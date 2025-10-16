# 問卷模板功能實作計劃

## 📋 專案概述

**目標**: 在 Lili Hotel 管理系統中實作問卷模板功能，參考現有的群發訊息建立介面

**參考網站**: https://editor-bot.no8.io/webview_edit/go

**功能需求**:
1. 客製化問卷名稱
2. 問卷範本選擇
3. 問卷建立時區設定
4. 問卷內容編輯（新增內容）
5. 右側即時預覽模擬器

---

## 🏗️ 系統架構

### 技術棧
- **Frontend**: React 18 + TypeScript + Ant Design + React Router
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Database**: PostgreSQL/MySQL
- **樣式**: CSS Modules
- **狀態管理**: React useState/useReducer

### 現有參考
- **群發訊息功能**: `/data2/lili_hotel/frontend/src/features/campaigns/`
  - `CampaignCreatePage.tsx` - 建立頁面 (780 行)
  - `CampaignListPage.tsx` - 列表頁面
  - `CampaignCreatePage.css` - 樣式檔案

---

## 📊 資料結構設計

### Backend Models

#### Survey (問卷主表)
```python
class Survey(Base):
    __tablename__ = "surveys"

    id: int (PK)
    name: str  # 問卷名稱
    template_id: int (FK -> SurveyTemplate)  # 問卷範本
    timezone: str  # 建立時區 (例如: Asia/Taipei)
    status: str  # draft, published, archived
    description: str (nullable)

    # 發送設定
    target_audience: str  # all, filtered
    target_tags: JSON (nullable)
    schedule_type: str  # immediate, scheduled
    scheduled_at: datetime (nullable)

    # 統計資料
    response_count: int (default=0)
    view_count: int (default=0)

    # 時間戳記
    created_at: datetime
    updated_at: datetime
    created_by: int (FK -> User)

    # 關聯
    template: SurveyTemplate (relationship)
    questions: List[SurveyQuestion] (relationship)
    responses: List[SurveyResponse] (relationship)
```

#### SurveyTemplate (問卷範本)
```python
class SurveyTemplate(Base):
    __tablename__ = "survey_templates"

    id: int (PK)
    name: str  # 範本名稱 (例如: 滿意度調查、活動報名)
    description: str
    icon: str (nullable)  # emoji 或圖示
    category: str  # feedback, registration, evaluation
    is_active: bool (default=True)

    # 預設問題配置 (JSON)
    default_questions: JSON  # 預設題目清單

    created_at: datetime
    updated_at: datetime
```

#### SurveyQuestion (問卷題目)
```python
class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id: int (PK)
    survey_id: int (FK -> Survey)
    question_type: str  # single_choice, multiple_choice, text, rating, date
    question_text: str  # 題目內容
    description: str (nullable)  # 題目說明

    # 選項設定 (JSON)
    options: JSON  # [{"label": "選項1", "value": "1"}, ...]

    # 驗證規則
    is_required: bool (default=False)
    min_length: int (nullable)  # 文字題最小長度
    max_length: int (nullable)  # 文字題最大長度
    min_value: int (nullable)   # 評分題最小值
    max_value: int (nullable)   # 評分題最大值

    # 排序
    order: int (default=0)

    created_at: datetime
    updated_at: datetime
```

#### SurveyResponse (問卷回應)
```python
class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id: int (PK)
    survey_id: int (FK -> Survey)
    member_id: int (FK -> Member)

    # 回應內容 (JSON)
    answers: JSON  # {question_id: answer_value}

    # 完成狀態
    is_completed: bool (default=False)
    completed_at: datetime (nullable)

    # 來源追蹤
    source: str (nullable)  # line, web, app
    ip_address: str (nullable)
    user_agent: str (nullable)

    created_at: datetime
    updated_at: datetime
```

---

## 🔌 API 端點設計

### Backend Routes

