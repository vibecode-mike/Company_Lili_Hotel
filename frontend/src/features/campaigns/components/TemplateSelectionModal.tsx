/**
 * 模板選擇模態對話框
 */
import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import './TemplateSelectionModal.css';

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

interface TemplateOption {
  id: string;
  layout: 'text' | 'image_text' | 'image';
  preview: React.ReactNode;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const templates: TemplateOption[] = [
    {
      id: 'text',
      layout: 'text',
      preview: (
        <>
          <div className="template-card">
            <div className="preview-text-top">純文字</div>
            <div className="preview-text-buttons">
              <button>Yes</button>
              <button>No</button>
            </div>
          </div>
          <div className="preview-text-bottom">確認型</div>
        </>
      ),
    },
    {
      id: 'image_text',
      layout: 'image_text',
      preview: (
        <>
          <div className="template-card">
            <div className="preview-image-title">圖片</div>
            <div className="preview-image-section">
              <div className="preview-text-lines">
                <div className="title">標題</div>
                <div className="content">內文</div>
              </div>
              <div className="preview-cta">
                <button>CTA 1</button>
                <button>CTA 2</button>
              </div>
            </div>
          </div>
          <div className="preview-text-bottom">按鈕型</div>
        </>
      ),
    },
    {
      id: 'image',
      layout: 'image',
      preview: (
        <>
          <div className="template-card">
            <div className="preview-image-title">純圖片</div>
          </div>
          <div className="preview-text-bottom">圖片點擊型</div>
        </>
      ),
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    navigate('/campaigns/create', { state: { templateType: templateId } });
    onClose();
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
    >
      <div className="modal-header">
        <h2>建立群發訊息</h2>
        <p className="modal-description">
          選擇一個模板開始建立，建立過程皆可隨時切換或同模板。
        </p>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <div
            key={template.id}
            className="template-card-wrapper"
            onClick={() => handleTemplateSelect(template.id)}
          >
            {template.preview}
          </div>
        ))}
      </div>

      <div className="modal-footer">
        <button className="btn-start" onClick={() => handleTemplateSelect('text')}>
          開始建立
        </button>
      </div>
    </Modal>
  );
};

export default TemplateSelectionModal;
