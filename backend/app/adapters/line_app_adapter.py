"""
LINE App 功能適配器
橋接 line_app/app.py 的同步函數到 Backend 的異步架構
"""
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import asyncio
import sys
import logging
import importlib.util
from threading import Lock

logger = logging.getLogger(__name__)

# 線程池（用于運行同步函數）
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="line_app_")
_import_lock = Lock()
usage_monitor = None
_sync_push_campaign = None

# 從配置導入路徑
from app.config import settings
LINE_APP_PATH = str(settings.line_app_path)


def _import_line_app_modules():
    """動態導入 line_app 模塊，避免命名衝突"""
    global usage_monitor, _sync_push_campaign

    if usage_monitor is not None and _sync_push_campaign is not None:
        return

    # 臨時將 line_app 目錄添加到 sys.path
    original_sys_path = sys.path.copy()

    try:
        # 添加 line_app 到搜索路徑
        if LINE_APP_PATH not in sys.path:
            sys.path.insert(0, LINE_APP_PATH)

        # 導入 usage_monitor
        import usage_monitor as um
        globals()['usage_monitor'] = um

        # 導入 app.push_campaign（使用 importlib 避免與 backend app 模塊衝突）
        spec = importlib.util.spec_from_file_location(
            "line_app.app",
            f"{LINE_APP_PATH}/app.py"
        )
        line_app_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(line_app_module)

        # 獲取 push_campaign 函數
        globals()['_sync_push_campaign'] = line_app_module.push_campaign

        logger.info("✅ line_app 模塊導入成功")

    except Exception as e:
        logger.error(f"❌ 無法導入 line_app 模塊: {e}")
        logger.error(f"當前 sys.path: {sys.path}")
        raise
    finally:
        # 恢復原始 sys.path（可選，避免污染）
        # sys.path = original_sys_path
        pass


def _ensure_line_app_modules():
    """按需加載 line_app，避免模塊導入階段觸發副作用。"""
    if usage_monitor is not None and _sync_push_campaign is not None:
        return

    with _import_lock:
        if usage_monitor is not None and _sync_push_campaign is not None:
            return
        _import_line_app_modules()


class LineAppAdapter:
    """LINE App 功能適配器

    將 line_app/app.py 中的同步函數適配爲異步函數，供 FastAPI Backend 調用
    """

    @staticmethod
    async def get_quota(channel_id: Optional[str] = None) -> Dict[str, Any]:
        """獲取 LINE 配額信息（異步）

        Args:
            channel_id: LINE 頻道 ID（可選，用于多租戶）

        Returns:
            {
                "type": "none" | "limited",  # 配額類型
                "monthly_limit": int,         # 月度限額
                "used": int,                  # 已使用
                "remaining": int              # 剩餘配額
            }

        Raises:
            Exception: LINE API 調用失敗
        """
        loop = asyncio.get_event_loop()

        try:
            _ensure_line_app_modules()
            logger.info(f"查詢 LINE 配額，channel_id: {channel_id}")
            result = await loop.run_in_executor(
                _executor,
                usage_monitor.get_monthly_usage_summary,
                channel_id
            )
            logger.info(f"配額查詢結果: {result}")

            # 檢查結果是否成功
            if not result.get("ok", True):
                # 返回默認值（無配額限制）
                logger.warning(f"配額查詢失敗: {result.get('error', 'unknown')}")
                return {
                    "type": "none",
                    "monthly_limit": 0,
                    "used": 0,
                    "remaining": 999999  # 默認無限配額
                }

            # 檢查 remaining 是否爲 None（LINE 未配置或無配額數據）
            if result.get("remaining") is None:
                logger.info("LINE 配額未配置，返回默認無限配額")
                return {
                    "type": result.get("type", "none"),
                    "monthly_limit": result.get("monthly_limit") or 0,
                    "used": result.get("used") or 0,
                    "remaining": 999999  # 默認無限配額
                }

            return result
        except Exception as e:
            logger.error(f"配額查詢異常: {e}")
            # 返回默認值（無配額限制）
            return {
                "type": "none",
                "monthly_limit": 0,
                "used": 0,
                "remaining": 999999
            }

    @staticmethod
    async def preflight_check(payload: Dict) -> Dict[str, Any]:
        """群發預檢（驗證配額是否充足）- 異步

        Args:
            payload: {
                "target_audience": "all" | "tags",  # 目標受衆類型
                "target_tags": [...],               # 目標標籤（可選）
                "channel_id": str                   # LINE 頻道 ID
            }

        Returns:
            {
                "ok": bool,                          # 是否通過預檢
                "status": "OK" | "INSUFFICIENT_QUOTA",  # 狀態
                "remaining": int,                    # 剩餘配額
                "needed": int,                       # 需要的配額
                "deficit": int                       # 不足的數量（如果不足）
            }

        Raises:
            Exception: LINE API 調用失敗或計算錯誤
        """
        loop = asyncio.get_event_loop()

        try:
            _ensure_line_app_modules()
            logger.info(f"執行群發預檢，payload: {payload}")
            result = await loop.run_in_executor(
                _executor,
                usage_monitor.preflight_check,
                payload
            )
            logger.info(f"預檢結果: {result}")
            return result
        except Exception as e:
            logger.error(f"預檢失敗: {e}")
            raise

    @staticmethod
    async def send_campaign(payload: Dict) -> Dict[str, Any]:
        """發送群發消息（異步）

        Args:
            payload: {
                "campaign_id": int,              # 活動/消息 ID
                "channel_id": str,               # LINE 頻道 ID（可選）
                "target_audience": "all" | "tags",  # 目標受衆類型
                "target_tags": [...],            # 目標標籤（可選）
                "flex_message_json": dict,       # 前端生成的 Flex Message
                "alt_text": str                  # 替代文字
            }

        Returns:
            {
                "ok": bool,                       # 是否發送成功
                "campaign_id": int,               # 活動/消息 ID
                "sent": int,                      # 成功發送數量
                "failed": int,                    # 失敗數量
                "errors": [...]                   # 失敗信息列表
            }

        Raises:
            Exception: 發送失敗
        """
        loop = asyncio.get_event_loop()

        try:
            _ensure_line_app_modules()
            logger.info(f"開始發送群發消息，campaign_id: {payload.get('campaign_id')}")
            logger.debug(f"發送 payload: {payload}")

            result = await loop.run_in_executor(
                _executor,
                _sync_push_campaign,
                payload
            )

            logger.info(f"發送完成: 成功 {result.get('sent', 0)}，失敗 {result.get('failed', 0)}")
            return result
        except Exception as e:
            logger.error(f"發送失敗: {e}", exc_info=True)
            raise
