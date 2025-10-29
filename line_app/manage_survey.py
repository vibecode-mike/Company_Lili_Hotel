
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""manage_survey.py — 用 JSON 建立 & 推送 LIFF 問卷（測試用）

用法：
  1) 建立 + 推送（最常用）：
     python manage_survey.py send survey.json

  2) 僅建立（不推送）：
     python manage_survey.py create survey.json

  3) 針對既有 survey_id 直接推送入口卡片：
     python manage_survey.py push --sid 123

JSON 結構（survey.json 範例見同目錄 survey_sample.json）：
{
  "name": "入住滿意度調查",
  "description": "花 30 秒協助我們提升服務，謝謝您！",
  "target_audience": "all",
  "questions": [
    {"order": 1, "question_type": "name", "question_text": "您的姓名", "is_required": true},
    {"order": 2, "question_type": "phone", "question_text": "聯絡電話", "is_required": false},
    {"order": 3, "question_type": "single_choice", "question_text": "整體滿意度", "is_required": true,
     "options": [{"label":"非常滿意"},{"label":"滿意"},{"label":"普通"},{"label":"不滿意"}]},
    {"order": 4, "question_type": "textarea", "question_text": "想對我們說的話", "is_required": false}
  ]
}

注意：
- 需要在 .env 設好 LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN / PUBLIC_BASE / LIFF_ID_OPEN / DB 連線。
- 你要先讓會員（members）表有資料：把 LINE 機器人加為好友並說話，或自行寫入 line_uid。

"""
import argparse
import json
import sys

# 匯入同目錄的 app.py（提供 register_survey_from_json / push_survey_entry / send_survey_via_liff 等）
import app


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def cmd_create(json_path: str) -> None:
    payload = load_json(json_path)
    ids = app.register_survey_from_json(payload)
    print(json.dumps({"ok": True, "action": "create", **ids}, ensure_ascii=False))


def cmd_push(sid: int, title: str | None = None, preview: str | None = None) -> None:
    sent = app.push_survey_entry(sid, title=title, preview_text=preview)
    print(json.dumps({"ok": True, "action": "push", "survey_id": sid, "pushed": sent}, ensure_ascii=False))


def cmd_send(json_path: str) -> None:
    payload = load_json(json_path)
    result = app.send_survey_via_liff(payload)
    print(json.dumps({"ok": True, "action": "send", **result}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="用 JSON 建立／推送 LIFF 問卷（測試用）")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_create = sub.add_parser("create", help="只建立問卷（不推送）")
    p_create.add_argument("json", help="問卷 JSON 檔路徑")

    p_push = sub.add_parser("push", help="針對既有 survey_id 推送入口卡片")
    p_push.add_argument("--sid", type=int, required=True, help="survey_id")
    p_push.add_argument("--title", type=str, default=None, help="Flex 標題（預設：問卷）")
    p_push.add_argument("--preview", type=str, default=None, help="推播前置文字（可選）」")

    p_send = sub.add_parser("send", help="建立 + 推送（最常用）")
    p_send.add_argument("json", help="問卷 JSON 檔路徑")

    args = parser.parse_args()

    if args.cmd == "create":
        cmd_create(args.json)
    elif args.cmd == "push":
        cmd_push(args.sid, title=args.title, preview=args.preview)
    elif args.cmd == "send":
        cmd_send(args.json)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