```python
# /backend/app/routes/survey.py

# 問卷管理
GET    /api/v1/surveys              # 取得問卷列表
POST   /api/v1/surveys              # 建立問卷
GET    /api/v1/surveys/{id}         # 取得問卷詳情
PUT    /api/v1/surveys/{id}         # 更新問卷
DELETE /api/v1/surveys/{id}         # 刪除問卷
POST   /api/v1/surveys/{id}/publish # 發布問卷

# 範本管理
GET    /api/v1/survey-templates     # 取得範本列表
GET    /api/v1/survey-templates/{id}# 取得範本詳情

# 題目管理
POST   /api/v1/surveys/{survey_id}/questions        # 新增題目
PUT    /api/v1/surveys/{survey_id}/questions/{id}   # 更新題目
DELETE /api/v1/surveys/{survey_id}/questions/{id}   # 刪除題目
POST   /api/v1/surveys/{survey_id}/questions/reorder# 重新排序題目

# 回應管理
GET    /api/v1/surveys/{survey_id}/responses        # 取得回應列表
GET    /api/v1/surveys/{survey_id}/responses/{id}   # 取得回應詳情
GET    /api/v1/surveys/{survey_id}/statistics       # 取得統計資料
```

### Request/Response Schemas

```python
# SurveyCreate
{
  "name": "2024 住客滿意度調查",
  "template_id": 1,
  "timezone": "Asia/Taipei",
  "description": "收集住客對服務的滿意度",
  "target_audience": "all",
  "schedule_type": "immediate",
  "questions": [
    {
      "question_type": "rating",
      "question_text": "您對本次住宿體驗的整體滿意度？",
      "is_required": true,
      "min_value": 1,
      "max_value": 5,
      "order": 1
    }
  ]
}

# SurveyResponse
{
  "id": 1,
  "name": "2024 住客滿意度調查",
  "template": {
    "id": 1,
    "name": "滿意度調查",
    "icon": "📊"
  },
  "status": "published",
  "timezone": "Asia/Taipei",
  "response_count": 156,
  "view_count": 320,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 🎨 Frontend 實作

### 1. 型別定義 (types/survey.ts)

```typescript
export const SurveyStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type SurveyStatus = typeof SurveyStatus[keyof typeof SurveyStatus];

export const QuestionType = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TEXT: 'text',
  RATING: 'rating',
  DATE: 'date',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export interface SurveyTemplate {
  id: number;
  name: string;
  description: string;
  icon?: string;
  category: string;
  default_questions?: SurveyQuestion[];
}

export interface SurveyQuestion {
  id?: number;
  question_type: QuestionType;
  question_text: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  order: number;
}

export interface SurveyCreate {
  name: string;
  template_id: number;
  timezone: string;
  description?: string;
  target_audience: 'all' | 'filtered';
  target_tags?: string[];
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  questions: SurveyQuestion[];
}

export interface Survey extends SurveyCreate {
  id: number;
  status: SurveyStatus;
  response_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}
```

### 2. API 服務 (services/api/survey.ts)

```typescript
import axios from 'axios';
import type { Survey, SurveyCreate, SurveyTemplate } from '@/types/survey';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const fetchSurveys = async (params?: any): Promise<Survey[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/surveys`, { params });
  return response.data;
};

export const createSurvey = async (data: SurveyCreate): Promise<Survey> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/surveys`, data);
  return response.data;
};

