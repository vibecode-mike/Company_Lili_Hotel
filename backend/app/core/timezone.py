"""營運時區（Operating Timezone）共用常數。

時間架構：DB 一律存 **UTC**；後端輸出 UTC aware ISO；前端依觀看者瀏覽器時區顯示。
只有「以商家營運所在地為準」的計算才換算到 OPERATING_TZ：
  - 報表日界線（analytics 的 GROUP BY DATE 前 CONVERT_TZ）
  - 日曆日（今天/明天）
  - 自動回應的日期區間 / 時段判斷
  - 無「觀看者」的字串輸出（CSV 匯出、chatbot 回覆）

預設台北（Asia/Taipei）。未來賣海外要改成「每租戶營運時區」時，只改這裡（或加一層 per-tenant 查詢）。

⚠️ DST 警告：台北無夏令時間，故 MySQL CONVERT_TZ 可用固定 offset 字串 OPERATING_TZ_SQL。
   若未來營運時區含 DST（美/歐/澳），OPERATING_TZ_SQL 不可再寫死偏移——
   CONVERT_TZ 必須改用「具名時區 + 載入 MySQL mysql.time_zone 表」，或依當下日期動態計算 offset，
   否則夏令時間期間日界線會錯一小時。
"""
from zoneinfo import ZoneInfo

# Python 端營運時區
OPERATING_TZ = ZoneInfo("Asia/Taipei")

# MySQL CONVERT_TZ 用的 offset 字串（僅因台北無 DST 才可寫死；含 DST 時區見上方警告）
OPERATING_TZ_SQL = "+08:00"
