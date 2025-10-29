# 力麗飯店 LineOA CRM 前端架構文檔 v2.1

## 1. 技術棧

### 1.1 核心技術
- **框架**: React 18.3.1
- **語言**: TypeScript (通過 Vite 內置支持)
- **構建工具**: Vite 6.4.1
- **包管理器**: npm

### 1.2 UI 與樣式
- **UI 組件庫**: shadcn/ui (基於 Radix UI)
- **基礎組件**: Radix UI Primitives (48 個組件)
- **CSS 方案**: Tailwind CSS
- **圖標**: lucide-react 0.487.0
- **Figma 集成**: Figma 設計稿直接轉換為 React 組件

### 1.3 狀態管理
- **組件狀態**: React Hooks (useState, useEffect, useRef)
- **表單狀態**: react-hook-form 7.55.0
- **全局狀態**: 未實現 (暫無需求)
- **服務端狀態**: 未實現 (暫無後端集成)

### 1.4 路由與導航
- **路由**: 未實現 (單頁應用，使用狀態切換視圖)
- **視圖管理**: 組件內狀態控制 (list/creation 視圖切換)

### 1.5 數據可視化
- **圖表庫**: recharts 2.15.2

### 1.6 HTTP 客戶端
- **請求庫**: 未實現 (暫無後端 API 集成)
- **日期處理**: react-day-picker 8.10.1

### 1.7 UI 增強工具
- **Toast 通知**: sonner 2.0.3
- **主題管理**: next-themes 0.4.6
- **樣式工具**: class-variance-authority 0.7.1, clsx, tailwind-merge
- **命令面板**: cmdk 1.1.1
- **輪播圖**: embla-carousel-react 8.6.0
- **抽屜組件**: vaul 1.1.2
- **可調整面板**: react-resizable-panels 2.1.7
- **OTP 輸入**: input-otp 1.4.2

### 1.8 開發工具
- **構建插件**: @vitejs/plugin-react-swc 3.10.2
- **類型支持**: @types/node 20.10.0
- **代碼規範**: 未配置 ESLint/Prettier
- **Git Hooks**: 未配置
- **測試框架**: 未配置

---

## 2. 項目目錄結構（實際實現 v0.1）

**當前狀態**: 基於 Figma 設計稿的原型實現，單頁應用架構

```
frontend/
├── src/
│   ├── assets/                      # 靜態資源
│   │   └── *.png                    # Figma 導出的圖片資源
│   │
│   ├── components/                  # 組件目錄
│   │   ├── figma/                   # Figma 特定組件
│   │   │   └── ImageWithFallback.tsx  # 圖片回退組件
│   │   │
│   │   ├── ui/                      # shadcn/ui 組件庫（48個組件）
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── use-mobile.ts        # 移動端檢測 Hook
│   │   │   └── utils.ts             # 工具函數 (cn)
│   │   │
│   │   ├── MessageList.tsx          # 消息列表頁面（主頁）
│   │   ├── MessageCreation.tsx      # 創建消息頁面（活動推播）
│   │   ├── FilterModal.tsx          # 標籤篩選模態框
│   │   └── InteractiveMessageTable.tsx  # 交互式消息表格組件
│   │
│   ├── imports/                     # Figma 自動生成的組件和 SVG
│   │   ├── *.tsx                    # Figma 組件（輪播、表格、容器等）
│   │   └── *.ts                     # SVG 路徑數據
│   │
│   ├── guidelines/                  # 設計規範（Figma 導出）
│   │
│   ├── App.tsx                      # 應用主組件（視圖路由）
│   ├── main.tsx                     # 應用入口
│   ├── index.css                    # Tailwind CSS 入口
│   └── Attributions.md              # 第三方資源歸屬
│
├── index.html                       # HTML 入口
├── vite.config.ts                   # Vite 配置
└── package.json                     # 依賴配置
```

### 2.1 目錄說明

**實際實現的模組**:
- ✅ **MessageList**: 消息推播列表展示
- ✅ **MessageCreation**: 創建活動推播（圖卡按鈕型）
- ✅ **FilterModal**: 標籤篩選功能
- ✅ **InteractiveMessageTable**: 交互式消息表格組件
- ✅ **shadcn/ui**: 完整的 UI 組件庫（48個組件）

**未實現的模組** (文檔保留，待後續開發):
- ⚠️ 路由系統 (React Router)
- ⚠️ 狀態管理 (Zustand, React Query)
- ⚠️ API 服務層
- ⚠️ 認證模塊
- ⚠️ 會員管理、問卷、標籤等業務模組
- ⚠️ 數據分析模組

### 2.2 與規劃架構的對比

| 模塊類型 | 規劃狀態 | 實現狀態 | 說明 |
|---------|---------|---------|------|
| UI 組件庫 | Ant Design | ✅ shadcn/ui | 已實現，使用不同的組件庫 |
| 樣式方案 | CSS Modules | ✅ Tailwind CSS | 已實現，使用不同的方案 |
| 活動推播 | features/campaigns/ | ✅ MessageList + MessageCreation | 已實現核心功能 |
| 路由系統 | React Router | ⚠️ 未實現 | 使用組件狀態切換視圖 |
| 狀態管理 | Zustand + React Query | ⚠️ 未實現 | 使用組件內 Hooks |
| API 服務層 | services/api/ | ⚠️ 未實現 | 暫無後端集成 |
| 其他業務模組 | features/ | ⚠️ 未實現 | 待後續開發 |

---

## 3. 核心模塊設計（v0.1 實際實現）

### 3.1 應用架構

#### App.tsx - 應用主組件
```typescript
import { useState } from 'react';
import MessageList from './components/MessageList';
import MessageCreation from './components/MessageCreation';

export default function App() {
  const [currentView, setCurrentView] = useState<'list' | 'creation'>('list');

  return (
    <>
      {currentView === 'list' ? (
        <MessageList onCreateMessage={() => setCurrentView('creation')} />
      ) : (
        <MessageCreation onBack={() => setCurrentView('list')} />
      )}
    </>
  );
}
```

**設計說明**:
- **簡單的視圖路由**: 使用組件狀態切換視圖，無需 React Router
- **單頁應用**: 兩個主視圖之間切換（列表 ↔ 創建）
- **Toast 通知**: sonner 依賴已安裝，可在組件內部使用 toast 函數進行通知