export const fetchSurveyTemplates = async (): Promise<SurveyTemplate[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/survey-templates`);
  return response.data;
};

export const publishSurvey = async (id: number): Promise<Survey> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/surveys/${id}/publish`);
  return response.data;
};
```

### 3. 問卷列表頁面 (features/surveys/pages/SurveyListPage.tsx)

**結構**: 參考 CampaignListPage.tsx
- 頁面標題和描述
- 搜尋和篩選功能
- 問卷卡片列表
- 狀態標籤 (草稿/已發布/已封存)
- 統計資料顯示 (回應數/瀏覽數)
- 操作按鈕 (編輯/發布/刪除)

### 4. 問卷建立頁面 (features/surveys/pages/SurveyCreatePage.tsx)

**佈局結構**:
```
┌─────────────────────────────────────────────────┐
│ 問卷模板 > 建立問卷                              │
├─────────────────┬───────────────────────────────┤
│                 │                               │
│  手機預覽區      │  表單編輯區                    │
│                 │                               │
│  ┌───────────┐  │  • 問卷名稱                    │
│  │           │  │  • 問卷範本選擇                │
│  │  模擬器    │  │  • 建立時區                    │
│  │  即時預覽  │  │                               │
│  │           │  │  ─────────────────            │
│  │           │  │                               │
│  │           │  │  問卷內容編輯：                │
│  │           │  │  ┌──────────────┐            │
│  └───────────┘  │  │ 題目 1        │            │
│                 │  │ [編輯] [刪除] │            │
│                 │  └──────────────┘            │
│                 │  [+ 新增題目]                 │
│                 │                               │
│                 │  ─────────────────            │
│                 │                               │
│                 │  • 發送對象                    │
│                 │  • 排程發送                    │
│                 │                               │
│                 │  [儲存草稿] [發布給用戶]        │
└─────────────────┴───────────────────────────────┘
```

**核心功能**:

1. **問卷基本設定**
   - 問卷名稱輸入框
   - 範本選擇下拉選單 (從 API 載入)
   - 時區選擇 (支援常用時區)
   - 問卷描述 (可選)

2. **問卷內容編輯**
   - 題目列表顯示
   - 新增題目按鈕
   - 題目類型選擇:
     * 單選題 (Radio)
     * 多選題 (Checkbox)
     * 文字輸入 (Text)
     * 評分題 (Rating)
     * 日期選擇 (Date)
   - 題目內容編輯
   - 選項管理 (新增/刪除/排序)
   - 必填設定
   - 題目拖曳排序

3. **即時預覽模擬器**
   - 手機框架樣式
   - 即時顯示問卷外觀
   - 模擬答題流程
   - 響應式設計

4. **發送設定**
   - 發送對象 (所有好友/篩選目標)
   - 排程發送 (立即/自訂時間)
   - 時區顯示

5. **操作按鈕**
   - 儲存草稿
   - 發布給用戶
   - 預覽測試

**狀態管理**:
```typescript
const [surveyName, setSurveyName] = useState('');
const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
const [timezone, setTimezone] = useState('Asia/Taipei');
const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
const [targetAudience, setTargetAudience] = useState<'all' | 'filtered'>('all');
const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
```

### 5. 樣式設計 (features/surveys/pages/SurveyCreatePage.css)

**參考**: CampaignCreatePage.css

主要樣式類別:
- `.survey-create-page` - 頁面容器
- `.editor-container` - 編輯器主容器
- `.preview-section` - 左側預覽區
- `.phone-simulator` - 手機模擬器
- `.form-section` - 右側表單區
- `.question-item` - 題目項目
- `.question-editor` - 題目編輯器
- `.form-actions` - 操作按鈕區

---

## 🗂️ 檔案結構

### Backend
```
backend/
├── app/
│   ├── models/
│   │   └── survey.py          # 新增：Survey 相關模型
│   ├── schemas/
│   │   └── survey.py          # 新增：Survey Pydantic schemas
│   ├── routes/
│   │   └── survey.py          # 新增：Survey API routes
│   └── alembic/
│       └── versions/
│           └── xxx_create_survey_tables.py  # 新增：遷移腳本
```

### Frontend
```
frontend/src/
├── types/
│   └── survey.ts              # 新增：Survey 型別定義
├── services/
│   └── api/
│       └── survey.ts          # 新增：Survey API 服務
└── features/
    └── surveys/               # 新增：問卷功能模組
        ├── components/
        │   ├── QuestionEditor.tsx      # 題目編輯器組件
        │   ├── QuestionTypeSelector.tsx # 題目類型選擇器
        │   └── SurveyPreview.tsx       # 問卷預覽組件
        └── pages/
            ├── SurveyListPage.tsx      # 問卷列表頁面
            ├── SurveyCreatePage.tsx    # 問卷建立頁面
            └── SurveyCreatePage.css    # 樣式檔案
