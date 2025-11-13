#!/usr/bin/env python3
"""
测试 Flex Message 模板系统
"""

import os
import sys
import json

# 将 line_app 目录添加到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import select_template_path, load_and_fill_template, build_bubble_from_template

def test_template_selection():
    """测试模板选择逻辑"""
    print("=" * 50)
    print("测试 1: 模板选择逻辑")
    print("=" * 50)

    test_cases = [
        # (template_type, item, expected_file)
        ("text", {}, "only_text.json"),
        ("text_button", {"action_button_enabled": True, "action_button_text": "按钮1"}, "one_button.json"),
        ("text_button", {
            "action_button_enabled": True, "action_button_text": "按钮1",
            "action_button2_enabled": True, "action_button2_text": "按钮2"
        }, "two_button.json"),
        ("image_card", {"action_button_enabled": True}, "one_button.json"),
        ("image_card", {"text": "内文", "action_button_enabled": True}, "text_onebutton.json"),
        ("image_card", {"price": "NT$1000", "action_button_enabled": True}, "price_onebutton.json"),
        ("image_card", {
            "text": "内文", "price": "NT$1000",
            "action_button_enabled": True, "action_button_text": "按钮1"
        }, "text_price_onebutton.json"),
        ("image_card", {
            "text": "内文", "price": "NT$1000",
            "action_button_enabled": True, "action_button_text": "按钮1",
            "action_button2_enabled": True, "action_button2_text": "按钮2"
        }, "text_price_twobutton.json"),
    ]

    for i, (ttype, item, expected) in enumerate(test_cases, 1):
        path = select_template_path(ttype, item)
        filename = os.path.basename(path)
        status = "✅" if filename == expected else "❌"
        print(f"{status} Test {i}: {ttype} -> {filename} (expected: {expected})")

    print()


def test_template_loading():
    """测试模板加载和变量填充"""
    print("=" * 50)
    print("测试 2: 模板加载和变量填充")
    print("=" * 50)

    # 测试纯文字模板
    template_path = "/data2/lili_hotel/line_app/only_text/only_text.json"
    variables = {"body_text": "这是测试文字"}
    result = load_and_fill_template(template_path, variables)
    print(f"✅ 纯文字模板加载成功")
    print(f"   内容: {json.dumps(result, ensure_ascii=False, indent=2)[:200]}...")
    print()

    # 测试图卡按钮模板
    template_path = "/data2/lili_hotel/line_app/image_button/text_price_twobutton.json"
    variables = {
        "image_url": "https://example.com/image.jpg",
        "body_text": "活动标题",
        "body_secondary_text": "活动描述内容",
        "price": "NT$1000",
        "action_button_text1": "立即购买",
        "action_uri1": "https://example.com/buy",
        "action_button_text2": "了解更多",
        "action_uri2": "https://example.com/info"
    }
    result = load_and_fill_template(template_path, variables)
    print(f"✅ 图卡按钮模板加载成功")
    print(f"   内容: {json.dumps(result, ensure_ascii=False, indent=2)[:300]}...")
    print()


def test_build_bubble():
    """测试 bubble 构建"""
    print("=" * 50)
    print("测试 3: Bubble 构建")
    print("=" * 50)

    # 设置 PUBLIC_BASE 环境变量（如果没有设置）
    if not os.getenv("PUBLIC_BASE"):
        os.environ["PUBLIC_BASE"] = "https://example.com"

    # 测试图卡按钮型
    item = {
        "image_url": "https://example.com/image.jpg",
        "title": "春季促销活动",
        "text": "所有商品8折优惠",
        "price": "NT$1000",
        "action_button_enabled": True,
        "action_button_text": "立即购买",
        "action_button_url": "https://example.com/buy",
        "action_button2_enabled": True,
        "action_button2_text": "了解更多",
        "action_button2_url": "https://example.com/info"
    }
    tracked_uri = "https://example.com/__track?cid=123&uid=U123"

    try:
        bubble = build_bubble_from_template("image_card", item, tracked_uri)
        print(f"✅ 图卡按钮型 Bubble 构建成功")
        print(f"   Bubble 类型: {bubble.get('type')}")
        print(f"   完整内容:\n{json.dumps(bubble, ensure_ascii=False, indent=2)}")
    except Exception as e:
        print(f"❌ Bubble 构建失败: {e}")
        import traceback
        traceback.print_exc()

    print()


if __name__ == "__main__":
    print("\n")
    print("=" * 50)
    print("Flex Message 模板系统测试")
    print("=" * 50)
    print()

    try:
        test_template_selection()
        test_template_loading()
        test_build_bubble()

        print("=" * 50)
        print("所有测试完成！")
        print("=" * 50)
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
