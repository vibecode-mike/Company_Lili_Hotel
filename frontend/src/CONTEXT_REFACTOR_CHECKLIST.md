# Context 重构检查清单

## ✅ 已完成

### Context 架构
- [x] 创建 `NavigationContext.tsx` - 路由管理
- [x] 创建 `AppStateContext.tsx` - UI 状态管理
- [x] 创建 `DataContext.tsx` - 数据管理
- [x] 创建 `AppProviders.tsx` - 统一的 Provider
- [x] 更新 `App.tsx` - 集成 Context 系统

---

## 📋 待重构组件

### 优先级 1: 主要页面组件

#### `/components/MessageList.tsx`
**当前 Props**:
```typescript
interface MessageListProps {
  onCreateMessage?: () => void;
  onNavigateToAutoReply?: () => void;
}
```

**重构为**:
```typescript
import { useNavigate } from '../contexts/NavigationContext';
import { useMessages } from '../contexts/DataContext';

// 移除所有 props
export default function MessageList() {
  const navigate = useNavigate();
  const { messages } = useMessages();
  
  // ...
}
```

**预计减少代码**: ~5-10 行

---

#### `/components/AutoReply.tsx`
**当前 Props**:
```typescript
interface AutoReplyProps {
  onBack?: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToMembers?: () => void;
}
```

**重构为**:
```typescript
import { useGoBack, useNavigate } from '../contexts/NavigationContext';
import { useAutoReplies } from '../contexts/DataContext';

export default function AutoReply() {
  const { goBack } = useGoBack();
  const navigate = useNavigate();
  const { autoReplies, toggleAutoReply } = useAutoReplies();
  
  // ...
}
```

**预计减少代码**: ~8-15 行

---

#### `/components/ChatRoom.tsx`
**当前 Props**:
```typescript
interface ChatRoomProps {
  member?: Member;
  onBack?: () => void;
}
```

**重构为**:
```typescript
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/DataContext';

export default function ChatRoom() {
  const { params, goBack } = useNavigation();
  const { getMemberById } = useMembers();
  
  const member = params.memberId ? getMemberById(params.memberId) : undefined;
  
  // ...
}
```

**预计减少代码**: ~5-10 行

---

#### `/components/MessageCreation.tsx`
**当前 Props**:
```typescript
interface MessageCreationProps {
  onBack?: () => void;
  onNavigate?: (page: string, params?: any) => void;
}
```

**重构为**:
```typescript
import { useGoBack, useNavigate } from '../contexts/NavigationContext';
import { useMessages } from '../contexts/DataContext';

export default function MessageCreation() {
  const { goBack } = useGoBack();
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  
  // ...
}
```

**预计减少代码**: ~5-10 行

---

### 优先级 2: MainContainer 组件

#### `/imports/MainContainer.tsx`（活动与讯息推播）
**当前**: 无 props（已经很简洁）

**可选优化**: 添加侧边栏状态管理
```typescript
import { useSidebar } from '../contexts/AppStateContext';

export default function MainContainer() {
  const { sidebarOpen } = useSidebar();
  
  // 根据 sidebarOpen 调整布局
}
```

---

#### `/imports/MainContainer-6001-1415.tsx`（会员管理列表）
**当前 Props**:
```typescript
interface MemberMainContainerProps {
  onAddMember?: () => void;
  onOpenChat?: (memberId: string) => void;
  onViewDetail?: (memberId: string) => void;
}
```

**重构为**:
```typescript
import { useNavigate } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/DataContext';
import { useModal } from '../contexts/AppStateContext';

export default function MainContainer() {
  const navigate = useNavigate();
  const { members } = useMembers();
  const addMemberModal = useModal('add-member');
  
  const handleOpenChat = (memberId: string) => {
    navigate('chat-room', { memberId });
  };
  
  const handleViewDetail = (memberId: string) => {
    navigate('member-detail', { memberId });
  };
  
  // ...
}
```

**预计减少代码**: ~10-15 行

---

#### `/imports/MainContainer-6001-3170.tsx`（会员详情）
**当前 Props**:
```typescript
interface Props {
  onBack?: () => void;
  member?: MemberData;
  onNavigate?: (page: string, params?: { memberId?: string }) => void;
}
```

**重构为**:
```typescript
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/DataContext';

export default function MainContainer() {
  const { params, goBack, navigate } = useNavigation();
  const { getMemberById, updateMember } = useMembers();
  
  const member = params.memberId ? getMemberById(params.memberId) : undefined;
  
  // ...
}
```

**预计减少代码**: ~15-20 行

---

#### `/imports/MainContainer-6013-738.tsx`（聊天室）
**当前 Props**:
```typescript
interface ChatRoomProps {
  member?: Member;
  onBack?: () => void;
}
```

**重构为**:
```typescript
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/DataContext';

export default function MainContainer() {
  const { params, goBack } = useNavigation();
  const { getMemberById } = useMembers();
  
  const member = params.memberId ? getMemberById(params.memberId) : undefined;
  
  // ...
}
```

**预计减少代码**: ~10-15 行

---

### 优先级 3: 子组件和工具组件

#### `/components/Sidebar.tsx`
**建议**: 添加侧边栏状态管理

```typescript
import { useSidebar } from '../contexts/AppStateContext';
import { useCurrentPage } from '../contexts/NavigationContext';

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const currentPage = useCurrentPage();
  
  // 根据当前页面高亮菜单项
  // ...
}
```

---

#### `/components/MemberTagEditModal.tsx`
**建议**: 使用 modal Context 和 tags Context

