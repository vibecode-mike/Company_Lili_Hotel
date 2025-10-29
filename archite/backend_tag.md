# 追蹤標籤功能 - 後端技術設計文檔

## 📋 1. 需求分析

### 1.1 核心需求
1. **元件級別追蹤**：記錄用戶對活動中每個元件（輪播卡片、按鈕）的互動
2. **多維度統計**：
   - 哪些用戶（line_id）觸發了哪個活動（campaign_id）的哪個元件（component_id）
   - 每個元件被觸發的總次數
   - 每個用戶對同一元件的觸發次數
3. **互動類型追蹤**：
   - 圖片點擊（image_click）
   - 按鈕點擊 - 觸發訊息（trigger_message）
   - 按鈕點擊 - 開啟網址（open_url）
   - 按鈕點擊 - 觸發圖片（trigger_image）

### 1.2 現有系統分析

#### 已有資料表
```
✅ interaction_tags        - 互動標籤（已有 campaign_id, trigger_count）
✅ tag_trigger_logs        - 標籤觸發日誌（已有 member_id, tag_id, campaign_id）
✅ template_carousel_items - 輪播項目（已有 interaction_tag_id）
✅ members                 - 會員表（line_uid）
```

#### 現有追蹤機制
```
✅ /__click 端點          - 追蹤 URL 點擊（已實現）
✅ PostbackEvent 處理器   - 處理 postback 事件（待擴展）
```

#### 系統缺陷
```
❌ tag_trigger_logs 缺少元件 ID（無法區分同一活動中不同元件的觸發）
❌ 缺少互動類型記錄（無法區分是點圖片還是點按鈕）
❌ PostbackEvent 只記錄訊息，未整合到追蹤系統
❌ 缺少元件級別的統計聚合
```

---

## 🏗️ 2. 系統架構設計

### 2.1 資料庫設計

#### 2.1.1 新增表：component_interaction_logs（元件互動日誌）

```sql
CREATE TABLE component_interaction_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主鍵',

    -- 關聯維度
    line_id VARCHAR(100) NOT NULL COMMENT 'LINE 用戶 UID',
    campaign_id BIGINT NOT NULL COMMENT '活動ID (campaigns.id)',
    template_id BIGINT COMMENT '模板ID (message_templates.id)',
    carousel_item_id BIGINT COMMENT '輪播元件ID (template_carousel_items.id)',
    interaction_tag_id BIGINT COMMENT '互動標籤ID (interaction_tags.id)',
    component_slot VARCHAR(50) COMMENT '模板元件槽位（hero_image、confirm_primary 等）',

    -- 互動資訊
    interaction_type ENUM(
        'image_click',        -- 點擊圖片
        'button_message',     -- 按鈕觸發訊息
        'button_url',         -- 按鈕開啟網址
        'button_image',       -- 按鈕觸發圖片
        'postback'            -- LINE postback 事件
    ) NOT NULL COMMENT '互動類型',

    interaction_value TEXT COMMENT '互動值（訊息內容、URL等）',

    -- 追蹤資訊
    triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '觸發時間',
    line_event_type VARCHAR(50) COMMENT 'LINE 事件類型',
    user_agent TEXT COMMENT '用戶代理',

    -- 索引
    INDEX idx_line_campaign (line_id, campaign_id),
    INDEX idx_template_slot (template_id, component_slot),
    INDEX idx_campaign_item (campaign_id, carousel_item_id),
    INDEX idx_triggered_at (triggered_at),
    INDEX idx_interaction_type (interaction_type),

    -- 外鍵
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (carousel_item_id) REFERENCES template_carousel_items(id) ON DELETE SET NULL,
    FOREIGN KEY (interaction_tag_id) REFERENCES interaction_tags(id) ON DELETE SET NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='元件互動日誌表';
```

#### 2.1.2 擴展現有表：template_carousel_items

```sql
-- 添加追蹤統計欄位
ALTER TABLE template_carousel_items
ADD COLUMN click_count INT DEFAULT 0 COMMENT '點擊次數',
ADD COLUMN unique_click_count INT DEFAULT 0 COMMENT '唯一點擊數',
ADD COLUMN last_clicked_at DATETIME COMMENT '最後點擊時間';
```

#### 2.1.3 元件槽位定義

為了統一不同模板的互動元件，新增 `component_slot` 概念，對應以下槽位：

| 模板類型 | component_slot | 說明 |
|----------|----------------|------|
| image_click | `hero_image` | 主要圖片點擊區 |
| image_click | `hero_button` | 圖片上的覆蓋按鈕 |
| image_card | `card_button_primary` | 主要行動按鈕 |
| image_card | `card_button_secondary` | 次要行動按鈕 |
| image_card | `card_button_tertiary` | 第三個自訂按鈕 / 外部連結 |
| text_button | `confirm_primary` | 文字確認模板的主按鈕 |
| text_button | `confirm_secondary` | 文字確認模板的次按鈕 |

