# Context API 使用指南

## 📋 概述

系统现在使用 Context API 来管理全局状态，完全消除了 prop drilling 问题。

---

## 🏗️ Context 架构

### 三个核心 Context

1. **NavigationContext** - 路由和导航管理
2. **AppStateContext** - UI 状态管理
3. **DataContext** - 应用数据管理

### AppProviders - 统一的 Provider 组合

所有 Context 都通过 `AppProviders` 统一提供，在 `App.tsx` 中包裹整个应用：

```typescript
import { AppProviders } from "./contexts/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
```

---

## 🧭 1. NavigationContext - 路由管理

### 功能

- 页面导航（无需 prop drilling）
- 导航历史管理
- 页面参数传递

### 页面类型

```typescript
type Page = 
  | 'message-list'        // 活动与讯息推播
  | 'auto-reply'          // 自动回应
  | 'member-management'   // 会员管理
  | 'member-detail'       // 会员详情
  | 'chat-room'           // 聊天室
  | 'flex-editor';        // LINE Flex Message 编辑器
```

### Hooks

#### `useNavigation()` - 完整的导航功能

```typescript
import { useNavigation } from './contexts/NavigationContext';

function MyComponent() {
  const { 
    currentPage,    // 当前页面
    params,         // 导航参数
    navigate,       // 导航到指定页面
    goBack,         // 返回上一页
    canGoBack,      // 是否可以返回
    history,        // 导航历史
    reset           // 重置导航状态
  } = useNavigation();

  // 导航到会员详情页
  const viewMemberDetail = (memberId: string) => {
    navigate('member-detail', { memberId });
  };

  // 返回上一页
  const handleBack = () => {
    goBack();
  };

  return (
    <div>
      <button onClick={handleBack} disabled={!canGoBack}>
        返回
      </button>
    </div>
  );
}
```

#### 便捷 Hooks

```typescript
// 只获取当前页面
import { useCurrentPage } from './contexts/NavigationContext';
const currentPage = useCurrentPage();

// 只获取导航函数
import { useNavigate } from './contexts/NavigationContext';
const navigate = useNavigate();

// 只获取返回功能
import { useGoBack } from './contexts/NavigationContext';
const { goBack, canGoBack } = useGoBack();
```

### 使用示例

#### 在列表页添加"创建消息"按钮

```typescript
// components/MessageList.tsx
import { useNavigate } from './contexts/NavigationContext';

export default function MessageList() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('flex-editor')}>
      建立訊息
    </button>
  );
}
```

#### 在详情页添加返回按钮

```typescript
// imports/MainContainer-6001-3170.tsx
import { useGoBack } from './contexts/NavigationContext';

export default function MainContainer() {
  const { goBack, canGoBack } = useGoBack();

  return (
    <button onClick={goBack} disabled={!canGoBack}>
      返回
    </button>
  );
}
```

#### 带参数的导航

```typescript
// components/MemberList.tsx
import { useNavigate } from './contexts/NavigationContext';

export default function MemberList() {
  const navigate = useNavigate();

  const handleViewDetail = (memberId: string) => {
    navigate('member-detail', { memberId });
  };

  const handleOpenChat = (memberId: string) => {
    navigate('chat-room', { memberId });
  };

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          <button onClick={() => handleViewDetail(member.id)}>
            查看详情
          </button>
          <button onClick={() => handleOpenChat(member.id)}>
            打开聊天
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### 获取导航参数

```typescript
// imports/MainContainer-6001-3170.tsx
import { useNavigation } from './contexts/NavigationContext';
import { useData } from './contexts/DataContext';

export default function MemberDetail() {
  const { params } = useNavigation();
  const { getMemberById } = useData();

  // 从导航参数获取会员 ID
  const memberId = params.memberId;
  
  // 从数据 Context 获取会员信息
  const member = memberId ? getMemberById(memberId) : undefined;

  if (!member) {
    return <div>会员不存在</div>;
  }

  return (
    <div>
      <h1>{member.realName}</h1>
      {/* ... */}
    </div>
  );
}
```

---

## 🎨 2. AppStateContext - UI 状态管理

### 功能

- 侧边栏状态
- 主题切换（亮色/暗色）
- 用户信息
- 模态框管理
- 全局搜索
- 项目选择（批量操作）

### Hooks

#### `useAppState()` - 完整的 UI 状态

```typescript
import { useAppState } from './contexts/AppStateContext';

