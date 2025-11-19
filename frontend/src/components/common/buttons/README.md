# 按钮组件库使用指南

## 📦 组件概览

### TextIconButton - 文字+图标按钮

通用的按钮组件，支持文字和图标的组合显示，可配置图标位置、样式变体、文字大小等。

---

## 🚀 快速开始

### 基础用法

```tsx
import { TextIconButton, ArrowRightIcon } from '../components/common';

// 最简单的用法
<TextIconButton 
  text="詳細"
  icon={<ArrowRightIcon />}
  onClick={handleClick}
/>
```

---

## 🎨 样式变体

### 1. Primary（主要样式）
```tsx
<TextIconButton 
  text="詳細"
  icon={<ArrowRightIcon />}
  onClick={handleView}
  variant="primary"  // 蓝色文字 #0f6beb
/>
```

### 2. Secondary（次要样式）
```tsx
<TextIconButton 
  text="編輯"
  icon={<EditIcon />}
  onClick={handleEdit}
  variant="secondary"  // 深灰色文字 #383838
/>
```

### 3. Ghost（幽灵样式）
```tsx
<TextIconButton 
  text="取消"
  icon={<CloseIcon />}
  onClick={handleCancel}
  variant="ghost"  // 浅灰色文字 #6e6e6e
/>
```

### 4. Danger（危险样式）
```tsx
<TextIconButton 
  text="刪除"
  icon={<DeleteIcon />}
  onClick={handleDelete}
  variant="danger"  // 红色文字 #f44336
/>
```

---

## 🔧 配置选项

### 图标位置

```tsx
// 图标在右侧（默认）
<TextIconButton 
  text="下一步"
  icon={<ArrowRightIcon />}
  iconPosition="right"
/>

// 图标在左侧
<TextIconButton 
  text="返回"
  icon={<ArrowLeftIcon />}
  iconPosition="left"
/>
```

### 文字大小

```tsx
// 小号文字
<TextIconButton 
  text="詳細"
  textSize="12px"
/>

// 中号文字（默认）
<TextIconButton 
  text="詳細"
  textSize="14px"
/>

// 大号文字
<TextIconButton 
  text="詳細"
  textSize="16px"
/>
```

### 禁用状态

```tsx
<TextIconButton 
  text="已完成"
  disabled={true}
  onClick={handleClick}  // 点击不会触发
/>
```

---

## 🎯 实际应用场景

### 场景 1：会员管理 - 查看详情按钮

```tsx
import { TextIconButton, ArrowRightIcon } from '../components/common';

function MemberRow({ member, onViewDetail }) {
  return (
    <div className="flex items-center gap-4">
      {/* ...其他内容 */}
      
      <TextIconButton 
        text="詳細"
        icon={<ArrowRightIcon color="#0F6BEB" />}
        onClick={() => onViewDetail(member)}
        variant="primary"
      />
    </div>
  );
}
```

### 场景 2：表单 - 返回按钮

```tsx
import { TextIconButton, ArrowLeftIcon } from '../components/common';

function FormHeader({ onBack }) {
  return (
    <div className="flex items-center gap-4">
      <TextIconButton 
        text="返回"
        icon={<ArrowLeftIcon color="#383838" />}
        iconPosition="left"
        onClick={onBack}
        variant="secondary"
      />
      
      <h1>編輯會員資料</h1>
    </div>
  );
}
```

### 场景 3：操作按钮组

```tsx
import { TextIconButton, ArrowRightIcon } from '../components/common';

function ActionButtons({ onEdit, onDelete, onView }) {
  return (
    <div className="flex items-center gap-2">
      <TextIconButton 
        text="編輯"
        onClick={onEdit}
        variant="secondary"
      />
      
      <TextIconButton 
        text="刪除"
        onClick={onDelete}
        variant="danger"
      />
      
      <TextIconButton 
        text="詳細"
        icon={<ArrowRightIcon />}
        onClick={onView}
        variant="primary"
      />
    </div>
  );
}
```

### 场景 4：分页导航

```tsx
import { TextIconButton, ArrowLeftIcon, ArrowRightIcon } from '../components/common';

function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center gap-4">
      <TextIconButton 
        text="上一頁"
        icon={<ArrowLeftIcon />}
        iconPosition="left"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="secondary"
      />
      
      <span>{currentPage} / {totalPages}</span>
      
      <TextIconButton 
        text="下一頁"
        icon={<ArrowRightIcon />}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="secondary"
      />
    </div>
  );
}
```

---

## 🎨 与箭头图标组合使用

### ArrowIcon 家族

