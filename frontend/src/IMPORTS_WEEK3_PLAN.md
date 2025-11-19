# Figma 导入文件清理 - 第三周计划

**计划日期：** 2025-11-18  
**执行周期：** 第三周  
**目标：** 识别和清理未使用文件

---

## 🎯 本周目标

清理 `/imports/` 目录中的未使用文件，减少文件数量和目录大小，提升项目整洁度和维护性。

### 关键指标目标

| 指标 | 当前 | 目标 | 改进 |
|------|------|------|------|
| **文件总数** | 69 个 | <30 个 | ↓ 56% |
| **目录大小** | 1.7MB | <850KB | ↓ 50% |
| **未使用文件** | ~43 个 | 0 个 | ✅ |
| **可维护性** | 中 | 高 | ↑ 80% |

---

## 📋 任务清单

### 阶段 1：分析和识别（第 1-2 天）

#### 任务 1.1：创建文件引用分析脚本 ⭐⭐⭐

**目标：** 自动分析所有文件的引用情况

**创建脚本：** `/scripts/analyze-imports-usage.sh`

```bash
#!/bin/bash

# 分析 imports 目录文件使用情况

echo "🔍 分析 Figma 导入文件使用情况..."
echo "================================"
echo ""

IMPORTS_DIR="imports"
REPORT_FILE="imports-usage-report-$(date +%Y%m%d-%H%M%S).txt"

{
  echo "Figma 导入文件使用分析报告"
  echo "生成时间: $(date)"
  echo "================================"
  echo ""
  
  echo "## 文件统计"
  echo "总文件数: $(find $IMPORTS_DIR -type f | wc -l)"
  echo "TSX 文件: $(find $IMPORTS_DIR -name "*.tsx" | wc -l)"
  echo "TS 文件: $(find $IMPORTS_DIR -name "*.ts" | wc -l)"
  echo ""
  
  echo "## 使用情况分析"
  echo "================================"
  echo ""
  
  # 遍历所有 imports 文件
  for file in $(find $IMPORTS_DIR -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/_unused/*"); do
    filename=$(basename "$file")
    filename_no_ext="${filename%.*}"
    
    # 搜索引用（排除自身）
    ref_count=$(grep -r "from.*$filename_no_ext" src/ components/ pages/ contexts/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "$file" | wc -l)
    
    if [ $ref_count -eq 0 ]; then
      echo "❌ UNUSED: $filename (0 引用)"
    elif [ $ref_count -eq 1 ]; then
      echo "⚠️  LOW: $filename (1 引用)"
    elif [ $ref_count -le 3 ]; then
      echo "🟡 MEDIUM: $filename ($ref_count 引用)"
    else
      echo "✅ HIGH: $filename ($ref_count 引用)"
    fi
  done
  
  echo ""
  echo "## 建议操作"
  echo "================================"
  echo "❌ UNUSED: 可以移动到 _unused/ 目录"
  echo "⚠️  LOW: 需要审查，可能未使用或即将弃用"
  echo "🟡 MEDIUM: 使用频率中等，保留"
  echo "✅ HIGH: 频繁使用，保留"
  
} > "$REPORT_FILE"

echo "✅ 报告已生成: $REPORT_FILE"
cat "$REPORT_FILE"
```

**执行：**
```bash
chmod +x scripts/analyze-imports-usage.sh
./scripts/analyze-imports-usage.sh
```

**预期结果：**
- 生成详细的使用情况报告
- 识别所有未使用文件
- 分类文件优先级

---

#### 任务 1.2：手动审查大型文件 ⭐⭐

**目标：** 审查大型组件文件，确认是否使用

**需要审查的文件：**

| 文件名 | 大小（行数） | 状态 | 操作 |
|--------|-------------|------|------|
| `MemberManagementInboxHoverAndPressed.tsx` | 2,952 行 | ❓ 待确认 | 搜索引用 |
| `MemberManagementInboxEditing.tsx` | ~1,500 行 | ❓ 待确认 | 搜索引用 |
| `MemberTagModalFuzzySearchCreation.tsx` | ~800 行 | ❓ 待确认 | 搜索引用 |
| `MemberTagModalNormal.tsx` | ~600 行 | ❓ 待确认 | 搜索引用 |
| `Frame3468772.tsx` | ~500 行 | ❓ 待确认 | 搜索引用 |
| `Frame3468775.tsx` | ~500 行 | ❓ 待确认 | 搜索引用 |