> 可依後續模板擴充維持命名規則：`{區域}_{元素類型}`，保持 50 字元內。

#### 2.1.4 資料表關係圖

```
component_interaction_logs (元件互動日誌)
    ↓ (N:1)
campaigns (活動)
    ↓ (1:N)
message_templates (訊息模板)
    ↓ (1:N)
template_carousel_items (輪播元件)
    ↓ (N:1)
interaction_tags (互動標籤)
```

### 2.2 追蹤機制設計

#### 2.2.1 追蹤流程架構

```
┌─────────────────┐
│  LINE 用戶端     │
│  (點擊元件)      │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
    [圖片點擊]                            [按鈕點擊]
         │                                      │
         ↓                                      ↓
┌─────────────────┐              ┌──────────────────────┐
│ image_click     │              │ action.type:         │
│ (URI action)    │              │ - message (postback) │
│                 │              │ - uri (網址)         │
└────────┬────────┘              └──────────┬───────────┘
         │                                  │
         ├──────────────────────────────────┤
         │      嵌入追蹤參數                 │
         │   ?cid=101&iid=5&type=xxx        │
         └──────────────┬───────────────────┘
                        ↓
              ┌─────────────────────┐
              │  Flask LINE Bot      │
              │  - /__click          │
              │  - PostbackEvent     │
              │  - MessageEvent      │
              └─────────┬────────────┘
                        ↓
              ┌─────────────────────┐
              │  追蹤服務層          │
              │  TrackingService    │
              └─────────┬────────────┘
                        ↓
              ┌─────────────────────┐
              │  記錄到資料庫        │
              │  component_         │
              │  interaction_logs   │
              └─────────────────────┘
```

#### 2.2.2 追蹤參數設計

**URL 追蹤參數**（用於所有可點擊元素）：
```
?cid={campaign_id}           # 活動ID (必須)
&tpl={template_id}            # 模板ID (可選，用於非輪播模板)
&iid={carousel_item_id}      # 元件ID (可選)
&slot={component_slot}       # 模板槽位 (可選)
&tid={interaction_tag_id}    # 標籤ID (可選)
&type={interaction_type}     # 互動類型 (必須)
&uid={line_user_id}          # LINE 用戶ID (必須)
```

- 當互動源於非輪播模板時 `tpl` + `slot` 為主要識別；輪播模板可同時帶 `iid` 與 `slot`（保留覆蓋按鈕區與圖卡按鈕位）。
- `slot` 建議採用表 2.1.3 中的命名，保持資料一致性。

**Postback Data 格式**（用於按鈕觸發訊息）：
```json
{
    "action": "track_interaction",
    "cid": 101,
    "tpl": 501,
    "iid": 5,
    "slot": "hero_button",
    "tid": 10,
    "type": "button_message",
    "value": "查看更多資訊"
}
```

- `tpl` 代表原始訊息模板，`slot` 為模板槽位，可協助後台重建按鈕/圖片來源。

---

## 🔧 3. 後端實現設計

### 3.1 SQLAlchemy 模型

#### 3.1.1 新增模型：ComponentInteractionLog

```python
# backend/app/models/component_interaction_log.py

from sqlalchemy import (
    Column, String, BigInteger, DateTime, Text,
    Enum as SQLEnum, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import enum


class InteractionType(str, enum.Enum):
    """互動類型"""
    IMAGE_CLICK = "image_click"          # 點擊圖片
    BUTTON_MESSAGE = "button_message"    # 按鈕觸發訊息
    BUTTON_URL = "button_url"            # 按鈕開啟網址
    BUTTON_IMAGE = "button_image"        # 按鈕觸發圖片
    POSTBACK = "postback"                # LINE postback 事件


class ComponentInteractionLog(Base):
    """元件互動日誌表"""

    __tablename__ = "component_interaction_logs"

    # 關聯維度
    line_id = Column(
        String(100),
        nullable=False,
        index=True,
        comment="LINE 用戶 UID"
    )
    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="活動ID"
    )
    template_id = Column(
        BigInteger,
        ForeignKey("message_templates.id", ondelete="SET NULL"),
        index=True,
        comment="模板ID"
    )
    carousel_item_id = Column(
        BigInteger,
        ForeignKey("template_carousel_items.id", ondelete="SET NULL"),
        index=True,
        comment="輪播元件ID"
    )
    interaction_tag_id = Column(
        BigInteger,
        ForeignKey("interaction_tags.id", ondelete="SET NULL"),
        index=True,
        comment="互動標籤ID"
    )
    component_slot = Column(
        String(50),
        index=True,
        comment="模板元件槽位"
    )

    # 互動資訊
    interaction_type = Column(
        SQLEnum(InteractionType),
        nullable=False,
        index=True,
        comment="互動類型"
    )
    interaction_value = Column(Text, comment="互動值")

    # 追蹤資訊
    triggered_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="觸發時間"
    )
    line_event_type = Column(String(50), comment="LINE 事件類型")
    user_agent = Column(Text, comment="用戶代理")

    # 關聯關係
    campaign = relationship("Campaign")
    template = relationship("MessageTemplate")
    carousel_item = relationship("TemplateCarouselItem")
    interaction_tag = relationship("InteractionTag")

    __table_args__ = (
        Index('idx_line_campaign', 'line_id', 'campaign_id'),
        Index('idx_template_slot', 'template_id', 'component_slot'),
        Index('idx_campaign_item', 'campaign_id', 'carousel_item_id'),
    )
```

