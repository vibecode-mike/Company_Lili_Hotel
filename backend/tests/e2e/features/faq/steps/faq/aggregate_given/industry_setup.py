import json
from behave import given
from sqlalchemy import text


@given('系統中有以下產業：')
def step_impl(context):
    db = context.db_session
    for row in context.table:
        db.execute(text(
            "INSERT INTO industries (name, is_active, created_at, updated_at) "
            "VALUES (:name, :is_active, NOW(), NOW())"
        ), {
            "name": row["name"],
            "is_active": row["is_active"].lower() == "true" if "is_active" in row.headings else True,
        })
    db.commit()

    # Store industry IDs for later reference
    result = db.execute(text("SELECT id, name FROM industries"))
    for r in result:
        context.ids[f"industry:{r[1]}"] = r[0]
