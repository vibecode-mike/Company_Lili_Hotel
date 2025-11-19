# TextIconButton 组件迁移指南

## 🎯 快速查找可复用的位置

### 搜索模式

在项目中搜索以下模式，找到可以替换为 `TextIconButton` 的代码：

#### 模式 1：文字 + 箭头图标
```tsx
// 搜索关键词：
// - "詳細" + "onClick" + "flex"
// - "text-[#0f6beb]" + "gap-[4px]"
// - "leading-[1.5]" + "whitespace-pre"

// 旧代码示例：
<div onClick={handleClick} className="flex gap-[4px] items-center px-[12px] ...">
  <div className="text-[#0f6beb] text-[14px]">
    <p className="leading-[1.5]">詳細</p>
  </div>
  <div className="flex items-center">
    {/* 箭头 SVG */}
  </div>
</div>

// 新代码：
<TextIconButton 
  text="詳細"
  icon={<ArrowRightIcon color="#0F6BEB" />}
  onClick={handleClick}
  variant="primary"
/>
```

#### 模式 2：返回按钮
```tsx
// 搜索关键词：
// - "返回" + "onClick"
// - "ArrowLeft" 或 "rotate-[-90deg]"

// 旧代码示例：
<div onClick={handleBack} className="flex items-center gap-2 cursor-pointer">
  {/* 左箭头图标 */}
  <span>返回</span>
</div>

// 新代码：
<TextIconButton 
  text="返回"
  icon={<ArrowLeftIcon />}
  iconPosition="left"
  onClick={handleBack}
  variant="secondary"
/>
```

---

## 📝 完整迁移示例

### 示例 1：会员管理页面

#### 迁移前（/imports/MainContainer-6001-1415.tsx）
```tsx
<div onClick={() => onViewDetail?.(member)} className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
    <p className="leading-[1.5] whitespace-pre">詳細</p>
  </div>
  <div className="flex items-center justify-center relative shrink-0">
    <div className="flex-none rotate-[180deg]">
      <div className="overflow-clip relative size-[16px]">
        <div className="absolute flex inset-[23.56%_36.29%_29.88%_36.27%] items-center justify-center">
          <div className="flex-none h-[4.39px] rotate-[90deg] w-[7.45px]">
            <div className="relative size-full">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 5">
                <path d={svgPaths.p1c38d100} fill="var(--fill-0, #0F6BEB)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 迁移后
```tsx
// 1. 添加导入
import { TextIconButton, ArrowRightIcon } from '../components/common';

// 2. 替换代码
<TextIconButton 
  text="詳細"
  icon={<ArrowRightIcon color="#0F6BEB" />}
  onClick={() => onViewDetail?.(member)}
  variant="primary"
/>

// 代码减少：17 行 → 5 行 ✅
```

---

### 示例 2：聊天按钮（假设存在）

#### 迁移前
```tsx
<div onClick={() => onOpenChat?.(member)} className="flex gap-[4px] items-center px-[12px] cursor-pointer hover:opacity-70">
  <div className="text-[#0f6beb] text-[14px]">
    <p className="leading-[1.5]">聊天</p>
  </div>
  <ChatIcon />
</div>
```

#### 迁移后
```tsx
import { TextIconButton } from '../components/common';
import { MessageCircle } from 'lucide-react';

<TextIconButton 
  text="聊天"
  icon={<MessageCircle size={16} color="#0F6BEB" />}
  onClick={() => onOpenChat?.(member)}
  variant="primary"
/>
```

---

### 示例 3：多个操作按钮

#### 迁移前
```tsx
<div className="flex gap-4">
  {/* 编辑按钮 */}
  <div onClick={handleEdit} className="flex gap-[4px] items-center cursor-pointer">
    <div className="text-[#383838] text-[14px]">编辑</div>
    <EditIcon />
  </div>
  
  {/* 删除按钮 */}
  <div onClick={handleDelete} className="flex gap-[4px] items-center cursor-pointer">
    <div className="text-[#f44336] text-[14px]">刪除</div>
    <DeleteIcon />
  </div>
  
  {/* 详细按钮 */}
  <div onClick={handleView} className="flex gap-[4px] items-center cursor-pointer">
    <div className="text-[#0f6beb] text-[14px]">詳細</div>
    <ArrowIcon />
  </div>
</div>
```

#### 迁移后
```tsx
import { TextIconButton, ArrowRightIcon } from '../components/common';
import { Edit, Trash2 } from 'lucide-react';

