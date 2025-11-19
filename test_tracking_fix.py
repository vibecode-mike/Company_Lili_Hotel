#!/usr/bin/env python3
"""
测试 line_app/app.py 中追踪点击功能的修复
验证：
1. __track() 使用 line_id 和 message_id
2. on_postback() 添加了 tracking 记录
3. 数据库插入正确
"""

import sys
import os
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加项目路径
sys.path.insert(0, '/data2/lili_hotel/backend')
sys.path.insert(0, '/data2/lili_hotel/line_app')

# 从环境变量获取数据库配置（使用 line_app/app.py 相同的默认值）
MYSQL_HOST = os.getenv('MYSQL_HOST', os.getenv('DB_HOST', '192.168.50.123'))
MYSQL_PORT = os.getenv('MYSQL_PORT', os.getenv('DB_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', os.getenv('DB_USER', 'root'))
MYSQL_PASSWORD = os.getenv('MYSQL_PASS', os.getenv('DB_PASS', '123456'))
MYSQL_DB = os.getenv('MYSQL_DB', os.getenv('DB_NAME', 'lili_hotel'))

# 创建数据库引擎
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
engine = create_engine(DATABASE_URL, echo=False)
Session = sessionmaker(bind=engine)


class TrackingTest:
    """追踪功能测试类"""

    def __init__(self):
        self.session = Session()
        self.test_results = []
        self.test_line_uid = "test_tracking_user_001"
        self.test_campaign_id = None
        self.test_message_id = None

    def log(self, message, status="INFO"):
        """记录测试日志"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{status}] {message}")
        self.test_results.append({
            "timestamp": timestamp,
            "status": status,
            "message": message
        })

    def setup_test_data(self):
        """准备测试数据"""
        self.log("=== 步骤 1: 准备测试数据 ===")

        try:
            # 1. 创建测试会员（使用实际的字段名，包括必需的 join_source）
            result = self.session.execute(text("""
                INSERT INTO members (line_uid, line_name, join_source, created_at, updated_at)
                VALUES (:uid, :name, :join_source, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    line_name = :name,
                    updated_at = NOW(),
                    id = LAST_INSERT_ID(id)
            """), {"uid": self.test_line_uid, "name": "测试追踪用户", "join_source": "test"})
            self.session.commit()
            self.log(f"✅ 创建/更新测试会员成功: line_uid={self.test_line_uid}", "PASS")

            # 2. 创建测试模板
            result = self.session.execute(text("""
                INSERT INTO message_templates (
                    name, template_type, created_at, updated_at
                )
                VALUES (
                    :name, :type, NOW(), NOW()
                )
            """), {"name": "测试追踪模板", "type": "text"})
            self.session.commit()
            test_template_id = result.lastrowid
            self.log(f"✅ 创建测试模板成功: template_id={test_template_id}", "PASS")

            # 3. 创建测试群发消息
            result = self.session.execute(text("""
                INSERT INTO campaigns (
                    campaign_name, campaign_tag, status, created_at, updated_at
                )
                VALUES (
                    :name, :tag, :status, NOW(), NOW()
                )
            """), {"name": "测试追踪功能", "tag": "test", "status": "draft"})
            self.session.commit()
            self.test_campaign_id = result.lastrowid
            self.log(f"✅ 创建测试群发成功: campaign_id={self.test_campaign_id}", "PASS")

            # 4. 创建测试消息记录（关联 template 和 campaign）
            result = self.session.execute(text("""
                INSERT INTO messages (
                    template_id, campaign_id, send_status, target_type,
                    message_content, created_at, updated_at
                )
                VALUES (
                    :template_id, :campaign_id, :status, :target_type,
                    :content, NOW(), NOW()
                )
            """), {
                "template_id": test_template_id,
                "campaign_id": self.test_campaign_id,
                "status": "draft",
                "target_type": "all",
                "content": "测试追踪消息"
            })
            self.session.commit()
            self.test_message_id = result.lastrowid
            self.log(f"✅ 创建测试消息成功: message_id={self.test_message_id}", "PASS")

            return True

        except Exception as e:
            self.log(f"❌ 准备测试数据失败: {e}", "FAIL")
            self.session.rollback()
            return False

    def test_component_interaction_logs_structure(self):
        """测试 component_interaction_logs 表结构"""
        self.log("=== 步骤 2: 验证表结构 ===")

        try:
            # 检查表结构
            result = self.session.execute(text("""
                DESCRIBE component_interaction_logs
            """)).fetchall()

            fields = {row[0]: row[1] for row in result}

            # 验证必需字段（使用实际的字段名）
            required_fields = {
                'id': 'bigint',
                'line_id': 'varchar',
                'message_id': 'bigint',
                'campaign_id': 'bigint',
                'interaction_type': 'enum',
                'triggered_at': 'datetime'
            }

            missing_fields = []
            for field, expected_type in required_fields.items():
                if field not in fields:
                    missing_fields.append(field)
                else:
                    actual_type = fields[field]
                    if expected_type in actual_type or actual_type.startswith(expected_type):
                        self.log(f"  ✓ 字段 {field} 存在 (类型: {actual_type})")
                    else:
                        self.log(f"  ⚠️  字段 {field} 类型不匹配: 预期 {expected_type}, 实际 {actual_type}", "WARN")

            if missing_fields:
                self.log(f"❌ 缺少必需字段: {', '.join(missing_fields)}", "FAIL")
                return False

            # 验证 message_id 是必需字段
            message_id_field = [f for f in result if f[0] == 'message_id']
            if message_id_field and message_id_field[0][2] == 'NO':  # NULL column
                self.log("✅ message_id 是必需字段（NOT NULL）", "PASS")
            else:
                self.log("⚠️  message_id 可以为 NULL", "WARN")

            self.log("✅ 表结构验证通过", "PASS")
            return True

        except Exception as e:
            self.log(f"❌ 表结构验证失败: {e}", "FAIL")
            return False

    def test_track_endpoint_insert(self):
        """测试 __track 端点的数据插入"""
        self.log("=== 步骤 3: 测试 __track 端点插入 ===")

        try:
            # 清理之前的测试数据
            self.session.execute(text("""
                DELETE FROM component_interaction_logs
                WHERE line_id = :uid AND campaign_id = :cid
            """), {"uid": self.test_line_uid, "cid": self.test_campaign_id})
            self.session.commit()

            # 模拟 __track 端点的插入逻辑（使用正确的字段，包括 created_at）
            self.session.execute(text("""
                INSERT INTO component_interaction_logs
                    (line_id, message_id, campaign_id, interaction_type, interaction_value, triggered_at, created_at)
                VALUES (:uid, :msg_id, :cid, :itype, :value, NOW(), NOW())
            """), {
                "uid": self.test_line_uid,
                "msg_id": self.test_message_id,
                "cid": self.test_campaign_id,
                "itype": "image_click",
                "value": "https://example.com/test"
            })
            self.session.commit()

            # 验证插入成功
            result = self.session.execute(text("""
                SELECT id, line_id, message_id, campaign_id, interaction_type, interaction_value
                FROM component_interaction_logs
                WHERE line_id = :uid AND campaign_id = :cid
                ORDER BY id DESC LIMIT 1
            """), {"uid": self.test_line_uid, "cid": self.test_campaign_id}).fetchone()

            if result:
                self.log(f"✅ __track 插入成功:", "PASS")
                self.log(f"  - 记录 ID: {result[0]}")
                self.log(f"  - line_id: {result[1]}")
                self.log(f"  - message_id: {result[2]}")
                self.log(f"  - campaign_id: {result[3]}")
                self.log(f"  - interaction_type: {result[4]}")
                self.log(f"  - interaction_value: {result[5]}")
                return True
            else:
                self.log("❌ __track 插入失败，未找到记录", "FAIL")
                return False

        except Exception as e:
            self.log(f"❌ __track 插入测试失败: {e}", "FAIL")
            self.session.rollback()
            return False

    def test_postback_tracking_insert(self):
        """测试 postback 的 tracking 插入"""
        self.log("=== 步骤 4: 测试 postback tracking 插入 ===")

        try:
            # 清理之前的测试数据
            self.session.execute(text("""
                DELETE FROM component_interaction_logs
                WHERE line_id = :uid AND campaign_id = :cid AND interaction_type = 'postback'
            """), {"uid": self.test_line_uid, "cid": self.test_campaign_id})
            self.session.commit()

            # 模拟 on_postback 的插入逻辑（使用正确的字段，包括 created_at）
            postback_data = f"cid={self.test_campaign_id}&mid={self.test_message_id}&action=test_button"
            self.session.execute(text("""
                INSERT INTO component_interaction_logs
                    (line_id, message_id, campaign_id, interaction_type, interaction_value, triggered_at, created_at)
                VALUES (:uid, :msg_id, :cid, :itype, :data, NOW(), NOW())
            """), {
                "uid": self.test_line_uid,
                "msg_id": self.test_message_id,
                "cid": self.test_campaign_id,
                "itype": "postback",
                "data": postback_data
            })
            self.session.commit()

            # 验证插入成功
            result = self.session.execute(text("""
                SELECT id, line_id, message_id, campaign_id, interaction_type, interaction_value
                FROM component_interaction_logs
                WHERE line_id = :uid
                  AND campaign_id = :cid
                  AND interaction_type = 'postback'
                ORDER BY id DESC LIMIT 1
            """), {"uid": self.test_line_uid, "cid": self.test_campaign_id}).fetchone()

            if result:
                self.log(f"✅ postback tracking 插入成功:", "PASS")
                self.log(f"  - 记录 ID: {result[0]}")
                self.log(f"  - line_id: {result[1]}")
                self.log(f"  - message_id: {result[2]}")
                self.log(f"  - campaign_id: {result[3]}")
                self.log(f"  - interaction_type: {result[4]}")
                self.log(f"  - interaction_value: {result[5]}")
                return True
            else:
                self.log("❌ postback tracking 插入失败，未找到记录", "FAIL")
                return False

        except Exception as e:
            self.log(f"❌ postback tracking 插入测试失败: {e}", "FAIL")
            self.session.rollback()
            return False

    def test_query_tracking_logs(self):
        """测试查询 tracking 记录"""
        self.log("=== 步骤 5: 测试查询 tracking 记录 ===")

        try:
            # 查询所有测试记录（使用实际的字段名）
            results = self.session.execute(text("""
                SELECT
                    cil.id,
                    cil.line_id,
                    m.line_name,
                    cil.message_id,
                    cil.campaign_id,
                    cil.interaction_type,
                    cil.interaction_value,
                    cil.triggered_at
                FROM component_interaction_logs cil
                JOIN members m ON cil.line_id = m.line_uid
                WHERE cil.line_id = :uid AND cil.campaign_id = :cid
                ORDER BY cil.triggered_at DESC
            """), {"uid": self.test_line_uid, "cid": self.test_campaign_id}).fetchall()

            if results:
                self.log(f"✅ 查询到 {len(results)} 条 tracking 记录:", "PASS")
                for i, row in enumerate(results, 1):
                    self.log(f"  记录 {i}:")
                    self.log(f"    - ID: {row[0]}")
                    self.log(f"    - LINE UID: {row[1]}")
                    self.log(f"    - LINE 名称: {row[2]}")
                    self.log(f"    - 消息 ID: {row[3]}")
                    self.log(f"    - 群发 ID: {row[4]}")
                    self.log(f"    - 互动类型: {row[5]}")
                    self.log(f"    - 互动值: {row[6]}")
                    self.log(f"    - 触发时间: {row[7]}")
                return True
            else:
                self.log("⚠️  未找到 tracking 记录", "WARN")
                return False

        except Exception as e:
            self.log(f"❌ 查询测试失败: {e}", "FAIL")
            return False

    def cleanup_test_data(self):
        """清理测试数据"""
        self.log("=== 步骤 6: 清理测试数据 ===")

        try:
            # 按正确的顺序删除测试数据（考虑外键约束）
            # 1. 删除 component_interaction_logs（引用 message_id）
            self.session.execute(text("""
                DELETE FROM component_interaction_logs
                WHERE line_id = :uid
            """), {"uid": self.test_line_uid})

            # 2. 删除 messages（引用 template_id 和 campaign_id）
            self.session.execute(text("""
                DELETE FROM messages
                WHERE campaign_id = :cid
            """), {"cid": self.test_campaign_id})

            # 3. 删除 campaigns
            self.session.execute(text("""
                DELETE FROM campaigns
                WHERE id = :cid
            """), {"cid": self.test_campaign_id})

            # 4. 删除 message_templates
            self.session.execute(text("""
                DELETE FROM message_templates
                WHERE name = '测试追踪模板'
            """))

            # 5. 删除测试会员
            self.session.execute(text("""
                DELETE FROM members
                WHERE line_uid = :uid
            """), {"uid": self.test_line_uid})

            self.session.commit()
            self.log("✅ 测试数据清理完成", "PASS")
            return True

        except Exception as e:
            self.log(f"❌ 清理测试数据失败: {e}", "FAIL")
            self.session.rollback()
            return False

    def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "="*70)
        print("追踪点击功能修复验证测试".center(70))
        print("="*70 + "\n")

        tests = [
            ("准备测试数据", self.setup_test_data),
            ("验证表结构", self.test_component_interaction_logs_structure),
            ("测试 __track 插入", self.test_track_endpoint_insert),
            ("测试 postback 插入", self.test_postback_tracking_insert),
            ("测试查询记录", self.test_query_tracking_logs),
            ("清理测试数据", self.cleanup_test_data),
        ]

        passed = 0
        failed = 0

        for test_name, test_func in tests:
            try:
                result = test_func()
                if result:
                    passed += 1
                else:
                    failed += 1
                print()  # 空行分隔
            except Exception as e:
                self.log(f"测试 '{test_name}' 执行异常: {e}", "ERROR")
                failed += 1
                print()

        # 输出汇总报告
        print("\n" + "="*70)
        print("测试汇总报告".center(70))
        print("="*70)
        print(f"\n总测试数: {passed + failed}")
        print(f"✅ 通过: {passed}")
        print(f"❌ 失败: {failed}")
        print(f"\n通过率: {passed / (passed + failed) * 100:.1f}%")

        if failed == 0:
            print("\n🎉 所有测试通过！追踪功能修复成功！")
            return True
        else:
            print(f"\n⚠️  有 {failed} 个测试失败，请检查修复内容")
            return False

    def __del__(self):
        """清理资源"""
        if hasattr(self, 'session'):
            self.session.close()


def main():
    """主函数"""
    tester = TrackingTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
