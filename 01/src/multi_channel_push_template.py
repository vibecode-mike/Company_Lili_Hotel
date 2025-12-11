class Test模板必須至少填寫圖片標題內文:
    """
    Rule：模板必須至少填寫「圖片、標題、內文」其中一項，否則不可儲存
    """

    def test_模板缺少必填欄位禁止儲存(self):
        # Given 使用者建立 Facebook 訊息模板
        # [事件風暴部位: Command - create_facebook_message_template]
        # [生成參考 Prompt: Command-Handler.md]

        # And 未填寫「選擇圖片、標題文字、內文文字說明」任一欄位
        # [事件風暴部位: Aggregate - MessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者點擊「儲存草稿」
        # [事件風暴部位: Command - save_template_draft]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統禁止儲存成功
        # [生成參考 Prompt: Success-Failure-Handler.md]


class TestLINE圖片比例自動變換:
    """
    Rule：若 LINE 模板含其他欄位 → 圖片比例為 1.91:1；若僅有圖片 → 1:1
    """

    def test_含其他欄位比例為_1_91比1(self):
        # Given 使用者於 LINE 編輯 Template
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 使用者於後台勾選欄位「選擇圖片」
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 勾選其他欄位如「標題」
        # [事件風暴部位: Command - toggle_line_template_field]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 圖片比例自動變換從 1:1 轉為 1.91:1
        # [事件風暴部位: Read Model - LineTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_僅圖片比例為_1比1(self):
        # Given 使用者於 LINE 編輯 Template
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 使用者於後台勾選欄位「選擇圖片」
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 使用者於後台勾選欄位「標題」
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 取消勾選欄位如「標題」
        # [事件風暴部位: Command - toggle_line_template_field]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 圖片比例自動變換從 1.91:1 轉為 1:1
        # [事件風暴部位: Read Model - LineTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestFacebook圖片比例固定:
    """
    Rule：Facebook Template 圖片比例一律固定為 1.91:1，不因欄位變化切換
    """

    def test_模板從含其他欄位到僅有圖片仍固定比例(self):
        # Given 使用者於 Facebook 編輯 Template
        # [事件風暴部位: Aggregate - FacebookMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 無論是否填寫標題或內文
        # [事件風暴部位: Aggregate - FacebookMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者點擊「儲存草稿」
        # [事件風暴部位: Command - save_template_draft]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 圖片比例皆固定為 1.91:1
        # [事件風暴部位: Read Model - FacebookTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test平台切換_LINE轉Facebook比例調整:
    """
    Rule：從 LINE 切換至 Facebook → 比例強制調整為 1.91:1
    """

    def test_LINE僅圖片切換到Facebook比例變更(self):
        # Given 使用者於 LINE 編輯 Template
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 僅勾選「圖片」欄位
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 圖片比例目前為 1:1
        # [事件風暴部位: Read Model - LineTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # When 使用者切換發佈平台至 Facebook
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 圖片比例應自動切換為 1.91:1
        # [事件風暴部位: Read Model - FacebookTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test平台切換_Facebook轉LINE比例調整:
    """
    Rule：從 Facebook 切回 LINE → 依 LINE 欄位決定比例 (1:1 / 1.91:1)
    """

    def test_Facebook僅圖片切換回LINE比例調整(self):
        # Given 使用者於 Facebook 編輯 Template
        # [事件風暴部位: Aggregate - FacebookMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 僅勾選「圖片」欄位
        # [事件風暴部位: Aggregate - FacebookMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 圖片比例目前為 1.91:1
        # [事件風暴部位: Read Model - FacebookTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # When 使用者切換發佈平台至 LINE
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 圖片比例應自動切換為 1:1
        # [事件風暴部位: Read Model - LineTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test切換渠道顯示對應TemplateUI:
    """
    Rule：當使用者切換發佈渠道為 LINE 或 Facebook，系統必須顯示該平台專屬的模板 UI 並套用規格
    """

    def test_LINE切換Facebook_UI立即變更(self):
        # Given 使用者目前位於「發佈渠道：LINE」
        # [事件風暴部位: Aggregate - ChannelContext]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And UI 目前呈現 LINE Flex Message 編輯畫面
        # [事件風暴部位: Read Model - LineTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # When 使用者將發佈渠道切換為「Facebook」
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then UI 應立即切換為 Facebook Template 編輯畫面
        # [事件風暴部位: Read Model - FacebookTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And Template 套用 Facebook 預設欄位顯示格式
        # [事件風暴部位: Read Model - FacebookTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 圖片比例應呈現為固定 1.91:1
        # [事件風暴部位: Read Model - FacebookTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 若某欄位不適用於 Facebook，需於 UI 進行隱藏或格式轉換
        # [事件風暴部位: Read Model - FacebookTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_Facebook切回LINE_UI需符合LINE設計(self):
        # Given 使用者目前位於「發佈渠道：Facebook」
        # [事件風暴部位: Aggregate - ChannelContext]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And UI 目前呈現 Facebook Template 編輯畫面
        # [事件風暴部位: Read Model - FacebookTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # When 使用者將發佈渠道切換回「LINE」
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then UI 應切換為 LINE Flex Message 編輯畫面
        # [事件風暴部位: Read Model - LineTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 圖片比例需依欄位狀態自動顯示為 1:1 或 1.91:1
        # [事件風暴部位: Read Model - LineTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And Facebook 隱藏欄位若 LINE 支援則需重新顯示欄位與數值
        # [事件風暴部位: Read Model - LineTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_切換後預覽反映當前平台UI(self):
        # Given 使用者在 LINE UI 編輯完成後切換為 Facebook
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # When 使用者點擊「預覽訊息」
        # [事件風暴部位: Query - preview_message_template]
        # [生成參考 Prompt: Query-Handler.md]

        # Then 預覽畫面需呈現 Facebook 消息模板樣式均為 FB 規格
        # [事件風暴部位: Read Model - FacebookTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不得仍以 LINE Flex Message 格式顯示
        # [事件風暴部位: Read Model - TemplatePreviewConsistency]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestLINE輪播卡片自動重新裁切:
    """
    Rule：多渠道推播頁面在 LINE 渠道使用 Flex Carousel 時依欄位自動重裁，僅最終儲存時上傳
    """

    def test_LINE_tab勾選欄位觸發重裁至_1_91比1(self):
        # Given 使用者於多渠道推播頁面選擇「發佈渠道：LINE」並建立 Flex Carousel
        # [事件風暴部位: Aggregate - LineCarouselDraft]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 僅勾選卡片欄位「選擇圖片」，預覽顯示 1:1 正方形
        # [事件風暴部位: Read Model - LineCarouselPreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 原始圖片 File 存在 originalFile 狀態欄位
        # [事件風暴部位: Aggregate - LineCarouselDraft]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者勾選卡片欄位「標題」或「內文」
        # [事件風暴部位: Command - toggle_carousel_field]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 前端依 Canvas 規則從 originalFile 重新裁切為 1.91:1（1920x1005）
        # [事件風暴部位: Read Model - CarouselCropPreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 預覽立即更新為橫向比例
        # [事件風暴部位: Read Model - CarouselPreviewUpdate]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 過程不呼叫後端 API，僅更新前端 Blob URL
        # [事件風暴部位: Read Model - FrontendState]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_切換至Facebook鎖定比例不重裁(self):
        # Given 使用者於 LINE Tab 已完成圖片重裁並切換發佈渠道為 Facebook
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # When 系統轉換至 Facebook Template UI
        # [事件風暴部位: Command - render_facebook_template_ui]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 預覽比例固定顯示為 1.91:1
        # [事件風暴部位: Read Model - FacebookTemplatePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不對原始圖片進行額外裁切或上傳
        # [事件風暴部位: Read Model - ImageProcessingBehavior]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And LINE 暫存的 originalFile 與裁切結果需保留（切回 LINE 時可復原）
        # [事件風暴部位: Aggregate - LineCarouselDraft]
        # [生成參考 Prompt: Aggregate-Then-Handler.md]

    def test_切回LINE依勾選狀態再次重裁或保留(self):
        # Given 使用者從 Facebook 切回「發佈渠道：LINE」
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # And 卡片仍有 originalFile 暫存
        # [事件風暴部位: Aggregate - LineCarouselDraft]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 勾選欄位數量為 1（僅圖片）
        # [事件風暴部位: Command - toggle_carousel_field]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 前端自 originalFile 重新裁切為 1:1 並更新預覽
        # [事件風暴部位: Read Model - CarouselCropPreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 若 originalFile 已不存在（例如重新開啟已儲存訊息），則預覽保持上次裁切結果，不自動重裁
        # [事件風暴部位: Read Model - CarouselPreviewFallback]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

    def test_多卡片批次保存沿用最後裁切結果(self):
        # Given 使用者建立 3 張輪播卡片並於 LINE Tab 完成各自的自動裁切
        # [事件風暴部位: Aggregate - LineCarouselDraft]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 點擊「儲存草稿」
        # [事件風暴部位: Command - save_carousel_draft]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 前端使用每張卡片的 originalFile 依當前比例再次裁切
        # [事件風暴部位: Read Model - CarouselBatchCrop]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 將裁切後的 Blob 轉為 File 後一次上傳，任一失敗則阻擋儲存
        # [事件風暴部位: Success-Failure - batch_upload_valid]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class Test多平台Carousel支援方式:
    """
    Rule：LINE Flex Carousel 切換至 Facebook 時保留卡片數與按鈕，套用 Facebook 規格
    """

    def test_LINE_carousel切換Facebook保留多卡片(self):
        # Given 使用者於 LINE Tab 建立 Carousel，含 3 張卡片且每卡最多 3 顆按鈕
        # [事件風暴部位: Aggregate - LineCarouselDraft]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 切換發佈渠道為 Facebook
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then Facebook Template 以 Carousel 形式呈現 3 張卡片
        # [事件風暴部位: Read Model - FacebookCarouselPreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 依 Facebook 規格渲染卡片與按鈕（按鈕仍以每卡最多 3 顆為上限）
        # [事件風暴部位: Read Model - FacebookCarouselPreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不刪除卡片或按鈕，僅套用 Facebook 樣式與欄位規格
        # [事件風暴部位: Aggregate - FacebookCarouselDraft]
        # [生成參考 Prompt: Aggregate-Then-Handler.md]


