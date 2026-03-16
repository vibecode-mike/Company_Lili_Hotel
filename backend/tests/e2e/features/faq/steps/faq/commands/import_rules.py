import csv
import io
import requests
from behave import when


@when('使用者上傳 "{filename}" 至大分類「{category_name}」匯入')
def step_impl(context, filename, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    dummy_content = b"dummy content"
    files = {"file": (filename, io.BytesIO(dummy_content), "application/octet-stream")}

    context.last_response = requests.post(
        f"{context.api_base}/faq/categories/{category_id}/rules/import",
        headers=context.auth_headers,
        files=files,
        timeout=10,
    )


@when('使用者上傳合法 CSV 檔案至大分類「{category_name}」匯入')
def step_impl_valid_csv(context, category_name):
    category_id = context.ids.get(f"category:{category_name}")
    if not category_id:
        raise KeyError(f"找不到大分類 '{category_name}' 的 ID")

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["房型名稱", "房型特色", "房價", "人數"])
    writer.writerow(["匯入雙人房", "海景", "4000", "2"])
    writer.writerow(["匯入四人房", "山景", "6000", "4"])
    csv_bytes = buf.getvalue().encode("utf-8-sig")

    files = {"file": ("rules.csv", io.BytesIO(csv_bytes), "text/csv")}

    context.last_response = requests.post(
        f"{context.api_base}/faq/categories/{category_id}/rules/import",
        headers=context.auth_headers,
        files=files,
        timeout=10,
    )
