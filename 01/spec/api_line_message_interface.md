# LINE 消息发送接口规范

后端主系统 → `line_app/app.py` 的 JSON 接口定义

**版本**: v1.0
**更新日期**: 2025-11-19
**命名策略**: 与数据库字段名保持一致

---

## 📋 接口概述

### 端点信息

- **URL**: `POST /api/line/send-message`
- **Content-Type**: `application/json`
- **认证**: Bearer Token（可选）

### 字段命名规范

| 字段名 | 类型 | 必填 | 长度限制 | 用途说明 |
|--------|------|------|----------|----------|
| `line_uid` | string | ✅ | 33 字元 | LINE 用户唯一识别码（U开头+32位） |
| `notification_message` | string | ✅ | 500 字元 | **推送通知横幅文字**（手机通知栏显示） |
| `preview_message` | string | ✅ | 500 字元 | **聊天列表预览文字**（聊天室列表显示） |
| `flex_message` | object | ✅ | - | Flex Message JSON 对象 |

---

## 📦 请求格式

### 单个用户发送

```json
{
  "line_uid": "U1234567890abcdef1234567890abcdef",
  "notification_message": "您有新的優惠訊息",
  "preview_message": "春節特惠活動開跑！豪華雙人房 3999 元起",
  "flex_message": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "春節特惠",
          "weight": "bold",
          "size": "xl"
        }
      ]
    }
  }
}
```

### 批量发送

```json
{
  "line_uids": [
    "U1234567890abcdef1234567890abcdef",
    "U9876543210fedcba9876543210fedcba"
  ],
  "notification_message": "您有新的優惠訊息",
  "preview_message": "春節特惠活動開跑！",
  "flex_message": { /* ... */ }
}
```

### 批量发送响应示例

```json
{
  "success_count": 2,
  "failure_count": 1,
  "total": 3,
  "details": [
    {
      "line_uid": "U1234567890abcdef1234567890abcdef",
      "status": "success",
      "sent_at": "2025-11-19T10:30:00Z",
      "attempts": 1,
      "last_status_code": 200,
      "last_error": null
    },
    {
      "line_uid": "U9876543210fedcba9876543210fedcba",
      "status": "failed",
      "sent_at": null,
      "attempts": 3,
      "last_status_code": 429,
      "last_error": "LINE API 错误: Too Many Requests"
    }
  ]
}
```

---

## 📤 响应格式

### 成功响应（HTTP 200）

```json
{
  "success": true,
  "message": "消息发送成功",
  "line_uid": "U1234567890abcdef1234567890abcdef",
  "notification_message": "您有新的優惠訊息",
  "preview_message": "春節特惠活動開跑！豪華雙人房 3999 元起",
  "alt_text_used": "您有新的優惠訊息",
  "sent_at": "2025-11-19T10:30:00Z"
}
```

### 错误响应

#### 验证错误（HTTP 422）