function MyComponent() {
  const {
    // 侧边栏
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    
    // 主题
    theme,
    setTheme,
    toggleTheme,
    
    // 用户
    user,
    setUser,
    
    // 加载状态
    isLoading,
    setIsLoading,
    
    // 模态框
    modals,
    openModal,
    closeModal,
    toggleModal,
    
    // 搜索
    searchQuery,
    setSearchQuery,
    
    // 选择
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    
    // 重置
    resetAppState
  } = useAppState();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      {/* 内容 */}
    </div>
  );
}
```

#### 便捷 Hooks

```typescript
// 侧边栏
import { useSidebar } from './contexts/AppStateContext';
const { sidebarOpen, toggleSidebar } = useSidebar();

// 主题
import { useTheme } from './contexts/AppStateContext';
const { theme, toggleTheme } = useTheme();

// 用户
import { useUser } from './contexts/AppStateContext';
const { user, setUser } = useUser();

// 模态框（为特定模态框）
import { useModal } from './contexts/AppStateContext';
const { isOpen, open, close, toggle } = useModal('member-tag-edit');

// 选择
import { useSelection } from './contexts/AppStateContext';
const { 
  selectedItems, 
  toggleSelection, 
  selectAll, 
  clearSelection,
  selectedCount,
  isSelected 
} = useSelection();
```

### 使用示例

#### 侧边栏切换

```typescript
// components/Sidebar.tsx
import { useSidebar } from './contexts/AppStateContext';

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <button onClick={toggleSidebar}>
        {sidebarOpen ? '收起' : '展开'}
      </button>
      {/* 侧边栏内容 */}
    </div>
  );
}
```

#### 主题切换

```typescript
// components/ThemeToggle.tsx
import { useTheme } from './contexts/AppStateContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 暗色模式' : '☀️ 亮色模式'}
    </button>
  );
}
```

#### 模态框管理

```typescript
// components/MemberTagEditButton.tsx
import { useModal } from './contexts/AppStateContext';

export default function MemberTagEditButton() {
  const modal = useModal('member-tag-edit');

  return (
    <>
      <button onClick={modal.open}>
        编辑标签
      </button>
      
      {modal.isOpen && (
        <MemberTagEditModal onClose={modal.close} />
      )}
    </>
  );
}
```

#### 批量选择

```typescript
// components/MemberList.tsx
import { useSelection } from './contexts/AppStateContext';
import { useMembers } from './contexts/DataContext';