<div className="flex gap-4">
  <TextIconButton 
    text="編輯"
    icon={<Edit size={16} />}
    onClick={handleEdit}
    variant="secondary"
  />
  
  <TextIconButton 
    text="刪除"
    icon={<Trash2 size={16} />}
    onClick={handleDelete}
    variant="danger"
  />
  
  <TextIconButton 
    text="詳細"
    icon={<ArrowRightIcon />}
    onClick={handleView}
    variant="primary"
  />
</div>
```

---

## 🔍 项目中可能需要迁移的文件

### 高优先级（很可能有可复用代码）

1. **会员管理相关**
   - `/components/MemberManagement.tsx`
   - `/components/MemberInfo.tsx`
   - `/imports/MemberManagementInboxHoverAndPressed.tsx`

2. **列表和表格**
   - 任何包含 "詳細" 按钮的组件
   - 任何包含 "查看更多" 的组件
   - 任何包含导航箭头的组件

3. **表单页面**
   - 包含 "返回" 按钮的表单
   - 包含 "下一步" / "上一步" 的多步骤表单

### 中优先级

4. **模态框和对话框**
   - 模态框的关闭按钮
   - 对话框的确认/取消按钮

5. **导航组件**
   - 面包屑导航的链接
   - 侧边栏的菜单项

---

## 🎨 颜色映射指南

### 从旧代码颜色到 variant 的映射

| 旧代码颜色 | variant | 用途 |
|-----------|---------|------|
| `text-[#0f6beb]` | `primary` | 主要操作（详细、查看等） |
| `text-[#383838]` | `secondary` | 次要操作（编辑、返回等） |
| `text-[#6e6e6e]` | `ghost` | 弱化操作（取消、关闭等） |
| `text-[#f44336]` | `danger` | 危险操作（删除、移除等） |

---

## ✅ 迁移检查清单

### 在迁移每个按钮之前，确认：

- [ ] 按钮有明确的文字标签
- [ ] 按钮有 onClick 事件处理
- [ ] 按钮的样式符合四种 variant 之一
- [ ] 图标是可选的（有些按钮可能只有文字）

### 迁移后，验证：

- [ ] 按钮外观与原来一致
- [ ] 点击功能正常工作
- [ ] Hover 效果正确（opacity-70）
- [ ] 响应式布局没有破坏

---

## 🚀 批量迁移策略

### 阶段 1：低风险迁移（建议先做）
1. 单独的"详细"按钮
2. 单独的"返回"按钮
3. 不在关键路径上的操作按钮

### 阶段 2：中等风险迁移
1. 表格中的操作按钮
2. 卡片中的操作按钮
3. 表单中的导航按钮

### 阶段 3：复杂场景迁移
1. 包含多个状态的按钮
2. 包含动态样式的按钮
3. 包含复杂交互的按钮

---

## 💡 注意事项

### ⚠️ 不适合迁移的场景

以下情况建议保留原有实现：

1. **按钮有复杂的内部布局**
   ```tsx
   // ❌ 不适合迁移
   <div className="flex flex-col items-center gap-2">
     <Icon />
     <span>多行文字</span>
     <Badge>标签</Badge>
   </div>
   ```

2. **按钮需要特殊的视觉效果**
   ```tsx
   // ❌ 不适合迁移
   <div className="bg-gradient-to-r from-blue-500 to-purple-600 ...">
     特殊渐变背景
   </div>
   ```

3. **按钮是第三方组件库的一部分**
   ```tsx
   // ❌ 不适合迁移
   <ShadcnButton>已经使用其他组件库</ShadcnButton>
   ```

### ✅ 适合迁移的场景

1. **简单的文字+图标组合**
2. **符合四种 variant 样式之一**
3. **只需要基本的 hover 交互**
4. **在多个地方重复出现的按钮样式**

---

## 🎯 迁移效果对比

### 代码量减少

| 项目 | 迁移前 | 迁移后 | 减少 |
|------|--------|--------|------|
| 代码行数 | 17 行 | 5 行 | **-70%** |
| SVG 代码 | 手动管理 | 组件封装 | ✅ |
| 样式一致性 | 手动维护 | 自动统一 | ✅ |
| 可维护性 | 低 | 高 | ✅ |

### 开发效率提升

| 任务 | 迁移前 | 迁移后 |
|------|--------|--------|
| 添加新按钮 | 复制粘贴 17 行 | 写 5 行代码 |
| 修改按钮颜色 | 找到所有地方修改 | 改一个 variant |
| 修改图标 | 重新导入 SVG | 换一个组件 |
| 调整间距 | 修改多个 className | 统一管理 |

---

## 📞 需要帮助？

如果在迁移过程中遇到问题：

1. 查看 `/components/common/buttons/README.md` 了解详细用法
2. 参考已迁移的示例代码
3. 提交 Issue 寻求帮助

---

**祝你迁移顺利！🎉**