```json
{
  "detail": [
    {
      "loc": ["body", "notification_message"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### LINE API 错误（HTTP 400）

```json
{
  "success": false,
  "error": "LINE API 错误",
  "detail": "Invalid LINE UID format",
  "status_code": 400
}
```

#### 服务器错误（HTTP 500）

```json
{
  "success": false,
  "error": "内部服务器错误",
  "detail": "消息发送失败: Connection timeout"
}
```

## 🚦 批量发送节流与重试策略

- **请求上限**：单次调用最多 500 个 `line_uids`；如需覆盖更多好友，请拆批或交由后台任务。
- **限速**：每个 `line_app` 实例使用令牌桶控制在 15 请求/秒（≈900 请求/分钟），低于 LINE Messaging API 默认 1,000 请求/分钟限制 10%，避免触发 429。排队耗时将体现在批次总时长中。
- **重试条件**：遇到 429、5xx 以及 HTTP 连接/超时错误时对单一 UID 最多重试 3 次，退避延迟分别为 1 秒、2 秒、4 秒。
- **不重试情境**：4xx（除 429）视为业务错误，如無效 LINE UID、無發送權限，直接回报。
- **结果字段**：`details` 中新增 `attempts`、`last_status_code`、`last_error`，用以呈现節流或重試狀態；成功紀錄 `last_error = null`、`attempts = 1`。
- **日志**：節流等待、重試次數與最終失敗原因皆寫入 `line_app` log，供營運/維運監控。

---

## 💻 `line_app/app.py` 实现

### 完整代码

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from linebot import LineBotApi
from linebot.models import FlexSendMessage
from linebot.exceptions import LineBotApiError
from datetime import datetime
import os
import logging

# ============================================
# 配置
# ============================================

app = FastAPI(title="LINE Message Service", version="1.0.0")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)


# ============================================
# 数据模型
# ============================================

class SendLineMessageRequest(BaseModel):
    """发送 LINE 消息请求模型"""

    line_uid: str = Field(
        ...,
        min_length=33,
        max_length=33,
        description="LINE 用户唯一识别码"
    )

    notification_message: str = Field(
        ...,
        max_length=500,
        description="通知訊息（推送通知横幅文字，手机通知栏显示）"
    )

    preview_message: str = Field(
        ...,
        max_length=500,
        description="訊息預覽（聊天列表预览文字，聊天室列表显示）"
    )

    flex_message: dict = Field(
        ...,
        description="Flex Message JSON 对象"
    )

    @validator('line_uid')
    def validate_line_uid(cls, v):
        """验证 LINE UID 格式"""
        if not v.startswith('U'):
            raise ValueError('LINE UID 必须以 U 开头')
        if len(v) != 33:
            raise ValueError('LINE UID 长度必须为 33 字元')
        return v

    @validator('notification_message', 'preview_message')
    def validate_message_not_empty(cls, v):
        """验证消息不为空"""
        if not v.strip():
            raise ValueError('消息内容不能为空')
        return v.strip()


class SendLineMessageResponse(BaseModel):
    """发送 LINE 消息响应模型"""

    success: bool
    message: str
    line_uid: str
    notification_message: str
    preview_message: str
    alt_text_used: str
    sent_at: str


class BatchSendLineMessageRequest(BaseModel):
    """批量发送 LINE 消息请求模型"""

    line_uids: list[str] = Field(
        ...,
        min_items=1,
        max_items=500,
        description="LINE 用户 UID 列表，每次请求最多 500 个，超過請拆批呼叫"
    )

    notification_message: str = Field(..., max_length=500)
    preview_message: str = Field(..., max_length=500)
    flex_message: dict


# ============================================
# API 端点
# ============================================

@app.post("/api/line/send-message", response_model=SendLineMessageResponse)
async def send_line_message(request: SendLineMessageRequest):
    """
    发送 LINE Flex Message（单个用户）

    Args:
        request: 发送消息请求

    Returns:
        发送结果

    Raises:
        HTTPException: 发送失败时抛出异常
    """

    try:
        # ⭐ 使用 notification_message 作为 altText
        # 策略说明：
        # - notification_message 用作 LINE API 的 altText
        # - preview_message 保留用于日志记录和数据分析
        alt_text = request.notification_message

        # 发送消息到 LINE
        line_bot_api.push_message(
            to=request.line_uid,
            messages=[
                FlexSendMessage(
                    alt_text=alt_text,
                    contents=request.flex_message
                )
            ]
        )

        # 记录成功日志
        logger.info(f"""
        ✅ LINE 消息发送成功
        ├─ LINE UID: {request.line_uid}
        ├─ 推送通知: {request.notification_message}
        ├─ 聊天预览: {request.preview_message}
        └─ altText: {alt_text}
        """)

        return SendLineMessageResponse(
            success=True,
            message="消息发送成功",
            line_uid=request.line_uid,
            notification_message=request.notification_message,
            preview_message=request.preview_message,
            alt_text_used=alt_text,
            sent_at=datetime.utcnow().isoformat() + 'Z'
        )

    except LineBotApiError as e:
        # LINE API 错误
        logger.error(f"❌ LINE API 错误: {e.status_code} - {e.error.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail=f"LINE API 错误: {e.error.message}"
        )

    except Exception as e:
        # 其他错误
        logger.error(f"❌ 消息发送失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"消息发送失败: {str(e)}"
        )


@app.post("/api/line/send-batch-message")
async def send_batch_line_message(request: BatchSendLineMessageRequest):
    """
    批量发送 LINE Flex Message

    Args:
        request: 批量发送请求

    Returns:
        批量发送结果统计
    """

    results = {
        "success_count": 0,
        "failure_count": 0,
        "total": len(request.line_uids),
        "details": []
    }

    for line_uid in request.line_uids:
        try:
            # 构建单个发送请求
            single_request = SendLineMessageRequest(
                line_uid=line_uid,
                notification_message=request.notification_message,
                preview_message=request.preview_message,
                flex_message=request.flex_message
            )

            # 调用单个发送接口
            response = await send_line_message(single_request)

            results["success_count"] += 1
            results["details"].append({
                "line_uid": line_uid,
                "status": "success",
                "sent_at": response.sent_at
            })

        except Exception as e:
            results["failure_count"] += 1
            results["details"].append({
                "line_uid": line_uid,
                "status": "failed",
                "error": str(e)
            })
            logger.error(f"批量发送失败: {line_uid} - {str(e)}")

    logger.info(f"""
    📊 批量发送完成
    ├─ 总数: {results['total']}
    ├─ 成功: {results['success_count']}
    └─ 失败: {results['failure_count']}
    """)

    return results


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "LINE Message Service",
        "version": "1.0.0"
    }


# ============================================
# 启动应用
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🔧 后端主系统调用示例

### Python 调用示例

```python
import requests
import json
from typing import Dict, Any