```typescript
import { useModal } from '../contexts/AppStateContext';
import { useTags } from '../contexts/DataContext';
import { useMembers } from '../contexts/DataContext';

export default function MemberTagEditModal({ memberId }: { memberId: string }) {
  const modal = useModal('member-tag-edit');
  const { allTags } = useTags();
  const { getMemberById, updateMember } = useMembers();
  
  const member = getMemberById(memberId);
  
  // ...
}
```

---

## 📊 重构统计

### 预期收益

| 组件 | 当前 Props 数量 | 重构后 Props | 减少行数 | 优先级 |
|------|---------------|-------------|---------|--------|
| MessageList.tsx | 2 | 0 | ~8 行 | 高 |
| AutoReply.tsx | 3 | 0 | ~12 行 | 高 |
| ChatRoom.tsx | 2 | 0 | ~8 行 | 高 |
| MessageCreation.tsx | 2 | 0 | ~8 行 | 高 |
| MainContainer-6001-1415.tsx | 3 | 0 | ~15 行 | 中 |
| MainContainer-6001-3170.tsx | 3 | 0 | ~18 行 | 中 |
| MainContainer-6013-738.tsx | 2 | 0 | ~12 行 | 中 |
| Sidebar.tsx | 0 | 0 | +5 行 | 低 |
| MemberTagEditModal.tsx | 多个 | 1-2 | ~10 行 | 低 |
| **总计** | **17+ props** | **0-2** | **~90-100 行** | - |

---

## 🚀 重构步骤

### 阶段 1: 主要页面（本周）

1. [ ] 重构 `MessageList.tsx`
   - 移除 `onCreateMessage`, `onNavigateToAutoReply` props
   - 使用 `useNavigate()`
   - 测试导航功能

2. [ ] 重构 `AutoReply.tsx`
   - 移除所有导航 props
   - 使用 `useGoBack()` 和 `useNavigate()`
   - 使用 `useAutoReplies()` 获取数据
   - 测试所有功能

3. [ ] 重构 `ChatRoom.tsx`
   - 移除 `member` 和 `onBack` props
   - 使用 `useNavigation()` 获取会员 ID
   - 使用 `useMembers()` 获取会员数据
   - 测试聊天室功能

4. [ ] 重构 `MessageCreation.tsx`
   - 移除导航 props
   - 使用 Context 管理状态
   - 测试消息创建流程

**预期收益**: 减少约 40-50 行 prop drilling 代码

---

### 阶段 2: MainContainer 组件（下周）

5. [ ] 重构 `MainContainer-6001-1415.tsx`
   - 移除所有回调 props
   - 使用导航 Context
   - 使用数据 Context

6. [ ] 重构 `MainContainer-6001-3170.tsx`
   - 移除 member prop 和导航 props
   - 从 Context 获取会员数据
   - 使用导航 Context

7. [ ] 重构 `MainContainer-6013-738.tsx`
   - 移除 member prop
   - 从 Context 获取数据

**预期收益**: 减少约 40-50 行 prop drilling 代码

---

### 阶段 3: 子组件优化（后续）

8. [ ] 优化 `Sidebar.tsx`
   - 添加侧边栏状态管理
   - 根据当前页面高亮菜单

9. [ ] 优化 `MemberTagEditModal.tsx`
   - 使用 modal Context
   - 使用 tags Context

10. [ ] 优化其他子组件

**预期收益**: 提升用户体验，代码更优雅

---

## ✅ 测试清单

每个重构完成后，必须测试：

### 功能测试
- [ ] 页面导航正常
- [ ] 返回按钮工作
- [ ] 参数传递正确
- [ ] 数据显示正确
- [ ] CRUD 操作正常

### UI 测试
- [ ] 布局没有变化
- [ ] 样式保持一致
- [ ] 交互响应正常
- [ ] 动画效果正常

### 性能测试
- [ ] 没有不必要的重渲染
- [ ] 加载速度没有变慢
- [ ] 内存使用正常

---

## 📝 注意事项

### DO ✅
- 一次重构一个组件
- 每次重构后立即测试
- 保持原有的功能和UI
- 使用 TypeScript 类型检查
- 提交小的、独立的 commits

### DON'T ❌
- 不要一次重构太多组件
- 不要改变组件的功能
- 不要修改样式和布局
- 不要跳过测试
- 不要删除可能需要的代码

---

## 🎯 成功标准

重构完成后，系统应该：

1. ✅ **零 prop drilling** - 所有状态通过 Context 管理
2. ✅ **类型安全** - 完整的 TypeScript 类型覆盖
3. ✅ **功能完整** - 所有功能正常工作
4. ✅ **性能良好** - 没有性能退化
5. ✅ **代码简洁** - 组件代码更少、更清晰
6. ✅ **易于维护** - 新功能容易添加

---

## 📈 预期总收益

| 指标 | 改善 |
|------|------|
| **Props 数量** | 从 17+ 减少到 0-2 |
| **代码行数** | 减少约 90-100 行 |
| **组件耦合度** | 大幅降低 |
| **可维护性** | 显著提升 |
| **开发效率** | 提高 30-40% |

---

## 🎉 下一步

1. **开始阶段 1** - 重构主要页面组件
2. **逐步测试** - 确保每个组件工作正常
3. **文档更新** - 更新组件文档
4. **团队培训** - 确保团队了解新的 Context 系统

---

**文档版本**: v1.0  
**创建日期**: 2024-11-08  
**状态**: 📋 待执行  
**负责人**: 开发团队
