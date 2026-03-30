"""
FAQ 知識庫管理服務層
"""
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
import logging

from app.models.faq import (
    Industry,
    FaqCategory,
    FaqCategoryField,
    FaqRule,
    FaqRuleTag,
    AiTokenUsage,
    AiToneConfig,
    FaqModuleAuth,
)
from app.models.chatbot_booking import FaqPmsConnection

logger = logging.getLogger(__name__)

MAX_RULES_PER_CATEGORY = 20

# PMS 串接啟用時，這些欄位由 PMS 自動帶入，後台不可手動修改
PMS_READONLY_FIELDS = {"房價", "間數", "人數", "url"}


class FaqService:
    """FAQ 知識庫管理服務"""

    async def _touch_category(self, db: AsyncSession, category_id: int):
        """更新大分類的 updated_at 時間戳（觸發最後更新時間刷新）"""
        stmt = select(FaqCategory).where(FaqCategory.id == category_id)
        result = await db.execute(stmt)
        cat = result.scalar_one_or_none()
        if cat:
            cat.updated_at = datetime.now()

    # === 大分類 ===

    async def get_categories(
        self, db: AsyncSession, industry_id: int
    ) -> List[FaqCategory]:
        """取得大分類清單（含欄位定義與規則數量）"""
        stmt = (
            select(FaqCategory)
            .options(selectinload(FaqCategory.fields))
            .where(FaqCategory.industry_id == industry_id)
            .order_by(FaqCategory.sort_order)
        )
        result = await db.execute(stmt)
        categories = result.scalars().all()

        # 一次查詢取得所有分類的規則數量與已發佈數量
        from sqlalchemy import case
        counts_stmt = (
            select(
                FaqRule.category_id,
                func.count().label("rule_count"),
                func.count(case((
                    (FaqRule.status == "active") & (FaqRule.is_enabled == True), 1  # noqa: E712
                ))).label("published_count"),
            )
            .select_from(FaqRule)
            .group_by(FaqRule.category_id)
        )
        counts_result = await db.execute(counts_stmt)
        counts_map = {row.category_id: (row.rule_count, row.published_count) for row in counts_result}

        for cat in categories:
            rc, pc = counts_map.get(cat.id, (0, 0))
            cat.rule_count = rc
            cat.published_count = pc

        return list(categories)

    async def toggle_category(
        self, db: AsyncSession, category_id: int, is_active: bool
    ) -> Optional[FaqCategory]:
        """啟用/停用大分類"""
        stmt = select(FaqCategory).where(FaqCategory.id == category_id)
        result = await db.execute(stmt)
        category = result.scalar_one_or_none()
        if not category:
            return None

        category.is_active = is_active
        category.updated_at = datetime.now()
        await db.flush()
        return category

    # === 規則 CRUD ===

    async def get_rules(
        self,
        db: AsyncSession,
        category_id: int,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """取得規則清單（含分頁）"""
        base_stmt = select(FaqRule).where(FaqRule.category_id == category_id)
        if status:
            base_stmt = base_stmt.where(FaqRule.status == status)

        # 計數
        count_stmt = (
            select(func.count())
            .select_from(FaqRule)
            .where(FaqRule.category_id == category_id)
        )
        if status:
            count_stmt = count_stmt.where(FaqRule.status == status)
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

        # 查詢
        stmt = (
            base_stmt.options(selectinload(FaqRule.tags))
            .order_by(FaqRule.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(stmt)
        rules = result.scalars().all()

        # 解析 content_json
        for rule in rules:
            if isinstance(rule.content_json, str):
                try:
                    rule._parsed_content = json.loads(rule.content_json)
                except (json.JSONDecodeError, TypeError):
                    rule._parsed_content = {}
            else:
                rule._parsed_content = rule.content_json or {}

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": list(rules),
        }

    async def get_rule(self, db: AsyncSession, rule_id: int) -> Optional[FaqRule]:
        """取得單筆規則"""
        stmt = (
            select(FaqRule)
            .options(selectinload(FaqRule.tags))
            .where(FaqRule.id == rule_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_rule(
        self,
        db: AsyncSession,
        category_id: int,
        content_json: Dict[str, Any],
        tag_names: List[str],
        user_id: int,
    ) -> FaqRule:
        """建立規則"""
        # 檢查分類是否存在
        cat_stmt = select(FaqCategory).where(FaqCategory.id == category_id)
        cat_result = await db.execute(cat_stmt)
        category = cat_result.scalar_one_or_none()
        if not category:
            raise ValueError("大分類不存在")

        # 檢查規則數量上限
        count_stmt = (
            select(func.count())
            .select_from(FaqRule)
            .where(FaqRule.category_id == category_id)
        )
        count_result = await db.execute(count_stmt)
        current_count = count_result.scalar() or 0
        if current_count >= MAX_RULES_PER_CATEGORY:
            raise ValueError(f"已達規則數量上限（{MAX_RULES_PER_CATEGORY} 筆），無法新增")

        rule = FaqRule(
            category_id=category_id,
            content_json=json.dumps(content_json, ensure_ascii=False),
            status="draft",
            created_by=user_id,
            updated_by=user_id,
        )
        db.add(rule)
        await db.flush()

        # 建立標籤關聯
        for tag_name in tag_names:
            tag = FaqRuleTag(rule_id=rule.id, tag_name=tag_name)
            db.add(tag)

        await self._touch_category(db, category_id)
        await db.flush()
        return rule

    async def update_rule(
        self,
        db: AsyncSession,
        rule_id: int,
        content_json: Optional[Dict[str, Any]],
        tag_names: Optional[List[str]],
        user_id: int,
    ) -> Optional[FaqRule]:
        """編輯規則（狀態回到 draft）"""
        rule = await self.get_rule(db, rule_id)
        if not rule:
            return None

        if content_json is not None:
            # PMS 串接啟用時，剔除 PMS 唯讀欄位的變更
            pms_conn = await self.get_pms_connection(db, rule.category_id)
            if pms_conn and pms_conn.status == "enabled":
                old_content = json.loads(rule.content_json) if rule.content_json else {}
                for field in PMS_READONLY_FIELDS:
                    if field in old_content:
                        content_json[field] = old_content[field]
            rule.content_json = json.dumps(content_json, ensure_ascii=False)

        rule.status = "draft"
        rule.updated_by = user_id

        # 更新標籤
        if tag_names is not None:
            await db.execute(
                delete(FaqRuleTag).where(FaqRuleTag.rule_id == rule_id)
            )
            for tag_name in tag_names:
                tag = FaqRuleTag(rule_id=rule.id, tag_name=tag_name)
                db.add(tag)

        await self._touch_category(db, rule.category_id)
        await db.flush()
        return rule

    async def delete_rule(self, db: AsyncSession, rule_id: int) -> bool:
        """刪除規則"""
        stmt = select(FaqRule).where(FaqRule.id == rule_id)
        result = await db.execute(stmt)
        rule = result.scalar_one_or_none()
        if not rule:
            return False

        category_id = rule.category_id
        await db.delete(rule)
        await self._touch_category(db, category_id)
        await db.flush()
        return True

    # === 發佈 ===

    async def publish_rule(
        self, db: AsyncSession, rule_id: int, user_id: int
    ) -> Optional[FaqRule]:
        """發佈規則（將 status 設為 active）"""
        rule = await self.get_rule(db, rule_id)
        if not rule:
            return None

        now = datetime.now()
        rule.status = "active"
        rule.published_at = now
        rule.published_by = user_id

        await db.flush()
        return rule

    # === Token 用量 ===

    async def get_token_usage(
        self, db: AsyncSession, industry_id: int
    ) -> Optional[AiTokenUsage]:
        """查詢 Token 用量"""
        stmt = select(AiTokenUsage).where(
            AiTokenUsage.industry_id == industry_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_token_quota(
        self, db: AsyncSession, industry_id: int, total_quota: int
    ) -> Optional[AiTokenUsage]:
        """設定 Token 額度"""
        usage = await self.get_token_usage(db, industry_id)
        if not usage:
            usage = AiTokenUsage(
                industry_id=industry_id,
                total_quota=total_quota,
                used_amount=0,
            )
            db.add(usage)
        else:
            usage.total_quota = total_quota
        await db.flush()
        return usage

    # === 語氣設定 ===

    async def get_tone_configs(self, db: AsyncSession) -> List[AiToneConfig]:
        """查詢語氣設定"""
        stmt = select(AiToneConfig).order_by(AiToneConfig.id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def activate_tone(
        self, db: AsyncSession, tone_id: int
    ) -> Optional[AiToneConfig]:
        """切換語氣（全域只有一個啟用）"""
        # 先把所有語氣停用
        all_stmt = select(AiToneConfig)
        all_result = await db.execute(all_stmt)
        for tone in all_result.scalars().all():
            tone.is_active = False

        # 啟用指定語氣
        stmt = select(AiToneConfig).where(AiToneConfig.id == tone_id)
        result = await db.execute(stmt)
        tone = result.scalar_one_or_none()
        if not tone:
            return None

        tone.is_active = True
        await db.flush()
        return tone

    # === 模組授權 ===

    async def get_module_auth(
        self, db: AsyncSession, client_id: str
    ) -> Optional[FaqModuleAuth]:
        """查詢模組授權狀態"""
        stmt = select(FaqModuleAuth).where(FaqModuleAuth.client_id == client_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_module_auth(
        self,
        db: AsyncSession,
        client_id: str,
        is_authorized: bool,
        authorized_by: Optional[str] = None,
    ) -> FaqModuleAuth:
        """設定模組授權"""
        auth = await self.get_module_auth(db, client_id)
        now = datetime.now()
        if not auth:
            auth = FaqModuleAuth(
                client_id=client_id,
                is_authorized=is_authorized,
                authorized_at=now if is_authorized else None,
                authorized_by=authorized_by,
            )
            db.add(auth)
        else:
            auth.is_authorized = is_authorized
            if is_authorized:
                auth.authorized_at = now
                auth.authorized_by = authorized_by
        await db.flush()
        return auth

    # === 取得產業 ===

    async def validate_required_fields(
        self, db: AsyncSession, category_id: int, content_json: Dict[str, Any]
    ) -> Optional[str]:
        """驗證必填欄位，回傳第一個缺少的欄位名稱，全部通過回傳 None"""
        stmt = (
            select(FaqCategoryField)
            .where(
                FaqCategoryField.category_id == category_id,
                FaqCategoryField.is_required == True,
            )
            .order_by(FaqCategoryField.sort_order)
        )
        result = await db.execute(stmt)
        required_fields = result.scalars().all()

        for field in required_fields:
            if field.field_name not in content_json or not content_json[field.field_name]:
                return field.field_name
        return None

    async def toggle_rule(
        self, db: AsyncSession, rule_id: int, is_enabled: bool = None, status: str = None
    ) -> Optional[FaqRule]:
        """切換規則啟用狀態（is_enabled）或發佈狀態（status）。

        兩維度獨立：
        - is_enabled: 啟用/停用（控制測試環境能否引用）
        - status: draft/active（控制前台聊天機器人是否引用快照）
        停用規則不影響前台已發佈快照，直到下次發佈。
        """
        rule = await self.get_rule(db, rule_id)
        if not rule:
            return None

        if is_enabled is not None:
            rule.is_enabled = is_enabled
            # 啟停變更 → 發佈狀態回到 draft，等下次發佈才同步前台
            if rule.status == "active":
                rule.status = "draft"
        if status is not None:
            rule.status = status
        await self._touch_category(db, rule.category_id)
        await db.flush()
        return rule

    async def publish_all_draft(
        self, db: AsyncSession, user_id: int
    ) -> int:
        """發佈所有 draft 規則，回傳發佈數量。
        - 分類 is_active=True + 規則 is_enabled=True + status=draft → 發佈
        - 分類 is_active=False 的已發佈規則 → 撤回為未發佈
        """
        now = datetime.now()

        # 1. 取得所有啟用分類的 ID
        active_cat_stmt = select(FaqCategory.id).where(FaqCategory.is_active == True)  # noqa: E712
        active_cat_result = await db.execute(active_cat_stmt)
        active_cat_ids = set(active_cat_result.scalars().all())

        # 2. 發佈：分類 on + 規則 on + draft
        publish_stmt = select(FaqRule).where(
            FaqRule.status == "draft",
            FaqRule.is_enabled_filter(),
            FaqRule.category_id.in_(active_cat_ids),
        )
        publish_result = await db.execute(publish_stmt)
        publish_rules = publish_result.scalars().all()

        count = 0
        for rule in publish_rules:
            rule.status = "active"
            rule.published_at = now
            rule.published_by = user_id
            count += 1

        # 3. 撤回：分類 off 的已發佈規則 → 未發佈
        if active_cat_ids:
            revoke_stmt = select(FaqRule).where(
                FaqRule.status == "active",
                FaqRule.category_id.notin_(active_cat_ids),
            )
        else:
            revoke_stmt = select(FaqRule).where(FaqRule.status == "active")
        revoke_result = await db.execute(revoke_stmt)
        revoke_rules = revoke_result.scalars().all()

        for rule in revoke_rules:
            rule.status = "draft"
            rule.published_at = None

        await db.flush()
        return count

    async def export_rules(
        self, db: AsyncSession, category_id: int
    ) -> List[FaqRule]:
        """匯出分類下所有規則（含標籤）"""
        stmt = (
            select(FaqRule)
            .options(selectinload(FaqRule.tags))
            .where(FaqRule.category_id == category_id)
            .order_by(FaqRule.id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def import_rules(
        self, db: AsyncSession, category_id: int, rows: List[Dict[str, Any]], user_id: int
    ) -> int:
        """匯入規則（以房型名稱為 key，Upsert + 刪除多餘），回傳匯入數量"""
        # 查詢現有規則（含 tags），建立 {房型名稱: rule} 對照表
        stmt = (
            select(FaqRule)
            .options(selectinload(FaqRule.tags))
            .where(FaqRule.category_id == category_id)
        )
        result = await db.execute(stmt)
        existing_rules = list(result.scalars().all())

        existing_map: Dict[str, FaqRule] = {}
        for rule in existing_rules:
            content = rule.content_json
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except (json.JSONDecodeError, TypeError):
                    content = {}
            name = content.get("房型名稱", "")
            if name:
                existing_map[name] = rule

        # Upsert：以房型名稱比對
        imported_names = set()
        count = 0
        for row in rows:
            # 抽出會員標籤，不存進 content_json
            tag_value = row.pop("會員標籤", "").strip()
            tag_names = [t.strip() for t in tag_value.split(",") if t.strip()] if tag_value else []

            name = row.get("房型名稱", "")
            imported_names.add(name)
            content_json_str = json.dumps(row, ensure_ascii=False)

            if name in existing_map:
                # UPDATE（視同新規則，重置所有狀態）
                rule = existing_map[name]
                rule.content_json = content_json_str
                rule.status = "draft"
                rule.published_at = None
                rule.is_enabled = True
                rule.updated_by = user_id
                # 更新標籤：刪除舊的，建立新的
                for old_tag in list(rule.tags):
                    await db.delete(old_tag)
                await db.flush()
                for tn in tag_names:
                    db.add(FaqRuleTag(rule_id=rule.id, tag_name=tn))
            else:
                # INSERT（新規則，預設未發佈 + 測試環境 off）
                rule = FaqRule(
                    category_id=category_id,
                    content_json=content_json_str,
                    status="draft",
                    created_by=user_id,
                    updated_by=user_id,
                )
                db.add(rule)
                await db.flush()
                for tn in tag_names:
                    db.add(FaqRuleTag(rule_id=rule.id, tag_name=tn))
            count += 1

        # 刪除 DB 中有但匯入檔沒有的規則
        for name, rule in existing_map.items():
            if name not in imported_names:
                await db.delete(rule)

        await db.flush()
        return count

    # === PMS 串接 ===

    async def get_pms_connection(
        self, db: AsyncSession, category_id: int
    ) -> Optional[FaqPmsConnection]:
        """取得 PMS 串接設定"""
        stmt = select(FaqPmsConnection).where(
            FaqPmsConnection.faq_category_id == category_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_pms_connection(
        self,
        db: AsyncSession,
        category_id: int,
        api_endpoint: str,
        api_key: str,
        auth_type: str,
    ) -> FaqPmsConnection:
        """建立 PMS 串接設定"""
        # 檢查是否已有連線（重新串接）
        existing = await self.get_pms_connection(db, category_id)
        if existing:
            existing.api_endpoint = api_endpoint
            existing.api_key_encrypted = api_key
            existing.auth_type = auth_type
            existing.status = "enabled"
            existing.last_synced_at = datetime.now()
            existing.error_message = None
            await self._touch_category(db, category_id)
            await db.flush()
            # 重新串接：snapshot_completed=True → 不再觸發快照（spec）
            if not existing.snapshot_completed:
                await self._snapshot_pms_to_faq(db, category_id, existing)
            return existing

        now = datetime.now()
        conn = FaqPmsConnection(
            faq_category_id=category_id,
            api_endpoint=api_endpoint,
            api_key_encrypted=api_key,
            auth_type=auth_type,
            status="enabled",
            last_synced_at=now,
            snapshot_completed=False,
        )
        db.add(conn)
        await self._touch_category(db, category_id)
        await db.flush()

        # 首次串接：自動將 PMS 房型資料帶入 FAQ 規則
        await self._snapshot_pms_to_faq(db, category_id, conn)
        return conn

    async def _snapshot_pms_to_faq(
        self,
        db: AsyncSession,
        category_id: int,
        conn: FaqPmsConnection,
    ) -> None:
        """首次串接 PMS 時，將 PMS 房型資料自動帶入 FAQ 規則。

        Spec: faq_pms_realtime_connection.feature — 首次快照機制
        """
        import asyncio
        from app.services.pms_chatbot_client import pms_enabled, query_pms

        if not pms_enabled():
            conn.snapshot_completed = True
            await db.flush()
            return

        try:
            # 查詢 PMS 取得所有房型（用明天~後天做為查詢區間）
            from datetime import timedelta
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
            raw = await asyncio.to_thread(query_pms, tomorrow, day_after, None, 2)

            rooms = raw.get("room", []) if isinstance(raw, dict) else []
            if not rooms:
                conn.snapshot_completed = True
                await db.flush()
                return

            # 載入房型名稱對照表
            from app.services.chatbot_service import ROOMTYPE_NAME, ROOMTYPE_MAX_OCCUPANCY

            for room in rooms:
                code = room.get("roomtype", "")
                data_rows = room.get("data", []) or []
                if not code or not data_rows:
                    continue

                name = ROOMTYPE_NAME.get(code, code)
                price = data_rows[0].get("price", 0)
                remain = min((d.get("remain", 0) for d in data_rows), default=0)
                max_occ = ROOMTYPE_MAX_OCCUPANCY.get(code, 2)

                content_json = json.dumps({
                    "房型名稱": name,
                    "房型特色": "",
                    "房價": str(price),
                    "人數": str(max_occ),
                    "間數": str(remain),
                    "url": "",
                    "image_url": "",
                }, ensure_ascii=False)

                rule = FaqRule(
                    category_id=category_id,
                    content_json=content_json,
                    status="draft",
                    is_enabled=True,
                )
                db.add(rule)

            conn.snapshot_completed = True
            await db.flush()
            logger.info(f"PMS snapshot: created {len(rooms)} FAQ rules for category {category_id}")

        except Exception as exc:
            logger.warning(f"PMS snapshot failed: {exc}")
            # 快照失敗不阻擋串接，標記為未完成，下次串接可重試
            conn.snapshot_completed = False
            await db.flush()

    async def toggle_pms_connection(
        self, db: AsyncSession, category_id: int, status: str
    ) -> Optional[FaqPmsConnection]:
        """切換 PMS 串接狀態"""
        conn = await self.get_pms_connection(db, category_id)
        if not conn:
            return None
        conn.status = status
        if status == "enabled":
            conn.last_synced_at = datetime.now()
        await self._touch_category(db, category_id)
        await db.flush()
        return conn

    async def get_default_industry(self, db: AsyncSession) -> Optional[Industry]:
        """取得預設產業（旅宿業）"""
        stmt = select(Industry).where(Industry.is_active == True).limit(1)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
