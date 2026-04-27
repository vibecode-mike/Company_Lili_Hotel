#!/usr/bin/env bash
# 力麗飯店 CRM - systemd timer 安裝腳本
# 用途：把 deploy/systemd/ 下的 .service / .timer 複製到 /etc/systemd/system/
#       並啟用，讓未來部署到任何 Linux VM（含 GCP Compute Engine）都能一鍵就位。
#
# 用法：sudo bash deploy/install-systemd.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_DIR/deploy/systemd"
DEST_DIR="/etc/systemd/system"

if [[ $EUID -ne 0 ]]; then
    echo "需要 root 權限。請用：sudo bash $0"
    exit 1
fi

if [[ ! -d "$SRC_DIR" ]]; then
    echo "找不到來源目錄：$SRC_DIR"
    exit 1
fi

echo "[1/4] 複製 systemd 設定檔到 $DEST_DIR"
for f in "$SRC_DIR"/*.service "$SRC_DIR"/*.timer; do
    [[ -e "$f" ]] || continue
    cp -v "$f" "$DEST_DIR/"
done

echo "[2/4] systemctl daemon-reload"
systemctl daemon-reload

echo "[3/4] 啟用並啟動 timer"
for timer in "$SRC_DIR"/*.timer; do
    [[ -e "$timer" ]] || continue
    name="$(basename "$timer")"
    systemctl enable --now "$name"
    echo "  - $name 已 enable + start"
done

echo "[4/4] 列出已安裝的 lili-* timer"
systemctl list-timers --all 'lili-*' || true

echo ""
echo "✅ 安裝完成。"
echo ""
echo "常用指令："
echo "  查看下一次執行時間：systemctl list-timers 'lili-*'"
echo "  手動跑一次：       systemctl start lili-guest-retention.service"
echo "  看 log：           journalctl -u lili-guest-retention.service -n 50"
