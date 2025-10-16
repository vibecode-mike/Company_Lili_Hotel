/**
 * 建立群發訊息頁面
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Select, Radio, Upload, Button, Tabs, message } from 'antd';
import { UploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { CampaignCreate, TemplateType, TargetAudience, ScheduleType, InteractionType } from '@/types/campaign';
import { createCampaign } from '@/services/api/campaign';
import AudienceSelector from '@/components/AudienceSelector';
import './CampaignCreatePage.css';

const { TextArea } = Input;
const { Option } = Select;

// 輪播項目接口
interface CarouselItem {
  id: string;
  fileList: UploadFile[];
  actionButtonEnabled: boolean;
  actionButtonText: string;
  actionButtonInteractionType: InteractionType;
  actionButtonTag: string;
}

const CampaignCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTemplateType = location.state?.templateType || 'image';

  const [activeTab, setActiveTab] = useState('preview');
  const [templateType, setTemplateType] = useState(initialTemplateType);
  const [formData, setFormData] = useState<Partial<CampaignCreate>>({
    template_type: 'image_click',
    target_audience: 'all',
    schedule_type: 'immediate',
    interaction_type: 'none',
  });
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [triggerImageList, setTriggerImageList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // 輪播相關狀態
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([
    {
      id: '1',
      fileList: [],
      actionButtonEnabled: false,
      actionButtonText: '',
      actionButtonInteractionType: 'none',
      actionButtonTag: '',
    }
  ]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // 動作按鈕狀態
  const [actionButton1Enabled, setActionButton1Enabled] = useState(false);
  const [actionButton2Enabled, setActionButton2Enabled] = useState(false);
  const [actionButton1Text, setActionButton1Text] = useState('');
  const [actionButton2Text, setActionButton2Text] = useState('');
  const [actionButton1InteractionType, setActionButton1InteractionType] = useState<InteractionType>('none');
  const [actionButton2InteractionType, setActionButton2InteractionType] = useState<InteractionType>('none');
  const [actionButton1Tag, setActionButton1Tag] = useState('');
  const [actionButton2Tag, setActionButton2Tag] = useState('');

  // 當前輪播項目
  const currentItem = carouselItems[currentCarouselIndex];

  const handleUploadChange = (info: any) => {
    // 針對圖片點擊型和圖卡按鈕型，更新當前輪播項目的圖片
    if (templateType === 'image' || templateType === 'image_text') {
      const updatedItems = [...carouselItems];
      updatedItems[currentCarouselIndex] = {
        ...updatedItems[currentCarouselIndex],
        fileList: info.fileList,
      };
      setCarouselItems(updatedItems);
    } else {
      // 其他模板類型使用原有的 fileList 狀態
      setFileList(info.fileList);
    }

    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上傳成功`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上傳失敗`);
    }
  };

  const handleTriggerImageChange = (info: any) => {
    setTriggerImageList(info.fileList);
  };

  // 輪播處理函數
  const handleAddCarousel = () => {
    const newItem: CarouselItem = {
      id: Date.now().toString(),
      fileList: [],
      actionButtonEnabled: false,
      actionButtonText: '',
      actionButtonInteractionType: 'none',
      actionButtonTag: '',
    };
    setCarouselItems([...carouselItems, newItem]);
    setCurrentCarouselIndex(carouselItems.length);
    message.success('已新增輪播項目');
  };

  const handlePrevCarousel = () => {
    setCurrentCarouselIndex((prev) =>
      prev > 0 ? prev - 1 : carouselItems.length - 1
    );
  };

  const handleNextCarousel = () => {
    setCurrentCarouselIndex((prev) =>
      prev < carouselItems.length - 1 ? prev + 1 : 0
    );
  };

  const handleSelectCarousel = (index: number) => {
    setCurrentCarouselIndex(index);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // 驗證必填欄位
    if (!formData.notification_text || !formData.preview_text) {
      message.error('請填寫必填欄位');
      return;
    }

    try {
      setLoading(true);

      // 處理圖片路徑（針對輪播）
      let imagePath: string | undefined;
      let carouselData = undefined;

      if (templateType === 'image' || templateType === 'image_text') {
        // 輪播模式：構建輪播數據
        if (carouselItems.length > 0) {
          // 使用第一個輪播項目的圖片作為主圖片
          if (carouselItems[0].fileList.length > 0) {
            imagePath = `/uploads/${carouselItems[0].fileList[0].name}`;
          }

          // 構建輪播項目數據
          carouselData = carouselItems.map((item, index) => ({
            image_path: item.fileList.length > 0 ? `/uploads/${item.fileList[0].name}` : '',
            title: formData.title || '',
            description: formData.notification_text || '',
            action_url: item.actionButtonInteractionType === 'open_url' ? formData.url : undefined,
            interaction_tag: item.actionButtonTag || undefined,
            action_button_enabled: item.actionButtonEnabled,
            action_button_text: item.actionButtonText || '',
            action_button_interaction_type: item.actionButtonInteractionType,
            sort_order: index,
          }));
        }
      } else {
        // 非輪播模式：使用原有的 fileList
        imagePath = fileList.length > 0 ? `/uploads/${fileList[0].name}` : undefined;
      }

      // 獲取互動標籤（圖片類型從 currentItem，其他類型從 formData）
      let interactionTag: string | undefined;
      if (templateType === 'image' || templateType === 'image_text') {
        interactionTag = carouselItems[0]?.actionButtonTag || undefined;
      } else {
        interactionTag = formData.interaction_tag || actionButton1Tag || undefined;
      }

      // 構建提交資料
      const submitData: CampaignCreate = {
        // 圖片路徑
        image_path: imagePath,

        // 互動類型相關
        interaction_type: formData.interaction_type,
        interaction_tag: interactionTag,
        url: formData.interaction_type === 'open_url' ? formData.url : undefined,
        trigger_message: formData.interaction_type === 'trigger_message' ? formData.trigger_message : undefined,
        trigger_image_path: formData.interaction_type === 'trigger_image' && triggerImageList.length > 0
          ? `/uploads/${triggerImageList[0].name}`
          : undefined,

        // 訊息相關
        title: formData.title,
        notification_text: formData.notification_text!,
        preview_text: formData.preview_text!,
        template_type: formData.template_type!,

        // 發送相關
        target_audience: formData.target_audience!,
        target_tags: formData.target_tags,
        schedule_type: (isDraft ? 'draft' : formData.schedule_type!) as ScheduleType,
        scheduled_at: formData.scheduled_at,

        // 輪播相關
        carousel_items: carouselData,
      };

      console.log('發送的 JSON 數據:', JSON.stringify(submitData, null, 2));
      await createCampaign(submitData);
      message.success(isDraft ? '已儲存草稿' : '訊息已發送');

      // 跳轉到列表頁
      setTimeout(() => {
        navigate('/campaigns');
      }, 1000);

    } catch (error: any) {
      console.error('提交失敗:', error);
      message.error(error.response?.data?.detail || '操作失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campaign-create-page">
      <div className="breadcrumb">
        群發訊息 <span>&gt;</span> 建立群發訊息
      </div>

      <h1 className="page-title">建立群發訊息</h1>
      <p className="page-description">建立並發送推播訊息給會員</p>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="campaign-tabs"
        items={[
          { key: 'preview', label: '預覽' },
          { key: 'test', label: '測試' },
        ]}
      />

      <div className="editor-container">
        {/* 表單區 */}
        <div className="form-section">
          {/* 模板類型選擇 - 移到最上方 */}
          <div className="form-group-inline">
            <label className="form-label-inline">
              模板類型<span className="required">*</span>
            </label>
            <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Select
                className="form-select"
                style={{ flex: 1 }}
                value={templateType}
                onChange={(value: string) => {
                  setTemplateType(value);
                  // 同步更新 formData 中的 template_type
                  const templateTypeMap: Record<string, TemplateType> = {
                    'text': 'text',
                    'image_text': 'image_card',
                    'image': 'image_click',
                  };
                  setFormData({ ...formData, template_type: templateTypeMap[value] });
                }}
              >
                <Option value="text">文字按鈕確認型</Option>
                <Option value="image_text">圖卡按鈕型</Option>
                <Option value="image">圖片點擊型</Option>
              </Select>
              {(templateType === 'image' || templateType === 'image_text') && (
                <Button type="primary" onClick={handleAddCarousel}>新增輪播</Button>
              )}
            </div>
          </div>

          {/* 圖卡按鈕型：顯示圖片上傳 */}
          {templateType === 'image_text' && (
            <div className="form-group-inline">
              <label className="form-label-inline">
                上傳圖片<span className="required">*</span>
              </label>
              <div style={{ flex: 1 }}>
                <Upload
                  listType="picture-card"
                  fileList={currentItem.fileList}
                  onChange={handleUploadChange}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  {currentItem.fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>選取檔案</div>
                    </div>
                  )}
                </Upload>
                <div className="form-help">
                  • 格式支援 JPG、JPEG、PNG
                  <br />• 每張圖片大小不超過 1 MB
                </div>
              </div>
            </div>
          )}

          {/* 圖片點擊型：顯示圖片上傳 */}
          {templateType === 'image' && (
            <div className="form-group-inline">
              <label className="form-label-inline">
                上傳圖片<span className="required">*</span>
              </label>
              <div style={{ flex: 1 }}>
                <Upload
                  listType="picture-card"
                  fileList={currentItem.fileList}
                  onChange={handleUploadChange}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  {currentItem.fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>選取檔案</div>
                    </div>
                  )}
                </Upload>
                <div className="form-help">
                  • 格式支援 JPG、JPEG、PNG
                  <br />• 每張圖片大小不超過 1 MB
                </div>
              </div>
            </div>
          )}

          {/* 文字型：訊息文字在最上方 */}
          {templateType === 'text' && (
            <div className="form-group">
              <label className="form-label">
                訊息文字<span className="required">*</span>
                <InfoCircleOutlined className="info-icon" />
              </label>
              <TextArea
                className="form-textarea"
                placeholder="輸入訊息文字將會傳送至聊天室"
                rows={4}
                value={formData.notification_text}
                onChange={(e) => setFormData({ ...formData, notification_text: e.target.value })}
              />
            </div>
          )}

          {/* 動作按鈕一 */}
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                style={{ marginRight: 8 }}
                checked={
                  templateType === 'image' || templateType === 'image_text'
                    ? currentItem.actionButtonEnabled
                    : actionButton1Enabled
                }
                onChange={(e) => {
                  if (templateType === 'image' || templateType === 'image_text') {
                    const updatedItems = [...carouselItems];
                    updatedItems[currentCarouselIndex] = {
                      ...updatedItems[currentCarouselIndex],
                      actionButtonEnabled: e.target.checked,
                    };
                    setCarouselItems(updatedItems);
                  } else {
                    setActionButton1Enabled(e.target.checked);
                  }
                }}
              />
              動作按鈕
              <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
            </label>
            {((templateType === 'image' || templateType === 'image_text') ? currentItem.actionButtonEnabled : actionButton1Enabled) && (
              <Input
                className="form-input"
                placeholder="輸入動作按鈕的說明"
                style={{ marginTop: 8 }}
                value={
                  templateType === 'image' || templateType === 'image_text'
                    ? currentItem.actionButtonText
                    : actionButton1Text
                }
                onChange={(e) => {
                  if (templateType === 'image' || templateType === 'image_text') {
                    const updatedItems = [...carouselItems];
                    updatedItems[currentCarouselIndex] = {
                      ...updatedItems[currentCarouselIndex],
                      actionButtonText: e.target.value,
                    };
                    setCarouselItems(updatedItems);
                  } else {
                    setActionButton1Text(e.target.value);
                  }
                }}
              />
            )}
          </div>

          {((templateType === 'image' || templateType === 'image_text') ? currentItem.actionButtonEnabled : actionButton1Enabled) && (
            <>
              {/* 互動類型 */}
              <div className="form-group-inline">
                <label className="form-label-inline">
                  互動類型<span className="required">*</span>
                </label>
                <Select
                  className="form-select"
                  placeholder={templateType === 'text' ? '選擇互動類型' : '觸發新訊息'}
                  value={
                    templateType === 'image' || templateType === 'image_text'
                      ? currentItem.actionButtonInteractionType
                      : actionButton1InteractionType
                  }
                  onChange={(value: InteractionType) => {
                    if (templateType === 'image' || templateType === 'image_text') {
                      const updatedItems = [...carouselItems];
                      updatedItems[currentCarouselIndex] = {
                        ...updatedItems[currentCarouselIndex],
                        actionButtonInteractionType: value,
                      };
                      setCarouselItems(updatedItems);
                    } else {
                      setActionButton1InteractionType(value);
                    }
                  }}
                >
                  <Option value="none">無互動</Option>
                  <Option value="trigger_message">觸發新訊息</Option>
                  <Option value="open_url">開啟網址連結</Option>
                  <Option value="trigger_image">觸發新圖片</Option>
                </Select>
              </div>

              {/* 當選擇觸發新訊息時顯示訊息文字欄位 */}
              {((templateType === 'image' || templateType === 'image_text')
                ? currentItem.actionButtonInteractionType
                : actionButton1InteractionType) === 'trigger_message' && (
                <div className="form-group-inline">
                  <label className="form-label-inline">
                    訊息文字<span className="required">*</span>
                  </label>
                  <TextArea
                    className="form-textarea"
                    placeholder="輸入觸發的訊息文字"
                    rows={3}
                    value={formData.trigger_message}
                    onChange={(e) => setFormData({ ...formData, trigger_message: e.target.value })}
                  />
                </div>
              )}
            </>
          )}

          {/* 互動標籤 - 圖片類型始終顯示 */}
          {(templateType === 'image' || templateType === 'image_text') && (
            <div className="form-group-inline">
              <label className="form-label-inline">
                互動標籤
                <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
              </label>
              <Input
                className="form-input"
                placeholder="輸入互動標籤"
                value={
                  templateType === 'image' || templateType === 'image_text'
                    ? currentItem.actionButtonTag
                    : actionButton1Tag
                }
                onChange={(e) => {
                  if (templateType === 'image' || templateType === 'image_text') {
                    const updatedItems = [...carouselItems];
                    updatedItems[currentCarouselIndex] = {
                      ...updatedItems[currentCarouselIndex],
                      actionButtonTag: e.target.value,
                    };
                    setCarouselItems(updatedItems);
                  } else {
                    setActionButton1Tag(e.target.value);
                  }
                }}
              />
            </div>
          )}

          {/* 文字型的互動標籤（只在動作按鈕啟用時顯示） */}
          {templateType === 'text' && actionButton1Enabled && (
            <div className="form-group-inline">
              <label className="form-label-inline">
                互動標籤
                <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
              </label>
              <Input
                className="form-input"
                placeholder="可依據會員互動結果自動貼上標籤"
                value={actionButton1Tag}
                onChange={(e) => setActionButton1Tag(e.target.value)}
              />
            </div>
          )}

          {/* 文字型：第二個動作按鈕 */}
          {templateType === 'text' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    style={{ marginRight: 8 }}
                    checked={actionButton2Enabled}
                    onChange={(e) => setActionButton2Enabled(e.target.checked)}
                  />
                  動作按鈕二
                  <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
                </label>
                {actionButton2Enabled && (
                  <Input
                    className="form-input"
                    placeholder="輸入動作按鈕的說明"
                    style={{ marginTop: 8 }}
                    value={actionButton2Text}
                    onChange={(e) => setActionButton2Text(e.target.value)}
                  />
                )}
              </div>

              {actionButton2Enabled && (
                <>
                  <div className="form-group-inline">
                    <label className="form-label-inline">
                      互動類型<span className="required">*</span>
                    </label>
                    <Select
                      className="form-select"
                      placeholder="選擇互動類型"
                      value={actionButton2InteractionType}
                      onChange={(value: InteractionType) => setActionButton2InteractionType(value)}
                    >
                      <Option value="none">無互動</Option>
                      <Option value="trigger_message">觸發新訊息</Option>
                      <Option value="open_url">開啟網址連結</Option>
                      <Option value="trigger_image">觸發新圖片</Option>
                    </Select>
                  </div>

                  {/* 當選擇觸發新訊息時顯示訊息文字欄位 */}
                  {actionButton2InteractionType === 'trigger_message' && (
                    <div className="form-group-inline">
                      <label className="form-label-inline">
                        訊息文字<span className="required">*</span>
                      </label>
                      <TextArea
                        className="form-textarea"
                        placeholder="輸入觸發的訊息文字"
                        rows={3}
                        value={formData.trigger_message}
                        onChange={(e) => setFormData({ ...formData, trigger_message: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group-inline">
                    <label className="form-label-inline">
                      互動標籤
                      <InfoCircleOutlined className="info-icon" style={{ marginLeft: 8 }} />
                    </label>
                    <Input
                      className="form-input"
                      placeholder="可依據會員互動結果自動貼上標籤"
                      value={actionButton2Tag}
                      onChange={(e) => setActionButton2Tag(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* 按鈕型：訊息文字在互動設定之後 */}
          {templateType === 'image_text' && (
            <div className="form-group">
              <label className="form-label">
                訊息文字<span className="required">*</span>
                <InfoCircleOutlined className="info-icon" />
              </label>
              <TextArea
                className="form-textarea"
                placeholder="輸入訊息文字將會傳送至聊天室"
                rows={4}
                value={formData.notification_text}
                onChange={(e) => setFormData({ ...formData, notification_text: e.target.value })}
              />
            </div>
          )}

          {/* 根據互動類型顯示對應的輸入欄位 */}
          {formData.interaction_type === 'open_url' && (
            <div className="form-group">
              <label className="form-label">
                URL<span className="required">*</span>
                <InfoCircleOutlined className="info-icon" />
              </label>
              <Input
                className="form-input"
                placeholder="貼上網址或是開啟位置連結"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              <div className="form-help">Hint：請輸入有效網址</div>
            </div>
          )}

          {formData.interaction_type === 'trigger_message' && (
            <div className="form-group">
              <label className="form-label">
                觸發訊息文字<span className="required">*</span>
              </label>
              <Input
                className="form-input"
                placeholder="輸入觸發的訊息文字"
                value={formData.trigger_message}
                onChange={(e) => setFormData({ ...formData, trigger_message: e.target.value })}
              />
            </div>
          )}

          {formData.interaction_type === 'trigger_image' && (
            <div className="form-group">
              <label className="form-label">
                觸發圖片<span className="required">*</span>
              </label>
              <Upload
                listType="picture-card"
                fileList={triggerImageList}
                onChange={handleTriggerImageChange}
                maxCount={1}
                beforeUpload={() => false}
              >
                {triggerImageList.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>選取圖片</div>
                  </div>
                )}
              </Upload>
            </div>
          )}

          <div className="form-divider">
            <h3>建立群發訊息</h3>

            <div className="form-group-inline">
              <label className="form-label-inline">
                標題
                <InfoCircleOutlined className="info-icon" />
              </label>
              <Input
                className="form-input"
                placeholder="輸入群發訊息標題"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group-inline">
              <label className="form-label-inline">
                通知訊息<span className="required">*</span>
                <InfoCircleOutlined className="info-icon" />
              </label>
              <TextArea
                className="form-textarea"
                placeholder="輸入推播通知顯示的訊息文字"
                rows={3}
                value={formData.notification_text}
                onChange={(e) => setFormData({ ...formData, notification_text: e.target.value })}
              />
            </div>

            <div className="form-group-inline">
              <label className="form-label-inline">
                訊息預覽<span className="required">*</span>
                <InfoCircleOutlined className="info-icon" />
              </label>
              <TextArea
                className="form-textarea"
                placeholder="輸入出現在對話清單顯示的文字"
                rows={3}
                value={formData.preview_text}
                onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
              />
            </div>

            <AudienceSelector
              value={formData.target_audience || 'all'}
              onChange={(value) => setFormData({ ...formData, target_audience: value })}
              selectedTags={selectedTags}
              onTagsChange={(tags) => {
                setSelectedTags(tags);
                setFormData({ ...formData, target_tags: tags.map(String) });
              }}
            />

            <div className="form-group">
              <label className="form-label">
                排程發送<span className="required">*</span>
                <InfoCircleOutlined className="info-icon" />
              </label>
              <Radio.Group
                className="radio-group"
                value={formData.schedule_type}
                onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value as ScheduleType })}
              >
                <Radio value="immediate">立即發送</Radio>
                <Radio value="scheduled">自訂時間</Radio>
              </Radio.Group>
              {formData.schedule_type === 'scheduled' && (
                <div className="datetime-input">
                  <Input
                    type="datetime-local"
                    className="form-input"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <Button className="btn-secondary" onClick={() => handleSubmit(true)} loading={loading} disabled={loading}>
              儲存草稿
            </Button>
            <Button type="primary" onClick={() => handleSubmit(false)} loading={loading} disabled={loading}>
              發布給用戶
            </Button>
          </div>
        </div>

        {/* 預覽區 */}
        <div className="preview-section">
          <div className="phone-indicator">A</div>
          <div className={`preview-card ${templateType === 'image' ? 'no-padding' : ''}`}>
            {templateType === 'text' && (
              <div className="preview-text-template">
                <div className="preview-text-content">
                  {formData.notification_text || '純文字'}
                </div>
                <div className="preview-text-buttons">
                  <button>Yes</button>
                  <button>No</button>
                </div>
              </div>
            )}

            {templateType === 'image_text' && (
              <div className="preview-image-text-template">
                <div className="preview-image">
                  {currentItem.fileList.length > 0 ? (
                    <img src={URL.createObjectURL(currentItem.fileList[0].originFileObj as Blob)} alt="預覽" />
                  ) : (
                    <div className="preview-image-placeholder">圖片</div>
                  )}
                </div>
                <div className="preview-text-section">
                  <div className="preview-title">{formData.title || '標題'}</div>
                  <div className="preview-content">{formData.notification_text || '內文'}</div>
                  <div className="preview-cta-buttons">
                    <button>CTA 1</button>
                    <button>CTA 2</button>
                  </div>
                </div>
              </div>
            )}

            {templateType === 'image' && (
              <div className="preview-image-template">
                {currentItem.fileList.length > 0 ? (
                  <img src={URL.createObjectURL(currentItem.fileList[0].originFileObj as Blob)} alt="預覽" />
                ) : (
                  <div className="preview-image-placeholder-large">純圖片</div>
                )}
                {currentItem.actionButtonEnabled && (
                  <button className="preview-action-button">
                    {currentItem.actionButtonText || '動作按鈕'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 輪播導航控制器 */}
          {(templateType === 'image' || templateType === 'image_text') && carouselItems.length > 1 && (
            <div className="carousel-navigation">
              <button className="carousel-nav-btn" onClick={handlePrevCarousel}>
                &lt;
              </button>
              <div className="carousel-page-numbers">
                {carouselItems.map((item, index) => (
                  <button
                    key={item.id}
                    className={`carousel-page-number ${index === currentCarouselIndex ? 'active' : ''}`}
                    onClick={() => handleSelectCarousel(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button className="carousel-nav-btn" onClick={handleNextCarousel}>
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignCreatePage;
