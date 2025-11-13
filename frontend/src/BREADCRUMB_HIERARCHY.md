# 📐 Breadcrumb 层级结构文档

## 🎯 页面层级

### 第一层页面（独立顶级页面）

这些页面没有父级，面包屑只显示当前页面名称。

#### 1. 活动与讯息推播
**文件**: `/imports/MainContainer.tsx`
```tsx
<SimpleBreadcrumb items={[
  { label: '活動與訊息推播', active: true }
]} />
```
**层级**: `活動與訊息推播`

---

#### 2. 自动回应
**文件**: `/components/AutoReply.tsx`
```tsx
<PageHeaderWithBreadcrumb
  breadcrumbItems={[
    { label: '自動回應', active: true }
  ]}
/>
```
**层级**: `自動回應`

---

#### 3. 会员管理
**文件**: `/imports/MainContainer-6001-1415.tsx`
```tsx
<SimpleBreadcrumb items={[
  { label: '會員管理', active: true }
]} />
```
**层级**: `會員管理`

---

### 第二层页面（子页面）

这些页面有父级，面包屑显示：父级（可点击）> 当前页

#### 4. 会员资讯（会员详情页）
**文件**: `/imports/MainContainer-6001-3170.tsx`
```tsx
<SimpleBreadcrumb items={[
  { label: '會員管理', onClick: onBack },
  { label: '會員資訊', active: true }
]} />
```
**层级**: `會員管理 > 會員資訊`
**父级**: 会员管理

---

#### 5. 聊天室
**文件**: `/imports/MainContainer-6013-738.tsx`
```tsx
<SimpleBreadcrumb items={[
  { label: '會員管理', onClick: onBack },
  { label: '聊天室', active: true }
]} />
```
**层级**: `會員管理 > 聊天室`
**父级**: 会员管理

---

## 📊 层级树状图

```
应用根
├── 活動與訊息推播 (第一层)
│
├── 自動回應 (第一层)
│
└── 會員管理 (第一层)
    ├── 會員資訊 (第二层)
    └── 聊天室 (第二层)
```

---

## 🎨 视觉规范

### 第一层页面
```
┌────────────────┐
│ 活動與訊息推播  │  ← 深灰色 (#383838)，不可点击
└────────────────┘
```

### 第二层页面
```
┌────────────┬───┬──────────┐
│ 會員管理    │ > │ 會員資訊  │
│ #6e6e6e    │   │ #383838  │
│ 可点击      │   │ 当前页    │
│ hover→蓝色 │   │ 不可点击  │
└────────────┴───┴──────────┘
```

---

## 💡 使用规则

### ✅ 正确做法

```tsx
// 第一层 - 只有一项，标记为 active
<SimpleBreadcrumb items={[
  { label: '自動回應', active: true }
]} />

// 第二层 - 第一项可点击返回父级
<SimpleBreadcrumb items={[
  { label: '會員管理', onClick: onBack },
  { label: '會員資訊', active: true }
]} />
```

### ❌ 错误做法

```tsx
// ❌ 错误：自动回应不是活动与讯息推播的子页面
<SimpleBreadcrumb items={[
  { label: '活動與訊息推播', onClick: ... },
  { label: '自動回應', active: true }
]} />

// ❌ 错误：当前页面有 onClick
<SimpleBreadcrumb items={[
  { label: '活動與訊息推播', onClick: ..., active: true }
]} />

// ❌ 错误：第一层页面有父级
<SimpleBreadcrumb items={[
  { label: '首页', onClick: ... },
  { label: '活動與訊息推播', active: true }
]} />
```

---

## 🔍 如何确定页面层级

### 问题清单

1. **这个页面是独立的顶级功能吗？**
   - 是 → 第一层
   - 否 → 继续下一个问题

2. **这个页面是从哪个页面进入的？**
   - 记下父页面名称

3. **点击返回按钮应该去哪里？**
   - 这就是父级页面

### 示例

**会员资讯页**：
1. 是独立功能吗？ → 否（它是会员的详情页）
2. 从哪个页面进入？ → 会员管理列表
3. 返回去哪里？ → 会员管理
4. **结论**：`會員管理 > 會員資訊`

**自动回应页**：
1. 是独立功能吗？ → 是（它是独立的自动回应管理功能）
2. 从哪个页面进入？ → 侧边栏直接进入
3. 返回去哪里？ → 不需要返回
4. **结论**：`自動回應`（第一层）

---

## 📝 组件使用

### 导入

```tsx
import { SimpleBreadcrumb } from '../components/common/Breadcrumb';
// 或
import { PageHeaderWithBreadcrumb } from './components/common/Breadcrumb';
```

### Props 类型

```typescript
interface BreadcrumbItem {
  label: string;          // 显示文本
  onClick?: () => void;   // 点击回调（可选）
  active?: boolean;       // 是否为当前页（可选）
}
```

### 颜色规范

| 状态 | 颜色 | 说明 |
|------|------|------|
| 当前页（active: true）| #383838 | 深灰色，不可点击 |
| 可点击项（有 onClick）| #6e6e6e | 中等灰色 |
| 可点击项 hover | #0f6beb | 蓝色 |

---

## ✅ 检查清单

在添加新页面时，确保：

- [ ] 确定页面是第一层还是第二层
- [ ] 第一层页面只有一个面包屑项
- [ ] 第二层页面有父级链接
- [ ] 当前页标记为 `active: true`
- [ ] 非当前页有 `onClick` 回调
- [ ] onClick 回调指向正确的父级页面
- [ ] 不要创建超过两层的面包屑

---

**文档版本**: v1.0  
**最后更新**: 2024-11-08  
**维护者**: 开发团队