#### 3.1.2 更新模型：TemplateCarouselItem

```python
# backend/app/models/template.py - 添加統計欄位

class TemplateCarouselItem(Base):
    # ... 現有欄位 ...

    # 追蹤統計欄位
    click_count = Column(Integer, default=0, comment="點擊次數")
    unique_click_count = Column(Integer, default=0, comment="唯一點擊數")
    last_clicked_at = Column(DateTime, comment="最後點擊時間")
```

### 3.2 服務層設計

#### 3.2.1 TrackingService（追蹤服務）

```python
# backend/app/services/tracking_service.py

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.models.component_interaction_log import (
    ComponentInteractionLog, InteractionType
)
from app.models.template import TemplateCarouselItem
from app.models.tag import InteractionTag
from app.models.member import Member, MemberSource
from datetime import datetime


class TrackingService:
    """追蹤服務"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def track_interaction(
        self,
        line_uid: str,
        campaign_id: int,
        interaction_type: InteractionType,
        template_id: Optional[int] = None,
        carousel_item_id: Optional[int] = None,
        component_slot: Optional[str] = None,
        interaction_tag_id: Optional[int] = None,
        interaction_value: Optional[str] = None,
        line_event_type: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ComponentInteractionLog:
        """
        記錄元件互動

        Args:
            line_uid: LINE 用戶ID
            campaign_id: 活動ID
            interaction_type: 互動類型
            template_id: 模板ID（可選）
            carousel_item_id: 輪播元件ID（可選）
            component_slot: 模板元件槽位（可選）
            interaction_tag_id: 互動標籤ID（可選）
            interaction_value: 互動值（可選）
            line_event_type: LINE 事件類型（可選）
            user_agent: 用戶代理（可選）

        Returns:
            ComponentInteractionLog: 互動日誌記錄
        """

        # 1. 建立互動日誌
        log = ComponentInteractionLog(
            line_id=line_uid,
            campaign_id=campaign_id,
            template_id=template_id,
            carousel_item_id=carousel_item_id,
            interaction_tag_id=interaction_tag_id,
            component_slot=component_slot,
            interaction_type=interaction_type,
            interaction_value=interaction_value,
            line_event_type=line_event_type,
            user_agent=user_agent,
            triggered_at=datetime.utcnow()
        )

        self.db.add(log)
        await self.db.flush()

        # 2. 更新統計（異步執行，不影響主流程）
        await self._update_statistics(
            campaign_id,
            template_id,
            carousel_item_id,
            component_slot,
            interaction_tag_id
        )

        await self.db.commit()
        await self.db.refresh(log)

        return log

    async def _update_statistics(
        self,
        campaign_id: int,
        template_id: Optional[int],
        carousel_item_id: Optional[int],
        component_slot: Optional[str],
        interaction_tag_id: Optional[int]
    ):
        """更新統計資料"""

        # 更新輪播元件統計
        if carousel_item_id:
            # 更新總點擊次數
            await self.db.execute(
                update(TemplateCarouselItem)
                .where(TemplateCarouselItem.id == carousel_item_id)
                .values(
                    click_count=TemplateCarouselItem.click_count + 1,
                    last_clicked_at=datetime.utcnow()
                )
            )

            # 計算唯一點擊數
            unique_count_result = await self.db.execute(
                select(func.count(func.distinct(ComponentInteractionLog.line_id)))
                .where(
                    ComponentInteractionLog.carousel_item_id == carousel_item_id
                )
            )
            unique_count = unique_count_result.scalar()

            await self.db.execute(
                update(TemplateCarouselItem)
                .where(TemplateCarouselItem.id == carousel_item_id)
                .values(unique_click_count=unique_count)
            )

        # 其他模板槽位（如文字確認按鈕）暫採即時計算，
        # 若後續需要持久化可新增 template_component_metrics 表統一存儲。

        # 更新互動標籤統計
        if interaction_tag_id:
            # 更新觸發次數
            await self.db.execute(
                update(InteractionTag)
                .where(InteractionTag.id == interaction_tag_id)
                .values(
                    trigger_count=InteractionTag.trigger_count + 1,
                    last_triggered_at=datetime.utcnow()
                )
            )

            # 計算唯一用戶數
            unique_member_count_result = await self.db.execute(
                select(func.count(func.distinct(ComponentInteractionLog.line_id)))
                .where(
                    ComponentInteractionLog.interaction_tag_id == interaction_tag_id
                )
            )
            unique_member_count = unique_member_count_result.scalar()

            await self.db.execute(
                update(InteractionTag)
                .where(InteractionTag.id == interaction_tag_id)
                .values(member_count=unique_member_count)
            )

    async def get_campaign_statistics(self, campaign_id: int) -> dict:
        """
        取得活動統計資料

        Returns:
            {
                "total_interactions": 總互動次數,
                "unique_members": 唯一會員數,
                "interaction_breakdown": {
                    "image_click": 數量,
                    "button_message": 數量,
                    ...
                },
                "component_stats": [
                    {
                        "template_id": 模板ID,
                        "carousel_item_id": 相關輪播元件ID（若有）,
                        "component_slot": 模板槽位（hero_image / confirm_primary ...）, 
                        "click_count": 次數,
                        "unique_click_count": 唯一次數
                    }
                ]
            }
        """

        # 總互動次數
        total_result = await self.db.execute(
            select(func.count(ComponentInteractionLog.id))
            .where(ComponentInteractionLog.campaign_id == campaign_id)
        )
        total_interactions = total_result.scalar()

        # 唯一用戶數
        unique_members_result = await self.db.execute(
            select(func.count(func.distinct(ComponentInteractionLog.line_id)))
            .where(ComponentInteractionLog.campaign_id == campaign_id)
        )
        unique_members = unique_members_result.scalar()

        # 互動類型分佈
        interaction_breakdown_result = await self.db.execute(
            select(
                ComponentInteractionLog.interaction_type,
                func.count(ComponentInteractionLog.id)
            )
            .where(ComponentInteractionLog.campaign_id == campaign_id)
            .group_by(ComponentInteractionLog.interaction_type)
        )
        interaction_breakdown = {
            row[0].value: row[1] for row in interaction_breakdown_result
        }

        # 元件統計
        component_stats_result = await self.db.execute(
            select(
                ComponentInteractionLog.template_id,
                ComponentInteractionLog.carousel_item_id,
                ComponentInteractionLog.component_slot,
                func.count(ComponentInteractionLog.id).label("click_count"),
                func.count(
                    func.distinct(ComponentInteractionLog.line_id)
                ).label("unique_click_count")
            )
            .where(ComponentInteractionLog.campaign_id == campaign_id)
            .group_by(
                ComponentInteractionLog.template_id,
                ComponentInteractionLog.carousel_item_id,
                ComponentInteractionLog.component_slot
            )
        )
        component_stats = [
            {
                "template_id": row.template_id,
                "carousel_item_id": row.carousel_item_id,
                "component_slot": row.component_slot,
                "click_count": row.click_count,
                "unique_click_count": row.unique_click_count
            }
            for row in component_stats_result
        ]

        return {
            "total_interactions": total_interactions,
            "unique_members": unique_members,
            "interaction_breakdown": interaction_breakdown,
            "component_stats": component_stats
        }
```

