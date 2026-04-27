#!/usr/bin/env bash
# ==============================================================================
# Webchat 訪客功能一鍵回滾腳本
# ==============================================================================
# 用途：把「webchat 訪客 + 對話保存 + 下載 + retention」整套功能撤回到實作前狀態
#
# 動作（依序）：
#   1. 確認操作（兩段式 prompt）
#   2. 停 lili_backend
#   3. 刪所有 is_guest=1 的訪客 + 對應對話資料
#   4. alembic downgrade -1（拿掉 is_guest / guest_seq 欄位）
#   5. git revert <feature-commit>（在 main 分支建一筆 revert commit）
#   6. 移除 .env 中加的 CRON_TOKEN / GUEST_RETENTION_DAYS
#   7. 卸載 systemd timer（若已安裝）
#   8. 重啟 lili_backend / lili_frontend
#   9. 印出後續步驟提示
#
# 旗標：
#   --dry-run   只印會做什麼，不實際執行
#   --yes       跳過互動確認（CI 用，本地慎用）
#
# 用法：
#   sudo bash deploy/rollback-guest-feature.sh           # 互動式
#   sudo bash deploy/rollback-guest-feature.sh --dry-run # 只看不動
# ==============================================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
VENV_PY="$REPO_DIR/venv/bin/python"
ENV_FILE="$BACKEND_DIR/.env"
MARKER_FILE="$REPO_DIR/deploy/.guest-feature-marker"

DRY_RUN=0
SKIP_PROMPT=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --yes|-y)  SKIP_PROMPT=1 ;;
        -h|--help)
            sed -n '2,28p' "$0"; exit 0 ;;
        *) echo "未知參數：$arg"; exit 2 ;;
    esac
done

run() {
    if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [dry-run] $*"
    else
        echo "  → $*"
        eval "$@"
    fi
}

confirm() {
    [[ $SKIP_PROMPT -eq 1 ]] && return 0
    local prompt="$1"
    read -r -p "$prompt [y/N] " ans
    [[ "$ans" =~ ^[yY]$ ]]
}

# ---------------------------------------------------------------------------
# 0. 前置檢查
# ---------------------------------------------------------------------------
echo "==> 訪客功能回滾"
[[ $DRY_RUN -eq 1 ]] && echo "    （DRY-RUN 模式：只印不執行）"
echo ""

if [[ $DRY_RUN -eq 0 && $EUID -ne 0 ]]; then
    echo "需要 root 權限：sudo bash $0"
    exit 1
fi

if [[ ! -f "$MARKER_FILE" ]]; then
    echo "找不到 marker：$MARKER_FILE"
    echo "（這個檔案記錄訪客功能 commit，回滾用）"
    exit 1
fi

FEATURE_COMMIT="$(cat "$MARKER_FILE" | tr -d '[:space:]')"
if [[ -z "$FEATURE_COMMIT" ]]; then
    echo "marker 內容為空"; exit 1
fi

cd "$REPO_DIR"
if ! git cat-file -e "$FEATURE_COMMIT^{commit}" 2>/dev/null; then
    echo "marker 指的 commit 不存在於 git history：$FEATURE_COMMIT"
    exit 1
fi

echo "目標：撤回 commit $FEATURE_COMMIT"
git log --oneline -1 "$FEATURE_COMMIT" || true
echo ""

# ---------------------------------------------------------------------------
# 1. 兩段式確認（依 CLAUDE.md 慣例）
# ---------------------------------------------------------------------------
if ! confirm "確定要回滾訪客功能嗎？此動作會刪除所有訪客資料"; then
    echo "已取消。"; exit 0
fi
if ! confirm "再次確認：訪客的對話紀錄、標籤都會永久刪除，無法復原"; then
    echo "已取消。"; exit 0
fi
echo ""

# ---------------------------------------------------------------------------
# 2. 停 backend（避免回滾期間有寫入打架）
# ---------------------------------------------------------------------------
echo "==> [1/8] 停 lili_backend"
run "systemctl stop lili_backend"
echo ""

# ---------------------------------------------------------------------------
# 3. 刪訪客資料（必須在 schema downgrade 之前，否則 is_guest 欄位就沒了）
# ---------------------------------------------------------------------------
echo "==> [2/8] 刪除所有訪客資料（is_guest=1）"
SQL=$(cat <<'EOF'
DELETE m FROM member_interaction_tags m
  INNER JOIN members mb ON mb.id = m.member_id
  WHERE mb.is_guest = 1;

DELETE m FROM member_tags m
  INNER JOIN members mb ON mb.id = m.member_id
  WHERE mb.is_guest = 1;

DELETE cm FROM conversation_messages cm
  INNER JOIN conversation_threads ct ON ct.id = cm.thread_id
  INNER JOIN members mb ON mb.id = ct.member_id
  WHERE mb.is_guest = 1;

DELETE ct FROM conversation_threads ct
  INNER JOIN members mb ON mb.id = ct.member_id
  WHERE mb.is_guest = 1;

DELETE FROM members WHERE is_guest = 1;
EOF
)
if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] 會跑以下 SQL："
    echo "$SQL" | sed 's/^/    /'