```

---

## 📝 實作步驟

### Phase 1: Backend 開發 (4-6 小時)

#### 1.1 建立資料模型
- [ ] 建立 `models/survey.py`
- [ ] 定義 Survey, SurveyTemplate, SurveyQuestion, SurveyResponse
- [ ] 設定模型關聯和索引

#### 1.2 建立 Schemas
- [ ] 建立 `schemas/survey.py`
- [ ] SurveyCreate, SurveyUpdate, SurveyResponse
- [ ] SurveyQuestionCreate, SurveyTemplateResponse
- [ ] 加入資料驗證規則

#### 1.3 建立 API Routes
- [ ] 建立 `routes/survey.py`
- [ ] 實作 CRUD 端點
- [ ] 實作範本查詢端點
- [ ] 實作發布和統計端點
- [ ] 註冊路由到主應用

#### 1.4 資料庫遷移
- [ ] 建立 Alembic migration
- [ ] 建立範本種子資料
- [ ] 執行遷移測試

### Phase 2: Frontend 開發 (6-8 小時)

#### 2.1 基礎設定
- [ ] 建立 `types/survey.ts`
- [ ] 建立 `services/api/survey.ts`
- [ ] 建立 surveys 功能目錄

#### 2.2 問卷列表頁面
- [ ] 建立 `SurveyListPage.tsx`
- [ ] 實作列表顯示
- [ ] 實作搜尋和篩選
- [ ] 實作操作按鈕

#### 2.3 問卷建立頁面
- [ ] 建立 `SurveyCreatePage.tsx`
- [ ] 實作基本設定表單
- [ ] 實作題目編輯器
- [ ] 實作即時預覽
- [ ] 實作拖曳排序

#### 2.4 組件開發
- [ ] `QuestionEditor.tsx` - 題目編輯器
- [ ] `QuestionTypeSelector.tsx` - 類型選擇器
- [ ] `SurveyPreview.tsx` - 預覽組件

#### 2.5 樣式設計
- [ ] 建立 `SurveyCreatePage.css`
- [ ] 響應式設計調整
- [ ] 動畫效果

#### 2.6 路由整合
- [ ] 更新 `routes/index.tsx`
- [ ] 新增 `/surveys` 路由
- [ ] 新增 `/surveys/create` 路由
- [ ] 測試導航

### Phase 3: 整合測試 (2-3 小時)

- [ ] API 端點測試
- [ ] Frontend 組件測試
- [ ] E2E 測試 (Playwright)
- [ ] UI/UX 測試
- [ ] 跨瀏覽器測試

---

## 🎯 預設範本設計

### 範本 1: 住客滿意度調查
```json
{
  "name": "住客滿意度調查",
  "icon": "😊",
  "category": "feedback",
  "default_questions": [
    {
      "question_type": "rating",
      "question_text": "您對整體住宿體驗的滿意度？",
      "is_required": true,
      "min_value": 1,
      "max_value": 5
    },
    {
      "question_type": "rating",
      "question_text": "您對客房清潔度的評價？",
      "is_required": true,
      "min_value": 1,
      "max_value": 5
    },
    {
      "question_type": "text",
      "question_text": "請分享您的住宿心得或建議",
      "is_required": false
    }
  ]
}
```

### 範本 2: 活動報名表
```json
{
  "name": "活動報名表",
  "icon": "🎉",
  "category": "registration",
  "default_questions": [
    {
      "question_type": "text",
      "question_text": "您的姓名",
      "is_required": true
    },
    {
      "question_type": "text",
      "question_text": "聯絡電話",
      "is_required": true
    },
    {
      "question_type": "single_choice",
      "question_text": "參加人數",
      "options": [
        {"label": "1人", "value": "1"},
        {"label": "2人", "value": "2"},
        {"label": "3人以上", "value": "3+"}
      ],
      "is_required": true
    }
  ]
}
```

### 範本 3: 服務評價
```json
{
  "name": "服務評價",
  "icon": "⭐",
  "category": "evaluation",
  "default_questions": [
    {
      "question_type": "rating",
      "question_text": "服務人員態度",
      "is_required": true,
      "min_value": 1,
      "max_value": 5
    },
    {
      "question_type": "rating",
      "question_text": "問題解決效率",
      "is_required": true,
      "min_value": 1,
      "max_value": 5
    },
    {
      "question_type": "multiple_choice",
      "question_text": "您認為我們需要改進的地方？(可複選)",
      "options": [
        {"label": "服務速度", "value": "speed"},
        {"label": "專業程度", "value": "professional"},
        {"label": "溝通能力", "value": "communication"},
        {"label": "其他", "value": "other"}
      ],
      "is_required": false
    }
  ]
}
```

---

## 🌐 時區支援

### 常用時區列表
```typescript
export const TIMEZONES = [
  { label: '台北 (GMT+8)', value: 'Asia/Taipei' },
  { label: '東京 (GMT+9)', value: 'Asia/Tokyo' },
  { label: '香港 (GMT+8)', value: 'Asia/Hong_Kong' },
  { label: '新加坡 (GMT+8)', value: 'Asia/Singapore' },
  { label: '紐約 (GMT-5)', value: 'America/New_York' },
  { label: '倫敦 (GMT+0)', value: 'Europe/London' },
  { label: '巴黎 (GMT+1)', value: 'Europe/Paris' },
];
```

### 時區處理
- 使用 `dayjs` + `dayjs/plugin/timezone`
- 儲存 UTC 時間到資料庫
- 顯示時轉換為使用者時區

---

## 🔐 權限和安全

### API 權限
- 需要登入才能存取問卷管理功能
- 只能操作自己建立的問卷
- 管理員可以查看所有問卷

### 資料驗證
- 問卷名稱: 1-100 字元
- 題目數量: 1-50 題
- 選項數量: 2-10 個
- 文字回應: 最多 1000 字元

---

## 📊 統計功能 (未來擴充)

### 基本統計
- 回應數量
- 完成率
- 平均完成時間
- 各題目選項分布

### 進階分析
- 交叉分析
- 趨勢圖表
- 匯出報表 (Excel, PDF)
- 即時儀表板

---

## 🚀 部署注意事項

### 環境變數
```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost/lili_hotel
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

