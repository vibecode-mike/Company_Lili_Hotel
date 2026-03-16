from behave import given
import requests


def _send(context, message: str):
    resp = requests.post(
        f"{context.api_base}/chatbot/message",
        json={"browser_key": context.memo["browser_key"], "message": message},
        timeout=15,
    )
    assert resp.status_code == 200
    return resp.json()


@given("查詢已取得至少一筆可用房型資料")
def step_room_data_available(context):
    """建立 session 並發送訊息讓系統查詢房型。"""
    _send(context, "我想訂房")
    _send(context, "我要1間雙人房")
    resp = _send(context, "3月20號住到3月22號")
    context.memo["setup_done"] = True


@given("資料來源已知（pms 或 faq_static）")
def step_source_known(context):
    pass


@given('房型資料來源為 "{source}"')
def step_source_set(context, source):
    context.memo["expected_source"] = source


@given("_auto_split_options 含建議方案")
def step_auto_split_available(context):
    context.memo["auto_split"] = True


@given("單一房型無法滿足民眾人數")
def step_single_room_insufficient(context):
    pass


@given("前台渲染")
def step_frontend_render(context):
    pass


@given("/kb/upload/room-image 已上傳房型圖片")
def step_image_uploaded(context):
    pass


@given("booking_billing.json 對應房型 Image_URL 非空")
def step_image_url_set(context):
    pass


@given("對應房型 Image_URL 為空")
def step_image_url_empty(context):
    pass
