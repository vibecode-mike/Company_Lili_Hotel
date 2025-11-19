#!/bin/bash

# React Hooks 性能檢測腳本
# 用途：自動檢測項目中的 Hooks 使用情況和潛在問題

echo "🔍 React Hooks 性能檢測"
echo "================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 統計函數
count_pattern() {
    pattern=$1
    label=$2
    count=$(grep -r "$pattern" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${BLUE}$label:${NC} $count 處"
}

# 1. Hooks 使用統計
echo "📊 Hooks 使用統計："
echo "--------------------------------"
count_pattern "useState(" "useState"
count_pattern "useEffect(" "useEffect"
count_pattern "useCallback(" "useCallback"
count_pattern "useMemo(" "useMemo"
count_pattern "useContext(" "useContext"
count_pattern "useRef(" "useRef"
count_pattern "useReducer(" "useReducer"
count_pattern "= memo(" "React.memo"
echo ""

# 2. React 18 新特性使用
echo "🆕 React 18 新特性："
echo "--------------------------------"
count_pattern "useDeferredValue(" "useDeferredValue"
count_pattern "useTransition(" "useTransition"
count_pattern "useId(" "useId"
echo ""

# 3. 潛在問題檢測
echo "⚠️  潛在問題檢測："
echo "--------------------------------"

# 檢查空的 useEffect
empty_effects=$(grep -r "useEffect(() => {" src/ --include="*.tsx" -A 2 | grep -c "}, \[\])")
if [ $empty_effects -gt 0 ]; then
    echo -e "${YELLOW}• 發現 $empty_effects 個可能的空 useEffect${NC}"
else
    echo -e "${GREEN}✓ 未發現空 useEffect${NC}"
fi

# 檢查未使用 useCallback 的內聯函數
inline_functions=$(grep -r "onClick={() =>" src/ --include="*.tsx" | wc -l | tr -d ' ')
if [ $inline_functions -gt 50 ]; then
    echo -e "${YELLOW}• 發現 $inline_functions 處內聯函數（可能需要 useCallback）${NC}"
else
    echo -e "${GREEN}✓ 內聯函數使用合理 ($inline_functions 處)${NC}"
fi

# 檢查未使用 useMemo 的 filter/map
filter_without_memo=$(grep -r "\.filter(" src/ --include="*.tsx" | grep -v "useMemo" | wc -l | tr -d ' ')
if [ $filter_without_memo -gt 30 ]; then
    echo -e "${YELLOW}• 發現 $filter_without_memo 處 filter 操作未使用 useMemo${NC}"
else
    echo -e "${GREEN}✓ filter 操作優化良好 ($filter_without_memo 處未優化)${NC}"
fi

echo ""

# 4. ESLint 檢查
echo "🔧 ESLint Hooks 規則檢查："
echo "--------------------------------"

if command -v npx &> /dev/null; then
    # 檢查是否有 ESLint 配置
    if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ]; then
        echo "正在運行 ESLint..."
        
        # 運行 ESLint 並捕獲輸出
        eslint_output=$(npx eslint src/ --ext .tsx --rule 'react-hooks/exhaustive-deps: error' 2>&1)
        eslint_exit_code=$?
        
        if [ $eslint_exit_code -eq 0 ]; then
            echo -e "${GREEN}✓ 所有 Hooks 規則檢查通過${NC}"
        else
            # 統計錯誤數量
            error_count=$(echo "$eslint_output" | grep "react-hooks/exhaustive-deps" | wc -l | tr -d ' ')
            echo -e "${RED}✗ 發現 $error_count 個 Hooks 依賴問題${NC}"
            echo ""
            echo "詳細錯誤："
            echo "$eslint_output" | grep -A 2 "react-hooks/exhaustive-deps"
        fi
    else
        echo -e "${YELLOW}⚠ 未找到 ESLint 配置文件${NC}"
        echo "請創建 .eslintrc.json 並添加 react-hooks 規則"
    fi
else
    echo -e "${YELLOW}⚠ 未安裝 npm/npx，跳過 ESLint 檢查${NC}"
fi

echo ""

# 5. 文件大小分析
echo "📦 組件複雜度分析："
echo "--------------------------------"