```tsx
import { 
  ArrowIcon,       // 通用箭头（可配置方向）
  ArrowRightIcon,  // 向右箭头
  ArrowLeftIcon,   // 向左箭头
  ArrowUpIcon,     // 向上箭头
  ArrowDownIcon    // 向下箭头
} from '../components/common';

// 向右箭头
<TextIconButton 
  text="詳細"
  icon={<ArrowRightIcon color="#0F6BEB" />}
/>

// 向左箭头
<TextIconButton 
  text="返回"
  icon={<ArrowLeftIcon color="#383838" />}
  iconPosition="left"
/>

// 自定义方向和颜色
<TextIconButton 
  text="展開"
  icon={<ArrowIcon direction="down" color="#6e6e6e" size={20} />}
/>
```

---

## 📊 Props 完整说明

### TextIconButtonProps

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `text` | `string` | - | ✅ | 按钮显示的文字 |
| `icon` | `React.ReactNode` | - | ❌ | 图标组件 |
| `iconPosition` | `'left' \| 'right'` | `'right'` | ❌ | 图标位置 |
| `onClick` | `() => void` | - | ❌ | 点击事件回调 |
| `className` | `string` | `''` | ❌ | 自定义类名 |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | ❌ | 按钮样式变体 |
| `disabled` | `boolean` | `false` | ❌ | 是否禁用 |
| `textSize` | `'12px' \| '14px' \| '16px'` | `'14px'` | ❌ | 文字大小 |

### ArrowIconProps

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `direction` | `'up' \| 'down' \| 'left' \| 'right'` | `'right'` | ❌ | 箭头方向 |
| `color` | `string` | `'#0F6BEB'` | ❌ | 箭头颜色 |
| `size` | `number` | `16` | ❌ | 图标大小（px） |
| `className` | `string` | `''` | ❌ | 自定义类名 |

---

## 💡 设计原则

### 1. 关注点分离
- **组件**：负责 UI 外观和样式
- **父组件**：负责业务逻辑和事件处理

### 2. 可组合性
- 按钮组件可以与任何图标组件组合
- 图标组件可以独立使用或嵌入按钮

### 3. 语义化
- 组件名称清晰表达职责
- Props 命名符合直觉

### 4. 可扩展性
- 通过 `className` 支持自定义样式
- 通过 `variant` 支持预设样式变体

---

## 🔍 常见问题

### Q: 如何自定义按钮颜色？

**A:** 使用 `className` 覆盖默认样式：

```tsx
<TextIconButton 
  text="自定義"
  className="text-purple-500 hover:text-purple-700"
  onClick={handleClick}
/>
```

### Q: 可以只显示图标不显示文字吗？

**A:** 不建议这样做。如果只需要图标按钮，建议使用 shadcn/ui 的 Button 组件：

```tsx
import { Button } from './components/ui/button';

<Button variant="ghost" size="icon">
  <ArrowRightIcon />
</Button>
```

### Q: 如何在 TextIconButton 中使用其他图标库？

**A:** 可以传入任何 React 组件作为 icon：

```tsx
import { Heart } from 'lucide-react';

<TextIconButton 
  text="收藏"
  icon={<Heart size={16} />}
  onClick={handleFavorite}
/>
```

### Q: 组件会不会因为路径复用而混淆功能？

**A:** 不会！组件只负责视觉外观，功能由 `onClick` 回调决定：

```tsx
// 相同样式，不同功能 ✅
<TextIconButton text="詳細" onClick={handleView} />
<TextIconButton text="編輯" onClick={handleEdit} />
<TextIconButton text="刪除" onClick={handleDelete} />
```

---

## 🎯 最佳实践

### ✅ 推荐做法

```tsx
// 1. 清晰的事件处理函数命名
<TextIconButton 
  text="詳細"
  onClick={handleViewMemberDetail}
/>

// 2. 使用语义化的变体
<TextIconButton 
  text="刪除"
  variant="danger"  // 而不是自定义红色
/>

// 3. 传递参数使用箭头函数
<TextIconButton 
  text="編輯"
  onClick={() => handleEdit(member.id)}
/>
```

### ❌ 不推荐做法

```tsx
// 1. 在按钮内部硬编码业务逻辑
// ❌ 错误示例（不要这样做）

// 2. 过度自定义样式覆盖
<TextIconButton 
  className="text-[#123456] hover:bg-[#654321] ..."  // ❌
/>

// 3. 省略必要的 onClick 处理
<TextIconButton 
  text="詳細"
  // ❌ 没有 onClick，按钮无法交互
/>
```

---

## 📝 更新日志

### v1.0.0 (2024-01-13)
- ✨ 初始版本
- ✅ 支持 4 种样式变体
- ✅ 支持左右图标位置
- ✅ 支持禁用状态
- ✅ 集成 ArrowIcon 组件库

---

## 🤝 贡献指南

如果你发现了 bug 或有功能建议，欢迎提交 Issue 或 Pull Request！
