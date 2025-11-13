# 共享容器组件使用指南

## 概述

为了消除代码重复，我们创建了一个共享的容器组件库 (`/components/common/Containers.tsx`)。这些组件提供了统一的布局容器，可在整个应用中重复使用。

## 重复问题分析

在重构前，以下容器组件在多个文件中重复定义：

### 1. TitleContainer
- **重复次数**: 8 个文件
- **文件列表**:
  - `/components/ChatRoom.tsx`
  - `/imports/MainContainer-6001-1415.tsx`
  - `/imports/MainContainer-6001-3170.tsx`
  - `/imports/MainContainer-6013-738.tsx`
  - `/imports/MainContainer.tsx`
  - `/imports/MainContent.tsx`
  - `/imports/MemberManagementInboxNormalState-8046-2742.tsx`
  - `/imports/MemberManagementInboxNormalState.tsx`

### 2. HeaderContainer
- **重复次数**: 10 个文件
- **文件列表**:
  - `/components/ChatRoom.tsx`
  - `/imports/MainContainer-6001-1415.tsx`
  - `/imports/MainContainer-6001-3170.tsx`
  - `/imports/MainContainer-6013-738.tsx`
  - `/imports/MainContainer.tsx`
  - `/imports/MainContent.tsx`
  - `/imports/MemberManagementInboxNormalState-8046-2742.tsx`
  - `/imports/MemberManagementInboxNormalState.tsx`
  - `/imports/PushMessage圖卡按鈕型-4-1916.tsx`
  - `/imports/251103會員管理MemberManagementV01.tsx`

### 3. ButtonContainer
- **重复次数**: 5 个文件
- **文件列表**:
  - `/imports/MemberTagModalFuzzySearchCreation.tsx`
  - `/imports/MemberTagModalNormal.tsx`
  - `/imports/PushMessage圖卡按鈕型-4-1916.tsx`

## 可用的共享容器组件

### 1. TitleContainer
**用途**: 包裹页面标题区域

**Props**:
- `children`: ReactNode - 标题内容
- `onBack?`: () => void - 可选的返回按钮回调

**示例**:
```tsx
import { TitleContainer } from './components/common/Containers';

// 无返回按钮
<TitleContainer>
  <h1>页面标题</h1>
</TitleContainer>

// 带返回按钮
<TitleContainer onBack={() => navigate(-1)}>
  <h1>页面标题</h1>
</TitleContainer>
```

### 2. HeaderContainer
**用途**: 包裹页面头部区域（标题+描述）

**Props**:
- `children`: ReactNode - 头部内容

**示例**:
```tsx
import { HeaderContainer, TitleContainer, DescriptionContainer } from './components/common/Containers';

<HeaderContainer>
  <TitleContainer>
    <h1>活动与讯息推播</h1>
  </TitleContainer>
  <DescriptionContainer>
    <p>建立单一图文或多页轮播内容，打造引人注目的品牌讯息</p>
  </DescriptionContainer>
</HeaderContainer>
```

### 3. DescriptionContainer
**用途**: 包裹页面描述文本

**Props**:
- `children`: ReactNode - 描述内容

### 4. ButtonContainer
**用途**: 包裹一组按钮

**Props**:
- `children`: ReactNode - 按钮内容
- `justify?`: 'start' | 'center' | 'end' | 'between' - 对齐方式（默认: 'start'）
- `gap?`: number - 间距（默认: 8）

**示例**:
```tsx
import { ButtonContainer } from './components/common/Containers';

<ButtonContainer justify="end" gap={12}>
  <button>取消</button>
  <button>确认</button>
</ButtonContainer>
```

### 5. SearchBarContainer
**用途**: 包裹搜索栏和相关操作

**Props**:
- `children`: ReactNode - 搜索栏内容

**示例**:
```tsx
import { SearchBarContainer } from './components/common/Containers';

<SearchBarContainer>
  <SearchBar />
  <ClearButton />
</SearchBarContainer>
```

### 6. ContentContainer
**用途**: 包裹主要内容区域

**Props**:
- `children`: ReactNode - 内容
- `padding?`: string - 内边距（默认: '40px'）

### 7. TableContainer
**用途**: 包裹表格区域

**Props**:
- `children`: ReactNode - 表格内容

### 8. TagContainer
**用途**: 包裹一组标签

**Props**:
- `children`: ReactNode - 标签内容
- `gap?`: number - 间距（默认: 4）

**示例**:
```tsx
import { TagContainer } from './components/common/Containers';

<TagContainer gap={8}>
  <span className="tag">标签1</span>
  <span className="tag">标签2</span>
  <span className="tag">标签3</span>
</TagContainer>
```

### 9. CardContainer
**用途**: 包裹卡片式内容

**Props**:
- `children`: ReactNode - 卡片内容
- `padding?`: string - 内边距（默认: '16px'）
- `background?`: string - 背景色（默认: '#ffffff'）
- `rounded?`: string - 圆角（默认: '12px'）

**示例**:
```tsx
import { CardContainer } from './components/common/Containers';

<CardContainer padding="24px" background="#f0f6ff">
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</CardContainer>
```

### 10. FormContainer
**用途**: 包裹表单字段

**Props**:
- `children`: ReactNode - 表单字段
- `gap?`: number - 间距（默认: 16）

**示例**:
```tsx
import { FormContainer } from './components/common/Containers';

<FormContainer gap={24}>
  <input type="text" placeholder="姓名" />
  <input type="email" placeholder="邮箱" />
  <button>提交</button>
</FormContainer>
```

### 11. MainContainer
**用途**: 包裹整个页面内容

**Props**:
- `children`: ReactNode - 页面内容
- `className?`: string - 额外的类名

**示例**:
```tsx
import { MainContainer } from './components/common/Containers';

<MainContainer className="min-h-screen">
  {/* 页面内容 */}
</MainContainer>
```

## 迁移指南

### 步骤 1: 识别重复的容器组件

在你的文件中查找如下模式：
```tsx
function TitleContainer() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Title Container">
      {/* ... */}
    </div>
  );
}
```

### 步骤 2: 导入共享组件

```tsx
import { TitleContainer, HeaderContainer } from './components/common/Containers';
```

### 步骤 3: 替换本地定义

删除本地的容器组件定义，使用导入的共享组件。

### 步骤 4: 调整 Props

如果原组件有特殊的 props，可能需要调整：
- 简单的情况：直接传递 children
- 复杂的情况：可能需要重新组织组件结构

## 优势

1. **代码复用**: 减少重复代码，降低维护成本
2. **统一性**: 确保整个应用的布局容器具有一致的样式和行为
3. **易于维护**: 修改容器组件只需在一个地方进行
4. **类型安全**: TypeScript 类型定义提供更好的开发体验
5. **可扩展**: 容易添加新的共享容器组件

## 注意事项

1. **渐进式迁移**: 不需要一次性迁移所有文件，可以逐步重构
2. **保持兼容**: 如果现有组件有特殊需求，可以先保留本地定义
3. **命名一致**: 使用共享组件时保持命名一致性
4. **文档更新**: 添加新的共享容器时记得更新此文档

## 未来改进

1. 添加更多通用的容器组件
2. 支持主题定制
3. 添加响应式布局支持
4. 添加动画效果支持