**审查步骤：**
```bash
# 1. 搜索文件引用
grep -r "MemberManagementInboxHoverAndPressed" src/ components/ pages/ --include="*.tsx"

# 2. 搜索类名引用（可能通过 className 使用）
grep -r "MemberManagementInboxHoverAndPressed" src/ components/ pages/ --include="*.tsx" --include="*.ts"

# 3. 检查是否在 node_modules 或 build 中被引用
grep -r "MemberManagementInboxHoverAndPressed" . --exclude-dir=node_modules --exclude-dir=build

# 4. 如果都没有引用，标记为未使用
```

---

#### 任务 1.3：创建未使用文件清单 ⭐⭐⭐

**目标：** 根据分析结果，创建详细的未使用文件清单

**创建文件：** `/IMPORTS_UNUSED_FILES.md`

```markdown
# 未使用的 Figma 导入文件清单

**生成日期：** 2025-11-XX  
**分析方法：** 自动扫描 + 手动审查

---

## 🗑️ 确认未使用的文件（40+ 个）

### 大型组件文件（6 个）

| 文件名 | 大小 | 引用次数 | 状态 | 操作 |
|--------|------|---------|------|------|
| MemberManagementInboxHoverAndPressed.tsx | 2,952 行 | 0 | ❌ 未使用 | 移动到 _unused/ |
| MemberManagementInboxEditing.tsx | 1,500 行 | 0 | ❌ 未使用 | 移动到 _unused/ |
| MemberTagModalFuzzySearchCreation.tsx | 800 行 | 0 | ❌ 未使用 | 移动到 _unused/ |
| MemberTagModalNormal.tsx | 600 行 | 0 | ❌ 未使用 | 移动到 _unused/ |
| Frame3468772.tsx | 500 行 | 0 | ❌ 未使用 | 移动到 _unused/ |
| Frame3468775.tsx | 500 行 | 0 | ❌ 未使用 | 移动到 _unused/ |

### SVG 文件（35+ 个）

| 文件名 | 引用次数 | 状态 | 操作 |
|--------|---------|------|------|
| svg-0buukvztvq.ts | 0 | ❌ 未使用 | 移动到 _unused/svg/ |
| svg-0lasnt9264.ts | 0 | ❌ 未使用 | 移动到 _unused/svg/ |
| svg-0t36cx7k7a.ts | 0 | ❌ 未使用 | 移动到 _unused/svg/ |
| ... | 0 | ❌ 未使用 | 移动到 _unused/svg/ |

**总计：** 40+ 个未使用文件

---

## ⚠️ 低频使用文件（需要审查）

| 文件名 | 引用次数 | 建议 |
|--------|---------|------|
| Tooltip.tsx | 1 | 保留（功能组件） |
| ... | 1-2 | 待审查 |

---

## ✅ 频繁使用文件（保留）

已在第一、二周重命名的文件，保留。
```

---

### 阶段 2：创建目录结构（第 2 天）

#### 任务 2.1：创建 _unused 目录 ⭐

**目标：** 创建临时存放未使用文件的目录

**执行：**
```bash
# 创建目录结构
mkdir -p imports/_unused
mkdir -p imports/_unused/components
mkdir -p imports/_unused/svg
mkdir -p imports/_unused/others

# 创建说明文件
cat > imports/_unused/README.md << 'EOF'
# 未使用的 Figma 导入文件

**创建日期：** 2025-11-XX  
**目的：** 临时存放可能未使用的文件

---

## ⚠️ 重要说明

1. **观察期：** 这些文件将保留 1-2 周进行观察
2. **测试：** 在此期间测试所有功能是否正常
3. **删除：** 确认无误后才会永久删除
4. **恢复：** 如发现错误，可以快速恢复

---

## 📁 目录结构

- `components/` - 大型组件文件
- `svg/` - SVG 路径文件
- `others/` - 其他类型文件

---

## 📊 统计

- 总文件数：40+ 个
- 组件文件：6 个
- SVG 文件：35+ 个
- 其他文件：若干

---

**生成日期：** $(date)
EOF

echo "✅ _unused 目录已创建"
```

---

### 阶段 3：移动文件（第 3 天）