### 3.3 LINE Bot 整合設計

#### 3.3.1 修改 Flex Message 生成邏輯

```python
# line_app/app.py - 修改 make_image_click_bubble() 函數

def make_image_click_bubble_with_tracking(
    item: dict,
    campaign_id: int,
    template_id: int,
    carousel_item_id: Optional[int],
    line_user_id: str
) -> dict:
    """生成帶追蹤參數的圖片點擊型 Flex Message"""

    image_url = image_url_from_item(item) or "https://dummyimage.com/..."
    aspect_ratio = item.get("image_aspect_ratio", "1:1")
    interaction_tag_id = item.get("interaction_tag_id")

    # 構建追蹤 URL
    def build_tracking_url(
        interaction_type: str,
        target_url: Optional[str] = None,
        slot: Optional[str] = None
    ) -> str:
        """構建追蹤 URL"""
        params = {
            "cid": campaign_id,
            "tpl": template_id,
            "iid": carousel_item_id,
            "slot": slot,
            "tid": interaction_tag_id,
            "type": interaction_type,
            "uid": line_user_id
        }

        if target_url:
            params["to"] = quote(target_url, safe='')

        query_string = "&".join(f"{k}={v}" for k, v in params.items() if v)
        return f"{PUBLIC_BASE}/__track?{query_string}"

    # 檢查是否啟用動作按鈕
    action_button_enabled = item.get("action_button_enabled", False)

    if not action_button_enabled:
        # 場景 1: 純圖片
        click_action_type = item.get("image_click_action_type", "open_image")
        click_action_value = item.get("image_click_action_value")

        if click_action_type == "open_url" and click_action_value:
            action_uri = build_tracking_url("image_click", click_action_value, slot="hero_image")
        else:
            action_uri = build_tracking_url("image_click", image_url, slot="hero_image")

        # 返回純圖片格式（image_only.json）
        return {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": image_url,
                "size": "full",
                "aspectRatio": aspect_ratio,
                "aspectMode": "cover",
                "action": {
                    "type": "uri",
                    "uri": action_uri
                }
            }
        }

    # 場景 2-5: 有動作按鈕
    action_button_text = item.get("action_button_text", "點擊查看")
    interaction_type = item.get("action_button_interaction_type", "none")

    button_box = {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#00000077",
        "cornerRadius": "999px",
        "paddingTop": "8px",
        "paddingBottom": "8px",
        "paddingStart": "20px",
        "paddingEnd": "20px",
        "width": "180px",
        "alignItems": "center",
        "justifyContent": "center",
        "contents": [
            {
                "type": "text",
                "text": action_button_text,
                "weight": "bold",
                "size": "sm",
                "align": "center",
                "color": "#FFFFFF"
            }
        ]
    }

    # 根據互動類型添加 action
    if interaction_type == "trigger_message":
        # 使用 postback 來追蹤
        trigger_message = item.get("action_button_trigger_message", "")
        postback_data = json.dumps({
            "action": "track_interaction",
            "cid": campaign_id,
            "tpl": template_id,
            "iid": carousel_item_id,
            "slot": "hero_button",
            "tid": interaction_tag_id,
            "type": "button_message",
            "value": trigger_message
        })

        button_box["action"] = {
            "type": "postback",
            "label": "action",
            "data": postback_data,
            "displayText": trigger_message
        }

    elif interaction_type == "open_url":
        button_url = item.get("action_button_url", "")
        tracked_url = build_tracking_url("button_url", button_url, slot="hero_button")

        button_box["action"] = {
            "type": "uri",
            "label": "action",
            "uri": tracked_url
        }

    elif interaction_type == "trigger_image":
        trigger_image_url = item.get("action_button_trigger_image_url", "")
        tracked_url = build_tracking_url("button_image", trigger_image_url, slot="hero_button")

        button_box["action"] = {
            "type": "uri",
            "label": "action",
            "uri": tracked_url
        }

    return {
        "type": "bubble",
        "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "0px",
            "contents": [
                {
                    "type": "image",
                    "url": image_url,
                    "size": "full",
                    "aspectMode": "cover",
                    "aspectRatio": aspect_ratio
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "position": "absolute",
                    "offsetBottom": "20px",
                    "offsetStart": "0px",
                    "offsetEnd": "0px",
                    "width": "100%",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "contents": [button_box]
                }
            ]
        }
    }
```