class TestFacebook圖片裁切方式:
    """
    Rule：Facebook 模板上傳圖片時，前端自動裁切/縮放為 1.91:1 後才預覽與上傳
    """

    def test_Facebook上傳圖片自動裁切(self):
        # Given 發佈渠道為 Facebook，使用者上傳圖片（任意原始比例）
        # [事件風暴部位: Command - upload_facebook_image]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 前端以 Canvas 自動裁切/縮放為 1.91:1 後預覽
        # [事件風暴部位: Read Model - FacebookImagePreview]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 將裁切後檔案上傳並儲存
        # [事件風暴部位: Command - persist_cropped_image]
        # [生成參考 Prompt: Command-Handler.md]

        # And 不接受未裁切的任意比例圖片直接上傳
        # [事件風暴部位: Success-Failure - reject_uncropped_upload]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class TestCarousel按鈕上限規則:
    """
    Rule：LINE 與 Facebook 的 Carousel 皆採「每張卡片最多 3 顆按鈕」，不共用總額度
    """

    def test_三張卡片各自上限(self):
        # Given 發佈渠道為 LINE 或 Facebook
        # [事件風暴部位: Aggregate - ChannelContext]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And Carousel 共有 3 張卡片
        # [事件風暴部位: Aggregate - CarouselDraft]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 每張卡片皆已新增 3 顆按鈕
        # [事件風暴部位: Command - add_carousel_button]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統於該卡片隱藏「新增按鈕」，但不影響其他卡片的按鈕新增
        # [事件風暴部位: Read Model - CarouselButtonLimitUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class Test跨渠道切換內容與發送對象處理:
    """
    Rule：跨渠道切換時保留可映射欄位並提示不支援欄位；切換時發送對象自動重新計算僅保留綁定新渠道會員
    """

    def test_LINE轉Facebook映射欄位與發送對象重算(self):
        # Given 使用者於 LINE 已填寫以下欄位表格
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者切換「發佈渠道」為 Facebook
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then Facebook 模板應自動帶入相同欄位內容表格
        # [事件風暴部位: Read Model - FacebookTemplateMappedFields]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 以下欄位因不支援 Facebook UI 而隱藏，但仍須保留暫存值
        # [事件風暴部位: Read Model - FieldVisibilityState]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And Facebook 按鈕邏輯為「連結網址、互動標籤 二擇一」
        # [事件風暴部位: Read Model - FacebookButtonRule]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 預設優先保留 LINE 連結網址對應顯示於 Facebook 的 UI 欄位
        # [事件風暴部位: Read Model - FieldMappingPriority]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 互動標籤需自動隱藏但不可清除（於切回 LINE 時復原）
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Then-Handler.md]

        # And 使用者可於 Facebook 介面中進行以上欄位的微調
        # [事件風暴部位: Read Model - FacebookTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不需重新重新上傳圖片或重新輸入欄位
        # [事件風暴部位: Success-Failure - avoid_reupload_on_switch]
        # [生成參考 Prompt: Success-Failure-Handler.md]

        # And 系統自動重新計算發送對象，僅保留已綁定 Facebook 的會員；未綁定者剔除並提示剔除數量
        # [事件風暴部位: Command - recalc_audience_for_channel]
        # [生成參考 Prompt: Command-Handler.md]

    def test_Facebook回切LINE保留暫存值並重算對象(self):
        # Given 使用者於 Facebook 已填寫以下欄位表格
        # [事件風暴部位: Aggregate - FacebookMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者切換「發佈渠道」為 LINE
        # [事件風暴部位: Command - switch_publish_channel]
        # [生成參考 Prompt: Command-Handler.md]

        # Then LINE 模板應自動帶入相同欄位內容表格
        # [事件風暴部位: Read Model - LineTemplateMappedFields]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 使用者可於 LINE 基於相同內容微調
        # [事件風暴部位: Read Model - LineTemplateUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 不需重新重新上傳圖片或重新輸入欄位
        # [事件風暴部位: Success-Failure - avoid_reupload_on_switch]
        # [生成參考 Prompt: Success-Failure-Handler.md]

        # And 系統自動重新計算發送對象，僅保留已綁定 LINE 的會員；未綁定者剔除並提示剔除數量
        # [事件風暴部位: Command - recalc_audience_for_channel]
        # [生成參考 Prompt: Command-Handler.md]

    def test_訊息發佈後暫存不再跨渠道保留(self):
        # Given 使用者於任一渠道完成訊息發佈
        # [事件風暴部位: Command - publish_message]
        # [生成參考 Prompt: Command-Handler.md]

        # When 訊息狀態為「已發佈」
        # [事件風暴部位: Aggregate - MessageStatus]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # Then 暫存值不再需跨渠道保留
        # [事件風暴部位: Aggregate - TemplateDraft]
        # [生成參考 Prompt: Aggregate-Then-Handler.md]

        # And 後續如再切換渠道則需重新建立或載入新模板
        # [事件風暴部位: Success-Failure - require_new_template_after_publish]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class TestInstagram支援範圍:
    """
    Rule：多渠道推播目前僅支援 LINE / Facebook，Instagram 不開放選取
    """

    def test_下拉選單不含Instagram(self):
        # Given 使用者開啟多渠道推播編輯器
        # [事件風暴部位: Command - open_multichannel_editor]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 發佈渠道選項僅包含「LINE」「Facebook」
        # [事件風暴部位: Read Model - ChannelDropdown]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 無 Instagram 選項，亦無 Instagram 模板/預覽/發送流程
        # [事件風暴部位: Success-Failure - instagram_option_blocked]
        # [生成參考 Prompt: Success-Failure-Handler.md]


