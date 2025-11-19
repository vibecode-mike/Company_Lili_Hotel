#!/usr/bin/env python3
"""
添加测试自动回应数据
"""
import asyncio
from app.database import AsyncSessionLocal
from app.models.auto_response import AutoResponse, AutoResponseKeyword


async def add_test_data():
    """添加测试数据"""
    async with AsyncSessionLocal() as db:
        # 创建关键字触发自动回应
        auto_response_1 = AutoResponse(
            name="订房咨询",
            trigger_type="keyword",
            content="您好～目前今晚仍有部分房型可预订，方便告诉我们入住人数与日期吗？我们将立即为您查询",
            is_active=True,
            trigger_count=0,
            response_count=1
        )
        db.add(auto_response_1)
        await db.flush()

        # 添加关键字
        keywords_1 = ["订房", "预约", "房型", "空房", "价格"]
        for kw in keywords_1:
            keyword = AutoResponseKeyword(
                auto_response_id=auto_response_1.id,
                keyword=kw,
                match_count=0
            )
            db.add(keyword)

        # 创建欢迎消息
        auto_response_2 = AutoResponse(
            name="欢迎新好友",
            trigger_type="welcome",
            content="欢迎来到我们的饭店！如需任何协助请随时告诉我们",
            is_active=True,
            trigger_count=0,
            response_count=1
        )
        db.add(auto_response_2)

        # 创建指定时间触发
        auto_response_3 = AutoResponse(
            name="非营业时间回复",
            trigger_type="time",
            content="目前为非营业时间，请于 09:00 后来电，谢谢！",
            is_active=True,
            trigger_count=0,
            response_count=1
        )
        db.add(auto_response_3)

        await db.commit()
        print("✅ 测试数据添加成功")
        print(f"   - 订房咨询（关键字触发）: {auto_response_1.id}")
        print(f"   - 欢迎新好友（欢迎消息）: {auto_response_2.id}")
        print(f"   - 非营业时间回复（指定时间）: {auto_response_3.id}")


if __name__ == "__main__":
    asyncio.run(add_test_data())
