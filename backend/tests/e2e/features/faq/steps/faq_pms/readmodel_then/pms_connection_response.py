from behave import then


@then('PMS 串接設定回應應包含：')
def step_impl(context):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應"
    assert resp.status_code in (200, 201), (
        f"HTTP 狀態碼預期 200/201，實際 {resp.status_code}: {resp.text}"
    )

    data = resp.json()
    for row in context.table:
        field = row["field"]
        expected = row["expected"]
        actual = str(data.get(field, ""))
        assert actual == expected, (
            f"欄位 '{field}' 預期 '{expected}'，實際 '{actual}'"
        )