class Test按鈕數量上限:
    """
    Rule：LINE 與 FB 模板每則最多可新增 3 個 Button
    """

    def test_達到三顆按鈕後隱藏新增(self):
        # Given Template 已建立 3 顆 Button
        # [事件風暴部位: Aggregate - MessageTemplateButtons]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 使用者於該訊息已新增至 3 顆按鈕
        # [事件風暴部位: Command - add_template_button]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統隱藏「新增按鈕」
        # [事件風暴部位: Read Model - ButtonLimitUI]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestLINE按鈕Link與Tag可並存:
    """
    Rule：LINE Template 的動作按鈕可同時設定 Link + Tag 不互斥
    """

    def test_LINE按鈕允許Link加Tag(self):
        # Given 使用者於 LINE 設定動作按鈕
        # [事件風暴部位: Aggregate - LineButtonConfig]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 使用者新增動作按鈕一設定文字為「立即預約」
        # [事件風暴部位: Aggregate - LineButtonConfig]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 設定連結網址 Link=”http://example.com”
        # [事件風暴部位: Command - set_button_link]
        # [生成參考 Prompt: Command-Handler.md]

        # And 設定互動標籤 Tag=#促銷
        # [事件風暴部位: Command - set_button_tag]
        # [生成參考 Prompt: Command-Handler.md]

        # And 設定按鈕樣式 Style=綠色實心
        # [事件風暴部位: Command - set_button_style]
        # [生成參考 Prompt: Command-Handler.md]

        # And 確認所有訊息必填欄位已設定
        # [事件風暴部位: Aggregate - LineMessageTemplate]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # When 點擊按鈕「發佈訊息」
        # [事件風暴部位: Command - publish_message]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 系統應允許成功儲存
        # [生成參考 Prompt: Success-Failure-Handler.md]


