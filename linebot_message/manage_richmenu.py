#!/usr/bin/env python3
# manage_richmenu.py
import os, sys, argparse
from dotenv import load_dotenv
from linebot import LineBotApi
from linebot.models import (
    RichMenu, RichMenuArea, RichMenuBounds,
    MessageAction, PostbackAction
)

# ----- 基礎 -----
def get_api():
    load_dotenv()  # 支援從 .env 讀取
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN")
    if not token:
        print("ERROR: 環境變數 LINE_CHANNEL_ACCESS_TOKEN 未設定（.env 或 shell）。", file=sys.stderr)
        sys.exit(1)
    return LineBotApi(token)

# 2500x843（單排四鍵）— 對應你現在的 richmenu.png 排版
AREAS = [
    {"label": "聯絡資訊", "text": "聯絡資訊", "data": "faq=contact",
     "bounds": RichMenuBounds(x=45,   y=90, width=580, height=663)},
    {"label": "住宿",     "text": "住宿",     "data": "faq=stay",
     "bounds": RichMenuBounds(x=655,  y=90, width=580, height=663)},
    {"label": "餐飲",     "text": "餐飲",     "data": "faq=dine",
     "bounds": RichMenuBounds(x=1265, y=90, width=580, height=663)},
    {"label": "停車場",   "text": "停車場",   "data": "faq=parking",
     "bounds": RichMenuBounds(x=1875, y=90, width=580, height=663)},
]

# ----- 操作 -----
def create_richmenu(image_path: str, name="HotelMenu", chat_bar="快速服務",
                    action="message", set_default=True):
    """建立 Rich Menu，選擇 action=message 或 postback；可選擇是否設為預設"""
    api = get_api()

    areas = []
    for a in AREAS:
        if action == "postback":
            act = PostbackAction(label=a["label"], data=a["data"])
        else:
            act = MessageAction(label=a["label"], text=a["text"])
        areas.append(RichMenuArea(bounds=a["bounds"], action=act))

    rm = RichMenu(
        size={"width": 2500, "height": 843},
        selected=True,
        name=name,
        chat_bar_text=chat_bar,
        areas=areas,
    )
    rid = api.create_rich_menu(rich_menu=rm)
    with open(image_path, "rb") as f:
        api.set_rich_menu_image(rid, "image/png", f)
    if set_default:
        api.set_default_rich_menu(rid)
    print("✅ 建立完成，richMenuId =", rid)
    if set_default:
        print("✅ 已設為所有使用者的預設 Rich Menu")
    return rid

def list_richmenus():
    api = get_api()
    rms = api.get_rich_menu_list()
    if not rms:
        print("(沒有任何 Rich Menu)")
        return
    for m in rms:
        print(m.rich_menu_id, "|", m.name)

def set_default(rid: str):
    api = get_api()
    api.set_default_rich_menu(rid)
    print("✅ 已設為預設 Rich Menu：", rid)

def cancel_default():
    api = get_api()
    api.cancel_default_rich_menu()
    print("✅ 已取消全體預設 Rich Menu")

def delete_richmenu(rid: str):
    api = get_api()
    api.delete_rich_menu(rid)
    print("🗑 已刪除 Rich Menu：", rid)

def update_image(rid: str, image_path: str):
    api = get_api()
    with open(image_path, "rb") as f:
        api.set_rich_menu_image(rid, "image/png", f)
    print("✅ 已更新圖片：", image_path, " →", rid)

def link_user(user_id: str, rid: str):
    api = get_api()
    api.link_rich_menu_to_user(user_id, rid)
    print(f"✅ 已把 {rid} 綁定到使用者 {user_id}")

def unlink_user(user_id: str):
    api = get_api()
    api.unlink_rich_menu_from_user(user_id)
    print(f"✅ 已解除使用者 {user_id} 的 Rich Menu")

# ----- CLI -----
def main():
    p = argparse.ArgumentParser(description="Manage LINE Rich Menu")
    sp = p.add_subparsers(dest="cmd", required=True)

    p_create = sp.add_parser("create", help="建立 Rich Menu 並上傳圖片")
    p_create.add_argument("--image", required=True, help="PNG 圖片路徑（2500x843）")
    p_create.add_argument("--name", default="HotelMenu")
    p_create.add_argument("--chatbar", default="快速服務")
    p_create.add_argument("--action", choices=["message","postback"], default="message",
                          help="按鈕動作型態（預設 message）")
    p_create.add_argument("--no-default", action="store_true", help="不要設為預設")

    sp.add_parser("list", help="列出所有 Rich Menu")

    p_def = sp.add_parser("set-default", help="把某個 Rich Menu 設為預設")
    p_def.add_argument("--rid", required=True)

    sp.add_parser("cancel-default", help="取消全體預設 Rich Menu")

    p_del = sp.add_parser("delete", help="刪除 Rich Menu（先取消綁定）")
    p_del.add_argument("--rid", required=True)

    p_img = sp.add_parser("update-image", help="更新既有 Rich Menu 的圖片")
    p_img.add_argument("--rid", required=True)
    p_img.add_argument("--image", required=True)

    p_link = sp.add_parser("link-user", help="把 Rich Menu 綁到單一使用者")
    p_link.add_argument("--user-id", required=True)
    p_link.add_argument("--rid", required=True)

    p_unlink = sp.add_parser("unlink-user", help="解除單一使用者的 Rich Menu")
    p_unlink.add_argument("--user-id", required=True)

    args = p.parse_args()

    if args.cmd == "create":
        create_richmenu(
            image_path=args.image,
            name=args.name,
            chat_bar=args.chatbar,
            action=args.action,
            set_default=(not args.no_default)
        )
    elif args.cmd == "list":
        list_richmenus()
    elif args.cmd == "set-default":
        set_default(args.rid)
    elif args.cmd == "cancel-default":
        cancel_default()
    elif args.cmd == "delete":
        delete_richmenu(args.rid)
    elif args.cmd == "update-image":
        update_image(args.rid, args.image)
    elif args.cmd == "link-user":
        link_user(args.user_id, args.rid)
    elif args.cmd == "unlink-user":
        unlink_user(args.user_id)

if __name__ == "__main__":
    main()
