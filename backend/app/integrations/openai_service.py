"""
OpenAI API 集成
"""
from openai import AsyncOpenAI
from app.config import settings
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    """OpenAI API 服務"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )
        self.model = settings.OPENAI_MODEL

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Optional[str]:
        """聊天補全"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI chat completion failed: {str(e)}")
            return None

    async def generate_auto_response(
        self, user_message: str, context: Optional[str] = None
    ) -> Optional[str]:
        """生成自動回應"""
        messages = [
            {
                "role": "system",
                "content": "你是力麗飯店的客服助手。請用專業、友善的語氣回答顧客的問題。",
            }
        ]

        if context:
            messages.append({"role": "system", "content": f"背景信息：{context}"})

        messages.append({"role": "user", "content": user_message})

        return await self.chat_completion(messages, temperature=0.7, max_tokens=500)

    async def generate_marketing_content(
        self,
        topic: str,
        target_audience: str,
        style: str = "專業友善",
    ) -> Optional[str]:
        """生成行銷內容"""
        prompt = f"""
        請為力麗飯店生成一則行銷訊息：
        - 主題：{topic}
        - 目標受眾：{target_audience}
        - 風格：{style}

        要求：
        1. 內容精簡，適合 LINE 訊息推播
        2. 包含吸引人的標題和內容
        3. 突出優惠或特色
        4. 加入行動呼籲
        """

        messages = [
            {"role": "system", "content": "你是一位專業的行銷文案撰寫專家。"},
            {"role": "user", "content": prompt},
        ]

        return await self.chat_completion(messages, temperature=0.8, max_tokens=300)

    async def analyze_member_tags(
        self, member_data: Dict[str, Any]
    ) -> Optional[List[str]]:
        """分析會員並推薦標籤"""
        prompt = f"""
        根據以下會員資料，推薦合適的標籤（最多5個）：
        {member_data}

        請只返回標籤名稱，每行一個，不要其他說明。
        """

        messages = [
            {
                "role": "system",
                "content": "你是一位數據分析專家，擅長會員分群和標籤管理。",
            },
            {"role": "user", "content": prompt},
        ]

        response = await self.chat_completion(messages, temperature=0.5, max_tokens=100)
        if response:
            return [tag.strip() for tag in response.strip().split("\n") if tag.strip()]
        return None

    async def sentiment_analysis(self, text: str) -> Optional[Dict[str, Any]]:
        """情感分析"""
        prompt = f"""
        分析以下訊息的情感傾向：
        {text}

        請以JSON格式返回：
        {{
            "sentiment": "positive/neutral/negative",
            "confidence": 0.0-1.0,
            "keywords": ["關鍵詞1", "關鍵詞2"]
        }}
        """

        messages = [
            {"role": "system", "content": "你是一位情感分析專家。"},
            {"role": "user", "content": prompt},
        ]

        response = await self.chat_completion(messages, temperature=0.3, max_tokens=150)
        if response:
            try:
                import json

                return json.loads(response)
            except:
                return None
        return None


# 創建全域實例
openai_service = OpenAIService()