---

### 3.2 MessageList 組件（消息列表）

**文件**: `src/components/MessageList.tsx`

**核心功能**:
- 展示活動推播列表
- 使用 Figma 導出的表格組件 (`Table8Columns3Actions`)
- 側邊欄導航（Starbit Logo + 菜單）
- 創建消息按鈕

**主要狀態管理**:
```typescript
// 無複雜狀態管理，主要通過 props 傳遞回調函數
interface MessageListProps {
  onCreateMessage: () => void;
}
```

**UI 組件使用**:
- Figma 導出的自定義組件
- SVG 圖標和品牌元素
- Tailwind CSS 樣式

---

### 3.3 MessageCreation 組件（創建活動推播）

**文件**: `src/components/MessageCreation.tsx` (1751 行)

**核心功能**:
- ✅ 多種模板類型選擇（文字按鈕型、圖卡按鈕型、圖片點擊型）
- ✅ 輪播圖卡編輯（支援多張圖片輪播）
- ✅ 圖片上傳功能
- ✅ 動作按鈕配置（觸發類型、標籤、URL等）
- ✅ 發送對象篩選（所有好友 / 標籤篩選）
- ✅ 排程發送設定（立即發送 / 自訂時間）
- ✅ 即時預覽（手機模擬器樣式）

**主要狀態管理**:
```typescript
// 使用多個 useState 管理組件狀態
const [sidebarOpen, setSidebarOpen] = useState(true);
const [templateType, setTemplateType] = useState('select');
const [title, setTitle] = useState('');
const [notificationMsg, setNotificationMsg] = useState('');
const [previewMsg, setPreviewMsg] = useState('');
const [scheduleType, setScheduleType] = useState('immediate');
const [targetType, setTargetType] = useState('all');
const [scheduledDate, setScheduledDate] = useState<Date>();
const [cards, setCards] = useState([...]); // 輪播卡片狀態
```

**UI 組件使用**:
- shadcn/ui 組件: `Select`, `Input`, `Button`, `RadioGroup`, `Label`, `Checkbox`, `Tooltip`, `Dialog`, `Popover`, `Calendar`
- Figma 導出的自定義組件
- lucide-react 圖標: `Menu`, `X`, `Copy`, `Trash2`, `Plus`, `ChevronLeft`, `ChevronRight`

**關鍵功能實現**:

1. **輪播管理**:
```typescript
const [cards, setCards] = useState([
  { id: 1, enableImage: false, enableTitle: false, /* ... */ }
]);

const handleAddCard = () => {
  setCards([...cards, { id: Date.now(), /* ... */ }]);
};

const handleDeleteCard = (id: number) => {
  setCards(cards.filter(card => card.id !== id));
};
```

2. **圖片上傳處理**:
```typescript
const handleImageChange = (cardId: number, file: File) => {
  // 圖片上傳邏輯
  const reader = new FileReader();
  reader.onload = (e) => {
    updateCardImage(cardId, e.target.result);
  };
  reader.readAsDataURL(file);
};
```

3. **表單驗證與提交**:
```typescript
const handleSubmit = () => {
  // 驗證必填欄位
  if (!notificationMsg || !previewMsg) {
    toast.error('請填寫所有必填欄位');
    return;
  }
  
  // 準備提交數據
  const data = {
    templateType,
    title,
    notificationMsg,
    previewMsg,
    scheduleType,
    targetType,
    cards,
    // ...
  };
  
  toast.success('消息已創建！');
};
```

---

### 3.4 InteractiveMessageTable 組件（交互式消息表格）

**文件**: `src/components/InteractiveMessageTable.tsx`

**核心功能**:
- 動態交互式表格組件
- 與 Figma 導出的 Table8Columns3Actions 組件集成
- 支持數據展示和操作功能
- 響應式設計和交互反饋

**主要特性**:
- 表格數據動態渲染
- 列寬自適應
- 操作按鈕集成（查看、編輯、刪除等）
- 狀態管理和事件處理

**使用場景**:
- MessageList 中的消息列表展示
- 數據表格的統一展示方案
- 支持自定義列配置和操作

---

### 3.5 FilterModal 組件（標籤篩選）

**文件**: `src/components/FilterModal.tsx`

**核心功能**:
- 標籤搜索與篩選
- 標籤選擇（包含/排除）
- 自定義標籤創建
- 自定義滾動條實現

**主要狀態管理**:
```typescript
interface Tag {
  id: string;
  name: string;
}

const [availableTags, setAvailableTags] = useState<Tag[]>([]);
const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
const [searchInput, setSearchInput] = useState('');
const [isInclude, setIsInclude] = useState(true); // 包含或排除
```

**標籤操作**:
```typescript
// 添加標籤
const handleAddTag = (tag: Tag) => {
  setSelectedTags([...selectedTags, tag]);
  setAvailableTags(availableTags.filter(t => t.id !== tag.id));
};

// 移除標籤
const handleRemoveTag = (tag: Tag) => {
  setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
  setAvailableTags([...availableTags, tag]);
};

// 創建新標籤
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && searchInput.trim()) {
    const newTag = { id: Date.now().toString(), name: searchInput };
    handleAddTag(newTag);
    setSearchInput('');
  }
};
```

---

### 3.6 shadcn/ui 組件使用模式

#### 基本使用示例

```typescript
// Button 組件
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg" onClick={handleClick}>
  提交
</Button>

// Select 組件
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="請選擇" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">選項 1</SelectItem>
    <SelectItem value="option2">選項 2</SelectItem>
  </SelectContent>
</Select>

// Dialog 組件
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>打開對話框</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>標題</DialogTitle>
    {/* 內容 */}
  </DialogContent>
</Dialog>

// Toast 通知
import { toast } from "sonner"

toast.success("操作成功！");
toast.error("操作失敗！");
toast.info("提示信息");
```

#### 樣式自定義

```typescript
// 使用 className 添加 Tailwind 樣式
<Button className="bg-blue-500 hover:bg-blue-600 text-white">
  自定義按鈕
</Button>

// 使用 cn() 工具函數合併樣式
import { cn } from "@/components/ui/utils"

<div className={cn(
  "base-class",
  condition && "conditional-class",
  "additional-class"
)}>
  內容
</div>
```

