# 🚀 快速开始指南

欢迎使用重构后的标签管理系统！本指南将帮助你快速了解新的架构和开发方式。

---

## 📦 项目结构

```
/
├── components/              # React 组件
│   ├── common/             # ✨ 共享组件库（新增）
│   │   ├── Breadcrumb.tsx  # 面包屑组件
│   │   └── Containers.tsx  # 容器组件库
│   ├── ui/                 # shadcn/ui 组件
│   ├── MessageList.tsx     # 活动与讯息推播
│   ├── AutoReply.tsx       # 自动回应
│   ├── ChatRoom.tsx        # 聊天室
│   ├── Sidebar.tsx         # ✨ 统一侧边栏（新增）
│   └── ...
│
├── contexts/               # ✨ Context API（新增）
│   ├── NavigationContext.tsx  # 路由管理
│   ├── AppStateContext.tsx    # UI 状态
│   ├── DataContext.tsx        # 数据管理
│   └── AppProviders.tsx       # 统一 Provider
│
├── types/                  # ✨ 类型定义（新增）
│   └── member.ts           # 会员类型系统
│
├── imports/                # Figma 导入的组件
│   ├── MainContainer*.tsx  # 各个页面容器
│   └── ...
│
├── App.tsx                 # ✨ 主应用（已更新）
│
└── 📚 文档/
    ├── CONTEXT_USAGE_GUIDE.md        # Context 使用指南
    ├── CONTEXT_REFACTOR_CHECKLIST.md # 重构检查清单
    ├── IMPORTS_CLEANUP_PLAN.md       # imports 清理计划
    └── REFACTORING_SUMMARY.md        # 重构总结
```

---

## 🎯 核心概念

### 1. Context API - 状态管理

**不再需要 prop drilling！** 所有全局状态都通过 Context 管理。

```typescript
// ❌ 之前：层层传递 props
<Parent onNavigate={handleNavigate}>
  <Child onNavigate={handleNavigate}>
    <GrandChild onNavigate={handleNavigate} />
  </Child>
</Parent>

// ✅ 现在：直接使用 Context
import { useNavigate } from './contexts/NavigationContext';

function GrandChild() {
  const navigate = useNavigate();
  // 直接使用，无需 props！
}
```

### 2. 三大 Context

| Context | 用途 | Hook |
|---------|------|------|
| **NavigationContext** | 页面路由 | `useNavigation()` |
| **AppStateContext** | UI 状态 | `useAppState()` |
| **DataContext** | 应用数据 | `useData()` |

### 3. 共享组件库

所有可复用组件都在 `/components/common/` 中：

```typescript
// 使用共享容器
import { ScrollableTableContainer } from './components/common/Containers';

// 使用面包屑
import { SimpleBreadcrumb } from './components/common/Breadcrumb';
```

---

## 💻 快速示��

### 示例 1: 页面导航

```typescript
import { useNavigate } from './contexts/NavigationContext';

function MyComponent() {
  const navigate = useNavigate();

  return (
    <div>
      {/* 导航到会员详情 */}
      <button onClick={() => navigate('member-detail', { memberId: '123' })}>
        查看会员
      </button>

      {/* 导航到聊天室 */}
      <button onClick={() => navigate('chat-room', { memberId: '123' })}>
        打开聊天
      </button>
    </div>
  );
}
```

### 示例 2: 获取和修改数据

```typescript
import { useMembers } from './contexts/DataContext';

function MemberList() {
  const { members, updateMember, deleteMember } = useMembers();

  const handleEdit = (id: string, updates: any) => {
    updateMember(id, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除？')) {
      deleteMember(id);
    }
  };

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          <h3>{member.realName}</h3>
          <button onClick={() => handleEdit(member.id, { realName: '新名字' })}>
            编辑
          </button>
          <button onClick={() => handleDelete(member.id)}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 示例 3: 使用共享组件

```typescript
import { ScrollableTableContainer, TitleContainer } from './components/common/Containers';
import { SimpleBreadcrumb } from './components/common/Breadcrumb';

function MyPage() {
  return (
    <div>
      {/* 面包屑 */}
      <SimpleBreadcrumb 
        items={[
          { label: '首页', onClick: () => navigate('home') },
          { label: '会员管理', active: true }
        ]} 
      />

      {/* 标题 */}
      <TitleContainer title="会员管理" />

      {/* 滚动表格 */}
      <ScrollableTableContainer>
        <table>
          {/* 表格内容 */}
        </table>
      </ScrollableTableContainer>
    </div>
  );
}
```

---

## 🔧 常用操作

### 添加新页面

1. **在 NavigationContext 中添加页面类型**:
```typescript
// contexts/NavigationContext.tsx
export type Page = 
  | 'message-list'
  | 'your-new-page';  // ← 添加这里
```

2. **在 App.tsx 中添加路由**:
```typescript
// App.tsx
function AppContent() {
  const { currentPage } = useNavigation();

  switch (currentPage) {
    case 'your-new-page':
      return <YourNewPage />;
    // ...
  }
}
```

3. **创建页面组件**:
```typescript
// components/YourNewPage.tsx
import { useGoBack } from '../contexts/NavigationContext';

export default function YourNewPage() {
  const { goBack } = useGoBack();

  return (
    <div>
      <button onClick={goBack}>返回</button>
      <h1>Your New Page</h1>
    </div>
  );
}
```

### 添加新的数据类型

1. **在 DataContext 中定义类型**:
```typescript
// contexts/DataContext.tsx
export interface YourDataType {
  id: string;
  name: string;
  // ...
}
```

2. **添加状态和方法**:
```typescript
// 在 DataProvider 中
const [yourData, setYourData] = useState<YourDataType[]>([]);

