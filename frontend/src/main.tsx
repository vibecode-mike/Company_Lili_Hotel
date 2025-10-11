import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import App from './App.tsx'
import 'antd/dist/reset.css'
import './styles/global.css'
import './index.css'

// Ant Design 主題配置
const antdTheme = {
  token: {
    colorPrimary: '#3B82F6',
    colorInfo: '#3B82F6',
    colorSuccess: '#059669',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorTextBase: '#1F2937',
    colorBgBase: '#FFFFFF',
    colorBorder: '#E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: '#FFFFFF',
      bodyBg: '#F8F9FA',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#EFF6FF',
      itemSelectedColor: '#3B82F6',
      itemHoverBg: '#F3F4F6',
      itemColor: '#4B5563',
    },
    Button: {
      primaryColor: '#FFFFFF',
      colorPrimary: '#1F2937',
      colorPrimaryHover: '#111827',
      borderRadius: 8,
      fontWeight: 600,
    },
    Input: {
      borderRadius: 8,
      colorBorder: '#D1D5DB',
      colorPrimaryHover: '#3B82F6',
    },
    Table: {
      headerBg: '#F9FAFB',
      headerColor: '#6B7280',
      borderColor: '#E5E7EB',
      rowHoverBg: '#F9FAFB',
      borderRadius: 12,
    },
    Tag: {
      defaultBg: '#EFF6FF',
      defaultColor: '#3B82F6',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={antdTheme} locale={zhTW}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
