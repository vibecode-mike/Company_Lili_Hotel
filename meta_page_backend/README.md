# meta_page_backend

使用 Meta API，操作粉絲專頁的貼文、留言及 messaging 等功能。

## 環境變數

建立 `.env` 檔案：
```
API_VERSION=v24.0
page_id=<facebook_page_id>
page_access_token=<page_access_token>
```

| 變數 | 說明 |
|------|------|
| `API_VERSION` | Meta Graph API 版本，例如 `v24.0` |
| `page_id` | 粉絲專頁 ID |
| `page_access_token` | 粉絲專頁的 Access Token |

## 啟動服務

```bash
# 直接執行
go run main.go

# 編譯後執行
go build -o meta && ./meta
```

服務將在 port **11204** 啟動。