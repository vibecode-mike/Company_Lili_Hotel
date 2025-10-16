import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Divider,
  Upload,
  Button,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { SurveyQuestion, QuestionType } from '@/types/survey';

const { Option } = Select;
const { TextArea } = Input;

interface QuestionEditorProps {
  visible: boolean;
  question?: SurveyQuestion;
  onSave: (question: SurveyQuestion) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  visible,
  question,
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = React.useState<QuestionType>(
    question?.question_type || 'name'
  );

  React.useEffect(() => {
    if (visible && question) {
      form.setFieldsValue(question);
      setQuestionType(question.question_type);
    } else if (visible) {
      form.resetFields();
      setQuestionType('name');
    }
  }, [visible, question, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave({
        ...values,
        id: question?.id,
        order: question?.order || 0,
      });
      form.resetFields();
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  // Render conditional fields based on question type
  const renderConditionalFields = () => {
    if (!questionType) return null;

    switch (questionType) {
      case 'video':
        return (
          <>
            <Divider orientation="left">影片設定</Divider>
            <Form.Item
              label="影片描述"
              name="video_description"
              tooltip="說明需要上傳什麼樣的影片"
            >
              <TextArea
                rows={2}
                placeholder="例如：請上傳您對本次住宿體驗的影片分享"
              />
            </Form.Item>
            <Form.Item
              label="影片超連結"
              name="video_link"
              tooltip="可選：提供範例影片連結或說明"
              rules={[
                {
                  type: 'url',
                  message: '請輸入有效的網址',
                },
              ]}
            >
              <Input placeholder="https://example.com/sample-video.mp4" />
            </Form.Item>
          </>
        );

      case 'image':
        return (
          <>
            <Divider orientation="left">圖片設定</Divider>
            <Form.Item
              label="圖片描述"
              name="image_description"
              tooltip="說明需要上傳什麼樣的圖片"
            >
              <TextArea
                rows={2}
                placeholder="例如：請上傳您在酒店拍攝的照片"
              />
            </Form.Item>
            <Form.Item
              label="圖片連結（可選）"
              name="image_link"
              tooltip="提供圖片URL，方便編輯階段預覽"
              rules={[
                {
                  type: 'url',
                  message: '請輸入有效的網址',
                },
              ]}
            >
              <Input placeholder="https://example.com/sample-image.jpg" />
            </Form.Item>
            <Form.Item
              label="上傳圖片（發送用）"
              name="image_base64"
              tooltip="發布給用戶時，圖片會以 Base64 格式傳送"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e?.fileList;
              }}
            >
              <Upload
                maxCount={1}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('只能上傳圖片檔案！');
                    return Upload.LIST_IGNORE;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('圖片大小不能超過 5MB！');
                    return Upload.LIST_IGNORE;
                  }

                  // Convert to base64
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => {
                    const base64 = reader.result as string;
                    form.setFieldsValue({ image_base64: base64 });
                  };

                  return false; // Prevent upload
                }}
                onRemove={() => {
                  form.setFieldsValue({ image_base64: undefined });
                }}
              >
                <Button icon={<UploadOutlined />}>選擇圖片</Button>
              </Upload>
            </Form.Item>
          </>
        );

      case 'link':
        return (
          <>
            <Divider orientation="left">連結設定</Divider>
            <Form.Item
              label="連結說明"
              name="description"
              tooltip="提示用戶應該輸入什麼樣的連結"
            >
              <TextArea
                rows={2}
                placeholder="例如：請輸入您的社交媒體連結"
              />
            </Form.Item>
          </>
        );

      case 'name':
      case 'phone':
      case 'email':
      case 'id_number':
      case 'address':
        return null;

      default:
        return null;
    }
  };

  return (
    <Modal
      title={question ? '編輯題目' : '新增題目'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
      okText="儲存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="類型"
          name="question_type"
          initialValue="name"
          rules={[{ required: true, message: '請選擇類型' }]}
        >
          <Select onChange={(value) => setQuestionType(value as QuestionType)}>
            <Option value="name">姓名</Option>
            <Option value="phone">電話</Option>
            <Option value="email">電子郵件</Option>
            <Option value="birthday">生日</Option>
            <Option value="address">地址</Option>
            <Option value="gender">性別</Option>
            <Option value="id_number">身分證字號</Option>
            <Option value="link">超連結</Option>
            <Option value="video">影片</Option>
            <Option value="image">圖片</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="題目文字"
          name="question_text"
          rules={[{ required: true, message: '請輸入題目文字' }]}
        >
          <TextArea
            rows={3}
            placeholder="例如：請輸入您的姓名"
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
          <Form.Item
            label="字型大小"
            name="font_size"
            initialValue={14}
          >
            <InputNumber
              min={12}
              max={24}
              addonAfter="px"
              placeholder="14"
            />
          </Form.Item>

          <Form.Item
            label="必填"
            name="is_required"
            initialValue={false}
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Space>

        {renderConditionalFields()}
      </Form>
    </Modal>
  );
};

export default QuestionEditor;