else
    cd "$BACKEND_DIR"
    "$VENV_PY" - <<PY
import os
from sqlalchemy import create_engine, text
import sys
sys.path.insert(0, '$BACKEND_DIR')
from app.config import settings
url = settings.DATABASE_URL.replace('mysql+aiomysql://', 'mysql+pymysql://')
e = create_engine(url)
with e.begin() as c:
    for stmt in """$SQL""".strip().split(';'):
        s = stmt.strip()
        if s:
            r = c.execute(text(s))
            print(f"  deleted {r.rowcount} rows: {s.split(chr(10))[0][:60]}...")
PY
fi
echo ""

# ---------------------------------------------------------------------------
# 4. alembic downgrade（拿掉 is_guest / guest_seq 欄位）
# ---------------------------------------------------------------------------
echo "==> [3/8] alembic downgrade -1（移除 is_guest / guest_seq schema）"
if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] cd $BACKEND_DIR && alembic downgrade -1"
else
    cd "$BACKEND_DIR"
    # shellcheck disable=SC1091
    source venv/bin/activate
    alembic downgrade -1
    deactivate || true
    cd "$REPO_DIR"
fi
echo ""

# ---------------------------------------------------------------------------
# 5. git revert（在 main 上建一筆 revert commit，不改寫歷史）
# ---------------------------------------------------------------------------
echo "==> [4/8] git revert $FEATURE_COMMIT"
if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] git revert --no-edit $FEATURE_COMMIT"
else
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "  ⚠️  working tree 有未提交變更，先 stash"
        git stash push -u -m "rollback-guest-feature stash"
    fi
    git revert --no-edit "$FEATURE_COMMIT"
fi
echo ""

# ---------------------------------------------------------------------------
# 6. .env 清理（移除 CRON_TOKEN / GUEST_RETENTION_DAYS）
# ---------------------------------------------------------------------------
echo "==> [5/8] 清掉 .env 中的 CRON_TOKEN / GUEST_RETENTION_DAYS"
if [[ -f "$ENV_FILE" ]]; then
    if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [dry-run] 會從 $ENV_FILE 移除 CRON_TOKEN / GUEST_RETENTION_DAYS / 相關註解行"
    else
        # 移除以這些 key 開頭的行 + 上方那行註解
        sed -i \
            -e '/^# 排程任務驗證 token/d' \
            -e '/^CRON_TOKEN=/d' \
            -e '/^GUEST_RETENTION_DAYS=/d' \
            "$ENV_FILE"
    fi
fi
echo ""

# ---------------------------------------------------------------------------
# 7. systemd timer 卸載（若已安裝）
# ---------------------------------------------------------------------------
echo "==> [6/8] 卸載 systemd timer（若已安裝）"
TIMERS=("lili-guest-retention.timer" "lili-guest-retention.service")
for u in "${TIMERS[@]}"; do
    if systemctl list-unit-files --no-legend "$u" 2>/dev/null | grep -q "$u"; then
        if [[ $DRY_RUN -eq 1 ]]; then
            echo "  [dry-run] systemctl disable --now $u; rm /etc/systemd/system/$u"
        else
            systemctl disable --now "$u" 2>/dev/null || true
            rm -f "/etc/systemd/system/$u"
        fi
    fi
done
[[ $DRY_RUN -eq 0 ]] && systemctl daemon-reload
echo ""

# ---------------------------------------------------------------------------
# 8. 重啟 backend / frontend
# ---------------------------------------------------------------------------
echo "==> [7/8] 重啟 lili_backend / lili_frontend"
run "systemctl restart lili_backend"
run "systemctl restart lili_frontend"
echo ""

# ---------------------------------------------------------------------------
# 9. 移除 marker（避免重複跑）
# ---------------------------------------------------------------------------
echo "==> [8/8] 移除 marker"
run "rm -f $MARKER_FILE"
echo ""

echo "✅ 回滾完成"
echo ""
echo "後續步驟："
echo "  1. 檢查網站是否正常：https://crmpoc.star-bit.io"
echo "  2. revert commit 已在本地分支，需要 push：git push origin main"
echo "  3. 若要重新前進到此功能：git revert <revert-commit>（再 revert 一次即可還原）"