### 資料庫遷移
```bash
cd backend
alembic revision --autogenerate -m "Add survey tables"
alembic upgrade head
```

### 前端建置
```bash
cd frontend
npm run build
```

---

## ✅ 測試檢查清單

### 功能測試
- [ ] 建立問卷
- [ ] 編輯問卷
- [ ] 刪除問卷
- [ ] 發布問卷
- [ ] 新增題目
- [ ] 編輯題目
- [ ] 刪除題目
- [ ] 拖曳排序題目
- [ ] 選擇範本
- [ ] 設定時區
- [ ] 即時預覽更新
- [ ] 儲存草稿
- [ ] 排程發送

### UI/UX 測試
- [ ] 響應式設計 (手機/平板/桌面)
- [ ] 表單驗證提示
- [ ] 載入狀態顯示
- [ ] 錯誤處理
- [ ] 成功提示

### 效能測試
- [ ] 大量題目載入速度
- [ ] 即時預覽更新延遲
- [ ] API 回應時間

---

## 📚 參考資料

### 現有程式碼
- `/data2/lili_hotel/frontend/src/features/campaigns/pages/CampaignCreatePage.tsx`
- `/data2/lili_hotel/frontend/src/types/campaign.ts`
- `/data2/lili_hotel/backend/app/models/campaign.py`
- `/data2/lili_hotel/backend/app/schemas/campaign.py`

### 技術文件
- React TypeScript: https://react-typescript-cheatsheet.netlify.app/
- Ant Design: https://ant.design/components/overview/
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy: https://docs.sqlalchemy.org/

---

## 💡 未來改進方向

1. **進階題型**
   - 矩陣題 (多題共用選項)
   - 檔案上傳
   - 地理位置
   - 簽名欄位

2. **邏輯跳題**
   - 條件顯示
   - 分支邏輯
   - 計分機制

3. **外觀客製化**
   - 主題顏色
   - Logo 上傳
   - 自訂感謝頁面

4. **整合功能**
   - LINE 官方帳號整合
   - Email 發送
   - Webhook 通知
   - API 匯出

5. **AI 功能**
   - 智能問卷生成
   - 回應分析
   - 情感分析

---

## 📞 聯絡資訊

**專案負責人**: AI Team
**專案路徑**: `/data2/lili_hotel/`
**文件版本**: 1.0
**最後更新**: 2025-01-XX

---

## 📋 變更記錄

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|---------|------|
| 2025-01-XX | 1.0 | 初版計劃文檔建立 | Claude |

---

**備註**:
- 本文檔基於現有的群發訊息功能架構設計
- Chrome DevTools MCP 整合為可選項目，可先完成基本功能
- 建議採用敏捷開發方式，分階段實作和測試
