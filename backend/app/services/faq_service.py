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
    FaqRuleVersion,
    FaqRuleTag,
    AiTokenUsage,
    AiToneConfig,
    FaqModuleAuth,
)
from app.models.chatbot_booking import FaqPmsConnection

logger = logging.getLogger(__name__)

MAX_RULES_PER_CATEGORY = 20
MAX_VERSIONS_PER_RULE = 2

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
            cat.updated_at = datetime.now(timezone.utc)

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

        # 取得每個分類的規則數量
        for cat in categories:
            count_stmt = (
                select(func.count())
                .select_from(FaqRule)
                .where(FaqRule.category_id == cat.id)
            )
            count_result = await db.execute(count_stmt)
            cat.rule_count = count_result.scalar() or 0

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
        category.updated_at = datetime.now(timezone.utc)
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

    # === 發佈與版本 ===

    async def publish_rule(
        self, db: AsyncSession, rule_id: int, user_id: int
    ) -> Optional[FaqRule]:
        """發佈規則（建立版本快照）"""
        rule = await self.get_rule(db, rule_id)
        if not rule:
            return None

        now = datetime.now(timezone.utc)

        # 取得目前最大版本號
        ver_stmt = (
            select(func.max(FaqRuleVersion.version_number))
            .where(FaqRuleVersion.rule_id == rule_id)
        )
        ver_result = await db.execute(ver_stmt)
        max_ver = ver_result.scalar() or 0

        # 建立新版本快照
        version = FaqRuleVersion(
            rule_id=rule_id,
            content_json=rule.content_json,
            status="active",
            version_number=max_ver + 1,
            snapshot_at=now,
        )
        db.add(version)

        # 保留最多 MAX_VERSIONS_PER_RULE 版本（刪除舊版）
        all_ver_stmt = (
            select(FaqRuleVersion)
            .where(FaqRuleVersion.rule_id == rule_id)
            .order_by(FaqRuleVersion.version_number.desc())
        )
        all_ver_result = await db.execute(all_ver_stmt)
        all_versions = all_ver_result.scalars().all()

        if len(all_versions) >= MAX_VERSIONS_PER_RULE:
            for old_ver in all_versions[MAX_VERSIONS_PER_RULE - 1:]:
                await db.delete(old_ver)

        # 更新規則狀態
        rule.status = "active"
        rule.published_at = now
        rule.published_by = user_id

        await db.flush()
        return rule

    async def revert_rule(
        self, db: AsyncSession, rule_id: int
    ) -> Optional[FaqRule]:
        """回復至上一版本"""
        rule = await self.get_rule(db, rule_id)
        if not rule:
            return None

        # 取得上一個版本
        ver_stmt = (
            select(FaqRuleVersion)
            .where(FaqRuleVersion.rule_id == rule_id)
            .order_by(FaqRuleVersion.version_number.desc())
            .offset(0)
            .limit(1)
        )
        ver_result = await db.execute(ver_stmt)
        prev_version = ver_result.scalar_one_or_none()

        if not prev_version:
            raise ValueError("沒有可回復的版本")

        rule.content_json = prev_version.content_json
        rule.status = "draft"

        await db.flush()
        return rule

    async def get_rule_versions(
        self, db: AsyncSession, rule_id: int
    ) -> List[FaqRuleVersion]:
        """取得版本歷史"""
        stmt = (
            select(FaqRuleVersion)
            .where(FaqRuleVersion.rule_id == rule_id)
            .order_by(FaqRuleVersion.version_number.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

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
        now = datetime.now(timezone.utc)
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
        """發佈所有 draft 規則（批次建立 FaqRuleVersion 快照），回傳發佈數量"""
        from datetime import datetime, timezone

        # 發佈所有啟用的 draft 規則（停用規則不建立快照）
        stmt = select(FaqRule).where(FaqRule.status == "draft", FaqRule.is_enabled_filter())
        result = await db.execute(stmt)
        rules = result.scalars().all()

        now = datetime.now(timezone.utc)
        count = 0
        for rule in rules:
            # 取得目前最大版本號
            ver_stmt = (
                select(func.max(FaqRuleVersion.version_number))
                .where(FaqRuleVersion.rule_id == rule.id)
            )
            ver_result = await db.execute(ver_stmt)
            max_ver = ver_result.scalar() or 0

            # 建立版本快照（spec 第九部分）
            version = FaqRuleVersion(
                rule_id=rule.id,
                content_json=rule.content_json,
                status="active",
                version_number=max_ver + 1,
                snapshot_at=now,
            )
            db.add(version)

            # 保留最多 MAX_VERSIONS_PER_RULE 版本
            all_ver_stmt = (
                select(FaqRuleVersion)
                .where(FaqRuleVersion.rule_id == rule.id)
                .order_by(FaqRuleVersion.version_number.desc())
            )
            all_ver_result = await db.execute(all_ver_stmt)
            all_versions = all_ver_result.scalars().all()
            if len(all_versions) >= MAX_VERSIONS_PER_RULE:
                for old_ver in all_versions[MAX_VERSIONS_PER_RULE - 1:]:
                    await db.delete(old_ver)

            rule.status = "active"
            rule.published_at = now
            rule.published_by = user_id
            count += 1

        await db.flush()
        return count

    async def export_rules(
        self, db: AsyncSession, category_id: int
    ) -> List[FaqRule]:
        """匯出分類下所有規則"""
        stmt = (
            select(FaqRule)
            .where(FaqRule.category_id == category_id)
            .order_by(FaqRule.id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def import_rules(
        self, db: AsyncSession, category_id: int, rows: List[Dict[str, Any]], user_id: int
    ) -> int:
        """匯入規則（完全覆蓋現有規則），回傳匯入數量"""
        # 刪除現有規則
        await db.execute(
            delete(FaqRule).where(FaqRule.category_id == category_id)
        )

        count = 0
        for row in rows:
            rule = FaqRule(
                category_id=category_id,
                content_json=json.dumps(row, ensure_ascii=False),
                status="draft",
                created_by=user_id,
                updated_by=user_id,
            )
            db.add(rule)
            count += 1

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
        now = datetime.now(timezone.utc)
        conn = FaqPmsConnection(
            faq_category_id=category_id,
            api_endpoint=api_endpoint,
            api_key_encrypted=api_key,  # 簡化：暫不加密
            auth_type=auth_type,
            status="enabled",
            last_synced_at=now,
            snapshot_completed=True,
        )
        db.add(conn)
        await self._touch_category(db, category_id)
        await db.flush()
        return conn

    async def toggle_pms_connection(
        self, db: AsyncSession, category_id: int, status: str
    ) -> Optional[FaqPmsConnection]:
        """切換 PMS 串接狀態"""
        conn = await self.get_pms_connection(db, category_id)
        if not conn:
            return None
        conn.status = status
        if status == "enabled":
            conn.last_synced_at = datetime.now(timezone.utc)
        await self._touch_category(db, category_id)
        await db.flush()
        return conn

    async def get_default_industry(self, db: AsyncSession) -> Optional[Industry]:
        """取得預設產業（旅宿業）"""
        stmt = select(Industry).where(Industry.is_active == True).limit(1)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
