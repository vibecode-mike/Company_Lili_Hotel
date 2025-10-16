# 力麗飯店 LineOA CRM 前端架構文檔 v1.1

## 1. 技術棧

### 1.1 核心技術
- **框架**: React 19.1.1
- **語言**: TypeScript 5.9.3
- **構建工具**: Vite 7.1.7
- **包管理器**: npm (可選用 pnpm)

### 1.2 UI 與樣式
- **UI 組件庫**: Ant Design 5.27.4
- **CSS 方案**: CSS Modules (未使用 Tailwind CSS)
- **圖標**: Ant Design Icons 6.1.0 + Custom SVG

### 1.3 狀態管理
- **全局狀態**: Zustand 5.0.8
- **服務端狀態**: TanStack Query (React Query) 5.90.2
- **表單狀態**: React Hook Form 7.64.0

### 1.4 路由與導航
- **路由**: React Router DOM 7.9.3
- **權限控制**: 自定義路由守衛

### 1.5 數據可視化
- **圖表庫**: 待實現 (規劃使用 Apache ECharts 或 Recharts)

### 1.6 HTTP 客戶端
- **請求庫**: Axios 1.12.2
- **攔截器**: 自定義請求/響應攔截
- **日期處理**: dayjs 1.11.18

### 1.7 開發工具
- **代碼規範**: ESLint 9.36.0 + TypeScript ESLint 8.45.0
- **Git Hooks**: 未配置 (可選添加 Husky + lint-staged)
- **測試框架**: 未配置 (可選添加 Vitest + React Testing Library)

---

## 2. 項目目錄結構