#### 3.3.2 新增追蹤端點：/__track

```python
# line_app/app.py

@app.get("/__track")
def track_interaction():
    """
    統一追蹤端點
    處理所有互動類型的追蹤
    """
    try:
        # 解析參數
        campaign_id = int(request.args.get("cid", "0"))
        template_id = int(request.args.get("tpl", "0")) or None
        carousel_item_id = int(request.args.get("iid", "0")) or None
        component_slot = request.args.get("slot", "") or None
        interaction_tag_id = int(request.args.get("tid", "0")) or None
        interaction_type = request.args.get("type", "")
        line_uid = request.args.get("uid", "")
        target_url = request.args.get("to", "")

        if not campaign_id or not interaction_type or not line_uid:
            logging.warning("Missing required tracking parameters")
            return redirect(target_url or PUBLIC_BASE)

        # 記錄追蹤（異步執行，不阻塞重定向）
        try:
            with engine.begin() as conn:
                # 插入互動日誌
                conn.execute(
                    text("""
                        INSERT INTO component_interaction_logs
                        (line_id, campaign_id, template_id, carousel_item_id, component_slot, interaction_tag_id,
                         interaction_type, interaction_value, line_event_type, triggered_at)
                        VALUES (:uid, :cid, :tpl, :iid, :slot, :tid, :itype, :ival, 'click', NOW())
                    """),
                    {
                        "uid": line_uid,
                        "cid": campaign_id,
                        "tpl": template_id,
                        "iid": carousel_item_id,
                        "slot": component_slot,
                        "tid": interaction_tag_id,
                        "itype": interaction_type,
                        "ival": target_url
                    }
                )

                # 更新統計
                if carousel_item_id:
                    conn.execute(
                        text("""
                            UPDATE template_carousel_items
                            SET click_count = click_count + 1,
                                last_clicked_at = NOW()
                            WHERE id = :iid
                        """),
                        {"iid": carousel_item_id}
                    )

                if interaction_tag_id:
                    conn.execute(
                        text("""
                            UPDATE interaction_tags
                            SET trigger_count = trigger_count + 1,
                                last_triggered_at = NOW()
                            WHERE id = :tid
                        """),
                        {"tid": interaction_tag_id}
                    )

                logging.info(f"Tracked: {interaction_type} - Campaign {campaign_id}")

        except Exception as e:
            logging.exception(f"Failed to track interaction: {e}")

        # 重定向到目標 URL
        if target_url:
            return redirect(target_url)
        else:
            return redirect(PUBLIC_BASE)

    except Exception as e:
        logging.exception("Track endpoint error")
        return redirect(PUBLIC_BASE)
```

#### 3.3.3 擴展 PostbackEvent 處理器

