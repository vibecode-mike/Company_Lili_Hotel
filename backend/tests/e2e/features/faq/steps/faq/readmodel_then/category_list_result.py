from behave import then


@then('查詢結果應包含以下大分類：')
def step_impl(context):
    resp = context.last_response
    assert resp is not None, "沒有 HTTP 回應"
    data = resp.json().get("data", [])

    for row in context.table:
        expected_name = row["name"]
        match = None
        for cat in data:
            if cat.get("name") == expected_name:
                match = cat
                break

        assert match is not None, (
            f"找不到大分類 '{expected_name}'，回應資料：{data}"
        )

        if "is_active" in row.headings:
            expected_active = row["is_active"].lower() == "true"
            assert match.get("is_active") == expected_active, (
                f"大分類 '{expected_name}' is_active 預期 {expected_active}，"
                f"實際 {match.get('is_active')}"
            )

        if "data_source_type" in row.headings:
            assert match.get("data_source_type") == row["data_source_type"], (
                f"大分類 '{expected_name}' data_source_type 預期 {row['data_source_type']}，"
                f"實際 {match.get('data_source_type')}"
            )

        if "total_rule_count" in row.headings:
            expected_count = int(row["total_rule_count"])
            actual_count = match.get("rule_count", match.get("total_rule_count", 0))
            assert actual_count == expected_count, (
                f"大分類 '{expected_name}' 規則數預期 {expected_count}，"
                f"實際 {actual_count}"
            )
