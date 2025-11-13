import { AppProviders } from "./contexts/AppProviders";
import { useNavigation } from "./contexts/NavigationContext";
import { useData } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import Login from "./components/auth/Login";
import MessageList from "./components/MessageList";
import MessageCreation from "./components/MessageCreation";
import MainContainer from "./imports/MainContainer-6001-3170";
import MemberManagement from "./imports/MainContainer-6001-1415";
import ChatRoom from "./components/ChatRoom";
import AutoReply from "./components/AutoReply";
import LineApiSettings from "./components/LineApiSettings";
import { memberDataToMember } from "./types/member";
import { Toaster } from "./components/ui/sonner";
import { useState } from "react";
import Sidebar, { PageWithSidebar } from "./components/Sidebar";

/**
 * 会员管理页面包装器
 * 添加侧边栏布局
 */
function MemberManagementWithLayout({
  navigate,
  onAddMember,
  onOpenChat,
  onViewDetail
}: {
  navigate: (page: string, params?: any) => void;
  onAddMember: () => void;
  onOpenChat: (member: { id: string }) => void;
  onViewDetail: (member: { id: string }) => void;
}) {
  return (
    <PageWithSidebar
      currentPage="members"
      onNavigateToMessages={() => navigate('message-list')}
      onNavigateToAutoReply={() => navigate('auto-reply')}
      onNavigateToMembers={() => navigate('member-management')}
      onNavigateToSettings={() => navigate('line-api-settings')}
    >
      <MemberManagement
        onAddMember={onAddMember}
        onOpenChat={onOpenChat}
        onViewDetail={onViewDetail}
      />
    </PageWithSidebar>
  );
}

/**
 * 主应用内容组件
 * 使用 Context 来管理路由和状态，避免 prop drilling
 */
function AppContent() {
  const { currentPage, params, navigate, goBack } = useNavigation();
  const { getMemberById } = useData();
  const { isAuthenticated } = useAuth();

  // Check authentication status
  if (!isAuthenticated) {
    return <Login />;
  }

  // 根据当前页面渲染对应的组件
  switch (currentPage) {
    case 'message-list':
      return (
        <MessageList
          onCreateMessage={() => navigate('flex-editor')}
          onNavigateToAutoReply={() => navigate('auto-reply')}
          onNavigateToSettings={() => navigate('line-api-settings')}
        />
      );

    case 'flex-editor':
      return (
        <MessageCreation
          onBack={goBack}
          onNavigate={navigate}
        />
      );

    case 'auto-reply':
      return (
        <AutoReply
          onBack={goBack}
          onNavigateToMessages={() => navigate('message-list')}
          onNavigateToMembers={() => navigate('member-management')}
          onNavigateToSettings={() => navigate('line-api-settings')}
        />
      );

    case 'member-management':
      return (
        <MemberManagementWithLayout
          navigate={navigate}
          onAddMember={() => {
            // TODO: 打开新增会员模态框
          }}
          onOpenChat={(member) => {
            navigate('chat-room', { memberId: member.id });
          }}
          onViewDetail={(member) => {
            navigate('member-detail', { memberId: member.id });
          }}
        />
      );

    case 'member-detail': {
      // 从 Context 获取会员数据
      const member = params.memberId ? getMemberById(params.memberId) : undefined;

      // 转换为 MemberData 格式（如果需要）
      const memberData = member ? {
        id: member.id,
        username: member.username,
        realName: member.realName,
        tags: member.tags,
        phone: member.phone,
        email: member.email,
        createTime: member.createTime,
        lastChatTime: member.lastChatTime,
        status: 'active' as const,
      } : undefined;

      return (
        <PageWithSidebar
          currentPage="members"
          onNavigateToMessages={() => navigate('message-list')}
          onNavigateToAutoReply={() => navigate('auto-reply')}
          onNavigateToMembers={() => navigate('member-management')}
          onNavigateToSettings={() => navigate('line-api-settings')}
        >
          <MainContainer
            member={memberData}
            onBack={goBack}
            onNavigate={navigate}
          />
        </PageWithSidebar>
      );
    }

    case 'chat-room': {
      // 从 Context 获取会员数据
      const member = params.memberId ? getMemberById(params.memberId) : undefined;

      return (
        <PageWithSidebar
          currentPage="members"
          onNavigateToMessages={() => navigate('message-list')}
          onNavigateToAutoReply={() => navigate('auto-reply')}
          onNavigateToMembers={() => navigate('member-management')}
          onNavigateToSettings={() => navigate('line-api-settings')}
        >
          <ChatRoom
            member={member}
            onBack={goBack}
          />
        </PageWithSidebar>
      );
    }

    case 'line-api-settings':
      return (
        <LineApiSettings
          onBack={goBack}
          onNavigateToMessages={() => navigate('message-list')}
          onNavigateToAutoReply={() => navigate('auto-reply')}
          onNavigateToMembers={() => navigate('member-management')}
          onNavigateToSettings={() => navigate('line-api-settings')}
        />
      );

    default:
      return (
        <MemberManagementWithLayout
          navigate={navigate}
          onAddMember={() => {
            // TODO: 打开新增会员模态框
          }}
          onOpenChat={(member) => {
            navigate('chat-room', { memberId: member.id });
          }}
          onViewDetail={(member) => {
            navigate('member-detail', { memberId: member.id });
          }}
        />
      );
  }
}

/**
 * 主应用组件
 * 用 AppProviders 包裹所有内容，提供全局状态管理
 */
export default function App() {
  return (
    <AuthProvider>
      <AppProviders>
        <AppContent />
        <Toaster />
      </AppProviders>
    </AuthProvider>
  );
}