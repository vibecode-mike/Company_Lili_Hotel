#!/usr/bin/env python3
"""
測試 Flex Message 模板系統
"""

import os
import sys
import json

# 將 line_app 目錄添加到路徑
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import select_template_path, load_and_fill_template, build_bubble_from_template

def test_template_selection():
    """測試模板選擇邏輯"""
    print("=" * 50)
    print("測試 1: 模板選擇邏輯")
    print("=" * 50)

    test_cases = [
        # (template_type, item, expected_file)
        ("text", {}, "only_text.json"),
        ("text_button", {"action_button_enabled": True, "action_button_text": "按鈕1"}, "one_button.json"),
        ("text_button", {
            "action_button_enabled": True, "action_button_text": "按鈕1",
            "action_button2_enabled": True, "action_button2_text": "按鈕2"
        }, "two_button.json"),
        ("image_card", {"action_button_enabled": True}, "one_button.json"),
        ("image_card", {"text": "內文", "action_button_enabled": True}, "text_onebutton.json"),
        ("image_card", {"price": "NT$1000", "action_button_enabled": True}, "price_onebutton.json"),
        ("image_card", {
            "text": "內文", "price": "NT$1000",
            "action_button_enabled": True, "action_button_text": "按鈕1"
        }, "text_price_onebutton.json"),
        ("image_card", {
            "text": "內文", "price": "NT$1000",
            "action_button_enabled": True, "action_button_text": "按鈕1",
            "action_button2_enabled": True, "action_button2_text": "按鈕2"
        }, "text_price_twobutton.json"),
    ]

    for i, (ttype, item, expected) in enumerate(test_cases, 1):
        path = select_template_path(ttype, item)
        filename = os.path.basename(path)
        status = "✅" if filename == expected else "❌"
        print(f"{status} Test {i}: {ttype} -> {filename} (expected: {expected})")

    print()


def test_template_loading():
    """測試模板加載和變量填充"""
    print("=" * 50)
    print("測試 2: 模板加載和變量填充")
    print("=" * 50)

    # 測試純文字模板
    template_path = "/data2/lili_hotel/line_app/only_text/only_text.json"
    variables = {"body_text": "這是測試文字"}
    result = load_and_fill_template(template_path, variables)
    print(f"✅ 純文字模板加載成功")
    print(f"   內容: {json.dumps(result, ensure_ascii=False, indent=2)[:200]}...")
    print()

    # 測試圖卡按鈕模板
    template_path = "/data2/lili_hotel/line_app/image_button/text_price_twobutton.json"
    variables = {
        "image_url": "https://example.com/image.jpg",
        "body_text": "活動標題",
        "body_secondary_text": "活動描述內容",
        "price": "NT$1000",
        "action_button_text1": "立即購買",
        "action_uri1": "https://example.com/buy",
        "action_button_text2": "了解更多",
        "action_uri2": "https://example.com/info"
    }
    result = load_and_fill_template(template_path, variables)
    print(f"✅ 圖卡按鈕模板加載成功")
    print(f"   內容: {json.dumps(result, ensure_ascii=False, indent=2)[:300]}...")
    print()


def test_build_bubble():
    """測試 bubble 構建"""
    print("=" * 50)
    print("測試 3: Bubble 構建")
    print("=" * 50)

    # 設置 PUBLIC_BASE 環境變量（如果沒有設置）
    if not os.getenv("PUBLIC_BASE"):
        os.environ["PUBLIC_BASE"] = "https://example.com"

    # 測試圖卡按鈕型
    item = {
        "image_url": "https://example.com/image.jpg",
        "title": "春季促銷活動",
        "text": "所有商品8折優惠",
        "price": "NT$1000",
        "action_button_enabled": True,
        "action_button_text": "立即購買",
        "action_button_url": "https://example.com/buy",
        "action_button2_enabled": True,
        "action_button2_text": "了解更多",
        "action_button2_url": "https://example.com/info"
    }
    tracked_uri = "https://example.com/__track?cid=123&uid=U123"

    try:
        bubble = build_bubble_from_template("image_card", item, tracked_uri)
        print(f"✅ 圖卡按鈕型 Bubble 構建成功")
        print(f"   Bubble 類型: {bubble.get('type')}")
        print(f"   完整內容:\n{json.dumps(bubble, ensure_ascii=False, indent=2)}")
    except Exception as e:
        print(f"❌ Bubble 構建失敗: {e}")
        import traceback
        traceback.print_exc()

    print()


if __name__ == "__main__":
    print("\n")
    print("=" * 50)
    print("Flex Message 模板系統測試")
    print("=" * 50)
    print()

    try:
        test_template_selection()
        test_template_loading()
        test_build_bubble()

        print("=" * 50)
        print("所有測試完成！")
        print("=" * 50)
    except Exception as e:
        print(f"\n❌ 測試失敗: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
