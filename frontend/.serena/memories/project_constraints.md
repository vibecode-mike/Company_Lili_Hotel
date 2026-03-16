# lili_hotel 專案限制（每次對話必須遵守）

## 規則
- **只能修改** `/data2/lili_hotel/frontend` 資料夾內的文件
- **不動 nginx** 設定（/etc/nginx 相關一律不碰）
- **不用 prod / staging** 環境
- **不動無關的排程或背景服務**

## 環境
- 前端開發機：192.168.50.123:5173（Vite dev server）
- nginx 代理機：192.168.50.120（chimie.star-bit.io → 192.168.50.123:5173）
- 後端：FastAPI on port 8700

## 主要檔案
- `/data2/lili_hotel/frontend/src/components/PMSIntegration.tsx` — PMS 訂房和帳務頁面（資料總覽 + 串接設定兩個 tab）
- `/data2/lili_hotel/frontend/src/styles/globals.css` — 全域樣式
