#!/usr/bin/env python3
"""
同步 members 表與 line_friends 表數據
- 清理：刪除指定 join_source 的 members 記錄（預設 'LINE'）中不在 line_friends 的會員
- 合併：將 line_friends 數據同步到 members 表
- 數據一致性：確保指定 join_source 的會員與 line_friends (is_following=1) 一致
"""
import sys
import os
from datetime import datetime

# 添加路徑以便導入 app 模組
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

# 創建數據庫連接（使用同步版本的 URL）
database_url = settings.DATABASE_URL.replace('aiomysql', 'pymysql')
engine = create_engine(database_url)
SessionLocal = sessionmaker(bind=engine)


TARGET_JOIN_SOURCE = "LINE"


def sync_members_with_line_friends():
    """執行數據同步"""
    db = SessionLocal()

    try:
        print("=" * 60)
        print("開始同步 members 與 line_friends")
        print("=" * 60)
        print()

        # ============================================================
        # 階段 1：清理不在 line_friends 的會員（僅針對指定來源）
        # ============================================================
        print(f"[階段 1] 清理不在 line_friends 的 {TARGET_JOIN_SOURCE} 來源會員...")

        # 查詢要刪除的會員（僅限指定 join_source）
        cleanup_query = text("""
            SELECT m.id, m.line_uid, m.line_name, m.join_source
            FROM members m
            WHERE m.join_source = :join_source
              AND m.line_uid IS NOT NULL
              AND m.line_uid != ''
              AND m.line_uid NOT IN (
                SELECT line_uid
                FROM line_friends
                WHERE is_following = 1
              )
        """)

        to_delete = db.execute(cleanup_query, {"join_source": TARGET_JOIN_SOURCE}).fetchall()
        deleted_count = len(to_delete)

        if deleted_count > 0:
            print(f"  發現 {deleted_count} 筆不在 line_friends 的會員（join_source='{TARGET_JOIN_SOURCE}'）：")
            for row in to_delete[:5]:  # 只顯示前 5 筆
                print(f"    - ID: {row.id}, line_uid: {row.line_uid}, name: {row.line_name}")
            if deleted_count > 5:
                print(f"    ... 還有 {deleted_count - 5} 筆")

            # 先刪除關聯的 member_tags
            delete_tags_query = text("""
                DELETE FROM member_tags
                WHERE member_id IN (
                    SELECT m.id
                    FROM members m
                    WHERE m.join_source = :join_source
                      AND m.line_uid IS NOT NULL
                      AND m.line_uid != ''
                      AND m.line_uid NOT IN (
                        SELECT line_uid
                        FROM line_friends
                        WHERE is_following = 1
                      )
                )
            """)
            db.execute(delete_tags_query, {"join_source": TARGET_JOIN_SOURCE})

            # 刪除會員
            delete_members_query = text("""
                DELETE FROM members
                WHERE join_source = :join_source
                  AND line_uid IS NOT NULL
                  AND line_uid != ''
                  AND line_uid NOT IN (
                    SELECT line_uid
                    FROM line_friends
                    WHERE is_following = 1
                  )
            """)
            db.execute(delete_members_query, {"join_source": TARGET_JOIN_SOURCE})
            db.commit()
            print(f"  ✓ 已清理：{deleted_count} 筆（僅 {TARGET_JOIN_SOURCE} 來源）")
        else:
            print(f"  ✓ 無需清理（所有 {TARGET_JOIN_SOURCE} 會員都在 line_friends 中）")

        print()

        # ============================================================
        # 階段 2：合併 line_friends 數據到 members
        # ============================================================
        print("[階段 2] 合併 line_friends 數據到 members...")

        # 查詢所有追蹤中的 LINE 好友
        friends_query = text("""
            SELECT line_uid, line_display_name, line_picture_url, followed_at
            FROM line_friends
            WHERE is_following = 1
            ORDER BY followed_at
        """)

        friends = db.execute(friends_query).fetchall()
        print(f"  找到 {len(friends)} 筆 LINE 好友（is_following=1）")

        inserted_count = 0
        updated_count = 0
        skipped_count = 0

        for friend in friends:
            line_uid = friend.line_uid
            line_name = friend.line_display_name or "LINE 用戶"
            line_avatar = friend.line_picture_url or ""
            followed_at = friend.followed_at or datetime.now()

            # 檢查是否已存在
            check_query = text("""
                SELECT id, line_name, line_avatar
                FROM members
                WHERE line_uid = :line_uid
            """)
            existing = db.execute(check_query, {"line_uid": line_uid}).fetchone()

            if existing:
                # 檢查是否需要更新
                if existing.line_name != line_name or existing.line_avatar != line_avatar:
                    update_query = text("""
                        UPDATE members
                        SET line_name = :line_name,
                            line_avatar = :line_avatar,
                            updated_at = :updated_at
                        WHERE line_uid = :line_uid
                    """)
                    db.execute(update_query, {
                        "line_uid": line_uid,
                        "line_name": line_name,
                        "line_avatar": line_avatar,
                        "updated_at": datetime.now()
                    })
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                # 插入新會員
                insert_query = text("""
                    INSERT INTO members (
                        line_uid, line_name, line_avatar, join_source, created_at, updated_at
                    ) VALUES (
                        :line_uid, :line_name, :line_avatar, :join_source, :created_at, :updated_at
                    )
                """)
                db.execute(insert_query, {
                    "line_uid": line_uid,
                    "line_name": line_name,
                    "line_avatar": line_avatar,
                    "join_source": TARGET_JOIN_SOURCE,
                    "created_at": followed_at,
                    "updated_at": datetime.now()
                })
                inserted_count += 1

        db.commit()

        print(f"  ✓ 新增：{inserted_count} 筆")
        print(f"  ✓ 更新：{updated_count} 筆")
        print(f"  ✓ 跳過：{skipped_count} 筆（已存在且相同）")
        print()

        # ============================================================
        # 階段 3：驗證結果
        # ============================================================
        print("[階段 3] 驗證同步結果...")

        # 統計 members 表（僅指定來源）
        members_count_query = text("""
            SELECT COUNT(*) as count
            FROM members
            WHERE join_source = :join_source
              AND line_uid IS NOT NULL
              AND line_uid != ''
        """)
        members_count = db.execute(members_count_query, {"join_source": TARGET_JOIN_SOURCE}).scalar()

        # 統計 line_friends 表
        friends_count_query = text("""
            SELECT COUNT(*) as count
            FROM line_friends
            WHERE is_following = 1
        """)
        friends_count = db.execute(friends_count_query).scalar()

        # 統計其他來源會員
        other_sources_query = text("""
            SELECT join_source, COUNT(*) as count
            FROM members
            WHERE join_source != :join_source OR join_source IS NULL
            GROUP BY join_source
        """)
        other_sources = db.execute(other_sources_query, {"join_source": TARGET_JOIN_SOURCE}).fetchall()

        print(f"  Members 表（join_source='{TARGET_JOIN_SOURCE}'）：{members_count} 筆")
        print(f"  LINE Friends（is_following=1）：{friends_count} 筆")

        if members_count == friends_count:
            print(f"  ✅ {TARGET_JOIN_SOURCE} 會員與 LINE 好友數據一致！")
        else:
            print(f"  ⚠️  數據不一致！差異：{abs(members_count - friends_count)} 筆")

        # 顯示其他來源會員統計
        if other_sources:
            print(f"\n  ℹ️  其他來源會員統計（不受 line_friends 影響）：")
            for row in other_sources:
                source = row.join_source or 'NULL'
                count = row.count
                print(f"     - {source}: {count} 筆")

        print()
        print("=" * 60)
        print("同步完成")
        print("=" * 60)
        print()
        print("統計摘要：")
        print(f"  - 清理：{deleted_count} 筆（{TARGET_JOIN_SOURCE} 來源且不在 line_friends）")
        print(f"  - 新增：{inserted_count} 筆（新 LINE 好友）")
        print(f"  - 更新：{updated_count} 筆（已存在）")
        print(f"  - 跳過：{skipped_count} 筆（無變化）")
        print(f"  - 最終 {TARGET_JOIN_SOURCE} 會員數：{members_count} 筆")
        print()

        return True

    except Exception as e:
        print(f"\n❌ 同步失敗：{e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False

    finally:
        db.close()


if __name__ == "__main__":
    success = sync_members_with_line_friends()
    sys.exit(0 if success else 1)