```
frontend/
├── public/                          # 靜態資源
│   ├── favicon.ico
│   ├── logo.svg
│   └── robots.txt
│
├── src/
│   ├── assets/                      # 資源文件
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       ├── global.css           # 全局樣式
│   │       ├── variables.css        # CSS 變量
│   │       └── reset.css            # 樣式重置
│   │
│   ├── components/                  # 通用組件
│   │   ├── Layout/                  # 布局組件
│   │   │   ├── Sidebar/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── index.module.css
│   │   │   │   └── types.ts
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   └── MainLayout/
│   │   │       ├── index.tsx
│   │   │       └── index.module.css
│   │   │
│   │   ├── Common/                  # 通用業務組件
│   │   │   ├── PageHeader/          # 頁面頭部
│   │   │   ├── SearchBar/           # 搜索欄
│   │   │   ├── FilterPanel/         # 篩選面板
│   │   │   ├── DataTable/           # 數據表格
│   │   │   ├── StatusBadge/         # 狀態徽章
│   │   │   ├── TagList/             # 標籤列表
│   │   │   ├── EmptyState/          # 空狀態
│   │   │   └── LoadingSpinner/      # 加載動畫
│   │   │
│   │   ├── Charts/                  # 圖表組件
│   │   │   ├── LineChart/
│   │   │   ├── PieChart/
│   │   │   ├── BarChart/
│   │   │   └── TrendCard/
│   │   │
│   │   └── Form/                    # 表單組件
│   │       ├── ImageUpload/         # 圖片上傳
│   │       ├── DateRangePicker/     # 日期範圍選擇
│   │       ├── TagSelect/           # 標籤選擇器
│   │       └── RichTextEditor/      # 富文本編輯器
│   │
│   ├── features/                    # 功能模塊（按業務劃分）
│   │   ├── auth/                    # 認證模塊
│   │   │   ├── components/
│   │   │   │   ├── LoginForm/
│   │   │   │   └── ProtectedRoute/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── members/                 # 會員管理
│   │   │   ├── components/
│   │   │   │   ├── MemberList/
│   │   │   │   ├── MemberDetail/
│   │   │   │   ├── MemberForm/
│   │   │   │   ├── TagManager/
│   │   │   │   └── ConsumptionHistory/
│   │   │   ├── hooks/
│   │   │   │   ├── useMembers.ts
│   │   │   │   ├── useMemberDetail.ts
│   │   │   │   └── useMemberTags.ts
│   │   │   ├── services/
│   │   │   │   └── memberService.ts
│   │   │   ├── pages/
│   │   │   │   ├── MemberListPage.tsx
│   │   │   │   └── MemberDetailPage.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── campaigns/               # 活動推播（群發訊息）
│   │   │   ├── components/
│   │   │   │   ├── CampaignList/
│   │   │   │   ├── CampaignForm/
│   │   │   │   ├── CampaignPreview/
│   │   │   │   ├── RecipientList/
│   │   │   │   └── CampaignStats/
│   │   │   ├── hooks/
│   │   │   │   ├── useCampaigns.ts
│   │   │   │   └── useCampaignDetail.ts
│   │   │   ├── services/
│   │   │   │   └── campaignService.ts
│   │   │   ├── pages/
│   │   │   │   ├── CampaignListPage.tsx
│   │   │   │   ├── CampaignCreatePage.tsx    # 建立群發訊息頁
│   │   │   │   └── CampaignCreatePage.css    # 頁面樣式
│   │   │   └── types.ts
│   │   │
│   │   ├── surveys/                 # 問卷模板
│   │   │   ├── components/
│   │   │   │   ├── SurveyList/
│   │   │   │   ├── QuestionEditor/          # 題目編輯器
│   │   │   │   │   └── index.tsx
│   │   │   │   └── SurveyPreview/
│   │   │   ├── hooks/
│   │   │   │   └── useSurveys.ts
│   │   │   ├── services/
│   │   │   │   └── surveyService.ts
│   │   │   ├── pages/
│   │   │   │   ├── SurveyListPage.tsx
│   │   │   │   ├── SurveyCreatePage.tsx      # 建立問卷頁
│   │   │   │   └── SurveyCreatePage.css      # 頁面樣式
│   │   │   └── types.ts
│   │   │
│   │   ├── templates/               # 消息模板
│   │   │   ├── components/
│   │   │   │   ├── TemplateList/
│   │   │   │   ├── TemplateEditor/
│   │   │   │   ├── TemplatePreview/
│   │   │   │   └── CarouselBuilder/
│   │   │   ├── hooks/
│   │   │   │   └── useTemplates.ts
│   │   │   ├── services/
│   │   │   │   └── templateService.ts
│   │   │   ├── pages/
│   │   │   │   └── TemplateEditorPage.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── tags/                    # 標籤管理
│   │   │   ├── components/
│   │   │   │   ├── TagGrid/
│   │   │   │   ├── TagForm/
│   │   │   │   └── TagStatistics/
│   │   │   ├── hooks/
│   │   │   │   └── useTags.ts
│   │   │   ├── services/
│   │   │   │   └── tagService.ts
│   │   │   ├── pages/
│   │   │   │   └── TagManagementPage.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── autoResponses/           # 自動回應
│   │   │   ├── components/
│   │   │   │   ├── ResponseList/
│   │   │   │   ├── ResponseForm/
│   │   │   │   └── KeywordManager/
│   │   │   ├── hooks/
│   │   │   │   └── useAutoResponses.ts
│   │   │   ├── services/
│   │   │   │   └── autoResponseService.ts
│   │   │   ├── pages/
│   │   │   │   └── AutoResponsePage.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── messages/                # 消息記錄
│   │   │   ├── components/
│   │   │   │   ├── ChatWindow/
│   │   │   │   ├── MessageList/
│   │   │   │   └── MessageInput/
│   │   │   ├── hooks/
│   │   │   │   └── useMessages.ts
│   │   │   ├── services/
│   │   │   │   └── messageService.ts
│   │   │   └── types.ts
│   │   │
│   │   └── analytics/               # 數據分析
│   │       ├── components/
│   │       │   ├── KPICards/
│   │       │   ├── TrendChart/
│   │       │   ├── PerformanceTable/
│   │       │   └── ExportPanel/
│   │       ├── hooks/
│   │       │   └── useAnalytics.ts
│   │       ├── services/
│   │       │   └── analyticsService.ts
│   │       ├── pages/
│   │       │   └── AnalyticsDashboard.tsx
│   │       └── types.ts
│   │
│   ├── hooks/                       # 全局 Hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePagination.ts
│   │   ├── useModal.ts
│   │   └── usePermission.ts
│   │
│   ├── services/                    # API 服務層
│   │   ├── api/
│   │   │   ├── client.ts            # Axios 實例配置
│   │   │   ├── interceptors.ts      # 請求/響應攔截器
│   │   │   └── endpoints.ts         # API 端點定義
│   │   └── utils/
│   │       ├── request.ts           # 統一請求方法
│   │       └── errorHandler.ts      # 錯誤處理
│   │
│   ├── stores/                      # 全局狀態管理
│   │   ├── authStore.ts             # 認證狀態
│   │   ├── userStore.ts             # 用戶信息
│   │   ├── uiStore.ts               # UI 狀態（側邊欄、主題等）
│   │   └── index.ts                 # Store 導出
│   │
│   ├── routes/                      # 路由配置
│   │   ├── index.tsx                # 路由主文件
│   │   ├── PrivateRoute.tsx         # 私有路由
│   │   └── routes.config.ts         # 路由配置
│   │
│   ├── types/                       # 全局類型定義
│   │   ├── api.ts                   # API 響應類型
│   │   ├── models.ts                # 數據模型類型
│   │   └── common.ts                # 通用類型
│   │
│   ├── utils/                       # 工具函數
│   │   ├── format.ts                # 格式化函數
│   │   ├── validation.ts            # 驗證函數
│   │   ├── date.ts                  # 日期處理
│   │   ├── storage.ts               # 本地存儲
│   │   └── constants.ts             # 常量定義
│   │
│   ├── config/                      # 配置文件
│   │   ├── theme.ts                 # 主題配置
│   │   ├── env.ts                   # 環境變量
│   │   └── menu.ts                  # 菜單配置
│   │
│   ├── App.tsx                      # 應用主組件
│   ├── main.tsx                     # 應用入口
│   └── vite-env.d.ts                # Vite 類型聲明
│
├── .env.development                 # 開發環境變量
├── .env.production                  # 生產環境變量
├── .eslintrc.json                   # ESLint 配置
├── .prettierrc                      # Prettier 配置
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置
├── tailwind.config.js               # Tailwind 配置
├── package.json
└── README.md
```