class LineMessageService:
    """LINE 消息服务客户端"""

    def __init__(self, base_url: str = "http://line-app:8000"):
        self.base_url = base_url

    def send_message(
        self,
        line_uid: str,
        notification_message: str,
        preview_message: str,
        flex_message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        发送 LINE 消息

        Args:
            line_uid: LINE 用户 UID
            notification_message: 推送通知文字
            preview_message: 聊天预览文字
            flex_message: Flex Message JSON 对象

        Returns:
            发送结果
        """

        payload = {
            "line_uid": line_uid,
            "notification_message": notification_message,
            "preview_message": preview_message,
            "flex_message": flex_message
        }

        response = requests.post(
            f"{self.base_url}/api/line/send-message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        response.raise_for_status()
        return response.json()

    def send_batch_message(
        self,
        line_uids: list[str],
        notification_message: str,
        preview_message: str,
        flex_message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """批量发送消息"""

        payload = {
            "line_uids": line_uids,
            "notification_message": notification_message,
            "preview_message": preview_message,
            "flex_message": flex_message
        }

        response = requests.post(
            f"{self.base_url}/api/line/send-batch-message",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=300
        )

        response.raise_for_status()
        return response.json()


# ============================================
# 使用示例：从数据库读取并发送
# ============================================

from sqlalchemy.orm import Session
from models import MessageTemplate, Member

def send_template_message(
    db: Session,
    template_id: str,
    member_id: str
):
    """
    从数据库读取模板并发送消息

    Args:
        db: 数据库会话
        template_id: 模板 ID
        member_id: 会员 ID
    """

    # 1. 查询模板
    template = db.query(MessageTemplate).filter_by(
        template_id=template_id
    ).first()

    if not template:
        raise ValueError(f"模板不存在: {template_id}")

    # 2. 查询会员
    member = db.query(Member).filter_by(
        member_id=member_id
    ).first()

    if not member or not member.line_uid:
        raise ValueError(f"会员无 LINE UID: {member_id}")

    # 3. 构建 Flex Message
    flex_message = json.loads(template.flex_message_json)

    # 4. 发送消息
    line_service = LineMessageService()

    result = line_service.send_message(
        line_uid=member.line_uid,
        notification_message=template.notification_message,  # ⭐ 数据库字段名
        preview_message=template.preview_message,            # ⭐ 数据库字段名
        flex_message=flex_message
    )

    print(f"✅ 消息发送成功: {result}")
    return result


# 使用示例
if __name__ == "__main__":
    from database import SessionLocal

    db = SessionLocal()
    try:
        send_template_message(
            db=db,
            template_id="TPL001",
            member_id="M123456"
        )
    finally:
        db.close()
```

---

## 📊 数据流图

```
┌─────────────────────────────┐
│  数据库 (MessageTemplate)   │
│  ─────────────────────────  │
│  notification_message       │
│  preview_message            │
│  flex_message_json          │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  后端主系统                 │
│  ─────────────────────────  │
│  查询模板数据               │
│  构建 JSON payload          │
└─────────────────────────────┘
              ↓
         HTTP POST
         JSON body:
         {
           "line_uid": "...",
           "notification_message": "...",
           "preview_message": "...",
           "flex_message": {...}
         }
              ↓
┌─────────────────────────────┐
│  line_app/app.py            │
│  ─────────────────────────  │
│  接收 JSON                  │
│  验证参数                   │
│  alt_text = notification_   │
│            message          │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  LINE Messaging API         │
│  ─────────────────────────  │
│  push_message(              │
│    to: line_uid,            │
│    messages: [{             │
│      type: "flex",          │
│      altText: "您有新的...",│
│      contents: {...}        │
│    }]                       │
│  )                          │
└─────────────────────────────┘
```

---

## ✅ 命名规范总结

| 层级 | notification 字段 | preview 字段 | 格式 |
|------|------------------|--------------|------|
| **数据库表** | `notification_message` | `preview_message` | snake_case |
| **后端 ORM** | `notification_message` | `preview_message` | snake_case |
| **后端 → line_app JSON** | `notification_message` | `preview_message` | snake_case |
| **line_app Python** | `notification_message` | `preview_message` | snake_case |
| **LINE API** | → `altText` | （记录但不传递） | camelCase |

**优势**：
- ✅ 全链路命名一致，无需字段映射
- ✅ 代码可读性高，降低维护成本
- ✅ 减少命名转换错误
- ✅ 与数据库设计文档完全对齐

---

## 🔒 安全建议

1. **认证**: 使用 Bearer Token 或 API Key 保护接口
2. **速率限制**: 限制每分钟请求次数，防止滥用
3. **输入验证**: 严格验证所有输入参数
4. **日志记录**: 记录所有发送请求和结果
5. **错误处理**: 避免在错误信息中泄露敏感信息

---

## 📚 相关文档

- 数据库设计: `spec/erm.dbml`
- 消息模板功能: `spec/features/message_template.feature`
- LINE Messaging API: https://developers.line.biz/en/reference/messaging-api/
