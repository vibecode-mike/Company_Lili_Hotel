# 共享容器组件快速参考

## 🚀 快速开始

### 导入组件

```tsx
import { 
  TitleContainer,
  HeaderContainer,
  DescriptionContainer,
  ButtonContainer,
  ContentContainer,
  TagContainer
} from "./components/common/Containers";
```

---

## 📦 组件一览表

| 组件 | 用途 | 主要 Props | 示例 |
|------|------|-----------|------|
| `TitleContainer` | 页面标题 | `children`, `onBack?` | 标题区域 |
| `HeaderContainer` | 头部区域 | `children` | 标题+描述 |
| `DescriptionContainer` | 描述文本 | `children` | 说明文字 |
| `ButtonContainer` | 按钮组 | `children`, `justify?`, `gap?` | 操作按钮 |
| `SearchBarContainer` | 搜索栏 | `children` | 搜索区域 |
| `ContentContainer` | 内容区域 | `children`, `padding?` | 主要内容 |
| `TableContainer` | 表格区域 | `children` | 数据表格 |
| `TagContainer` | 标签组 | `children`, `gap?` | 标签列表 |
| `CardContainer` | 卡片 | `children`, `padding?`, `background?`, `rounded?` | 卡片式内容 |
| `FormContainer` | 表单 | `children`, `gap?` | 表单字段 |
| `MainContainer` | 页面主容器 | `children`, `className?` | 整个页面 |

---

## 💡 常用模式

### 模式 1: 标准页面头部

```tsx
<HeaderContainer>
  <TitleContainer>
    <h1>页面标题</h1>
  </TitleContainer>
  <DescriptionContainer>
    <p>页面描述</p>
  </DescriptionContainer>
</HeaderContainer>
```

### 模式 2: 带返回按钮的标题

```tsx
<HeaderContainer>
  <TitleContainer onBack={() => navigate(-1)}>
    <h1>页面标题</h1>
  </TitleContainer>
</HeaderContainer>
```

### 模式 3: 底部按钮组

```tsx
<ButtonContainer justify="end" gap={12}>
  <button className="btn-cancel">取消</button>
  <button className="btn-confirm">确认</button>
</ButtonContainer>
```

### 模式 4: 标签列表

```tsx
<TagContainer gap={8}>
  {tags.map(tag => (
    <span key={tag} className="tag">{tag}</span>
  ))}
</TagContainer>
```

### 模式 5: 完整页面布局

```tsx
<MainContainer>
  <ContentContainer padding="40px">
    <HeaderContainer>
      <TitleContainer>
        <h1>活动与讯息推播</h1>
      </TitleContainer>
      <DescriptionContainer>
        <p>建立单一图文或多页轮播内容</p>
      </DescriptionContainer>
    </HeaderContainer>
    
    {/* 主要内容 */}
    <TableContainer>
      {/* 表格 */}
    </TableContainer>
  </ContentContainer>
</MainContainer>
```

---

## ⚙️ Props 详解

### TitleContainer

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | 必填 | 标题内容 |
| `onBack` | `() => void` | - | 返回按钮回调（可选） |

**示例**:
```tsx
// 无返回按钮
<TitleContainer>
  <h1>会员管理</h1>
</TitleContainer>

// 带返回按钮
<TitleContainer onBack={() => history.back()}>
  <h1>会员详情</h1>
</TitleContainer>
```

### ButtonContainer

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | 必填 | 按钮内容 |
| `justify` | `'start' \| 'center' \| 'end' \| 'between'` | `'start'` | 对齐方式 |
| `gap` | `number` | `8` | 间距（px） |

**示例**:
```tsx
// 左对齐（默认）
<ButtonContainer>
  <button>按钮1</button>
  <button>按钮2</button>
</ButtonContainer>

// 右对齐
<ButtonContainer justify="end" gap={12}>
  <button>取消</button>
  <button>确认</button>
</ButtonContainer>

// 两端对齐
<ButtonContainer justify="between">
  <button>删除</button>
  <button>保存</button>
</ButtonContainer>
```

### ContentContainer

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | 必填 | 内容 |
| `padding` | `string` | `'40px'` | 内边距 |

**示例**:
```tsx
// 默认边距
<ContentContainer>
  {/* 内容 */}
</ContentContainer>

// 自定义边距
<ContentContainer padding="24px 40px">
  {/* 内容 */}
</ContentContainer>
```

### TagContainer

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | 必填 | 标签内容 |
| `gap` | `number` | `4` | 间距（px） |

**示例**:
```tsx
<TagContainer gap={8}>
  <span className="tag">VIP</span>
  <span className="tag">活跃用户</span>
  <span className="tag">高消费</span>
</TagContainer>
```

### CardContainer

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | 必填 | 卡片内容 |
| `padding` | `string` | `'16px'` | 内边距 |
| `background` | `string` | `'#ffffff'` | 背景色 |
| `rounded` | `string` | `'12px'` | 圆角 |

**示例**:
```tsx
<CardContainer 
  padding="24px" 
  background="#f0f6ff"
  rounded="16px"
>
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</CardContainer>
```

---

## 🎨 样式定制

### 方法 1: 使用 className（推荐）

```tsx
<ButtonContainer className="my-custom-buttons">
  {/* 按钮 */}
</ButtonContainer>
```

### 方法 2: 使用内联样式

```tsx
<ContentContainer padding="24px 40px">
  {/* 内容 */}
</ContentContainer>
```

### 方法 3: 包装额外的 div

```tsx
<div className="custom-wrapper">
  <HeaderContainer>
    {/* 内容 */}
  </HeaderContainer>
</div>
```

---

## ⚠️ 注意事项

### 1. 避免命名冲突

如果你的文件中已经有本地的 `TitleContainer`，使用别名导入：

```tsx
import { 
  TitleContainer as SharedTitleContainer 
} from "./components/common/Containers";

// 使用
<SharedTitleContainer>
  {/* ... */}
</SharedTitleContainer>
```

### 2. 保留特殊实现

如果你的容器组件有特殊的样式或逻辑，**不要强制使用共享组件**：

```tsx
// 保留这样的特殊实现
function MySpecialTitleContainer() {
  return (
    <div className="special-title-with-gradient">
      {/* 特殊样式 */}
    </div>
  );
}
```

### 3. children 必须传递

所有容器组件都需要 `children`：

```tsx
// ✅ 正确
<TitleContainer>
  <h1>标题</h1>
</TitleContainer>

// ❌ 错误（没有内容）
<TitleContainer />
```

---

## 🔍 何时使用共享组件 vs 本地组件

### 使用共享组件 ✅

- 标准的页面头部
- 通用的按钮组布局
- 常规的内容容器
- 简单的标签列表

### 使用本地组件 ⚠️

- 包含特殊的 SVG 图标或动画
- 有复杂的交互逻辑
- 使用绝对定位
- 有特定的业务逻辑

---

## 📖 更多资源

- [完整使用指南](/CONTAINER_COMPONENTS_GUIDE.md)
- [重构示例](/REFACTORING_EXAMPLE.md)
- [重构总结](/REFACTORING_SUMMARY.md)
- [组件源码](/components/common/Containers.tsx)

---

**快速参考版本**: v1.0  
**最后更新**: 2024-11-08
