"""
建立測試群發訊息數據
"""
import sys
import asyncio
sys.path.insert(0, '/data2/lili_hotel/backend')

from app.database import AsyncSessionLocal
from app.models.campaign import Campaign
from datetime import datetime, timedelta

async def create_test_campaigns():
    async with AsyncSessionLocal() as db:
        try:
            # 建立三筆測試數據
            campaigns = [
                Campaign(
                    title='春季優惠活動',
                    template_type='image_card',
                    notification_text='春季限定！全館商品85折優惠，立即搶購！',
                    preview_text='春季優惠活動開跑囉～',
                    target_audience='all',
                    schedule_type='scheduled',
                    scheduled_at=datetime.now() + timedelta(days=2),
                    status='scheduled',
                    created_by=1
                ),
                Campaign(
                    title='會員專屬禮遇',
                    template_type='text',
                    notification_text='親愛的會員，感謝您的支持！專屬好禮等您領取',
                    preview_text='會員專屬好禮',
                    target_audience='filtered',
                    schedule_type='immediate',
                    status='sent',
                    sent_at=datetime.now() - timedelta(days=1),
                    created_by=1
                ),
                Campaign(
                    title='夏日新品預告',
                    template_type='image_click',
                    notification_text='夏日新品即將上市，搶先預覽最新款式！',
                    preview_text='夏日新品預告',
                    target_audience='all',
                    schedule_type='immediate',
                    status='draft',
                    created_by=1
                )
            ]

            for campaign in campaigns:
                db.add(campaign)

            await db.commit()

            print('成功建立 3 筆測試數據！')
            print('ID\t標題\t\t狀態')
            print('-' * 50)
            for c in campaigns:
                print(f'{c.id}\t{c.title}\t{c.status}')

        except Exception as e:
            await db.rollback()
            print(f'錯誤：{e}')
            raise

if __name__ == '__main__':
    asyncio.run(create_test_campaigns())