```python
# line_app/app.py

@handler.add(PostbackEvent)
def on_postback(event: PostbackEvent):
    """處理 postback 事件並追蹤"""
    uid = getattr(event.source, "user_id", None)
    data_str = getattr(event.postback, "data", "") if getattr(event, "postback", None) else ""

    if not uid or not data_str:
        return

    try:
        # 解析 postback data
        data = json.loads(data_str)

        # 記錄訊息（原有邏輯）
        mid = upsert_member(uid)
        insert_message(mid, "incoming", "postback", {"data": data_str})

        # 追蹤互動（新增邏輯）
        if data.get("action") == "track_interaction":
            campaign_id = data.get("cid")
            template_id = data.get("tpl")
            carousel_item_id = data.get("iid")
            component_slot = data.get("slot")
            interaction_tag_id = data.get("tid")
            interaction_type = data.get("type")
            interaction_value = data.get("value")

            if campaign_id and interaction_type:
                try:
                    with engine.begin() as conn:
                        # 插入互動日誌
                        conn.execute(
                            text("""
                                INSERT INTO component_interaction_logs
                                (line_id, campaign_id, template_id, carousel_item_id, component_slot, interaction_tag_id,
                                 interaction_type, interaction_value, line_event_type, triggered_at)
                                VALUES (:uid, :cid, :tpl, :iid, :slot, :tid, :itype, :ival, 'postback', NOW())
                            """),
                            {
                                "uid": uid,
                                "cid": campaign_id,
                                "tpl": template_id,
                                "iid": carousel_item_id,
                                "slot": component_slot,
                                "tid": interaction_tag_id,
                                "itype": interaction_type,
                                "ival": interaction_value
                            }
                        )

                        # 更新統計
                        if carousel_item_id:
                            conn.execute(
                                text("""
                                    UPDATE template_carousel_items
                                    SET click_count = click_count + 1,
                                        last_clicked_at = NOW()
                                    WHERE id = :iid
                                """),
                                {"iid": carousel_item_id}
                            )

                        if interaction_tag_id:
                            conn.execute(
                                text("""
                                    UPDATE interaction_tags
                                    SET trigger_count = trigger_count + 1,
                                        last_triggered_at = NOW()
                                    WHERE id = :tid
                                """),
                                {"tid": interaction_tag_id}
                            )

                        logging.info(f"Postback tracked: Campaign {campaign_id}")

                except Exception as e:
                    logging.exception(f"Failed to track postback: {e}")

    except json.JSONDecodeError:
        logging.warning(f"Invalid postback data: {data_str}")
    except Exception as e:
        logging.exception("Postback tracking error")
```

### 3.3.4 模板槽位映射

為了讓不同模板共用追蹤機制，需在產生訊息時指定 `component_slot`：

| 模板 | 元件 | component_slot | 備註 |
|------|------|----------------|------|
| 圖片點擊 | 主圖片 | hero_image | 任何點擊圖片的互動皆落在此槽位 |
| 圖片點擊 | 覆蓋按鈕 | hero_button | `action_button_*` 產生的互動 |
| 圖卡按鈕 | 主要行動按鈕 | card_button_primary | 對應 template item 的第一個按鈕 |
| 圖卡按鈕 | 次要按鈕 | card_button_secondary | 依序指派第二個按鈕 |
| 圖卡按鈕 | 連結 / 第三按鈕 | card_button_tertiary | 包含外部 URL 或額外 CTA |
| 文字按鈕確認 | 主按鈕 | confirm_primary | 對應 LINE Confirm 左側按鈕 |
| 文字按鈕確認 | 次按鈕 | confirm_secondary | 對應 LINE Confirm 右側按鈕 |

> 若後續新增模板，只需在生成訊息時補上對應的 `component_slot`，不用調整資料表結構。

落實方式：
- 圖片點擊模板：`make_image_click_bubble_with_tracking` 需帶入 `template_id`，圖片使用 `hero_image`，覆蓋按鈕使用 `hero_button`。
- 圖卡按鈕模板：每個 TemplateCarouselItem 依順序標記 `card_button_primary` / `card_button_secondary` / `card_button_tertiary`，並保留 `carousel_item_id` 以利既有統計。
- 文字按鈕確認模板：左右按鈕分別標記 `confirm_primary`、`confirm_secondary`，便於報表拆解按鈕成效。

### 3.4 API 端點設計

#### 3.4.1 查詢活動統計

```python
# backend/app/api/v1/campaigns.py

from app.services.tracking_service import TrackingService

@router.get("/{campaign_id}/statistics")
async def get_campaign_statistics(
    campaign_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    取得活動追蹤統計

    Returns:
        {
            "code": 200,
            "data": {
                "total_interactions": 總互動次數,
                "unique_members": 唯一會員數,
                "interaction_breakdown": {...},
                "component_stats": [...]
            }
        }
    """
    tracking_service = TrackingService(db)
    stats = await tracking_service.get_campaign_statistics(campaign_id)

    return {"code": 200, "data": stats}
```