---

### 3.7 狀態管理策略（當前實現）

**當前狀態**: 使用 React Hooks 進行本地狀態管理

| 狀態類型 | 管理方案 | 示例 |
|---------|---------|------|
| **組件內狀態** | useState | 表單輸入、視圖切換、UI 狀態 |
| **表單狀態** | react-hook-form | （計劃中，當前使用 useState） |
| **全局狀態** | 未實現 | 計劃使用 Zustand |
| **服務端狀態** | 未實現 | 計劃使用 React Query |

**狀態提升模式**:
```typescript
// App.tsx 管理視圖狀態
const [currentView, setCurrentView] = useState<'list' | 'creation'>('list');

// 通過 props 傳遞狀態變更函數
<MessageList onCreateMessage={() => setCurrentView('creation')} />
<MessageCreation onBack={() => setCurrentView('list')} />
```

---

## 3.8 規劃中的模塊（待實現）

以下模塊在文檔中有詳細設計，但尚未實現，保留作為後續開發參考。

## 4. 狀態管理策略

### 4.1 狀態分類

| 狀態類型 | 管理方案 | 示例 |
|---------|---------|------|
| **服務端狀態** | React Query | 會員列表、活動數據、標籤數據 |
| **全局 UI 狀態** | Zustand | 側邊欄展開/收起、主題設置 |
| **認證狀態** | Zustand + LocalStorage | Token、用戶信息 |
| **表單狀態** | React Hook Form | 創建會員表單、創建活動表單 |
| **組件內部狀態** | useState | Modal 開關、當前選中項 |

### 4.2 Zustand Store 示例

```typescript
// uiStore.ts
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  theme: 'light',
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}));
```

---

## 5. 樣式方案（Tailwind CSS + shadcn/ui）

### 5.1 Tailwind CSS 配置

#### index.css（入口文件）
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 全局基礎樣式 */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### 樣式工具函數
```typescript
// components/ui/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**使用示例**:
```typescript
import { cn } from "@/components/ui/utils"

<div className={cn(
  "base-class",
  isActive && "active-class",
  "additional-class"
)} />
```

---

### 5.2 shadcn/ui 組件樣式系統

#### 組件變體系統（class-variance-authority）

```typescript
// 示例: Button 組件
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

### 5.3 實際使用的樣式模式

#### 1. Tailwind 工具類
```typescript
// 直接使用 Tailwind CSS 類
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <span className="text-lg font-semibold text-gray-900">標題</span>
  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
    操作
  </Button>
</div>
```

#### 2. 條件樣式
```typescript
<div className={cn(
  "p-4 rounded-lg",
  isActive ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  內容
</div>
```

#### 3. 響應式設計
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 手機1列，平板2列，桌面3列 */}
</div>

<div className="text-sm sm:text-base md:text-lg lg:text-xl">
  響應式文字大小
</div>
```

#### 4. 自定義 Figma 組件樣式
```typescript
// MessageCreation.tsx 中的實際樣式
<div className="h-[49.333px] relative shrink-0 w-[148px]">
  <div className="absolute inset-[24.73%_62.3%_43%_29.83%]">
    {/* Figma 導出的精確定位 */}
  </div>
</div>
```

---

### 5.4 顏色系統（實際使用）

**主要顏色**:
- **主色（藍色）**: #189AEB, #3B82F6
- **輔助色（青色）**: #6ED7FF
- **中性色**: Gray 50-900
- **語義色**:
  - Success: #10B981
  - Warning: #F59E0B
  - Error: #EF4444

**使用方式**:
```typescript
// Tailwind 類
className="bg-blue-500 text-white"
className="text-gray-700 hover:text-gray-900"

// CSS 變量
className="bg-primary text-primary-foreground"
```

---

## 6. 性能優化

### 6.1 代碼分割
```typescript
// 路由懶加載
const MemberListPage = lazy(() => import('@/features/members/pages/MemberListPage'));

// 組件懶加載
const HeavyChart = lazy(() => import('@/components/Charts/HeavyChart'));

// 使用 Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyChart />
</Suspense>
```

### 6.2 列表虛擬化
```typescript
import { FixedSizeList } from 'react-window';

export const VirtualMemberList: React.FC = () => {
  const { data } = useMembers();

  return (
    <FixedSizeList
      height={600}
      itemCount={data?.items.length || 0}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MemberItem member={data.items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 6.3 圖片優化
```typescript
// 使用 CDN + 壓縮
const getOptimizedImageUrl = (url: string, width: number) => {
  return `${url}?x-oss-process=image/resize,w_${width}/quality,q_80`;
};

// 懶加載圖片
<img
  src={placeholderUrl}
  data-src={imageUrl}
  loading="lazy"
  alt="member avatar"
/>
```

### 6.4 React Query 優化
```typescript
// 預取數據
const prefetchMemberDetail = (id: number) => {
  queryClient.prefetchQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMemberById(id),
  });
};

// 樂觀更新
const updateMember = useMutation({
  mutationFn: memberService.updateMember,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['member', newData.id] });
    const previousData = queryClient.getQueryData(['member', newData.id]);

    queryClient.setQueryData(['member', newData.id], newData);

    return { previousData };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['member', newData.id], context.previousData);
  },
});
```

---

## 7. 錯誤處理

### 7.1 全局錯誤邊界
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h1>出錯了</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            重新加載
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 7.2 API 錯誤處理
```typescript
import { message } from 'antd';

export const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        message.error(data.message || '請求參數錯誤');
        break;
      case 401:
        message.error('登入已過期，請重新登入');
        window.location.href = '/login';
        break;
      case 403:
        message.error('您沒有權限執行此操作');
        break;
      case 404:
        message.error('請求的資源不存在');
        break;
      case 500:
        message.error('服務器錯誤，請稍後再試');
        break;
      default:
        message.error('發生未知錯誤');
    }
  } else if (error.request) {
    message.error('網絡連接失敗，請檢查您的網絡');
  } else {
    message.error('請求失敗，請稍後再試');
  }
};
```

---

## 8. 測試策略

### 8.1 單元測試
```typescript
// MemberList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemberList } from './MemberList';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('MemberList', () => {
  it('renders member list correctly', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemberList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('王小明')).toBeInTheDocument();
    });
  });
});
```

### 8.2 集成測試
```typescript
// 測試完整的用戶流程
describe('Member Management Flow', () => {
  it('allows user to create and view a member', async () => {
    // 1. 導航到會員列表
    // 2. 點擊新增按鈕
    // 3. 填寫表單
    // 4. 提交表單
    // 5. 驗證會員已創建
  });
});
```

---

## 9. 部署方案

### 9.1 構建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Radix UI 和其他依賴的版本別名
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      // Figma 資源映射
      'figma:asset/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png': path.resolve(__dirname, './src/assets/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png'),
      // 其他 Radix UI 組件別名...
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
  },
});
```

**配置說明**:
- 使用 `@vitejs/plugin-react-swc` 提供更快的編譯速度
- 構建輸出目錄為 `build/` 而非 `dist/`
- 開發服務器監聽所有網絡接口 (0.0.0.0)
- 自動打開瀏覽器
- 支持 Figma 資源映射和版本化依賴別名

### 9.2 環境變量

```bash
# .env
VITE_API_BASE_URL=http://127.0.0.1:8700

