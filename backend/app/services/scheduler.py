"""
排程服務模組
使用 APScheduler 管理定時任務
"""
import logging
from datetime import datetime
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.job import Job

logger = logging.getLogger(__name__)


class CampaignScheduler:
    """活動與問卷排程管理器"""

    _instance: Optional["CampaignScheduler"] = None
    _scheduler: Optional[AsyncIOScheduler] = None

    def __new__(cls):
        """單例模式確保只有一個排程器實例"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化排程器"""
        if self._scheduler is None:
            self._scheduler = AsyncIOScheduler()
            logger.info("✅ CampaignScheduler initialized")

    def start(self):
        """啟動排程器"""
        if not self._scheduler.running:
            self._scheduler.start()
            logger.info("🚀 Scheduler started")

    def shutdown(self):
        """關閉排程器"""
        if self._scheduler and self._scheduler.running:
            self._scheduler.shutdown()
            logger.info("⏹️  Scheduler shutdown")

    async def schedule_campaign(self, campaign_id: int, scheduled_at: datetime) -> bool:
        """
        排程發送活動

        Args:
            campaign_id: 活動 ID
            scheduled_at: 排程時間

        Returns:
            bool: 是否排程成功
        """
        try:
            job_id = f"campaign_{campaign_id}"

            # 檢查是否已存在相同任務
            existing_job = self._scheduler.get_job(job_id)
            if existing_job:
                logger.warning(f"⚠️  Job {job_id} already exists, replacing...")
                existing_job.remove()

            # 添加新任務
            self._scheduler.add_job(
                func=self._send_campaign_job,
                trigger=DateTrigger(run_date=scheduled_at),
                args=[campaign_id],
                id=job_id,
                name=f"Send Campaign {campaign_id}",
                replace_existing=True,
            )

            logger.info(f"✅ Campaign {campaign_id} scheduled for {scheduled_at}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to schedule campaign {campaign_id}: {e}")
            return False

    async def schedule_survey(self, survey_id: int, scheduled_at: datetime) -> bool:
        """
        排程發送問卷

        Args:
            survey_id: 問卷 ID
            scheduled_at: 排程時間

        Returns:
            bool: 是否排程成功
        """
        try:
            job_id = f"survey_{survey_id}"

            # 檢查是否已存在相同任務
            existing_job = self._scheduler.get_job(job_id)
            if existing_job:
                logger.warning(f"⚠️  Job {job_id} already exists, replacing...")
                existing_job.remove()

            # 添加新任務
            self._scheduler.add_job(
                func=self._send_survey_job,
                trigger=DateTrigger(run_date=scheduled_at),
                args=[survey_id],
                id=job_id,
                name=f"Send Survey {survey_id}",
                replace_existing=True,
            )

            logger.info(f"✅ Survey {survey_id} scheduled for {scheduled_at}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to schedule survey {survey_id}: {e}")
            return False

    async def cancel_campaign(self, campaign_id: int) -> bool:
        """
        取消活動排程

        Args:
            campaign_id: 活動 ID

        Returns:
            bool: 是否取消成功
        """
        try:
            job_id = f"campaign_{campaign_id}"
            job = self._scheduler.get_job(job_id)

            if job:
                job.remove()
                logger.info(f"✅ Campaign {campaign_id} schedule canceled")
                return True
            else:
                logger.warning(f"⚠️  Campaign {campaign_id} schedule not found")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to cancel campaign {campaign_id}: {e}")
            return False

    async def cancel_survey(self, survey_id: int) -> bool:
        """
        取消問卷排程

        Args:
            survey_id: 問卷 ID

        Returns:
            bool: 是否取消成功
        """
        try:
            job_id = f"survey_{survey_id}"
            job = self._scheduler.get_job(job_id)

            if job:
                job.remove()
                logger.info(f"✅ Survey {survey_id} schedule canceled")
                return True
            else:
                logger.warning(f"⚠️  Survey {survey_id} schedule not found")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to cancel survey {survey_id}: {e}")
            return False

    def get_scheduled_jobs(self) -> list:
        """
        獲取所有排程任務

        Returns:
            list: 任務列表
        """
        jobs = self._scheduler.get_jobs()
        return [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat()
                if job.next_run_time
                else None,
            }
            for job in jobs
        ]

    async def _send_campaign_job(self, campaign_id: int):
        """
        背景任務：發送活動

        Args:
            campaign_id: 活動 ID
        """
        try:
            logger.info(f"🚀 Executing scheduled campaign {campaign_id}")

            from app.services.linebot_service import LineBotService

            linebot_service = LineBotService()
            result = await linebot_service.send_campaign(campaign_id)

            sent_count = 0
            failed_count = 0
            ok = False
            if isinstance(result, dict):
                sent_count = result.get("sent", 0) or 0
                failed_count = result.get("failed", 0) or 0
                ok = bool(result.get("ok")) and sent_count > 0

            from app.database import AsyncSessionLocal
            from app.models.message import Message
            from sqlalchemy import select

            async with AsyncSessionLocal() as db:
                stmt = select(Message).where(Message.id == campaign_id)
                campaign_result = await db.execute(stmt)
                campaign = campaign_result.scalar_one_or_none()

                if not campaign:
                    logger.error(f"❌ Campaign {campaign_id} not found when updating status")
                    return

                campaign.send_count = sent_count

                if ok:
                    campaign.send_status = "已發送"
                    campaign.send_time = datetime.now()
                    if failed_count:
                        logger.warning(
                            "⚠️ Campaign %s sent to %s users with %s failures",
                            campaign_id,
                            sent_count,
                            failed_count,
                        )
                    else:
                        logger.info(
                            "✅ Campaign %s sent to %s users", campaign_id, sent_count
                        )
                else:
                    campaign.send_status = "發送失敗"
                    logger.warning("⚠️ Campaign %s failed to send during schedule", campaign_id)

                await db.commit()

        except Exception as e:
            logger.error(f"❌ Failed to send campaign {campaign_id}: {e}")
            # 這裡可以加入重試邏輯或通知管理員

    async def _send_survey_job(self, survey_id: int):
        """
        背景任務：發送問卷

        Args:
            survey_id: 問卷 ID
        """
        try:
            logger.info(f"🚀 Executing scheduled survey {survey_id}")

            # 動態導入避免循環依賴
            from app.services.linebot_service import LineBotService

            linebot_service = LineBotService()
            await linebot_service.send_survey(survey_id)

            logger.info(f"✅ Survey {survey_id} sent successfully")

        except Exception as e:
            logger.error(f"❌ Failed to send survey {survey_id}: {e}")
            # 這裡可以加入重試邏輯或通知管理員


# 全局排程器實例
scheduler = CampaignScheduler()