#### 3.4.2 查詢元件追蹤記錄

```python
@router.get("/{campaign_id}/interactions")
async def get_campaign_interactions(
    campaign_id: int,
    template_id: Optional[int] = None,
    carousel_item_id: Optional[int] = None,
    component_slot: Optional[str] = None,
    interaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    查詢活動的互動記錄

    Params:
        template_id: 篩選特定模板
        carousel_item_id: 篩選特定輪播元件
        component_slot: 篩選特定模板槽位
        interaction_type: 篩選互動類型
        start_date: 開始時間
        end_date: 結束時間
    """
    query = select(ComponentInteractionLog).where(
        ComponentInteractionLog.campaign_id == campaign_id
    )

    if template_id:
        query = query.where(ComponentInteractionLog.template_id == template_id)

    if carousel_item_id:
        query = query.where(ComponentInteractionLog.carousel_item_id == carousel_item_id)

    if component_slot:
        query = query.where(ComponentInteractionLog.component_slot == component_slot)

    if interaction_type:
        query = query.where(ComponentInteractionLog.interaction_type == interaction_type)

    if start_date:
        query = query.where(ComponentInteractionLog.triggered_at >= start_date)

    if end_date:
        query = query.where(ComponentInteractionLog.triggered_at <= end_date)

    # 分頁
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.order_by(ComponentInteractionLog.triggered_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    interactions = result.scalars().all()

    return {
        "code": 200,
        "data": {
            "items": [
                {
                    "id": i.id,
                    "line_id": i.line_id,
                    "template_id": i.template_id,
                    "carousel_item_id": i.carousel_item_id,
                    "component_slot": i.component_slot,
                    "interaction_type": i.interaction_type.value,
                    "interaction_value": i.interaction_value,
                    "triggered_at": i.triggered_at.isoformat()
                }
                for i in interactions
            ],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    }
```

---

## 📊 4. 統計與分析功能

### 4.1 實時統計指標

```python
# 活動層級統計
GET /api/v1/campaigns/{campaign_id}/statistics
→ {
    "total_interactions": 1250,        # 總互動次數
    "unique_members": 456,             # 唯一會員數
    "interaction_rate": 0.36,          # 互動率 (unique_members / sent_count)
    "interaction_breakdown": {
        "image_click": 500,
        "button_message": 300,
        "button_url": 350,
        "button_image": 100
    },
    "component_stats": [
        {
            "template_id": 501,
            "carousel_item_id": 101,
            "component_slot": "hero_image",
            "click_count": 300,
            "unique_click_count": 200
        },
        ...
    ],
    "hourly_distribution": [...],     # 每小時分佈
    "top_engaged_members": [...]      # 最活躍會員
}

# 元件層級統計
GET /api/v1/campaigns/{campaign_id}/components/{item_id}/statistics
→ {
    "click_count": 300,
    "unique_click_count": 200,
    "click_rate": 0.67,                # 點擊率
    "last_clicked_at": "2025-10-27T14:30:00",
    "top_interaction_type": "button_url",
    "member_interactions": [...]       # 會員互動分佈
}
```

### 4.2 資料匯出功能

```python
# 匯出 CSV
GET /api/v1/campaigns/{campaign_id}/interactions/export?format=csv

# 匯出 JSON
GET /api/v1/campaigns/{campaign_id}/interactions/export?format=json
```

---

## 🔄 5. 資料庫遷移腳本

### 5.1 Alembic Migration

```python
# backend/alembic/versions/xxxx_add_component_tracking.py

"""add component tracking system

Revision ID: xxxx
Revises: yyyy
Create Date: 2025-10-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None


def upgrade():
    # 創建 component_interaction_logs 表
    op.create_table(
        'component_interaction_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('line_id', sa.String(100), nullable=False),
        sa.Column('campaign_id', sa.BigInteger(), nullable=False),
        sa.Column('template_id', sa.BigInteger(), nullable=True),
        sa.Column('carousel_item_id', sa.BigInteger(), nullable=True),
        sa.Column('component_slot', sa.String(length=50), nullable=True),
        sa.Column('interaction_tag_id', sa.BigInteger(), nullable=True),
        sa.Column('interaction_type',
                  sa.Enum('image_click', 'button_message', 'button_url',
                         'button_image', 'postback', name='interactiontype'),
                  nullable=False),
        sa.Column('interaction_value', sa.Text(), nullable=True),
        sa.Column('triggered_at', sa.DateTime(), nullable=False),
        sa.Column('line_event_type', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['message_templates.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['carousel_item_id'], ['template_carousel_items.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['interaction_tag_id'], ['interaction_tags.id'], ondelete='SET NULL'),
        mysql_charset='utf8mb4',
        mysql_comment='元件互動日誌表'
    )

    # 創建索引
    op.create_index('idx_line_campaign', 'component_interaction_logs', ['line_id', 'campaign_id'])
    op.create_index('idx_template_slot', 'component_interaction_logs', ['template_id', 'component_slot'])
    op.create_index('idx_campaign_item', 'component_interaction_logs', ['campaign_id', 'carousel_item_id'])
    op.create_index('idx_triggered_at', 'component_interaction_logs', ['triggered_at'])
    op.create_index('idx_interaction_type', 'component_interaction_logs', ['interaction_type'])

    # 擴展 template_carousel_items 表
    op.add_column('template_carousel_items',
                  sa.Column('click_count', sa.Integer(), server_default='0', nullable=True))
    op.add_column('template_carousel_items',
                  sa.Column('unique_click_count', sa.Integer(), server_default='0', nullable=True))
    op.add_column('template_carousel_items',
                  sa.Column('last_clicked_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('template_carousel_items', 'last_clicked_at')
    op.drop_column('template_carousel_items', 'unique_click_count')
    op.drop_column('template_carousel_items', 'click_count')

    op.drop_index('idx_interaction_type', 'component_interaction_logs')
    op.drop_index('idx_triggered_at', 'component_interaction_logs')
    op.drop_index('idx_campaign_item', 'component_interaction_logs')
    op.drop_index('idx_template_slot', 'component_interaction_logs')
    op.drop_index('idx_line_campaign', 'component_interaction_logs')

    op.drop_table('component_interaction_logs')
```

