import React from 'react';
import { Drawer } from 'antd';
import type { QuestionType } from '@/types/survey';
import './QuestionTypeSelector.css';

interface QuestionTypeOption {
  type: QuestionType;
  label: string;
  description: string;
}

interface QuestionTypeGroup {
  category: string;
  options: QuestionTypeOption[];
}

interface QuestionTypeSelectorProps {
  visible: boolean;
  onSelect: (type: QuestionType) => void;
  onClose: () => void;
}

const questionTypeGroups: QuestionTypeGroup[] = [
  {
    category: '個人資料',
    options: [
      { type: 'name', label: '姓名', description: '填寫姓名' },
      { type: 'phone', label: '電話', description: '填寫電話號碼' },
      { type: 'email', label: '電子郵件', description: '填寫電子郵件地址' },
      { type: 'birthday', label: '生日', description: '選擇生日日期' },
      { type: 'address', label: '地址', description: '填寫地址資訊' },
      { type: 'gender', label: '性別', description: '選擇性別' },
      { type: 'id_number', label: '身分證字號', description: '填寫身分證字號' },
    ],
  },
  {
    category: '多媒體',
    options: [
      { type: 'link', label: '超連結', description: '填寫網址連結' },
      { type: 'video', label: '影片', description: '上傳影片檔案' },
      { type: 'image', label: '圖片', description: '上傳圖片檔案' },
    ],
  },
];

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  const handleSelect = (type: QuestionType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Drawer
      title="問卷題型"
      placement="right"
      onClose={onClose}
      open={visible}
      width={360}
      className="question-type-selector-drawer"
    >
      <div className="question-type-selector">
        {questionTypeGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="question-type-group">
            <div className="group-title">{group.category}</div>
            <div className="group-options">
              {group.options.map((option) => (
                <div
                  key={option.type}
                  className="question-type-option"
                  onClick={() => handleSelect(option.type)}
                >
                  <div className="option-label">{option.label}</div>
                  <div className="option-description">{option.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
};

export default QuestionTypeSelector;
