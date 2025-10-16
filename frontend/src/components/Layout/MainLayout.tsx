/**
 * 主布局組件
 */
import React from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';

const { Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    {
      key: 'broadcast',
      type: 'group',
      label: <div className="nav-section-title">群發訊息</div>,
      children: [
        {
          key: '/campaigns',
          icon: <span>📊</span>,
          label: '活動與訊息推播',
        },
        {
          key: '/campaigns/create',
          icon: <span>✉️</span>,
          label: '建立群發訊息',
        },
        {
          key: '/surveys',
          icon: <span>📋</span>,
          label: '問卷模板',
        },
      ],
    },
    {
      key: 'tags',
      type: 'group',
      label: <div className="nav-section-title">標籤管理</div>,
      children: [
        {
          key: '/tags',
          icon: <span>🏷️</span>,
          label: '標籤管理',
        },
        {
          key: '/tags/tracking',
          icon: <span>📈</span>,
          label: '標籤追蹤',
        },
      ],
    },
    {
      key: 'members',
      type: 'group',
      label: <div className="nav-section-title">會員管理</div>,
      children: [
        {
          key: '/members',
          icon: <span>👥</span>,
          label: '會員列表',
        },
        {
          key: '/messages',
          icon: <span>💬</span>,
          label: '訊息紀錄',
        },
      ],
    },
    {
      key: 'settings',
      type: 'group',
      label: <div className="nav-section-title">設定</div>,
      children: [
        {
          key: '/auto-responses',
          icon: <span>🤖</span>,
          label: '自動回應',
        },
        {
          key: '/analytics',
          icon: <span>📊</span>,
          label: '數據分析',
        },
        {
          key: '/settings',
          icon: <span>⚙️</span>,
          label: '系統設定',
        },
      ],
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout className="main-layout">
      <Sider width={240} className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#60A5FA"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">STARBIT</div>
            <div className="logo-subtitle">MARKETING</div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="sidebar-menu"
        />

        <div className="user-info">
          <div className="user-avatar">管</div>
          <span className="user-name">管理員</span>
        </div>
      </Sider>

      <Layout className="content-layout">
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