export default function MemberList() {
  const { members } = useMembers();
  const { 
    selectedItems, 
    toggleSelection, 
    selectAll, 
    clearSelection,
    selectedCount,
    isSelected 
  } = useSelection();

  const handleSelectAll = () => {
    selectAll(members.map(m => m.id));
  };

  return (
    <div>
      <div>
        <button onClick={handleSelectAll}>全选</button>
        <button onClick={clearSelection}>清除选择</button>
        <span>已选择 {selectedCount} 项</span>
      </div>
      
      {members.map(member => (
        <div key={member.id}>
          <input
            type="checkbox"
            checked={isSelected(member.id)}
            onChange={() => toggleSelection(member.id)}
          />
          <span>{member.realName}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 💾 3. DataContext - 应用数据管理

### 功能

- 会员数据 CRUD
- 消息数据 CRUD
- 自动回复 CRUD
- 标签管理
- 数据统计

### 数据类型

```typescript
// 会员
interface Member {
  id: string;
  username: string;
  realName: string;
  tags: string[];
  phone: string;
  email: string;
  createTime: string;
  lastChatTime: string;
  avatar?: string;
}

// 消息
interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: 'LINE' | 'Facebook' | 'Instagram';
  status: '已排程' | '草稿' | '已發送';
  recipientCount: number;
  openCount: number;
  clickCount: number;
  sendTime: string;
  createdAt: string;
  updatedAt: string;
  content?: any;
}

// 自动回复
interface AutoReply {
  id: string;
  keyword: string;
  replyType: '文字' | '圖文' | 'Flex Message';
  replyContent: string;
  enabled: boolean;
  matchType: '完全符合' | '包含關鍵字';
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Hooks

#### `useData()` - 完整的数据访问

```typescript
import { useData } from './contexts/DataContext';

function MyComponent() {
  const {
    // 会员
    members,
    setMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    
    // 消息
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    getMessageById,
    
    // 自动回复
    autoReplies,
    setAutoReplies,
    addAutoReply,
    updateAutoReply,
    deleteAutoReply,
    getAutoReplyById,
    toggleAutoReply,
    
    // 标签
    allTags,
    addTag,
    removeTag,
    
    // 统计
    stats,
    
    // 重置
    resetAllData
  } = useData();

  return <div>{/* 内容 */}</div>;
}
```

#### 便捷 Hooks

```typescript
// 会员
import { useMembers } from './contexts/DataContext';
const { members, addMember, updateMember, deleteMember, getMemberById } = useMembers();

// 消息
import { useMessages } from './contexts/DataContext';
const { messages, addMessage, updateMessage, deleteMessage, getMessageById } = useMessages();

// 自动回复
import { useAutoReplies } from './contexts/DataContext';
const { autoReplies, addAutoReply, updateAutoReply, deleteAutoReply, toggleAutoReply } = useAutoReplies();

// 标签
import { useTags } from './contexts/DataContext';
const { allTags, addTag, removeTag } = useTags();

// 统计
import { useStats } from './contexts/DataContext';
const stats = useStats();
```

### 使用示例

#### 显示会员列表

```typescript
// components/MemberList.tsx
import { useMembers } from './contexts/DataContext';

export default function MemberList() {
  const { members, deleteMember } = useMembers();

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此会员吗？')) {
      deleteMember(id);
    }
  };

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          <h3>{member.realName}</h3>
          <p>{member.email}</p>
          <button onClick={() => handleDelete(member.id)}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### 添加新会员

```typescript
// components/AddMemberForm.tsx
import { useMembers } from './contexts/DataContext';
import { useState } from 'react';

export default function AddMemberForm() {
  const { addMember } = useMembers();
  const [formData, setFormData] = useState({
    username: '',
    realName: '',
    phone: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMember = {
      id: `member-${Date.now()}`,
      ...formData,
      tags: [],
      createTime: new Date().toISOString(),
      lastChatTime: new Date().toISOString(),
    };
    
    addMember(newMember);
    
    // 重置表单
    setFormData({
      username: '',
      realName: '',
      phone: '',
      email: '',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="用户名"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      <input
        placeholder="真实姓名"
        value={formData.realName}
        onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
      />
      <input
        placeholder="电话"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      <input
        placeholder="邮箱"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <button type="submit">添加会员</button>
    </form>
  );
}
```

#### 编辑会员信息

```typescript
// components/EditMemberForm.tsx
import { useMembers } from './contexts/DataContext';
import { useState, useEffect } from 'react';

export default function EditMemberForm({ memberId }: { memberId: string }) {
  const { getMemberById, updateMember } = useMembers();
  const member = getMemberById(memberId);
  
  const [formData, setFormData] = useState({
    username: member?.username || '',
    realName: member?.realName || '',
    phone: member?.phone || '',
    email: member?.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(memberId, formData);
  };

  if (!member) {
    return <div>会员不存在</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      {/* 其他字段... */}
      <button type="submit">保存</button>
    </form>
  );
}
```

#### 显示统计信息

```typescript
// components/StatsDashboard.tsx
import { useStats } from './contexts/DataContext';

export default function StatsDashboard() {
  const stats = useStats();

  return (
    <div>
      <div>
        <h3>总会员数</h3>
        <p>{stats.totalMembers}</p>
      </div>
      <div>
        <h3>总消息数</h3>
        <p>{stats.totalMessages}</p>
      </div>
      <div>
        <h3>自动回复</h3>
        <p>{stats.activeAutoReplies} / {stats.totalAutoReplies}</p>
      </div>
    </div>
  );
}
```

#### 标签管理

```typescript
// components/TagManager.tsx
import { useTags } from './contexts/DataContext';

export default function TagManager() {
  const { allTags, addTag, removeTag } = useTags();
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div>
      <div>
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="新标签"
        />
        <button onClick={handleAdd}>添加</button>
      </div>
      
      <div>
        {allTags.map(tag => (
          <div key={tag}>
            <span>{tag}</span>
            <button onClick={() => removeTag(tag)}>删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔄 组合使用多个 Context

大多数组件会同时使用多个 Context：

```typescript
// components/MemberDetailPage.tsx
import { useNavigation } from './contexts/NavigationContext';
import { useMembers } from './contexts/DataContext';
import { useModal } from './contexts/AppStateContext';

export default function MemberDetailPage() {
  // 导航
  const { params, goBack } = useNavigation();
  
  // 数据
  const { getMemberById, updateMember } = useMembers();
  
  // UI 状态
  const editModal = useModal('member-edit');

  // 获取会员数据
  const member = params.memberId ? getMemberById(params.memberId) : undefined;

  if (!member) {
    return (
      <div>
        <button onClick={goBack}>返回</button>
        <p>会员不存在</p>
      </div>
    );
  }

  const handleSave = (updates: Partial<Member>) => {
    updateMember(member.id, updates);
    editModal.close();
  };

  return (
    <div>
      <button onClick={goBack}>返回</button>
      <h1>{member.realName}</h1>
      <button onClick={editModal.open}>编辑</button>
      
      {editModal.isOpen && (
        <EditMemberModal
          member={member}
          onSave={handleSave}
          onClose={editModal.close}
        />
      )}
    </div>
  );
}
```

---

## 📈 优势总结

### 之前（Prop Drilling）

```typescript
// App.tsx
<MessageList 
  onNavigate={handleNavigate} 
  onOpenMemberDetail={handleOpenMemberDetail}
  onOpenChat={handleOpenChat}
  members={members}
  onUpdateMember={handleUpdateMember}
  sidebarOpen={sidebarOpen}
  onToggleSidebar={handleToggleSidebar}
  // ... 10+ props
/>

// MessageList.tsx
function MessageList({ 
  onNavigate, 
  onOpenMemberDetail, 
  onOpenChat,
  members,
  onUpdateMember,
  sidebarOpen,
  onToggleSidebar,
  // ... 10+ props 
}) {
  // 需要将这些 props 继续传递给子组件...
  return <MemberCard 
    onOpenDetail={onOpenMemberDetail}
    onOpenChat={onOpenChat}
    onUpdate={onUpdateMember}
    // ...
  />;
}
```

### 现在（Context API）

```typescript
// App.tsx
<AppProviders>
  <MessageList />
</AppProviders>

// MessageList.tsx
import { useNavigation } from './contexts/NavigationContext';
import { useMembers } from './contexts/DataContext';

function MessageList() {
  // 直接获取需要的功能，无需 props
  const { navigate } = useNavigation();
  const { members, updateMember } = useMembers();

  return <MemberCard />;
}

// MemberCard.tsx
import { useNavigation } from './contexts/NavigationContext';

function MemberCard({ member }) {
  // 子组件也可以直接访问
  const { navigate } = useNavigation();
  
  return (
    <button onClick={() => navigate('member-detail', { memberId: member.id })}>
      查看详情
    </button>
  );
}
```

### 好处

✅ **消除 prop drilling** - 不再需要通过多层组件传递 props  
✅ **代码更简洁** - 组件只声明它真正需要的数据  
✅ **易于维护** - 修改状态结构不需要更新所有组件  
✅ **类型安全** - TypeScript 提供完整的类型检查  
✅ **性能优化** - 只有使用的组件会在数据变化时重新渲染  
✅ **便于测试** - 可以为测试提供 mock Context  

---

## 🚀 下一步重构建议

### 1. 更新 MessageList.tsx

移除所有 props，使用 Context：

```typescript
// 之前
export default function MessageList({ 
  onCreateMessage, 
  onNavigateToAutoReply 
}: { 
  onCreateMessage?: () => void;
  onNavigateToAutoReply?: () => void;
}) {
  // ...
}

// 之后
import { useNavigate } from './contexts/NavigationContext';

export default function MessageList() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('flex-editor')}>
      建立訊息
    </button>
  );
}
```

### 2. 更新 AutoReply.tsx

```typescript
// 之前
export default function AutoReply({
  onBack,
  onNavigateToMessages,
  onNavigateToMembers
}: AutoReplyProps) {
  // ...
}

// 之后
import { useGoBack, useNavigate } from './contexts/NavigationContext';

export default function AutoReply() {
  const { goBack } = useGoBack();
  const navigate = useNavigate();
  
  return (
    <>
      <button onClick={goBack}>返回</button>
      <button onClick={() => navigate('message-list')}>
        消息列表
      </button>
      <button onClick={() => navigate('member-management')}>
        会员管理
      </button>
    </>
  );
}
```

### 3. 更新 ChatRoom.tsx

```typescript
// 之前
export default function ChatRoom({ 
  member, 
  onBack 
}: { 
  member?: Member; 
  onBack?: () => void 
}) {
  // ...
}

// 之后
import { useNavigation } from './contexts/NavigationContext';
import { useMembers } from './contexts/DataContext';

export default function ChatRoom() {
  const { params, goBack } = useNavigation();
  const { getMemberById } = useMembers();
  
  const member = params.memberId ? getMemberById(params.memberId) : undefined;
  
  return (
    <>
      <button onClick={goBack}>返回</button>
      {member && <h1>{member.realName}</h1>}
    </>
  );
}
```

### 4. 更新所有 MainContainer 文件

所有 `MainContainer-*.tsx` 文件都可以移除 props，直接使用 Context。

---

## 📚 相关文档

- `/contexts/NavigationContext.tsx` - 导航 Context 实现
- `/contexts/AppStateContext.tsx` - UI 状态 Context 实现
- `/contexts/DataContext.tsx` - 数据 Context 实现
- `/contexts/AppProviders.tsx` - Provider 组合
- `/App.tsx` - Context 集成示例

---

**更新时间**: 2024-11-08  
**状态**: ✅ Context 系统已完成  
**下一步**: 逐步重构组件，移除 prop drilling
