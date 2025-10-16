/**
 * 模板選擇模態對話框
 */
import { useState } from 'react';
import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './TemplateSelectionModal.css';

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

interface TemplateOption {
  id: string;
  name: string;
  layout: 'text' | 'image_text' | 'image';
}

interface DraftItem {
  id: number;
  title: string;
  type: string;
  status: string;
  lastEditTime: string;
  createTime: string;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCarouselControls, setShowCarouselControls] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const templates: TemplateOption[] = [
    { id: 'text', name: '文字按鈕確認型', layout: 'text' },
    { id: 'image_text', name: '圖卡按鈕型', layout: 'image_text' },
    { id: 'image', name: '圖片點擊型', layout: 'image' },
  ];

  // Mock draft data
  const recentDrafts: DraftItem[] = [
    {
      id: 1,
      title: '中秋豪華禮盒推播',
      type: '圖片點擊型',
      status: '草稿',
      lastEditTime: 'yyyy-mm-dd hh:mm',
      createTime: 'yyyy-mm-dd hh:mm',
    },
    {
      id: 2,
      title: '中秋頂級禮盒推播',
      type: '圖片點擊型',
      status: '草稿',
      lastEditTime: 'yyyy-mm-dd hh:mm',
      createTime: 'yyyy-mm-dd hh:mm',
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleStartCreate = () => {
    if (selectedTemplate) {
      navigate('/campaigns/create', { state: { templateType: selectedTemplate } });
      onClose();
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : templates.length - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev < templates.length - 1 ? prev + 1 : 0));
  };

  const renderTemplatePreview = (template: TemplateOption) => {
    switch (template.layout) {
      case 'text':
        return (
          <div className="template-preview text-template">
            <div className="template-preview-content">
              <p className="text-content">純文字</p>
            </div>
            <div className="template-preview-buttons">
              <button className="preview-btn">Yes</button>
              <button className="preview-btn">No</button>
            </div>
          </div>
        );
      case 'image_text':
        return (
          <div className="template-preview image-text-template">
            <div className="template-preview-image">圖片</div>
            <div className="template-preview-text">
              <p className="preview-title">標題</p>
              <p className="preview-content">內文</p>
            </div>
            <div className="template-preview-cta">
              <button className="preview-cta-btn">CTA 1</button>
              <button className="preview-cta-btn">CTA 2</button>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="template-preview image-template">
            <div className="template-preview-image-only">純圖片</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      className="template-selection-modal"
      closable={true}
      closeIcon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#6E6E6E"/>
        </svg>
      }
    >
      <div className="modal-content">
        {/* Modal Title */}
        <div className="modal-header">
          <h2>建立群發訊息</h2>
          <p className="modal-description">
            選擇一個模板開始建立。建立過程皆可隨時切換成不同模板。
          </p>
        </div>

        {/* Template Carousel */}
        <div
          className="template-carousel-container"
          onMouseEnter={() => setShowCarouselControls(true)}
          onMouseLeave={() => setShowCarouselControls(false)}
        >
          <div className="template-carousel">
            <div
              className="template-carousel-track"
              style={{ transform: `translateX(-${currentSlide * (100 / 3)}%)` }}
            >
              {templates.map((template) => (
                <div key={template.id} className="template-carousel-item">
                  <button
                    className={`template-card-button ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="template-card-preview">
                      {renderTemplatePreview(template)}
                    </div>
                  </button>
                  <p className="template-name">{template.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Navigation */}
          {showCarouselControls && (
            <>
              <button className="carousel-nav-btn carousel-prev" onClick={handlePrevSlide}>
                <LeftOutlined />
              </button>
              <button className="carousel-nav-btn carousel-next" onClick={handleNextSlide}>
                <RightOutlined />
              </button>
            </>
          )}
        </div>

        {/* Recent Drafts Section */}
        <div className="recent-drafts-section">
          <h3 className="section-title">最近編輯（保留近{'{時間區段}'}的草稿內容）</h3>

          {/* Table Header */}
          <div className="drafts-table-header">
            <div className="drafts-header-cell title-col">標題</div>
            <div className="drafts-header-cell type-col">類型</div>
            <div className="drafts-header-cell status-col">狀態</div>
            <div className="drafts-header-cell time-col">上次編輯時間</div>
            <div className="drafts-header-cell time-col">建立時間</div>
            <div className="drafts-header-cell action-col"></div>
          </div>

          {/* Table Rows */}
          <div className="drafts-table-body">
            {recentDrafts.map((draft) => (
              <div key={draft.id} className="drafts-table-row">
                <div className="drafts-cell title-col">{draft.title}</div>
                <div className="drafts-cell type-col">{draft.type}</div>
                <div className="drafts-cell status-col">{draft.status}</div>
                <div className="drafts-cell time-col">{draft.lastEditTime}</div>
                <div className="drafts-cell time-col">{draft.createTime}</div>
                <div className="drafts-cell action-col">
                  <button className="edit-btn">
                    編輯
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="edit-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="modal-footer">
          <button
            className="btn-start"
            onClick={handleStartCreate}
            disabled={!selectedTemplate}
          >
            開始建立
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateSelectionModal;