# .env.development
VITE_API_BASE_URL=http://127.0.0.1:8700

# .env.production
VITE_API_BASE_URL=https://api.hotel-crm.com
```

### 9.3 部署流程

```bash
# 1. 安裝依賴
npm install

# 2. 構建生產版本
npm run build

# 3. 構建輸出目錄
# build/ 目錄內容複製到服務器
```

**說明**:
- 當前版本未配置預覽命令
- 構建輸出在 `build/` 目錄而非 `dist/`
- 項目名稱: "Push Message_活動與訊息推播/圖片點擊型_v0.1"

### 9.4 Nginx 配置

```nginx
server {
    listen 80;
    server_name crm.hotel.com;

    root /var/www/hotel-crm/build;
    index index.html;

    # Gzip 壓縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 處理 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://backend:8700;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 靜態資源緩存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**配置說明**:
- 根目錄使用 `build/` 而非 `dist/`
- API 代理指向後端端口 8700
- 支持 Figma 資源和 SVG 圖片緩存

---

## 10. 開發規範

### 10.1 命名規範

- **組件**: PascalCase (`MemberList.tsx`)
- **函數/變量**: camelCase (`getUserInfo`)
- **常量**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **類型/接口**: PascalCase + I 前綴 (`IMember`)
- **CSS 類**: kebab-case (`.member-list`)

### 10.2 文件組織

```
feature/
├── components/          # 組件
│   └── ComponentName/
│       ├── index.tsx
│       ├── index.module.css
│       ├── types.ts
│       └── __tests__/
├── hooks/              # Hooks
├── services/           # API 服務
├── types.ts            # 類型定義
└── pages/              # 頁面
```

### 10.3 代碼審查清單

- ✅ TypeScript 類型完整
- ✅ 無 ESLint 錯誤
- ✅ 代碼已格式化（Prettier）
- ✅ 組件可復用性
- ✅ 性能優化（memo, useMemo, useCallback）
- ✅ 錯誤處理完善
- ✅ 響應式設計
- ✅ 無障礙性（a11y）

---

## 11. 工具與資源

### 11.1 推薦 VS Code 插件

- **ESLint**: 代碼檢查
- **Prettier**: 代碼格式化
- **TypeScript Vue Plugin (Volar)**: TypeScript 支持
- **Tailwind CSS IntelliSense**: Tailwind 自動完成
- **Error Lens**: 行內錯誤提示

### 11.2 Chrome 調試工具

- **React Developer Tools**: React 組件調試
- **Redux DevTools**: 狀態調試
- **React Query DevTools**: 查詢調試

---

## 12. 常見問題

### Q1: 如何處理大列表性能問題？
使用 `react-window` 或 `react-virtualized` 進行列表虛擬化。

### Q2: 如何優化首屏加載速度？
- 路由懶加載
- 代碼分割
- 圖片懶加載
- CDN 加速

### Q3: 如何處理 Token 過期？
在 Axios 攔截器中檢測 401 狀態碼，自動刷新 Token 或跳轉登入頁。

### Q4: 如何實現暗黑模式？
使用 Ant Design 的 ConfigProvider 配置主題，結合 CSS 變量切換。

---

## 附錄

### A. 腳本命令（v0.1 實際配置）

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

**說明**:
- `dev`: 啟動開發服務器 (localhost:5173)
- `build`: 構建生產版本 (輸出到 build/ 目錄)
- **未配置**: TypeScript 類型檢查、ESLint、Prettier、測試腳本 (v0.1 原型階段簡化配置)

### B. 依賴包列表（v0.1 實際配置）

#### 生產依賴 (dependencies)

```json
{
  "dependencies": {
    // 核心框架
    "react": "^18.3.1",
    "react-dom": "^18.3.1",

    // shadcn/ui 基礎組件 (Radix UI Primitives)
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-aspect-ratio": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-context-menu": "^2.2.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-hover-card": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",

    // UI 增強工具
    "class-variance-authority": "^0.7.1",  // 組件變體管理
    "clsx": "*",                           // 條件性 className 組合
    "tailwind-merge": "*",                 // Tailwind 類名合併
    "cmdk": "^1.1.1",                      // 命令面板組件
    "sonner": "^2.0.3",                    // Toast 通知
    "next-themes": "^0.4.6",               // 主題管理

    // 功能組件
    "lucide-react": "^0.487.0",            // 圖標庫
    "embla-carousel-react": "^8.6.0",      // 輪播組件
    "vaul": "^1.1.2",                      // 抽屜組件
    "react-resizable-panels": "^2.1.7",    // 可調整大小面板
    "input-otp": "^1.4.2",                 // OTP 輸入組件

    // 數據與表單
    "react-hook-form": "^7.55.0",          // 表單狀態管理
    "react-day-picker": "^8.10.1",         // 日期選擇器
    "recharts": "^2.15.2"                  // 圖表庫
  }
}
```

#### 開發依賴 (devDependencies)

```json
{
  "devDependencies": {
    "@types/node": "^20.10.0",             // Node.js 類型定義
    "@vitejs/plugin-react-swc": "^3.10.2", // Vite React SWC 插件
    "vite": "^6.4.1"                       // 構建工具
  }
}
```

#### 依賴分類說明

**UI 組件系統 (48 個組件)**:
- 基於 Radix UI Primitives 的無樣式組件
- 使用 Tailwind CSS 進行樣式定制
- shadcn/ui 設計系統規範

**Tailwind CSS 相關**:
- `class-variance-authority`: 管理組件變體樣式
- `clsx` + `tailwind-merge`: 智能合併和去重 Tailwind 類名
- `cn()` 工具函數實現類名組合

**未實現的規劃依賴**:
- ❌ React Router DOM (路由)
- ❌ Zustand (全局狀態管理)
- ❌ React Query (服務端狀態)
- ❌ Axios (HTTP 客戶端)
- ❌ Ant Design (UI 組件庫)
- ❌ ESLint / Prettier (代碼規範)
- ❌ Vitest (測試框架)

**v0.1 原型說明**: 當前版本為 Figma 設計稿轉換的初始原型，專注於 UI 實現和基本交互邏輯，暫未集成後端 API 和完整的狀態管理系統。

---

## 13. 頁面設計詳解

### 13.1 建立群發訊息頁面（CampaignCreatePage）

#### 頁面佈局
- **左右分欄設計**: 左側表單區 + 右側預覽區
- **左側表單區**: 包含所有輸入控件和設定選項
- **右側預覽區**: 手機模擬器樣式，即時預覽訊息效果

#### 核心功能實現

**1. 模板類型選擇** (`/data2/lili_hotel/frontend/src/features/campaigns/pages/CampaignCreatePage.tsx:217-245`)
```typescript
// 支援三種模板類型
const templateTypes = {
  text: '文字按鈕確認型',
  image_text: '圖卡按鈕型',
  image: '圖片點擊型'
};

// 模板類型與後端 API 的映射
const templateTypeMap = {
  'text': 'text',
  'image_text': 'image_card',
  'image': 'image_click',
};
```

**2. 輪播功能實現** (`CampaignCreatePage.tsx:44-67`)
```typescript
// 輪播項目資料結構
interface CarouselItem {
  id: string;
  fileList: UploadFile[];
  actionButtonEnabled: boolean;
  actionButtonText: string;
  actionButtonInteractionType: InteractionType;
  actionButtonTag: string;
}

// 輪播狀態管理
const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([...]);
const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
```

**3. 動作按鈕設定** (`CampaignCreatePage.tsx:322-457`)
- 文字按鈕確認型: 支援最多 2 個動作按鈕
- 圖片點擊型/圖卡按鈕型: 每個輪播圖支援 1 個動作按鈕
- 每個按鈕可設定: 按鈕文字、互動類型、互動標籤

**4. 互動類型設定** (`CampaignCreatePage.tsx:378-408`)
```typescript
// 互動類型選項
const interactionTypes = {
  none: '無互動',
  trigger_message: '觸發新訊息',
  open_url: '開啟網址連結',
  trigger_image: '觸發新圖片'
};
```

**5. 即時預覽** (`CampaignCreatePage.tsx:700-774`)
- 使用手機模擬器樣式展示訊息效果
- 根據模板類型動態渲染預覽內容
- 輪播導航控制器支援前後翻頁和直接跳轉

#### 樣式設計 (`CampaignCreatePage.css`)
```css
/* 編輯區域 - 左右分欄 */
.editor-container {
  display: flex;
  gap: 32px;
}

/* 表單區 - 左側 */
.form-section {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  padding: 32px;
}

/* 預覽區 - 右側 */
.preview-section {
  width: 400px;
  background: linear-gradient(135deg, #7C9CBF, #93B5D8);
  border-radius: 12px;
  padding: 40px 20px;
  flex-shrink: 0;
}
```

#### 關鍵實施細節
1. **圖片上傳**: 使用 Ant Design Upload 組件，支援 JPG/JPEG/PNG 格式，限制 1MB
2. **輪播管理**: 每個輪播圖獨立管理圖片和互動設定
3. **表單驗證**: 必填欄位包含通知訊息和訊息預覽
4. **草稿儲存**: 支援儲存草稿和直接發布兩種操作

---

### 13.2 建立問卷頁面（SurveyCreatePage）

#### 頁面佈局
- **左右分欄設計**: 左側表單區 + 右側預覽區
- **左側表單區**: 基本設定、發送設定、問卷內容（題目管理）
- **右側預覽區**: 手機模擬器樣式，即時預覽問卷效果

#### 核心功能實現

**1. 問卷基本設定** (`/data2/lili_hotel/frontend/src/features/surveys/pages/SurveyCreatePage.tsx:363-401`)
```typescript
// 表單欄位
<Form.Item label="問卷名稱" name="name" required>
  <Input placeholder="例如：2024 住客滿意度調查" />
</Form.Item>

<Form.Item label="問卷範本" name="template_id" required>
  <Select onChange={handleTemplateChange}>
    {templates.map(template => (
      <Option key={template.id} value={template.id}>
        <Space>
          <span>{template.icon}</span>
          <span>{template.name}</span>
        </Space>
      </Option>
    ))}
  </Select>
</Form.Item>
```

**2. 題目管理系統** (`SurveyCreatePage.tsx:97-127`)
```typescript
// 題目操作
const handleAddQuestion = () => { /* 新增題目 */ };
const handleEditQuestion = (index: number) => { /* 編輯題目 */ };
const handleDeleteQuestion = (index: number) => { /* 刪除題目 */ };
const handleSaveQuestion = (question: SurveyQuestion) => { /* 儲存題目 */ };
```

**3. 題型支援** (`QuestionEditor.tsx:170-181`)
```typescript
// 支援 10 種題型
const questionTypes = {
  name: '姓名',
  phone: '電話',
  email: '電子郵件',
  birthday: '生日',
  address: '地址',
  gender: '性別',
  id_number: '身分證字號',
  link: '超連結',
  video: '影片',
  image: '圖片'
};
```

**4. 題目編輯器** (`QuestionEditor.tsx:24-225`)
- **基本設定**: 題型選擇、題目文字、字型大小、必填設定
- **條件欄位**: 根據題型動態顯示特定設定欄位
  - 影片題型: 影片描述、影片超連結
  - 圖片題型: 圖片描述、圖片超連結
  - 連結題型: 連結說明

**5. 即時預覽** (`SurveyCreatePage.tsx:580-634`)
```typescript
// 手機模擬器預覽
<div className="phone-simulator">
  <div className="phone-frame">
    <div className="phone-header">...</div>
    <div className="phone-content">
      <div className="survey-preview">
        <h2>{surveyName || '問卷名稱'}</h2>
        {questions.map((question, index) => (
          <div key={index} className="question-item">
            <div className="question-number">Q{index + 1}</div>
            <div className="question-text">{question.question_text}</div>
            {renderQuestionInput(question)}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

**6. 題目輸入預覽渲染** (`SurveyCreatePage.tsx:144-274`)
```typescript
// 根據題型渲染對應的輸入欄位預覽
const renderQuestionInput = (question: SurveyQuestion) => {
  switch (question.question_type) {
    case 'name': return <Input placeholder="請輸入姓名" disabled />;
    case 'phone': return <Input placeholder="請輸入電話號碼" disabled />;
    case 'email': return <Input placeholder="請輸入電子郵件" disabled />;
    case 'birthday': return <DatePicker disabled />;
    case 'address': return <TextArea rows={2} disabled />;
    case 'gender': return <Radio.Group disabled>...</Radio.Group>;
    case 'video': return <div>🎥 影片上傳區域</div>;
    case 'image': return <div>🖼️ 圖片上傳區域</div>;
    // ...
  }
};
```

#### 樣式設計 (`SurveyCreatePage.css`)
```css
/* 編輯區域 */
.editor-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

/* 表單區 */
.form-section {
  flex: 1;
  min-width: 0;
}

/* 預覽區 */
.preview-section {
  width: 420px;
  flex-shrink: 0;
}

/* 手機模擬器 */
.phone-simulator {
  position: sticky;
  top: 24px;
}
```

#### 關鍵實施細節
1. **表單整合**: 基本設定和發送設定使用同一個 Form 實例
2. **題目排序**: 題目順序自動編號，暫未實施拖曳排序
3. **即時預覽**: 使用 `onValuesChange` 監聽表單變化，即時更新預覽
4. **模態編輯器**: 題目編輯器使用 Modal 組件，支援新增和編輯模式
5. **輸入限制**: v0.1 版本已移除最小長度/最大長度輸入限制功能

---

## 14. API 服務層設計

### 14.1 Campaign API (`/data2/lili_hotel/frontend/src/services/api/campaign.ts`)

**核心功能**: 活動推播 API 服務層，處理群發訊息的創建、查詢、更新和刪除操作。

**主要 API 方法**:

```typescript
import { apiClient } from './client';
import type { CampaignCreate, CampaignListItem } from '@/types/campaign';

// 創建活動推播
export const createCampaign = async (data: CampaignCreate) => {
  return apiClient.post('/api/v1/campaigns', data);
};

// 獲取活動列表
export const getCampaigns = async (): Promise<CampaignListItem[]> => {
  return apiClient.get('/api/v1/campaigns');
};

// 獲取單一活動詳情
export const getCampaignById = async (id: number) => {
  return apiClient.get(`/api/v1/campaigns/${id}`);
};

// 更新活動（僅草稿和排程狀態可編輯）
export const updateCampaign = async (id: number, data: Partial<CampaignCreate>) => {
  return apiClient.put(`/api/v1/campaigns/${id}`, data);
};

// 刪除活動
export const deleteCampaign = async (id: number) => {
  return apiClient.delete(`/api/v1/campaigns/${id}`);
};
```

**後端對應端點**:
- `POST /api/v1/campaigns`: 創建活動，自動創建訊息模板並設定活動狀態
- `GET /api/v1/campaigns`: 獲取活動列表，包含發送統計數據
- `GET /api/v1/campaigns/{id}`: 獲取活動詳情
- `PUT /api/v1/campaigns/{id}`: 更新活動（僅草稿和排程狀態）
- `DELETE /api/v1/campaigns/{id}`: 刪除活動

**資料處理邏輯**:
- 前端 `template_type` 映射到後端類型: `text`, `image_card`, `image_click`
- `schedule_type` 支援: `immediate` (立即發送), `scheduled` (排程發送), `draft` (草稿)
- 活動狀態自動判斷: 根據排程時間與當前時間比較
- 目標受眾支援: `all` (所有好友), `filtered` (篩選目標對象)
- 互動類型支援: `none`, `open_url`, `trigger_message`, `trigger_image`

### 14.2 Survey API (`/data2/lili_hotel/frontend/src/services/api/survey.ts`)

**核心功能**: 問卷管理 API 服務層，處理問卷範本、問卷 CRUD、題目管理和統計數據。

**主要 API 方法**:

```typescript
import { apiClient } from './client';
import type {
  SurveyCreate,
  SurveyUpdate,
  SurveyTemplate,
  Survey,
  SurveyQuestion,
  SurveyStatistics
} from '@/types/survey';

// ============ 問卷範本 ============
// 獲取問卷範本列表
export const fetchSurveyTemplates = async (): Promise<SurveyTemplate[]> => {
  return apiClient.get('/api/v1/surveys/templates');
};

// 獲取單一問卷範本
export const fetchSurveyTemplate = async (id: number): Promise<SurveyTemplate> => {
  return apiClient.get(`/api/v1/surveys/templates/${id}`);
};

// ============ 問卷 CRUD ============
// 獲取問卷列表（支援篩選、搜尋、分頁）
export const fetchSurveys = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Survey[]> => {
  return apiClient.get('/api/v1/surveys', { params });
};

// 獲取單一問卷
export const fetchSurvey = async (id: number): Promise<Survey> => {
  return apiClient.get(`/api/v1/surveys/${id}`);
};

// 創建問卷（自動創建題目）
export const createSurvey = async (data: SurveyCreate) => {
  return apiClient.post('/api/v1/surveys', data);
};

// 更新問卷（僅草稿狀態可編輯）
export const updateSurvey = async (id: number, data: SurveyUpdate) => {
  return apiClient.put(`/api/v1/surveys/${id}`, data);
};

// 刪除問卷
export const deleteSurvey = async (id: number) => {
  return apiClient.delete(`/api/v1/surveys/${id}`);
};

// 發布問卷（草稿 → 發布）
export const publishSurvey = async (id: number) => {
  return apiClient.post(`/api/v1/surveys/${id}/publish`);
};

// ============ 題目管理 ============
// 創建題目（僅草稿狀態可編輯）
export const createQuestion = async (surveyId: number, data: SurveyQuestion) => {
  return apiClient.post(`/api/v1/surveys/${surveyId}/questions`, data);
};

// 更新題目（僅草稿狀態可編輯）
export const updateQuestion = async (
  surveyId: number,
  questionId: number,
  data: SurveyQuestion
) => {
  return apiClient.put(`/api/v1/surveys/${surveyId}/questions/${questionId}`, data);
};

// 刪除題目（僅草稿狀態可編輯）
export const deleteQuestion = async (surveyId: number, questionId: number) => {
  return apiClient.delete(`/api/v1/surveys/${surveyId}/questions/${questionId}`);
};

// 重新排序題目
export const reorderQuestions = async (surveyId: number, questionIds: number[]) => {
  return apiClient.post(`/api/v1/surveys/${surveyId}/questions/reorder`, { question_ids: questionIds });
};

// ============ 統計與回應 ============
// 獲取問卷統計
export const fetchSurveyStatistics = async (surveyId: number): Promise<SurveyStatistics> => {
  return apiClient.get(`/api/v1/surveys/${surveyId}/statistics`);
};

// 獲取問卷回應列表
export const fetchSurveyResponses = async (surveyId: number, params?: {
  page?: number;
  limit?: number;
}) => {
  return apiClient.get(`/api/v1/surveys/${surveyId}/responses`, { params });
};
```

**後端對應端點**:
- `GET /api/v1/surveys/templates`: 獲取問卷範本列表（僅啟用的範本）
- `GET /api/v1/surveys`: 獲取問卷列表（支援狀態篩選、搜尋、分頁）
- `POST /api/v1/surveys`: 創建問卷（自動創建題目，狀態為 `draft`）
- `PUT /api/v1/surveys/{id}`: 更新問卷（僅 `draft` 狀態可編輯）
- `DELETE /api/v1/surveys/{id}`: 刪除問卷
- `POST /api/v1/surveys/{id}/publish`: 發布問卷（`draft` → `published`）
- `POST/PUT/DELETE /api/v1/surveys/{id}/questions`: 題目 CRUD（僅 `draft` 可編輯）
- `POST /api/v1/surveys/{id}/questions/reorder`: 題目重新排序
- `GET /api/v1/surveys/{id}/responses`: 獲取問卷回應
- `GET /api/v1/surveys/{id}/statistics`: 獲取問卷統計

**資料處理邏輯**:
- 問卷狀態: `draft`, `published`, `archived`
- 題目類型: 10 種（`name`, `phone`, `email`, `birthday`, `address`, `gender`, `id_number`, `link`, `video`, `image`）
- 題目欄位擴展:
  - 影片題型: `video_description`, `video_link`
  - 圖片題型: `image_description`, `image_link`
  - 驗證欄位: `min_length`, `max_length`, `min_value`, `max_value`
- 發送設定: `target_audience` (all/filtered), `target_tags`, `schedule_type` (immediate/scheduled)
- 狀態保護: 僅 `draft` 狀態可編輯，發布後不可編輯

---

## 15. 類型定義

### 15.1 Campaign Types (`/data2/lili_hotel/frontend/src/types/campaign.ts`)

**核心類型定義**: 群發訊息相關的 TypeScript 類型定義

```typescript
// ============ 常量類型 ============
export const CampaignStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  ARCHIVED: 'archived',
} as const;
export type CampaignStatus = typeof CampaignStatus[keyof typeof CampaignStatus];