class TestFacebook按鈕Link與Tag互斥:
    """
    Rule：Facebook Template 的動作按鈕不可同時含 Link + Tag，必須二選一
    """

    def test_勾選Tag時Link強制關閉(self):
        # Given 使用者於 Facebook 按鈕設定互動標籤
        # [事件風暴部位: Aggregate - FacebookButtonConfig]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 設定互動標籤為「訂房行為」Tag=#訂房行為
        # [事件風暴部位: Command - set_button_tag]
        # [生成參考 Prompt: Command-Handler.md]

        # When 勾選連結網址
        # [事件風暴部位: Command - toggle_button_link_option]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 互動標籤欄位應自動清空並 disabled
        # [事件風暴部位: Read Model - FacebookButtonRule]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 顯示連結網址欄位且為必填
        # [事件風暴部位: Read Model - FacebookButtonRule]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 使用者可於欄位輸入 URL=”http://hotel.com”
        # [事件風暴部位: Command - set_button_link]
        # [生成參考 Prompt: Command-Handler.md]

    def test_勾選Link時Tag強制關閉(self):
        # Given 使用者於 Facebook 按鈕設定連結網址
        # [事件風暴部位: Aggregate - FacebookButtonConfig]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 設定連結網址為 URL=”http://hotel.com”
        # [事件風暴部位: Command - set_button_link]
        # [生成參考 Prompt: Command-Handler.md]

        # When 勾選互動標籤
        # [事件風暴部位: Command - toggle_button_tag_option]
        # [生成參考 Prompt: Command-Handler.md]

        # Then 連結網址欄位 URL 應自動清空並 disabled
        # [事件風暴部位: Read Model - FacebookButtonRule]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 顯示互動標籤欄位且為必填
        # [事件風暴部位: Read Model - FacebookButtonRule]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 須設定額外欄位為「觸發訊息文字」
        # [事件風暴部位: Read Model - FacebookButtonRule]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]


class TestFacebookTag可填觸發回覆訊息:
    """
    Rule：Facebook Button 選 Tag 時可額外輸入回覆訊息（可選填）
    """

    def test_Facebook按鈕Tag回覆訊息(self):
        # Given Facebook 按鈕設定 Tag=#訂房行為
        # [事件風暴部位: Aggregate - FacebookButtonConfig]
        # [生成參考 Prompt: Aggregate-Given-Handler.md]

        # And 觸發文字設定為「快來看看吧 http://example.com」
        # [事件風暴部位: Command - set_button_reply_text]
        # [生成參考 Prompt: Command-Handler.md]

        # When 使用者觸發訊息動作按鈕時
        # [事件風暴部位: Event - button_clicked]
        # [生成參考 Prompt: Event-Handler.md]

        # Then 點擊系統後會回覆「快來看看吧 http://example.com」
        # [事件風暴部位: Read Model - ReplyMessage]
        # [生成參考 Prompt: ReadModel-Then-Handler.md]

        # And 將使用者自動貼上互動標籤 #訂房行為
        # [事件風暴部位: Command - tag_user_on_click]
        # [生成參考 Prompt: Command-Handler.md]