---

## 🚀 6. 部署計劃

### 6.1 部署步驟

```bash
# 1. 資料庫遷移
cd /data2/lili_hotel/backend
source ../venv/bin/activate
alembic upgrade head

# 2. 部署後端服務
systemctl restart lili_hotel_backend

# 3. 部署 LINE Bot
systemctl restart lili_hotel_linebot

# 4. 驗證部署
curl http://localhost:8700/api/v1/campaigns/101/statistics
```

### 6.2 回滾計劃

```bash
# 如果需要回滾
alembic downgrade -1
systemctl restart lili_hotel_backend
systemctl restart lili_hotel_linebot
```

---

## 📈 7. 效能評估

### 7.1 預期負載

```
- 每日活動: 10 個
- 每個活動發送: 1000 人
- 點擊率: 30%
- 每日追蹤記錄: 3,000 筆
- 每月追蹤記錄: 90,000 筆
```

### 7.2 效能優化策略

1. **索引優化**：關鍵查詢欄位建立複合索引
2. **非同步寫入**：追蹤記錄使用非同步寫入，不阻塞主流程
3. **快取機制**：統計資料使用 Redis 快取（5分鐘）
4. **批次更新**：統計資料每小時批次重新計算
5. **資料歸檔**：超過 6 個月的記錄自動歸檔

---

## ✅ 8. 測試計劃

### 8.1 單元測試

```python
# tests/test_tracking_service.py

async def test_track_interaction():
    """測試追蹤互動功能"""
    service = TrackingService(db_session)

    log = await service.track_interaction(
        line_uid="U123456",
        campaign_id=101,
        interaction_type=InteractionType.BUTTON_MESSAGE,
        template_id=501,
        carousel_item_id=5,
        component_slot="hero_button",
        interaction_value="查看更多"
    )

    assert log.id is not None
    assert log.member_id is not None
    assert log.campaign_id == 101
```

### 8.2 整合測試

```bash
# 測試追蹤端點
curl "http://localhost:3001/__track?cid=101&tpl=501&iid=5&slot=hero_image&type=image_click&uid=U123456"

# 測試 postback 追蹤
curl -X POST http://localhost:3001/callback \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "postback",
      "source": {"userId": "U123456"},
      "postback": {
        "data": "{\"action\":\"track_interaction\",\"cid\":101,\"tpl\":501,\"iid\":5,\"slot\":\"hero_button\",\"type\":\"button_message\"}"
      }
    }]
  }'

# 查詢統計
curl http://localhost:8700/api/v1/campaigns/101/statistics
```

---

## 📝 9. 總結

### 9.1 核心特點

✅ **完整追蹤**：覆蓋所有互動類型（圖片、按鈕、訊息）
✅ **元件級別**：精確到輪播卡片與模板槽位（hero_button、confirm_primary 等）
✅ **即時統計**：支援即時查詢和統計分析
✅ **非侵入式**：不影響現有業務邏輯
✅ **高效能**：異步寫入、索引優化、快取機制

### 9.2 技術亮點

- 使用 Enum 類型確保資料一致性
- 複合索引優化查詢效能
- 非同步統計更新不阻塞主流程
- 支援 postback 和 URI 兩種追蹤方式
- component_slot 槽位設計覆蓋不同模板，擴充時僅需新增槽位映射
- 完整的資料庫遷移和回滾方案

### 9.3 下一步

等待您確認此設計後，我將：
1. 實現所有模型和服務層代碼
2. 修改 LINE Bot 追蹤邏輯
3. 創建資料庫遷移腳本
4. 編寫完整的測試用例
5. 提供部署文檔

---

**請您確認此設計是否符合需求，有任何問題或需要調整的地方請告知！** 🎯