export const TemplateType = {
  IMAGE_CLICK: 'image_click',
  TEXT: 'text',
  TEXT_BUTTON: 'text_button',
  IMAGE_CARD: 'image_card',
} as const;
export type TemplateType = typeof TemplateType[keyof typeof TemplateType];

export const TargetAudience = {
  ALL: 'all',
  FILTERED: 'filtered',
} as const;
export type TargetAudience = typeof TargetAudience[keyof typeof TargetAudience];

export const ScheduleType = {
  IMMEDIATE: 'immediate',
  SCHEDULED: 'scheduled',
} as const;
export type ScheduleType = typeof ScheduleType[keyof typeof ScheduleType];

export const InteractionType = {
  NONE: 'none',
  OPEN_URL: 'open_url',
  TRIGGER_MESSAGE: 'trigger_message',
  TRIGGER_IMAGE: 'trigger_image',
} as const;
export type InteractionType = typeof InteractionType[keyof typeof InteractionType];

// ============ 資料介面 ============
export interface CampaignImage {
  url: string;
  filename: string;
  size?: number;
}

export interface CampaignCreate {
  // 圖片相關
  image?: CampaignImage;
  image_path?: string;
  interaction_type?: InteractionType;
  interaction_tag?: string;
  url?: string;
  trigger_message?: string;
  trigger_image?: string;
  trigger_image_path?: string;

