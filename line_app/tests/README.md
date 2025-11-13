# LINE App Tests

測試套件用於驗證群發訊息追蹤功能的正確性，特別是 campaigns → messages 資料表遷移。

## 測試內容

### Unit Tests (`test_message_tracking.py`)
- SQL 查詢結構驗證
  - ✅ 使用正確的資料表名稱 (`messages`)
  - ✅ 使用正確的欄位名稱 (`send_count`, `click_count`)
  - ✅ 參數化查詢 (防止 SQL injection)
- 錯誤處理
  - ✅ 資料庫錯誤時記錄日誌
  - ✅ 不會讓系統崩潰
- Schema 驗證
  - ✅ 確認必要欄位存在
  - ✅ 確認不使用舊欄位名稱

### Integration Tests (`test_push_message_integration.py`)
- 完整群發流程
  - ✅ 建立訊息記錄
  - ✅ 發送給目標用戶
  - ✅ 更新發送統計 (`send_count`)
- 點擊追蹤流程
  - ✅ 查找會員
  - ✅ 記錄點擊事件
  - ✅ 更新點擊統計 (`click_count`)
- 錯誤恢復
  - ✅ 資料庫故障時優雅降級
  - ✅ 記錄錯誤日誌
- 資料庫遷移驗證
  - ✅ 確認資料表重構完成
  - ✅ 確認欄位名稱更新

## 執行測試

### 安裝依賴

```bash
pip install pytest pytest-mock
```

### 執行所有測試

```bash
# 從 line_app 目錄執行
cd /data2/lili_hotel/line_app
python -m pytest tests/ -v
```

### 執行特定測試文件

```bash
# Unit tests only
python -m pytest tests/test_message_tracking.py -v

# Integration tests only
python -m pytest tests/test_push_message_integration.py -v
```

### 執行特定測試類別

```bash
# 只測試 SQL 查詢結構
python -m pytest tests/test_message_tracking.py::TestMessageTracking -v

# 只測試整合流程
python -m pytest tests/test_push_message_integration.py::TestPushMessageIntegration -v
```

### 執行特定測試方法

```bash
# 測試 send_count 查詢
python -m pytest tests/test_message_tracking.py::TestMessageTracking::test_send_count_update_query_structure -v

# 測試完整推送流程
python -m pytest tests/test_push_message_integration.py::TestPushMessageIntegration::test_complete_push_message_flow -v
```

### 顯示詳細輸出

```bash
# 顯示所有 print 輸出
python -m pytest tests/ -v -s

# 顯示失敗的測試詳情
python -m pytest tests/ -v --tb=short
```

### 生成測試覆蓋率報告

```bash
pip install pytest-cov

# 生成覆蓋率報告
python -m pytest tests/ --cov=. --cov-report=html

# 查看報告
# 瀏覽器開啟 htmlcov/index.html
```

## 測試結構

```
tests/
├── __init__.py                          # 測試套件初始化
├── README.md                            # 本文件
├── test_message_tracking.py             # 單元測試
└── test_push_message_integration.py     # 整合測試
```

## 重要變更驗證

### ✅ 資料表名稱
- ❌ ~~`campaigns`~~ (舊名稱用於群發訊息)
- ✅ `messages` (新名稱用於群發訊息)
- ✅ `campaigns` (新名稱用於活動管理)

### ✅ 欄位名稱
- ❌ ~~`sent_count`~~ → ✅ `send_count`
- ❌ ~~`clicked_count`~~ → ✅ `click_count`

### ✅ 錯誤處理
- ✅ 資料庫更新失敗時記錄日誌
- ✅ 不影響主要功能運作

## 持續整合

這些測試應該整合到 CI/CD 流程中：

```yaml
# .github/workflows/test.yml 範例
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install pytest pytest-mock
      - name: Run tests
        run: |
          cd line_app
          python -m pytest tests/ -v
```

## 故障排除

### ImportError: No module named 'app'

確保從 `line_app` 目錄執行測試：

```bash
cd /data2/lili_hotel/line_app
python -m pytest tests/ -v
```

### 資料庫連接錯誤

測試使用 mock 物件，不需要真實資料庫連接。如果遇到連接錯誤，檢查是否正確 mock 了 `app.engine`。

### 測試失敗

1. 檢查 `app.py` 中的 SQL 查詢是否使用正確的資料表和欄位名稱
2. 確認錯誤處理邏輯已實作
3. 查看測試輸出的詳細錯誤訊息

## 貢獻

新增測試時，請遵循以下規範：

1. **測試命名**: 使用描述性名稱 (`test_<功能>_<預期行為>`)
2. **文檔字串**: 每個測試都應有清楚的說明
3. **Mock**: 使用 mock 隔離外部依賴
4. **斷言**: 使用清楚的斷言訊息
5. **獨立性**: 測試之間不應相互依賴

## 參考資料

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest-Mock Documentation](https://pytest-mock.readthedocs.io/)
- [資料庫遷移文檔](../../backend/migrations/README.md)
