"""
LINE App 功能适配器
桥接 line_app/app.py 的同步函数到 Backend 的异步架构
"""
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import asyncio
import sys
import logging
import importlib.util

logger = logging.getLogger(__name__)

# 线程池（用于运行同步函数）
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="line_app_")

# 从配置导入路径
from app.config import settings
LINE_APP_PATH = str(settings.project_root / "line_app")


def _import_line_app_modules():
    """动态导入 line_app 模块，避免命名冲突"""
    global usage_monitor, _sync_push_campaign

    # 临时将 line_app 目录添加到 sys.path
    original_sys_path = sys.path.copy()

    try:
        # 添加 line_app 到搜索路径
        if LINE_APP_PATH not in sys.path:
            sys.path.insert(0, LINE_APP_PATH)

        # 导入 usage_monitor
        import usage_monitor as um
        globals()['usage_monitor'] = um

        # 导入 app.push_campaign（使用 importlib 避免与 backend app 模块冲突）
        spec = importlib.util.spec_from_file_location(
            "line_app.app",
            f"{LINE_APP_PATH}/app.py"
        )
        line_app_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(line_app_module)

        # 获取 push_campaign 函数
        globals()['_sync_push_campaign'] = line_app_module.push_campaign

        logger.info("✅ line_app 模块导入成功")

    except Exception as e:
        logger.error(f"❌ 无法导入 line_app 模块: {e}")
        logger.error(f"当前 sys.path: {sys.path}")
        raise
    finally:
        # 恢复原始 sys.path（可选，避免污染）
        # sys.path = original_sys_path
        pass


# 执行导入
try:
    _import_line_app_modules()
except Exception as e:
    logger.warning(f"line_app 模块导入失败，某些功能可能不可用: {e}")


class LineAppAdapter:
    """LINE App 功能适配器

    将 line_app/app.py 中的同步函数适配为异步函数，供 FastAPI Backend 调用
    """

    @staticmethod
    async def get_quota(channel_id: Optional[str] = None) -> Dict[str, Any]:
        """获取 LINE 配额信息（异步）

        Args:
            channel_id: LINE 频道 ID（可选，用于多租户）

        Returns:
            {
                "type": "none" | "limited",  # 配额类型
                "monthly_limit": int,         # 月度限额
                "used": int,                  # 已使用
                "remaining": int              # 剩余配额
            }

        Raises:
            Exception: LINE API 调用失败
        """
        loop = asyncio.get_event_loop()

        try:
            logger.info(f"查询 LINE 配额，channel_id: {channel_id}")
            result = await loop.run_in_executor(
                _executor,
                usage_monitor.get_monthly_usage_summary,
                channel_id
            )
            logger.info(f"配额查询结果: {result}")

            # 检查结果是否成功
            if not result.get("ok", True):
                # 返回默认值（无配额限制）
                logger.warning(f"配额查询失败: {result.get('error', 'unknown')}")
                return {
                    "type": "none",
                    "monthly_limit": 0,
                    "used": 0,
                    "remaining": 999999  # 默认无限配额
                }

            # 检查 remaining 是否为 None（LINE 未配置或无配额数据）
            if result.get("remaining") is None:
                logger.info("LINE 配额未配置，返回默认无限配额")
                return {
                    "type": result.get("type", "none"),
                    "monthly_limit": result.get("monthly_limit") or 0,
                    "used": result.get("used") or 0,
                    "remaining": 999999  # 默认无限配额
                }

            return result
        except Exception as e:
            logger.error(f"配额查询异常: {e}")
            # 返回默认值（无配额限制）
            return {
                "type": "none",
                "monthly_limit": 0,
                "used": 0,
                "remaining": 999999
            }

    @staticmethod
    async def preflight_check(payload: Dict) -> Dict[str, Any]:
        """群发预检（验证配额是否充足）- 异步

        Args:
            payload: {
                "target_audience": "all" | "tags",  # 目标受众类型
                "target_tags": [...],               # 目标标签（可选）
                "channel_id": str                   # LINE 频道 ID
            }

        Returns:
            {
                "ok": bool,                          # 是否通过预检
                "status": "OK" | "INSUFFICIENT_QUOTA",  # 状态
                "remaining": int,                    # 剩余配额
                "needed": int,                       # 需要的配额
                "deficit": int                       # 不足的数量（如果不足）
            }

        Raises:
            Exception: LINE API 调用失败或计算错误
        """
        loop = asyncio.get_event_loop()

        try:
            logger.info(f"执行群发预检，payload: {payload}")
            result = await loop.run_in_executor(
                _executor,
                usage_monitor.preflight_check,
                payload
            )
            logger.info(f"预检结果: {result}")
            return result
        except Exception as e:
            logger.error(f"预检失败: {e}")
            raise

    @staticmethod
    async def send_campaign(payload: Dict) -> Dict[str, Any]:
        """发送群发消息（异步）

        Args:
            payload: {
                "campaign_id": int,              # 活动/消息 ID
                "channel_id": str,               # LINE 频道 ID（可选）
                "target_audience": "all" | "tags",  # 目标受众类型
                "target_tags": [...],            # 目标标签（可选）
                "flex_message_json": dict,       # 前端生成的 Flex Message
                "alt_text": str                  # 替代文字
            }

        Returns:
            {
                "ok": bool,                       # 是否发送成功
                "campaign_id": int,               # 活动/消息 ID
                "sent": int,                      # 成功发送数量
                "failed": int,                    # 失败数量
                "errors": [...]                   # 失败信息列表
            }

        Raises:
            Exception: 发送失败
        """
        loop = asyncio.get_event_loop()

        try:
            logger.info(f"开始发送群发消息，campaign_id: {payload.get('campaign_id')}")
            logger.debug(f"发送 payload: {payload}")

            result = await loop.run_in_executor(
                _executor,
                _sync_push_campaign,
                payload
            )

            logger.info(f"发送完成: 成功 {result.get('sent', 0)}，失败 {result.get('failed', 0)}")
            return result
        except Exception as e:
            logger.error(f"发送失败: {e}", exc_info=True)
            raise