  // 訊息相關
  title?: string;
  notification_text: string;  // 必填: 通知訊息
  preview_text: string;       // 必填: 訊息預覽
  template_type: TemplateType;

  // 發送相關
  target_audience: TargetAudience;
  target_tags?: string[];
  schedule_type: ScheduleType;
  scheduled_at?: string;
}

export interface CampaignListItem {
  id: number;
  title?: string;
  image?: CampaignImage;
  tags: string[];
  platforms: string[];
  status: CampaignStatus;
  target_count?: number;
  open_count?: number;
  click_count?: number;
  sent_at?: string;
  scheduled_at?: string;
  created_at: string;
}

export interface CampaignDetail extends CampaignListItem {
  notification_text: string;
  preview_text: string;
  template_type: TemplateType;
  target_audience: TargetAudience;
  interaction_tag?: string;
  url?: string;
  trigger?: string;
}
```

**類型說明**:
- `CampaignStatus`: 活動狀態 (`draft`, `scheduled`, `sent`, `archived`)
- `TemplateType`: 模板類型 (`text`, `image_card`, `image_click`)
- `TargetAudience`: 目標受眾 (`all`, `filtered`)
- `ScheduleType`: 排程類型 (`immediate`, `scheduled`)
- `InteractionType`: 互動類型 (`none`, `open_url`, `trigger_message`, `trigger_image`)
- `CampaignCreate`: 創建活動的資料結構，包含訊息內容、發送設定等
- `CampaignListItem`: 活動列表項目，包含基本資訊和統計數據
- `CampaignDetail`: 活動詳細資訊，繼承自 `CampaignListItem` 並添加完整內容

### 15.2 Survey Types (`/data2/lili_hotel/frontend/src/types/survey.ts`)

**核心類型定義**: 問卷管理相關的 TypeScript 類型定義

```typescript
// ============ 常量類型 ============
export const SurveyStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;
export type SurveyStatus = typeof SurveyStatus[keyof typeof SurveyStatus];