const addYourData = (data: YourDataType) => {
  setYourData(prev => [...prev, data]);
};

// 在 value 中导出
const value = {
  // ...
  yourData,
  addYourData,
};
```

3. **创建便捷 Hook**:
```typescript
export function useYourData() {
  const { yourData, addYourData } = useData();
  return { yourData, addYourData };
}
```

---

## 📚 学习资源

### 必读文档

1. **[Context 使用指南](/CONTEXT_USAGE_GUIDE.md)** ⭐⭐⭐
   - Context API 完整教程
   - 所有 Hook 的详细说明
   - 实用示例

2. **[重构总结](/REFACTORING_SUMMARY.md)** ⭐⭐
   - 了解项目架构
   - 查看已完成的工作
   - 了解未来计划

3. **[重构检查清单](/CONTEXT_REFACTOR_CHECKLIST.md)** ⭐
   - 组件重构步骤
   - 测试清单

### 可选文档

- **[imports 清理计划](/IMPORTS_CLEANUP_PLAN.md)** - 了解 imports 目录优化
- **[Breadcrumb 清理进度](/BREADCRUMB_CLEANUP_PROGRESS.md)** - 面包屑重构详情

---

## 🎨 开发工作流

### 1. 创建新组件

```typescript
// components/NewComponent.tsx
import { useNavigate } from '../contexts/NavigationContext';
import { useData } from '../contexts/DataContext';

export default function NewComponent() {
  const navigate = useNavigate();
  const { members } = useData();

  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
}
```

### 2. 使用共享组件

```typescript
import { 
  ScrollableTableContainer,
  TitleContainer 
} from '../components/common/Containers';

import { SimpleBreadcrumb } from '../components/common/Breadcrumb';
```

### 3. 测试组件

1. 功能测试 - 确保所有功能正常
2. UI 测试 - 检查样式和布局
3. 性能测试 - 确认没有性能问题

---

## ⚡ 性能优化提示

### 1. 避免不必要的重渲染

```typescript
// ❌ 不好：整个 Context
const everything = useData();

// ✅ 好：只获取需要的
const { members } = useMembers();
```

### 2. 使用 useCallback 和 useMemo

```typescript
import { useCallback, useMemo } from 'react';

const filteredMembers = useMemo(
  () => members.filter(m => m.tags.includes('VIP')),
  [members]
);

const handleClick = useCallback(
  (id: string) => {
    navigate('member-detail', { memberId: id });
  },
  [navigate]
);
```

### 3. 拆分大组件

```typescript
// ❌ 不好：一个巨大的组件
function HugeComponent() {
  // 500 行代码...
}

// ✅ 好：拆分成小组件
function ParentComponent() {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
}
```

---

## 🐛 常见问题

### Q1: "useNavigation must be used within a NavigationProvider" 错误

**A**: 确保组件被 `AppProviders` 包裹：

```typescript
// App.tsx
import { AppProviders } from './contexts/AppProviders';

export default function App() {
  return (
    <AppProviders>
      <YourComponent />  {/* ← 必须在 AppProviders 内部 */}
    </AppProviders>
  );
}
```

### Q2: 如何在 Context 外部使用数据？

**A**: 不应该在 Context 外部使用。如果真的需要：
- 考虑是否可以重构组件结构
- 或者将该组件移到 AppProviders 内部

### Q3: 为什么我的组件重新渲染太频繁？

**A**: 可能是使用了整个 Context。解决方法：

```typescript
// ❌ 会导致所有数据变化都重渲染
const { members, messages, autoReplies } = useData();

// ✅ 只订阅需要的数据
const { members } = useMembers();
```

### Q4: 如何在非组件中使用 Context？

**A**: 不能直接使用。解决方案：
- 将逻辑移到组件中
- 或创建一个服务层，通过参数传递数据

---

## 🎯 最佳实践

### DO ✅

1. **使用具体的 Hook** - `useMembers()` 而不是 `useData()`
2. **保持组件小而专注** - 每个组件只做一件事
3. **使用 TypeScript 类型** - 充分利用类型检查
4. **复用共享组件** - 不要重复创建相似组件
5. **编写清晰的代码** - 让别人能轻松理解

### DON'T ❌

1. **不要 prop drilling** - 使用 Context 代替
2. **不要直接修改状态** - 使用提供的方法
3. **不要创建重复组件** - 检查 `/components/common/`
4. **不要忽略类型错误** - 修复所有 TypeScript 错误
5. **不要跳过测试** - 确保代码质量

---

## 🚀 下一步

1. **阅读** [Context 使用指南](/CONTEXT_USAGE_GUIDE.md)
2. **查看** 现有组件的实现（App.tsx）
3. **开始** 创建你的第一个使用 Context 的组件
4. **参与** 重构工作（查看 [重构检查清单](/CONTEXT_REFACTOR_CHECKLIST.md)）

---

## 💬 需要帮助？

- 📖 查看文档（`/CONTEXT_USAGE_GUIDE.md` 等）
- 💡 查看示例代码（App.tsx）
- 🤝 联系开发团队

---

**欢迎来到新的��发体验！** 🎉

使用 Context API 和共享组件库，你会发现开发变得更加高效和愉快。

---

**文档版本**: v1.0  
**最后更新**: 2024-11-08  
**维护者**: 开发团队