---

## 3. 核心模塊設計

### 3.1 認證模塊

#### authStore.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (username, password) => {
        // 實現登入邏輯
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
      refreshToken: async () => {
        // 實現刷新 Token 邏輯
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### ProtectedRoute.tsx
```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !requiredRole.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

---

### 3.2 API 服務層

#### client.ts
```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/config/env';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期，跳轉登入頁
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### memberService.ts
```typescript
import { apiClient } from '@/services/api/client';
import type {
  Member,
  MemberListParams,
  MemberListResponse,
  CreateMemberDTO
} from '../types';

export const memberService = {
  // 獲取會員列表
  getMembers: async (params: MemberListParams): Promise<MemberListResponse> => {
    return apiClient.get('/api/v1/members', { params });
  },

  // 獲取會員詳情
  getMemberById: async (id: number): Promise<Member> => {
    return apiClient.get(`/api/v1/members/${id}`);
  },

  // 創建會員
  createMember: async (data: CreateMemberDTO): Promise<Member> => {
    return apiClient.post('/api/v1/members', data);
  },

  // 更新會員
  updateMember: async (id: number, data: Partial<Member>): Promise<Member> => {
    return apiClient.put(`/api/v1/members/${id}`, data);
  },

  // 刪除會員
  deleteMember: async (id: number): Promise<void> => {
    return apiClient.delete(`/api/v1/members/${id}`);
  },

  // 添加標籤
  addTags: async (id: number, tagIds: number[]): Promise<void> => {
    return apiClient.post(`/api/v1/members/${id}/tags`, { tag_ids: tagIds });
  },

  // 移除標籤
  removeTag: async (id: number, tagId: number): Promise<void> => {
    return apiClient.delete(`/api/v1/members/${id}/tags/${tagId}`);
  },

  // 獲取消費記錄
  getConsumptionRecords: async (id: number, params: any) => {
    return apiClient.get(`/api/v1/members/${id}/consumption-records`, { params });
  },
};
```

---

### 3.3 React Query 集成

#### useMembers.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '../services/memberService';
import type { MemberListParams } from '../types';

export const useMembers = (params: MemberListParams) => {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => memberService.getMembers(params),
    keepPreviousData: true,
  });
};