export const QuestionType = {
  NAME: 'name',
  PHONE: 'phone',
  EMAIL: 'email',
  BIRTHDAY: 'birthday',
  ADDRESS: 'address',
  GENDER: 'gender',
  ID_NUMBER: 'id_number',
  LINK: 'link',
  VIDEO: 'video',
  IMAGE: 'image',
} as const;
export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

// ============ 資料介面 ============
export interface SurveyTemplate {
  id: number;
  name: string;
  description: string;
  icon?: string;
  category: string;
  default_questions?: SurveyQuestion[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id?: number;
  question_type: QuestionType;
  question_text: string;
  font_size?: number;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  order: number;
  // 影片題型欄位
  video_description?: string;
  video_link?: string;
  // 圖片題型欄位
  image_description?: string;
  image_link?: string;
}

export interface SurveyCreate {
  name: string;
  template_id: number;
  description?: string;
  target_audience: 'all' | 'filtered';
  target_tags?: string[];
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  questions: SurveyQuestion[];
}

export interface Survey extends Omit<SurveyCreate, 'questions'> {
  id: number;
  status: SurveyStatus;
  response_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  template?: SurveyTemplate;
  questions?: SurveyQuestion[];
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  member_id: number;
  answers: Record<string, any>;
  is_completed: boolean;
  completed_at?: string;
  source?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyStatistics {
  total_responses: number;
  total_views: number;
  completion_rate: number;
  average_time: number;
  question_stats: Array<{
    question_id: number;
    question_text: string;
    responses: Record<string, number>;
  }>;
}
```

**類型說明**:
- `SurveyStatus`: 問卷狀態 (`draft`, `published`, `archived`)
- `QuestionType`: 題目類型，支援 10 種類型
  - 基本資料類: `name`, `phone`, `email`, `birthday`, `address`, `gender`, `id_number`
  - 多媒體類: `link`, `video`, `image`
- `SurveyTemplate`: 問卷範本，包含預設題目和分類資訊
- `SurveyQuestion`: 問卷題目，支援多種驗證欄位和多媒體擴展
- `SurveyCreate`: 創建問卷的資料結構
- `Survey`: 完整問卷資訊，包含狀態和統計數據
- `SurveyResponse`: 問卷回應記錄
- `SurveyStatistics`: 問卷統計資料，包含完成率和題目統計

---

**文檔版本**: v2.1
**最後更新**: 2025-10-28
**維護者**: 前端開發團隊
**變更說明**:
- **v2.1 (2025-10-28) - 實際代碼對齊更新**:
  - 📝 更新實際項目名稱: "Push Message_活動與訊息推播/圖片點擊型_v0.1"
  - ✅ 添加 InteractiveMessageTable 組件文檔
  - 🔧 更新 App.tsx 架構（移除全局 Toaster）
  - 📦 更新構建配置為實際的 vite.config.ts 內容
  - 🏗️ 構建輸出目錄更正為 `build/` 而非 `dist/`
  - 🌐 更新 Nginx 配置指向正確的 API 端口 (8700)
  - 📁 更新實際目錄結構和組件數量（48 個 UI 組件）
  - 🎨 確認無 styles/ 目錄，僅有 index.css
  - 📝 補充 Figma 資源映射和版本化依賴別名說明

- **v2.0 (2025-10-28) - 重大架構變更**:
  - 🔄 **技術棧重構**: 從 Ant Design 遷移至 shadcn/ui + Tailwind CSS
  - 📦 **核心框架版本**: React 18.3.1 (實際), Vite 6.4.1 (實際)
  - 🎨 **UI 組件系統**: 採用 Radix UI Primitives + 48 shadcn/ui 組件
  - 💅 **樣式方案**: CSS Modules → Tailwind CSS 工具類 + CVA 變體管理
  - 🏗️ **項目結構**: 更新為 v0.1 Figma 原型實際結構
  - 📝 **核心模塊**: 文檔反映實際實現 (App.tsx, MessageList, MessageCreation, FilterModal)
  - 🔧 **依賴包**: 完整更新為實際使用的 30+ 依賴項
  - ⚠️ **未實現功能**: 明確標註 React Router、Zustand、React Query、Axios 等暫未集成
  - 📋 **狀態管理**: 當前使用 React Hooks (useState, useEffect, useRef)
  - 🎯 **開發階段**: v0.1 Figma 原型，專注 UI 實現和基本交互

- v1.3 (2025-10-15):
  - 更新 Campaign API 服務層完整文檔
  - 更新 Survey API 服務層完整文檔
  - 補充完整的 Campaign Types 類型定義
  - 補充完整的 Survey Types 類型定義
  - 添加後端端點映射和資料處理邏輯說明
  - 詳細說明狀態管理、題目類型和驗證欄位

- v1.2 (2025-10-15):
  - 新增「建立群發訊息頁面」詳細實施文檔
  - 新增「建立問卷頁面」詳細實施文檔
  - 新增 API 服務層和類型定義說明
  - 更新目錄結構，加入 surveys 模塊

- v1.1 (2025-10-09):
  - 更新實際使用的技術棧版本 (React 19, Vite 7, Ant Design 5.27等)
  - 更新環境變量配置為實際使用的端口 (8700)
  - 移除未實現的依賴 (圖表庫、測試框架、Tailwind CSS、Prettier)
  - 標註待實現功能和可選配置項

**重要提示**:
- v2.1 確保文檔與實際代碼完全對齊，修正了構建配置、組件列表等細節
- v2.0 代表文檔從「規劃架構」轉變為「實際實現」，反映當前 v0.1 Figma 原型的真實技術棧和項目結構
- 與 v1.x 版本相比存在重大架構差異
