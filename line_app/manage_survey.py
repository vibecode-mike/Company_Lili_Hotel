#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manage_survey.py — 用 JSON 建立 & 推送 LIFF 問卷（測試/正式皆可）

用法：
  1) 建立 + 推送（最常用）：
     python manage_survey.py send survey.json [--channel-id CHANNEL_ID]

  2) 僅建立（不推送）：
     python manage_survey.py create survey.json

  3) 針對既有 survey_id 直接推送入口卡片：
     python manage_survey.py push --sid 123 [--title 標題] [--preview 前置文字] [--channel-id CHANNEL_ID]

JSON 結構（survey.json 範例見同目錄 survey_sample_planB.json）：
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
- 若「未指定 --channel-id」，將使用 .env 內的預設設定（包含 LIFF_ID_OPEN / Token / Secret）。
- 若「有指定 --channel-id」，將使用資料表 ryan_line_channels 該筆的設定（channel_access_token / channel_secret / liff_id_open）。
- 你要先讓 members 表有資料（把 LINE 機器人加為好友並說話，或自行寫入 line_uid）。
"""

import argparse
import json
import sys

# 匯入同目錄的 app.py（提供 register_survey_from_json / push_survey_entry / send_survey_via_liff 等）
import app as app_starbit


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def cmd_create(json_path: str) -> None:
    """只建立問卷（不推送）。"""
    payload = load_json(json_path)
    ids = app_starbit.register_survey_from_json(payload)
    print(json.dumps({"ok": True, "action": "create", **ids}, ensure_ascii=False))


def cmd_push(sid: int,
             title: str | None = None,
             preview: str | None = None,
             channel_id: str | None = None) -> None:
    """
    針對既有 survey_id 推送入口卡片。

    - 未指定 channel_id → 用 .env 的預設設定。
    - 指定 channel_id   → 用 DB ryan_line_channels 的設定（token/secret/liff_id_open）。
    """
    sent = app_starbit.push_survey_entry(
        sid,
        title=title,
        preview_text=preview,
        channel_id=channel_id
    )
    print(json.dumps({"ok": True, "action": "push", "survey_id": sid, "pushed": sent}, ensure_ascii=False))


def cmd_send(json_path: str, channel_id: str | None = None) -> None:
    """
    建立 + 推送（最常用）。

    - 未指定 channel_id → 用 .env 的預設設定。
    - 指定 channel_id   → payload 會帶入 channel_id，後端自動用 DB 設定。
    """
    payload = load_json(json_path)
    if channel_id:
        payload["channel_id"] = channel_id
    result = app_starbit.send_survey_via_liff(payload)
    print(json.dumps({"ok": True, "action": "send", **result}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="用 JSON 建立／推送 LIFF 問卷（測試/正式）")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # create：只建立
    p_create = sub.add_parser("create", help="只建立問卷（不推送）")
    p_create.add_argument("json", help="問卷 JSON 檔路徑")

    # push：針對既有 survey_id 推送入口卡片
    p_push = sub.add_parser("push", help="針對既有 survey_id 推送入口卡片")
    p_push.add_argument("--sid", type=int, required=True, help="survey_id")
    p_push.add_argument("--title", type=str, default=None, help="Flex 標題（預設：問卷）")
    p_push.add_argument("--preview", type=str, default=None, help="推播前置文字（可選）")
    p_push.add_argument("--channel-id", type=str, default=None, help="指定頻道 id（對應 ryan_line_channels.id）")

    # send：建立 + 推送
    p_send = sub.add_parser("send", help="建立 + 推播（最常用）")
    p_send.add_argument("json", help="問卷 JSON 檔路徑")
    p_send.add_argument("--channel-id", type=str, default=None, help="指定頻道 id（對應 ryan_line_channels.id）")

    args = parser.parse_args()

    if args.cmd == "create":
        cmd_create(args.json)
    elif args.cmd == "push":
        cmd_push(args.sid, title=args.title, preview=args.preview, channel_id=args.channel_id)
    elif args.cmd == "send":
        cmd_send(args.json, channel_id=args.channel_id)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
