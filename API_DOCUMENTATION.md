# 丽丽酒店 LINE Bot 后端 API 文档

**版本**: v1.0
**最后更新**: 2025-10-28
**Base URL**: `http://127.0.0.1:8700/api/v1`

---

## 目录

- [通用说明](#通用说明)
- [活动推播 API](#活动推播-api)
  - [创建活动](#创建活动)
  - [获取活动列表](#获取活动列表)
  - [获取活动详情](#获取活动详情)
  - [立即发送活动](#立即发送活动)
  - [删除活动](#删除活动)
  - [预计发送人数](#预计发送人数)
- [问卷管理 API](#问卷管理-api)
- [标签管理 API](#标签管理-api)
- [数据模型](#数据模型)
- [错误处理](#错误处理)

---

## 通用说明

### 请求格式
- **Content-Type**: `application/json`
- **字符编码**: UTF-8
- **时区**: Asia/Taipei (UTC+8)

### 响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

### HTTP状态码
| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 活动推播 API

### 创建活动

创建并可选择立即发送活动推播。

**Endpoint**: `POST /api/v1/campaigns`

**请求体**:
```json
{
  "title": "活动标题",
  "notification_text": "通知消息",
  "preview_text": "预览文字",
  "template_type": "text|text_button|image_click|image_card",
  "schedule_type": "immediate|scheduled|draft",
  "scheduled_at": "2025-12-31T23:59:59",
  "target_audience": {
    "type": "all|filtered",
    "condition": "include|exclude",
    "tags": [1, 2, 3]
  },
  "interaction_tags": ["标签1", "标签2"],
  "interaction_type": "none|open_url|trigger_message|trigger_image",
  "trigger_condition": {
    "type": "open_url|trigger_message|trigger_image",
    "value": "https://example.com 或 触发文字 或 图片URL"
  },
  "carousel_items": [
    {
      "image_url": "https://example.com/image.jpg",
      "title": "卡片标题",
      "description": "卡片描述",
      "price": 299,
      "image_aspect_ratio": "1:1|16:9|20:13",
      "image_click_action_type": "open_image|open_url",
      "image_click_action_value": null,
      "action_button_enabled": false,
      "action_button_text": "查看详情",
      "action_button_interaction_type": "none|open_url|trigger_message|trigger_image",
      "action_button_url": "https://example.com",
      "action_button_trigger_message": "我要报名",
      "action_button_trigger_image_url": "https://example.com/trigger.jpg",
      "interaction_tag": "点击标签",
      "sort_order": 0
    }
  ]
}
```

**字段说明**:

#### 基础字段
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 活动标题 |
| `notification_text` | string | 是 | 通知消息内容 |
| `preview_text` | string | 是 | 消息预览文字 |
| `template_type` | string | 是 | 模板类型: `text`, `text_button`, `image_click`, `image_card` |
| `schedule_type` | string | 是 | 发送类型: `immediate`(立即), `scheduled`(排程), `draft`(草稿) |
| `scheduled_at` | datetime | 条件 | 排程发送时间 (schedule_type=scheduled时必填) |

#### 目标受众字段
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `target_audience` | object/string | 是 | 目标受众配置 |
| `target_audience.type` | string | 是 | `all`(所有人) 或 `filtered`(筛选) |
| `target_audience.condition` | string | 条件 | `include`(包含) 或 `exclude`(排除) |
| `target_audience.tags` | array | 条件 | 标签ID数组 (type=filtered时必填) |

#### 互动字段 (单图模式)
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `interaction_type` | string | 否 | 互动类型: `none`, `open_url`, `trigger_message`, `trigger_image` |
| `interaction_tags` | array | 否 | 互动标签数组 |
| `trigger_condition` | object | 否 | 触发条件配置 |
| `trigger_condition.type` | string | 是 | 触发类型 |
| `trigger_condition.value` | string | 是 | 触发值 (URL/文字/图片URL) |

#### 轮播项字段 (CarouselItemCreate)

**核心字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | string | 否 | **主图片URL** |
| `title` | string | 否 | 卡片标题 |
| `description` | string | 否 | 卡片描述 |
| `price` | number | 否 | 价格 |
| `sort_order` | integer | 否 | 排序序号 (默认: 0) |

**图片设置**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_aspect_ratio` | string | 否 | 图片长宽比: `1:1`, `16:9`, `20:13` (默认: `1:1`) |
| `image_click_action_type` | string | 否 | 图片点击动作: `open_image`, `open_url` (默认: `open_image`) |
| `image_click_action_value` | string | 否 | 图片点击动作值 (当type=open_url时填写URL) |

**动作按钮字段** ⭐ **已更新**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action_button_enabled` | boolean | 否 | 是否启用动作按钮 (默认: false) |
| `action_button_text` | string | 条件 | 按钮显示文字 (enabled=true时必填) |
| `action_button_interaction_type` | string | 条件 | 互动类型: `none`, `open_url`, `trigger_message`, `trigger_image` |
| `action_button_url` | string | 条件 | **开启网址** (interaction_type=open_url时填写) |
| `action_button_trigger_message` | string | 条件 | **触发文字** (interaction_type=trigger_message时填写) |
| `action_button_trigger_image_url` | string | 条件 | **触发图片URL** (interaction_type=trigger_image时填写) |

**互动标签**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `interaction_tag` | string | 否 | 互动标签名称 |

---

### ⚠️ 重要变更说明

#### 已删除字段
- ❌ `url` - 已删除，统一使用 `action_button_url`

#### 新增/明确字段
- ✅ `action_button_url` - 专用于"开启网址"互动
- ✅ `action_button_trigger_message` - 专用于"触发文字"互动
- ✅ `action_button_trigger_image_url` - 专用于"触发图片"互动

---

### 响应示例

**成功响应**:
```json
{
  "code": 200,
  "message": "活動創建成功",
  "data": {
    "id": 157,
    "title": "测试活动",
    "status": "sent",
    "sent_count": 5
  }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 活动ID |
| `title` | string | 活动标题 |
| `status` | string | 状态: `draft`, `scheduled`, `sent`, `failed` |
| `sent_count` | integer | 发送数量 |

**错误响应**:
```json
{
  "detail": "'image' is not a valid TemplateType"
}
```

---

### 获取活动列表

**Endpoint**: `GET /api/v1/campaigns`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status_filter` | string | 否 | 状态筛选: `draft`, `scheduled`, `sent`, `failed` |
| `search` | string | 否 | 搜索关键词 (标题或标签模糊搜索) |
| `page` | integer | 否 | 页码 (默认: 1) |
| `limit` | integer | 否 | 每页数量 (默认: 20) |

**请求示例**:
```bash
GET /api/v1/campaigns?status_filter=sent&page=1&limit=20
```

**响应示例**:
```json
[
  {
    "id": 157,
    "title": "【修复测试1】纯图片消息",
    "status": "sent",
    "platform": "LINE",
    "interaction_tags": ["纯图片测试", "场景1"],
    "target_count": 5,
    "open_count": 0,
    "click_count": 0,
    "sent_at": "2025-10-28 23:23",
    "scheduled_at": null
  }
]
```

---

### 获取活动详情

**Endpoint**: `GET /api/v1/campaigns/{campaign_id}`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `campaign_id` | integer | 是 | 活动ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": 157,
    "title": "测试活动",
    "status": "sent",
    "template": {
      "id": 1,
      "type": "image_card",
      "notification_text": "通知消息",
      "preview_text": "预览文字"
    },
    "target_audience": {
      "type": "all",
      "condition": "include",
      "tags": []
    },
    "scheduled_at": null,
    "sent_at": "2025-10-28T23:23:26",
    "sent_count": 5
  }
}
```

---

### 立即发送活动

**Endpoint**: `POST /api/v1/campaigns/{campaign_id}/send`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `campaign_id` | integer | 是 | 活动ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "活動已發送給 5 位用戶",
  "data": {
    "ok": true,
    "sent": 5,
    "failed": 0,
    "campaign_id": 157
  }
}
```

---

### 删除活动

**Endpoint**: `DELETE /api/v1/campaigns/{campaign_id}`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `campaign_id` | integer | 是 | 活动ID |

**限制**: 仅草稿状态的活动可删除

**响应示例**:
```json
{
  "code": 200,
  "message": "活動已刪除"
}
```

---

### 预计发送人数

**Endpoint**: `POST /api/v1/campaigns/estimate-recipients`

**请求体**:
```json
{
  "type": "all|filtered",
  "condition": "include|exclude",
  "tags": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "count": 123
  }
}
```

---

## 数据模型

### CampaignStatus (活动状态)
```python
DRAFT = "draft"        # 草稿
SCHEDULED = "scheduled"  # 已排程
SENT = "sent"          # 已发送
FAILED = "failed"      # 发送失败
```

### TemplateType (模板类型)
```python
TEXT = "text"                # 纯文字
TEXT_BUTTON = "text_button"  # 文字按钮确认型
IMAGE_CLICK = "image_click"  # 图片点击型
IMAGE_CARD = "image_card"    # 图卡按钮型
```

### InteractionType (互动类型)
```python
NONE = "none"                      # 无互动
OPEN_URL = "open_url"              # 开启网址
TRIGGER_MESSAGE = "trigger_message"  # 触发文字
TRIGGER_IMAGE = "trigger_image"    # 触发图片
```

---

## 场景示例

### 场景1: 纯图片消息 (无动作按钮)

**使用场景**: 发送单纯的图片宣传，点击图片可开启原图。

**请求示例**:
```json
{
  "title": "纯图片测试",
  "notification_text": "查看图片",
  "preview_text": "图片预览",
  "template_type": "image_click",
  "schedule_type": "immediate",
  "target_audience": {
    "type": "all"
  },
  "carousel_items": [{
    "image_url": "https://example.com/image.jpg",
    "action_button_enabled": false,
    "image_aspect_ratio": "1:1",
    "image_click_action_type": "open_image"
  }]
}
```

**LINE展示效果**:
- 使用 `hero` 结构
- 纯图片展示
- 点击图片 → 开启原图

---

### 场景2: 图片 + 开启网址按钮

**使用场景**: 发送促销图片，底部浮动按钮点击跳转到活动页面。

**请求示例**:
```json
{
  "title": "促销活动",
  "notification_text": "限时优惠",
  "preview_text": "点击查看详情",
  "template_type": "image_click",
  "schedule_type": "immediate",
  "target_audience": {
    "type": "all"
  },
  "carousel_items": [{
    "image_url": "https://example.com/promo.jpg",
    "action_button_enabled": true,
    "action_button_text": "立即查看",
    "action_button_interaction_type": "open_url",
    "action_button_url": "https://example.com/promo-page",
    "image_aspect_ratio": "16:9"
  }]
}
```

**LINE展示效果**:
- 使用 `body` 结构
- 图片 + 底部浮动按钮
- 点击按钮 → 跳转到 `https://example.com/promo-page`

---

### 场景3: 图片 + 触发文字按钮

**使用场景**: 发送活动海报，点击按钮发送报名文字。

**请求示例**:
```json
{
  "title": "活动报名",
  "notification_text": "点击参加",
  "preview_text": "活动报名",
  "template_type": "image_click",
  "schedule_type": "immediate",
  "target_audience": {
    "type": "all"
  },
  "carousel_items": [{
    "image_url": "https://example.com/event.jpg",
    "action_button_enabled": true,
    "action_button_text": "我要参加",
    "action_button_interaction_type": "trigger_message",
    "action_button_trigger_message": "我要报名参加活动",
    "interaction_tag": "event_signup"
  }]
}
```

**LINE展示效果**:
- 使用 `body` 结构
- 图片 + 底部浮动按钮
- 点击按钮 → 用户自动发送 "我要报名参加活动"
- 后端可根据 `interaction_tag` 识别触发来源

---

### 场景4: 轮播卡片 (多张)

**使用场景**: 发送多个产品/套餐，用户可左右滑动查看。

**请求示例**:
```json
{
  "title": "酒店套餐推广",
  "notification_text": "多种套餐任选",
  "preview_text": "查看套餐详情",
  "template_type": "image_card",
  "schedule_type": "immediate",
  "target_audience": {
    "type": "all"
  },
  "carousel_items": [
    {
      "image_url": "https://example.com/economy.jpg",
      "title": "经济套餐",
      "description": "舒适温馨",
      "price": 299,
      "action_button_enabled": true,
      "action_button_text": "立即预订",
      "action_button_interaction_type": "open_url",
      "action_button_url": "https://example.com/book/economy",
      "sort_order": 0
    },
    {
      "image_url": "https://example.com/deluxe.jpg",
      "title": "豪华套餐",
      "description": "品质生活",
      "price": 599,
      "action_button_enabled": true,
      "action_button_text": "查看详情",
      "action_button_interaction_type": "open_url",
      "action_button_url": "https://example.com/book/deluxe",
      "sort_order": 1
    }
  ]
}
```

**LINE展示效果**:
- 使用 `carousel` 结构
- 多张卡片可左右滑动
- 每张卡片包含: 图片、标题、描述、价格、按钮

---

## 错误处理

### 常见错误

**400 Bad Request**:
```json
{
  "detail": "请填写活动标题和通知消息"
}
```

**404 Not Found**:
```json
{
  "detail": "活动 999 不存在"
}
```

**500 Internal Server Error**:
```json
{
  "detail": "创建活动失败: Database connection error"
}
```

### 错误代码对照表

| HTTP状态 | detail | 原因 | 解决方案 |
|---------|--------|------|---------|
| 400 | 'image' is not a valid TemplateType | 模板类型错误 | 使用正确的模板类型: `text`, `text_button`, `image_click`, `image_card` |
| 400 | Only draft campaigns can be deleted | 非草稿状态无法删除 | 只能删除 `status=draft` 的活动 |
| 400 | Campaign already sent | 活动已发送 | 不能重复发送同一活动 |
| 404 | Campaign X not found | 活动不存在 | 检查活动ID是否正确 |
| 500 | Failed to send campaign | LINE Bot发送失败 | 检查LINE Channel Access Token配置 |

---

## 附录

### A. 字段映射速查表

| 用途 | 正确字段名 | 旧字段名 (已废弃) |
|------|-----------|------------------|
| 主图片 | `image_url` | - |
| 开启网址 | `action_button_url` | ~~`url`~~ ❌ |
| 触发文字 | `action_button_trigger_message` | ~~`trigger_message`~~ (不完整) |
| 触发图片 | `action_button_trigger_image_url` | ~~`trigger_image_url`~~ (不完整) |

### B. 迁移指南

如果您的代码使用了旧的字段名，请按以下方式更新：

**旧代码**:
```json
{
  "url": "https://example.com",
  "trigger_message": "Hello"
}
```

**新代码**:
```json
{
  "action_button_url": "https://example.com",
  "action_button_trigger_message": "Hello"
}
```

### C. 测试端点

**健康检查**:
```bash
GET /health

Response:
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development"
}
```

---

**文档维护**: AI Team
**反馈**: 如有问题请提交 Issue