# 找出最大的組件文件（可能需要優化）
echo "最大的 5 個組件文件："
find src/ -name "*.tsx" -type f -exec wc -l {} + | sort -rn | head -6 | tail -5 | while read line; do
    size=$(echo $line | awk '{print $1}')
    file=$(echo $line | awk '{print $2}')
    if [ $size -gt 500 ]; then
        echo -e "${YELLOW}  $size 行 - $file${NC}"
    else
        echo -e "${GREEN}  $size 行 - $file${NC}"
    fi
done

echo ""

# 6. 性能建議
echo "💡 優化建議："
echo "--------------------------------"

suggestions=()

# 建議 1: useEffect 依賴
useEffect_count=$(grep -r "useEffect(" src/ --include="*.tsx" | wc -l | tr -d ' ')
if [ $useEffect_count -gt 20 ]; then
    suggestions+=("• 建議檢查 $useEffect_count 處 useEffect 的依賴數組是否完整")
fi

# 建議 2: useCallback
useCallback_count=$(grep -r "useCallback(" src/ --include="*.tsx" | wc -l | tr -d ' ')
if [ $useCallback_count -lt 20 ] && [ $inline_functions -gt 50 ]; then
    suggestions+=("• 建議為傳遞給子組件的函數添加 useCallback")
fi

# 建議 3: useMemo
useMemo_count=$(grep -r "useMemo(" src/ --include="*.tsx" | wc -l | tr -d ' ')
if [ $useMemo_count -lt 15 ] && [ $filter_without_memo -gt 30 ]; then
    suggestions+=("• 建議為計算密集操作（filter, map, sort）添加 useMemo")
fi

# 建議 4: React.memo
memo_count=$(grep -r "= memo(" src/ --include="*.tsx" | wc -l | tr -d ' ')
if [ $memo_count -lt 10 ]; then
    suggestions+=("• 建議為列表項組件和靜態組件添加 React.memo")
fi

# 建議 5: React 18 新特性
deferred_count=$(grep -r "useDeferredValue(" src/ --include="*.tsx" | wc -l | tr -d ' ')
transition_count=$(grep -r "useTransition(" src/ --include="*.tsx" | wc -l | tr -d ' ')
if [ $deferred_count -eq 0 ] && [ $transition_count -eq 0 ]; then
    suggestions+=("• 建議使用 React 18 新特性（useDeferredValue, useTransition）優化大數據渲染")
fi

if [ ${#suggestions[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ 太棒了！沒有明顯的優化建議${NC}"
else
    for suggestion in "${suggestions[@]}"; do
        echo -e "${YELLOW}$suggestion${NC}"
    done
fi

echo ""

# 7. 生成報告
echo "📄 生成詳細報告..."
REPORT_FILE="hooks-performance-report-$(date +%Y%m%d-%H%M%S).txt"

{
    echo "React Hooks 性能檢測報告"
    echo "生成時間: $(date)"
    echo "================================"
    echo ""
    echo "Hooks 使用統計:"
    grep -r "useState(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | xargs echo "  useState:"
    grep -r "useEffect(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | xargs echo "  useEffect:"
    grep -r "useCallback(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | xargs echo "  useCallback:"
    grep -r "useMemo(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | xargs echo "  useMemo:"
    grep -r "= memo(" src/ --include="*.tsx" 2>/dev/null | wc -l | xargs echo "  React.memo:"
    echo ""
    echo "詳細問題清單:"
    echo "  - 空 useEffect: $empty_effects 處"
    echo "  - 內聯函數: $inline_functions 處"
    echo "  - 未優化的 filter: $filter_without_memo 處"
    echo ""
    echo "優化建議:"
    for suggestion in "${suggestions[@]}"; do
        echo "  $suggestion"
    done
} > "$REPORT_FILE"

echo -e "${GREEN}✓ 報告已生成: $REPORT_FILE${NC}"

echo ""
echo "================================"
echo "檢測完成！"
echo ""
echo "📚 相關文檔："
echo "  • /HOOKS_OPTIMIZATION_PLAN.md - 優化計劃"
echo "  • /HOOKS_OPTIMIZATION_TRACKER.md - 進度追蹤"
echo "  • /MEMO_OPTIMIZATION_GUIDE.md - React.memo 指南"
echo ""
echo "🚀 下一步："
echo "  1. 查看生成的報告文件"
echo "  2. 參考優化計劃開始修復"
echo "  3. 使用 React DevTools Profiler 測試性能"