#### 任务 3.1：移动大型组件文件 ⭐⭐

**目标：** 将未使用的大型组件移动到 _unused 目录

**执行脚本：** `/scripts/move-unused-components.sh`

```bash
#!/bin/bash

echo "🚚 移动未使用的组件文件..."

# 定义要移动的文件
UNUSED_COMPONENTS=(
  "MemberManagementInboxHoverAndPressed.tsx"
  "MemberManagementInboxEditing.tsx"
  "MemberTagModalFuzzySearchCreation.tsx"
  "MemberTagModalNormal.tsx"
  "Frame3468772.tsx"
  "Frame3468775.tsx"
)

# 移动文件
for file in "${UNUSED_COMPONENTS[@]}"; do
  if [ -f "imports/$file" ]; then
    echo "移动: $file"
    mv "imports/$file" "imports/_unused/components/"
  else
    echo "跳过: $file (文件不存在)"
  fi
done

echo ""
echo "✅ 组件文件移动完成"
echo "已移动 ${#UNUSED_COMPONENTS[@]} 个文件到 imports/_unused/components/"
```

**执行：**
```bash
chmod +x scripts/move-unused-components.sh
./scripts/move-unused-components.sh
```

---

#### 任务 3.2：移动未使用的 SVG 文件 ⭐⭐⭐

**目标：** 批量移动未使用的 SVG 文件

**执行脚本：** `/scripts/move-unused-svg.sh`

```bash
#!/bin/bash

echo "🚚 移动未使用的 SVG 文件..."

# 找出所有 SVG 文件
ALL_SVG_FILES=$(find imports/ -maxdepth 1 -name "svg-*.ts" -type f)

MOVED_COUNT=0
KEPT_COUNT=0

for file in $ALL_SVG_FILES; do
  filename=$(basename "$file")
  filename_no_ext="${filename%.*}"
  
  # 搜索引用（排除自身和 _unused 目录）
  ref_count=$(grep -r "from.*$filename_no_ext" src/ components/ pages/ contexts/ imports/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "$file" | grep -v "_unused" | wc -l | tr -d ' ')
  
  if [ $ref_count -eq 0 ]; then
    echo "移动: $filename (0 引用)"
    mv "$file" "imports/_unused/svg/"
    MOVED_COUNT=$((MOVED_COUNT + 1))
  else
    echo "保留: $filename ($ref_count 引用)"
    KEPT_COUNT=$((KEPT_COUNT + 1))
  fi
done

echo ""
echo "✅ SVG 文件移动完成"
echo "已移动: $MOVED_COUNT 个"
echo "保留: $KEPT_COUNT 个"
```

**执行：**
```bash
chmod +x scripts/move-unused-svg.sh
./scripts/move-unused-svg.sh
```

---

### 阶段 4：测试和验证（第 4-5 天）

#### 任务 4.1：运行完整测试 ⭐⭐⭐

**目标：** 确保移动文件后所有功能正常

**测试清单：**

- [ ] **编译测试**
  ```bash
  npm run build
  # 应该无错误
  ```

- [ ] **TypeScript 检查**
  ```bash
  npx tsc --noEmit
  # 应该无类型错误
  ```

- [ ] **ESLint 检查**
  ```bash
  npm run lint
  # 应该无新增错误
  ```

- [ ] **功能测试**
  - [ ] 会员管理页面正常
  - [ ] 消息列表页面正常
  - [ ] 自动回应页面正常
  - [ ] 所有图标显示正常
  - [ ] 所有按钮可点击
  - [ ] 无控制台错误

---

#### 任务 4.2：创建监控日志 ⭐⭐

**目标：** 记录观察期间的任何异常

**创建文件：** `/IMPORTS_CLEANUP_LOG.md`

```markdown
# Figma 导入文件清理观察日志

**开始日期：** 2025-11-XX  
**观察期：** 2 周

---

## 📅 每日记录

### 2025-11-XX（第 1 天）

**操作：**
- 移动了 6 个大型组件文件
- 移动了 35+ 个 SVG 文件

**测试结果：**
- ✅ 编译成功
- ✅ TypeScript 无错误
- ✅ ESLint 无新增错误
- ✅ 所有页面正常

**问题：**
- 无

---

### 2025-11-XX（第 2 天）

**测试结果：**
- ...

**问题：**
- ...

---

（持续记录 2 周）
```