export const useMemberDetail = (id: number) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMemberById(id),
    enabled: !!id,
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      memberService.updateMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};
```

---

### 3.4 路由配置

#### routes.config.ts
```typescript
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// 懶加載頁面
const MemberListPage = lazy(() => import('@/features/members/pages/MemberListPage'));
const MemberDetailPage = lazy(() => import('@/features/members/pages/MemberDetailPage'));
const CampaignListPage = lazy(() => import('@/features/campaigns/pages/CampaignListPage'));
const CreateCampaignPage = lazy(() => import('@/features/campaigns/pages/CreateCampaignPage'));
const TagManagementPage = lazy(() => import('@/features/tags/pages/TagManagementPage'));
const AutoResponsePage = lazy(() => import('@/features/autoResponses/pages/AutoResponsePage'));
const AnalyticsDashboard = lazy(() => import('@/features/analytics/pages/AnalyticsDashboard'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/campaigns" replace />,
      },
      {
        path: 'campaigns',
        children: [
          { index: true, element: <CampaignListPage /> },
          { path: 'create', element: <CreateCampaignPage /> },
          { path: ':id/edit', element: <CreateCampaignPage /> },
        ],
      },
      {
        path: 'members',
        children: [
          { index: true, element: <MemberListPage /> },
          { path: ':id', element: <MemberDetailPage /> },
        ],
      },
      {
        path: 'tags',
        element: <TagManagementPage />,
      },
      {
        path: 'auto-responses',
        element: <AutoResponsePage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsDashboard />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
```

---

### 3.5 組件設計示例

#### MemberList 組件
```typescript
import React from 'react';
import { Table, Tag, Space, Button, Input } from 'antd';
import { SearchOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons';
import { useMembers } from '../hooks/useMembers';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { Member } from '../types';

export const MemberList: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, handlePageChange } = usePagination();

  const { data, isLoading } = useMembers({
    search: debouncedSearch,
    page,
    page_size: pageSize,
  });

  const columns = [
    {
      title: '會員資訊',
      key: 'member',
      render: (record: Member) => (
        <Space>
          <Avatar src={record.line_picture_url}>
            {record.last_name?.charAt(0)}
          </Avatar>
          <div>
            <div>{`${record.last_name}${record.first_name}`}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              LINE: {record.line_display_name}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '電子信箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手機號碼',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: any[]) => (
        <>
          {tags.map((tag) => (
            <Tag
              key={tag.id}
              color={tag.type === 'member' ? 'blue' : 'orange'}
            >
              {tag.name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '建立時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('zh-TW'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Member) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/members/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<MessageOutlined />}
            onClick={() => handleChat(record.id)}
          >
            聊天
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜尋姓名、Email、手機號碼"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.data?.items || []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.data?.total || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 位會員`,
        }}
        rowKey="id"
      />
    </div>
  );
};
```

---

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

## 5. 樣式方案

### 5.1 設計系統

#### 顏色系統
```css
/* variables.css */
:root {
  /* 主色 */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-primary-light: #DBEAFE;

  /* 中性色 */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-600: #6B7280;
  --color-gray-900: #1F2937;

  /* 語義色 */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* 文字 */
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-disabled: #9CA3AF;

  /* 背景 */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;

  /* 邊框 */
  --border-color: #E5E7EB;
  --border-radius: 8px;

  /* 陰影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

#### 字體系統
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                 'Microsoft JhengHei', sans-serif;

  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
}
```

### 5.2 Ant Design 主題配置

```typescript
// theme.ts
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#3B82F6',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#3B82F6',
    borderRadius: 8,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif',
  },
  components: {
    Button: {
      controlHeight: 40,
      fontSize: 14,
    },
    Table: {
      headerBg: '#F9FAFB',
      borderColor: '#E5E7EB',
    },
  },
};
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
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['echarts', 'echarts-for-react'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

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
# 或使用 pnpm
# pnpm install

# 2. 構建生產版本
npm run build

# 3. 預覽構建結果（可選）
npm run preview

# 4. 部署到靜態服務器（如 Nginx）
# dist/ 目錄內容複製到服務器
```

### 9.4 Nginx 配置

```nginx
server {
    listen 80;
    server_name crm.hotel.com;

    root /var/www/hotel-crm/dist;
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
        proxy_pass http://backend:8000;
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

### A. 腳本命令

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit"
  }
}
```

### B. 依賴包列表

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.3",
    "antd": "^5.27.4",
    "@ant-design/icons": "^6.1.0",
    "zustand": "^5.0.8",
    "@tanstack/react-query": "^5.90.2",
    "react-hook-form": "^7.64.0",
    "axios": "^1.12.2",
    "dayjs": "^1.11.18"
  },
  "devDependencies": {
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.9",
    "@types/node": "^24.7.0",
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "~5.9.3",
    "vite": "^7.1.7",
    "eslint": "^9.36.0",
    "@eslint/js": "^9.36.0",
    "typescript-eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.22",
    "globals": "^16.4.0"
  }
}
```

**注意**: 本項目暫未使用圖表庫 (echarts, echarts-for-react)、測試框架 (vitest, @testing-library/react)、代碼格式化工具 (prettier)、Tailwind CSS。這些可根據需求後續添加。

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

**文檔版本**: v1.3
**最後更新**: 2025-10-15
**維護者**: 前端開發團隊
**變更說明**:
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
