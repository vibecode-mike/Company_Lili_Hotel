/**
 * 路由配置
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import MemberListPage from '@/features/members/pages/MemberListPage';
import MemberDetailPage from '@/features/members/pages/MemberDetailPage';
import CampaignListPage from '@/features/campaigns/pages/CampaignListPage';
import CampaignCreatePage from '@/features/campaigns/pages/CampaignCreatePage';
import SurveyListPage from '@/features/surveys/pages/SurveyListPage';
import SurveyCreatePage from '@/features/surveys/pages/SurveyCreatePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/campaigns" replace />,
      },
      {
        path: 'members',
        element: <MemberListPage />,
      },
      {
        path: 'campaigns',
        element: <CampaignListPage />,
      },
      {
        path: 'campaigns/create',
        element: <CampaignCreatePage />,
      },
      {
        path: 'surveys',
        element: <SurveyListPage />,
      },
      {
        path: 'surveys/create',
        element: <SurveyCreatePage />,
      },
      {
        path: 'tags',
        element: <div>標籤管理頁面（開發中）</div>,
      },
      {
        path: 'tags/tracking',
        element: <div>標籤追蹤頁面（開發中）</div>,
      },
      {
        path: 'messages',
        element: <div>訊息記錄頁面（開發中）</div>,
      },
      {
        path: 'messages/:id',
        element: <div>聊天頁面（開發中）</div>,
      },
      {
        path: 'members/:id',
        element: <MemberDetailPage />,
      },
      {
        path: 'auto-responses',
        element: <div>自動回應頁面（開發中）</div>,
      },
      {
        path: 'analytics',
        element: <div>數據分析頁面（開發中）</div>,
      },
      {
        path: 'settings',
        element: <div>系統設定頁面（開發中）</div>,
      },
      {
        path: '*',
        element: <div style={{ padding: '48px', textAlign: 'center' }}>
          <h2>404 - 頁面不存在</h2>
          <p>您訪問的頁面不存在，請檢查 URL 或返回首頁。</p>
        </div>,
      },
    ],
  },
]);