---

### 阶段 5：生成报告（第 5 天）

#### 任务 5.1：生成清理报告 ⭐

**目标：** 总结本周的清理工作

**创建文件：** `/IMPORTS_WEEK3_COMPLETE.md`

```markdown
# Figma 导入文件清理 - 第三周完成报告

**完成日期：** 2025-11-XX  
**状态：** ✅ 完成

---

## 📊 清理统计

| 指标 | 清理前 | 清理后 | 改进 |
|------|--------|--------|------|
| 文件总数 | 69 | 29 | ↓ 58% |
| 目录大小 | 1.7MB | 800KB | ↓ 53% |
| 未使用文件 | 43 | 0（已移动） | ✅ |

---

## ✅ 已移动的文件

### 组件文件（6 个）
- MemberManagementInboxHoverAndPressed.tsx
- MemberManagementInboxEditing.tsx
- ...

### SVG 文件（37 个）
- svg-0buukvztvq.ts
- svg-0lasnt9264.ts
- ...

---

## 📋 保留的文件（29 个）

### 组件文件（6 个）
- ✅ ButtonEdit.tsx
- ✅ IcInfo.tsx
- ✅ ActionTriggerTextMessage.tsx
- ✅ ActionTriggerImageMessage.tsx
- ✅ MemberListContainer.tsx
- ✅ MemberDetailContainer.tsx

### SVG 文件（20 个）
- ✅ svg-icons-common.ts
- ✅ svg-table-icons.ts
- ...

### 别名文件（13 个）
- 第一、二周创建的别名文件

---

## ✅ 测试结果

- ✅ 编译成功
- ✅ 所有功能正常
- ✅ 无控制台错误
- ✅ 性能无回归

---

## 📅 下一步

**观察期：** 2 周（2025-11-XX ~ 2025-12-XX）

**第四周计划：**
1. 继续观察是否有问题
2. 完成所有引用的更新
3. 永久删除 _unused 文件
4. 创建维护文档
```

---

## 🎯 成功标准

### 必须达成（P0）

- [ ] ✅ 所有未使用文件已移动到 _unused/
- [ ] ✅ 编译测试通过
- [ ] ✅ 所有功能测试通过
- [ ] ✅ 无新增错误

### 应该达成（P1）

- [ ] ✅ 文件数量减少 50%+
- [ ] ✅ 目录大小减少 50%+
- [ ] ✅ 创建完整的文档记录

### 可选达成（P2）

- [ ] ✅ 自动化清理脚本
- [ ] ✅ CI/CD 集成
- [ ] ✅ 性能监控

---

## ⚠️ 风险和缓解措施

### 风险 1：误删使用中的文件

**缓解措施：**
- ✅ 使用 _unused 目录，不直接删除
- ✅ 设置 2 周观察期
- ✅ 完整测试所有功能
- ✅ 可快速恢复

### 风险 2：动态导入未被检测到

**缓解措施：**
- ✅ 手动审查大型文件
- ✅ 搜索多种引用方式
- ✅ 观察期监控错误

### 风险 3：未来可能需要这些文件

**缓解措施：**
- ✅ 保留在 _unused 目录 2 周
- ✅ Git 历史记录可恢复
- ✅ 文档记录所有操作

---

## 📝 执行检查清单

### 准备工作

- [ ] 备份项目
- [ ] 创建新分支
- [ ] 通知团队成员

### 执行步骤

- [ ] 运行分析脚本
- [ ] 手动审查大型文件
- [ ] 创建未使用文件清单
- [ ] 创建 _unused 目录
- [ ] 移动组件文件
- [ ] 移动 SVG 文件
- [ ] 运行完整测试
- [ ] 创建监控日志
- [ ] 生成清理报告

### 后续工作

- [ ] 每天检查错误日志
- [ ] 每周更新观察记录
- [ ] 2 周后评估是否删除

---

**创建日期：** 2025-11-18  
**预计执行：** 第三周  
**负责人：** 开发团队

---

> 💡 **重要提示：**  
> 这是一个渐进式的清理过程，不要急于删除文件。  
> 使用 _unused 目录作为缓冲区，确保安全。  
> 充分测试，定期观察，谨慎行事。

🚀 **准备好开始第三周的清理工作了吗？**
