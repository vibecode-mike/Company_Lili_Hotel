#!/usr/bin/env python3
"""
LINE 加好友功能測試腳本
測試 upsert_line_friend 函數是否正確寫入 line_friends 表
"""

import sys
import os
from datetime import datetime

# 添加 line_app 到路徑
sys.path.insert(0, '/data2/lili_hotel/line_app')

# 環境變數設定（如果需要）
os.environ.setdefault('MYSQL_HOST', '192.168.50.123')
os.environ.setdefault('MYSQL_PORT', '3306')
os.environ.setdefault('MYSQL_USER', 'root')
os.environ.setdefault('MYSQL_PASS', '123456')
os.environ.setdefault('MYSQL_DB', 'lili_hotel')

try:
    from app import upsert_line_friend, fetchone
    import pymysql
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("請確認 line_app/app.py 存在且可訪問")
    sys.exit(1)


class Colors:
    """終端顏色"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(text):
    """打印標題"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}\n")


def print_success(text):
    """打印成功訊息"""
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")


def print_error(text):
    """打印錯誤訊息"""
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")


def print_info(text):
    """打印資訊訊息"""
    print(f"{Colors.YELLOW}ℹ️  {text}{Colors.RESET}")


def get_db_connection():
    """建立數據庫連接"""
    try:
        conn = pymysql.connect(
            host='192.168.50.123',
            user='root',
            password='123456',
            database='lili_hotel',
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        print_error(f"數據庫連接失敗: {e}")
        return None


def check_before_test(test_uid):
    """測試前檢查"""
    print_header("測試前檢查")

    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cursor:
            # 檢查表是否存在
            cursor.execute("SHOW TABLES LIKE 'line_friends'")
            if not cursor.fetchone():
                print_error("line_friends 表不存在")
                return False
            print_success("line_friends 表存在")

            # 檢查測試 UID 是否已存在
            cursor.execute(
                "SELECT * FROM line_friends WHERE line_uid = %s",
                (test_uid,)
            )
            existing = cursor.fetchone()
            if existing:
                print_info(f"測試 UID 已存在（將執行更新操作）: {existing}")
            else:
                print_info("測試 UID 不存在（將執行插入操作）")

            # 顯示當前記錄總數
            cursor.execute("SELECT COUNT(*) as count FROM line_friends")
            count = cursor.fetchone()['count']
            print_info(f"當前 line_friends 表記錄總數: {count}")

        return True
    except Exception as e:
        print_error(f"測試前檢查失敗: {e}")
        return False
    finally:
        conn.close()


def test_upsert_line_friend():
    """測試 upsert_line_friend 函數"""
    print_header("測試 upsert_line_friend 函數")

    # 測試數據（使用 UNIX 時間戳確保唯一性）
    timestamp = int(datetime.now().timestamp())
    test_uid = f"Utest_{timestamp}"
    test_name = f"測試用戶_{timestamp}"
    test_picture = f"https://example.com/avatar_{timestamp}.jpg"

    print_info(f"測試 LINE UID: {test_uid}")
    print_info(f"測試顯示名稱: {test_name}")
    print_info(f"測試頭像 URL: {test_picture}")

    # 測試前檢查
    if not check_before_test(test_uid):
        return False

    # 執行函數
    print(f"\n{Colors.YELLOW}執行 upsert_line_friend()...{Colors.RESET}")
    try:
        friend_id = upsert_line_friend(
            line_uid=test_uid,
            display_name=test_name,
            picture_url=test_picture,
            is_following=True
        )

        if friend_id:
            print_success(f"函數執行成功，返回 Friend ID: {friend_id}")
        else:
            print_error("函數返回 None")
            return False

    except Exception as e:
        print_error(f"函數執行失敗: {e}")
        import traceback
        traceback.print_exc()
        return False

    # 驗證數據庫記錄
    print_header("驗證數據庫記錄")

    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id,
                    line_uid,
                    line_display_name,
                    line_picture_url,
                    member_id,
                    is_following,
                    followed_at,
                    unfollowed_at,
                    last_interaction_at,
                    created_at,
                    updated_at
                FROM line_friends
                WHERE line_uid = %s
            """, (test_uid,))

            result = cursor.fetchone()

            if not result:
                print_error("數據庫中找不到記錄")
                return False

            print_success("數據庫記錄找到")
            print(f"\n{Colors.BOLD}記錄詳情：{Colors.RESET}")
            for key, value in result.items():
                print(f"  {key:25} : {value}")

            # 驗證欄位
            print(f"\n{Colors.BOLD}欄位驗證：{Colors.RESET}")

            checks = [
                ("ID", result['id'] == friend_id, f"ID 匹配 ({friend_id})"),
                ("LINE UID", result['line_uid'] == test_uid, f"UID 正確 ({test_uid})"),
                ("Display Name", result['line_display_name'] == test_name, f"名稱正確 ({test_name})"),
                ("Picture URL", result['line_picture_url'] == test_picture, f"頭像 URL 正確"),
                ("Is Following", result['is_following'] == 1, "is_following = 1"),
                ("Followed At", result['followed_at'] is not None, "followed_at 已設定"),
                ("Unfollowed At", result['unfollowed_at'] is None, "unfollowed_at 為 NULL"),
                ("Last Interaction", result['last_interaction_at'] is not None, "last_interaction_at 已設定"),
                ("Created At", result['created_at'] is not None, "created_at 已設定"),
                ("Updated At", result['updated_at'] is not None, "updated_at 已設定"),
            ]

            all_passed = True
            for name, passed, message in checks:
                if passed:
                    print_success(f"{name:20} : {message}")
                else:
                    print_error(f"{name:20} : 驗證失敗")
                    all_passed = False

            # 顯示新的記錄總數
            cursor.execute("SELECT COUNT(*) as count FROM line_friends")
            new_count = cursor.fetchone()['count']
            print_info(f"\n當前 line_friends 表記錄總數: {new_count}")

            return all_passed

    except Exception as e:
        print_error(f"數據庫驗證失敗: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()


def test_update_scenario():
    """測試更新場景（重複調用相同 UID）"""
    print_header("測試更新場景")

    timestamp = int(datetime.now().timestamp())
    test_uid = f"Utest_update_{timestamp}"

    print_info("第一次插入...")
    try:
        friend_id_1 = upsert_line_friend(
            line_uid=test_uid,
            display_name="原始名稱",
            picture_url="https://example.com/old.jpg",
            is_following=True
        )
        print_success(f"第一次插入成功，ID: {friend_id_1}")
    except Exception as e:
        print_error(f"第一次插入失敗: {e}")
        return False

    print_info("\n第二次更新（修改名稱和頭像）...")
    try:
        friend_id_2 = upsert_line_friend(
            line_uid=test_uid,
            display_name="更新後名稱",
            picture_url="https://example.com/new.jpg",
            is_following=True
        )
        print_success(f"第二次更新成功，ID: {friend_id_2}")
    except Exception as e:
        print_error(f"第二次更新失敗: {e}")
        return False

    # 驗證 ID 應該相同
    if friend_id_1 == friend_id_2:
        print_success(f"ID 保持不變 ({friend_id_1} == {friend_id_2})")
    else:
        print_error(f"ID 不一致 ({friend_id_1} != {friend_id_2})")
        return False

    # 驗證資料已更新
    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT line_display_name, line_picture_url FROM line_friends WHERE line_uid = %s",
                (test_uid,)
            )
            result = cursor.fetchone()

            if result['line_display_name'] == "更新後名稱":
                print_success("顯示名稱已更新")
            else:
                print_error(f"顯示名稱未更新: {result['line_display_name']}")
                return False

            if result['line_picture_url'] == "https://example.com/new.jpg":
                print_success("頭像 URL 已更新")
            else:
                print_error(f"頭像 URL 未更新: {result['line_picture_url']}")
                return False

        return True
    except Exception as e:
        print_error(f"驗證失敗: {e}")
        return False
    finally:
        conn.close()


def test_unfollow_scenario():
    """測試取消追蹤場景"""
    print_header("測試取消追蹤場景")

    timestamp = int(datetime.now().timestamp())
    test_uid = f"Utest_unfollow_{timestamp}"

    print_info("1. 加入好友...")
    try:
        friend_id = upsert_line_friend(
            line_uid=test_uid,
            display_name="測試取消追蹤用戶",
            is_following=True
        )
        print_success(f"加入好友成功，ID: {friend_id}")
    except Exception as e:
        print_error(f"加入好友失敗: {e}")
        return False

    print_info("\n2. 取消追蹤...")
    try:
        upsert_line_friend(
            line_uid=test_uid,
            is_following=False
        )
        print_success("取消追蹤成功")
    except Exception as e:
        print_error(f"取消追蹤失敗: {e}")
        return False

    # 驗證狀態
    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT is_following, unfollowed_at FROM line_friends WHERE line_uid = %s",
                (test_uid,)
            )
            result = cursor.fetchone()

            checks = [
                (result['is_following'] == 0, "is_following = 0"),
                (result['unfollowed_at'] is not None, "unfollowed_at 已設定"),
            ]

            all_passed = True
            for passed, message in checks:
                if passed:
                    print_success(message)
                else:
                    print_error(f"{message} - 驗證失敗")
                    all_passed = False

            return all_passed

    except Exception as e:
        print_error(f"驗證失敗: {e}")
        return False
    finally:
        conn.close()


def main():
    """主測試函數"""
    print_header("LINE 加好友功能測試")
    print(f"{Colors.BOLD}測試時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}\n")

    tests = [
        ("基本插入測試", test_upsert_line_friend),
        ("更新場景測試", test_update_scenario),
        ("取消追蹤場景測試", test_unfollow_scenario),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"{test_name} 執行異常: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))

    # 總結
    print_header("測試總結")

    passed_count = sum(1 for _, result in results if result)
    total_count = len(results)

    for test_name, result in results:
        if result:
            print_success(f"{test_name:25} : PASSED")
        else:
            print_error(f"{test_name:25} : FAILED")

    print(f"\n{Colors.BOLD}總計：{passed_count}/{total_count} 測試通過{Colors.RESET}")

    if passed_count == total_count:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 所有測試通過！{Colors.RESET}\n")
        return 0
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  部分測試失敗{Colors.RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
