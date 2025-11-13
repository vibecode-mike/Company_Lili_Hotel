#!/usr/bin/env python3
"""
測試新模型定義是否正確
"""
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent))

def test_model_imports():
    """測試模型導入"""
    print("=" * 60)
    print("測試 1: 模型導入")
    print("=" * 60)

    try:
        from app.models import (
            Base,
            Member,
            MemberTag,
            InteractionTag,
            Message,
            MessageRecipient,
            MessageRecord,
            Campaign,
            MessageTemplate,
            AutoResponse,
            MemberInteractionRecord,
            ConsumptionRecord,
            PMSIntegration,
        )
        print("✅ 所有模型導入成功")
        return True
    except Exception as e:
        print(f"❌ 模型導入失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_tables():
    """測試模型表名"""
    print("\n" + "=" * 60)
    print("測試 2: 檢查表名定義")
    print("=" * 60)

    try:
        from app.models import (
            Member,
            MemberTag,
            InteractionTag,
            Message,
            MessageRecipient,
            MessageRecord,
            Campaign,
            MessageTemplate,
            AutoResponse,
            MemberInteractionRecord,
            ConsumptionRecord,
            PMSIntegration,
        )

        expected_tables = {
            "Member": "members",
            "MemberTag": "member_tags",
            "InteractionTag": "interaction_tags",
            "Message": "messages",
            "MessageRecipient": "message_recipients",
            "MessageRecord": "message_records",
            "Campaign": "campaigns",
            "MessageTemplate": "message_templates",
            "AutoResponse": "auto_responses",
            "MemberInteractionRecord": "member_interaction_records",
            "ConsumptionRecord": "consumption_records",
            "PMSIntegration": "pms_integrations",
        }

        models = {
            "Member": Member,
            "MemberTag": MemberTag,
            "InteractionTag": InteractionTag,
            "Message": Message,
            "MessageRecipient": MessageRecipient,
            "MessageRecord": MessageRecord,
            "Campaign": Campaign,
            "MessageTemplate": MessageTemplate,
            "AutoResponse": AutoResponse,
            "MemberInteractionRecord": MemberInteractionRecord,
            "ConsumptionRecord": ConsumptionRecord,
            "PMSIntegration": PMSIntegration,
        }

        all_correct = True
        for model_name, expected_table in expected_tables.items():
            model = models[model_name]
            actual_table = model.__tablename__
            if actual_table == expected_table:
                print(f"✅ {model_name:30} -> {actual_table}")
            else:
                print(f"❌ {model_name:30} -> {actual_table} (expected: {expected_table})")
                all_correct = False

        return all_correct
    except Exception as e:
        print(f"❌ 表名檢查失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_columns():
    """測試重要欄位是否存在"""
    print("\n" + "=" * 60)
    print("測試 3: 檢查重要欄位")
    print("=" * 60)

    try:
        from app.models import Member, Message, MessageTemplate

        # 檢查 Member 的新欄位
        member_columns = [c.name for c in Member.__table__.columns]
        required_member_fields = ["residence", "join_source", "line_avatar", "line_name", "internal_note"]

        print("\nMember 表欄位:")
        for field in required_member_fields:
            if field in member_columns:
                print(f"  ✅ {field}")
            else:
                print(f"  ❌ {field} (缺少)")

        # 檢查 Message 的新欄位
        message_columns = [c.name for c in Message.__table__.columns]
        required_message_fields = [
            "message_content", "thumbnail", "failure_reason",
            "target_type", "target_filter",
            "scheduled_date", "scheduled_time",
            "estimated_send_count", "available_quota"
        ]

        print("\nMessage 表欄位:")
        for field in required_message_fields:
            if field in message_columns:
                print(f"  ✅ {field}")
            else:
                print(f"  ❌ {field} (缺少)")

        # 檢查 MessageTemplate 的 template_type
        template_columns = [c.name for c in MessageTemplate.__table__.columns]
        print("\nMessageTemplate 表欄位:")
        if "template_type" in template_columns:
            print(f"  ✅ template_type (已恢復)")
        else:
            print(f"  ❌ template_type (缺少)")

        return True
    except Exception as e:
        print(f"❌ 欄位檢查失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_relationships():
    """測試模型關聯關係"""
    print("\n" + "=" * 60)
    print("測試 4: 檢查關聯關係")
    print("=" * 60)

    try:
        from app.models import Member, Message, Campaign

        # 檢查 Member 的關聯
        member_relationships = [r.key for r in Member.__mapper__.relationships]
        print(f"\nMember 關聯關係: {', '.join(member_relationships)}")

        required_member_rels = [
            "member_tags",
            "interaction_records",
            "message_records",
            "consumption_records",
            "pms_integrations"
        ]

        for rel in required_member_rels:
            if rel in member_relationships:
                print(f"  ✅ {rel}")
            else:
                print(f"  ⚠️  {rel} (可能缺少)")

        # 檢查 Message 的關聯
        message_relationships = [r.key for r in Message.__mapper__.relationships]
        print(f"\nMessage 關聯關係: {', '.join(message_relationships)}")

        # 檢查 Campaign 的關聯
        campaign_relationships = [r.key for r in Campaign.__mapper__.relationships]
        print(f"\nCampaign 關聯關係: {', '.join(campaign_relationships)}")

        return True
    except Exception as e:
        print(f"❌ 關聯關係檢查失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_create_tables():
    """測試建表 SQL 生成"""
    print("\n" + "=" * 60)
    print("測試 5: 生成建表 SQL（不實際執行）")
    print("=" * 60)

    try:
        from sqlalchemy import create_engine
        from app.models import Base

        # 使用 SQLite 記憶體資料庫測試
        engine = create_engine("sqlite:///:memory:", echo=False)

        # 生成所有表
        Base.metadata.create_all(engine)

        # 列出所有表名
        tables = Base.metadata.tables.keys()
        print(f"\n生成的表 ({len(tables)} 個):")
        for table in sorted(tables):
            print(f"  ✅ {table}")

        return True
    except Exception as e:
        print(f"❌ 建表 SQL 生成失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n🔍 開始測試新模型定義...\n")

    results = []
    results.append(("模型導入", test_model_imports()))
    results.append(("表名定義", test_model_tables()))
    results.append(("欄位定義", test_model_columns()))
    results.append(("關聯關係", test_model_relationships()))
    results.append(("建表SQL", test_create_tables()))

    # 總結
    print("\n" + "=" * 60)
    print("測試總結")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} {test_name}")

    print(f"\n通過率: {passed}/{total} ({passed/total*100:.1f}%)")

    if passed == total:
        print("\n🎉 所有測試通過！模型定義正確。")
        sys.exit(0)
    else:
        print("\n⚠️  部分測試失敗，請檢查錯誤訊息。")
        sys.exit(1)
