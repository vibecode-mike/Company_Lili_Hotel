import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Space,
  message,
  Breadcrumb,
  Divider,
  Radio,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
  PlusOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { fetchSurveyTemplates, createSurvey, publishSurvey } from '@/services/api/survey';
import type { SurveyTemplate, SurveyCreate, SurveyQuestion } from '@/types/survey';
import QuestionEditor from '../components/QuestionEditor';
import AudienceSelector from '@/components/AudienceSelector';
import type { TargetAudience } from '@/components/AudienceSelector';
import './SurveyCreatePage.css';

const { Option } = Select;
const { TextArea } = Input;

const SurveyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | undefined>();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Real-time preview states
  const [surveyName, setSurveyName] = useState<string>('');

  // Audience selection states
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Debug: Log every render
  console.log('🎬 Component rendering with surveyName:', surveyName);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await fetchSurveyTemplates();
      setTemplates(data);
    } catch (error) {
      // Use mock templates when API is not available
      console.log('Using mock templates for development');
      const mockTemplates: SurveyTemplate[] = [
        {
          id: 1,
          name: '住客滿意度調查',
          icon: '😊',
          description: '評估住客對酒店服務、設施和整體體驗的滿意度',
          category: 'customer_satisfaction',
          default_questions: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: '服務品質評估',
          icon: '⭐',
          description: '收集住客對各項服務品質的反饋',
          category: 'service_quality',
          default_questions: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setTemplates(mockTemplates);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      if (template.default_questions) {
        setQuestions(template.default_questions);
      }
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(undefined);
    setEditingIndex(null);
    setEditorVisible(true);
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestion(questions[index]);
    setEditingIndex(index);
    setEditorVisible(true);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const handleSaveQuestion = (question: SurveyQuestion) => {
    if (editingIndex !== null) {
      // 編輯現有題目
      const newQuestions = [...questions];
      newQuestions[editingIndex] = { ...question, order: editingIndex };
      setQuestions(newQuestions);
    } else {
      // 新增題目
      setQuestions([...questions, { ...question, order: questions.length }]);
    }
    setEditorVisible(false);
    setEditingQuestion(undefined);
    setEditingIndex(null);
  };

  // Handle form values change for real-time preview
  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    console.log('🔥🔥🔥 FORM CHANGE TRIGGERED 🔥🔥🔥');
    console.log('📝 Changed values:', changedValues);
    console.log('📋 All values:', allValues);
    console.log('🎯 Current surveyName state:', surveyName);

    if (changedValues.name !== undefined) {
      console.log('✅ Setting survey name to:', changedValues.name);
      setSurveyName(changedValues.name);
      console.log('✅ Survey name state should now be:', changedValues.name);
    }
  };

  // Render question input based on question type
  const renderQuestionInput = (question: SurveyQuestion) => {
    switch (question.question_type) {
      case 'name':
        return (
          <Input
            placeholder="請輸入姓名"
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'phone':
        return (
          <Input
            placeholder="請輸入電話號碼"
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'email':
        return (
          <Input
            placeholder="請輸入電子郵件"
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'birthday':
        return (
          <DatePicker
            disabled
            placeholder="請選擇生日"
            style={{ width: '100%', background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'address':
        return (
          <Input.TextArea
            placeholder="請輸入地址"
            rows={2}
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'gender':
        return (
          <Radio.Group disabled style={{ width: '100%' }}>
            <Space direction="horizontal">
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
              <Radio value="other">其他</Radio>
            </Space>
          </Radio.Group>
        );

      case 'id_number':
        return (
          <Input
            placeholder="請輸入身分證字號"
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'link':
        return (
          <Input
            placeholder="https://example.com"
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );

      case 'video':
        return (
          <div style={{ padding: '16px', background: '#f0f0f0', borderRadius: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>🎥</span>
              <div style={{ marginTop: 8, color: '#666', fontWeight: 500 }}>影片上傳區域</div>
            </div>
            {question.video_description && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', borderRadius: 4, fontSize: 13, color: '#666' }}>
                {question.video_description}
              </div>
            )}
            {question.video_link && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#1890ff' }}>
                <a href={question.video_link} target="_blank" rel="noopener noreferrer">
                  查看範例影片
                </a>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div style={{ padding: '16px', background: '#f0f0f0', borderRadius: 8 }}>
            {question.image_base64 || question.image_link ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={question.image_base64 || question.image_link}
                  alt="預覽圖片"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 4 }}
                />
                {question.image_base64 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#52c41a' }}>
                    ✓ 已上傳Base64圖片（發送用）
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 48 }}>🖼️</span>
                <div style={{ marginTop: 8, color: '#666', fontWeight: 500 }}>圖片上傳區域</div>
              </div>
            )}
            {question.image_description && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', borderRadius: 4, fontSize: 13, color: '#666' }}>
                {question.image_description}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            placeholder="答案輸入區域"
            disabled
            style={{ background: '#fafafa', borderRadius: 8 }}
          />
        );
    }
  };

  const handleSaveDraft = async () => {
    try {
      // 僅驗證必填欄位：name, template_id
      await form.validateFields(['name', 'template_id']);

      if (questions.length === 0) {
        message.warning('請至少新增一個題目');
        return;
      }

      setLoading(true);

      const surveyData: SurveyCreate = {
        name: form.getFieldValue('name'),
        template_id: form.getFieldValue('template_id'),
        description: form.getFieldValue('description'),
        target_audience: 'all', // 草稿預設值
        schedule_type: 'immediate', // 草稿預設值
        questions: questions,
      };

      await createSurvey(surveyData);
      message.success('問卷草稿已儲存');
      navigate('/surveys');
    } catch (error: any) {
      if (error.errorFields) {
        message.error('請填寫問卷名稱和選擇範本');
      } else {
        message.error('儲存問卷失敗');
        console.error('Save survey error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      // 驗證所有必填欄位
      const values = await form.validateFields();

      if (questions.length === 0) {
        message.warning('請至少新增一個題目');
        return;
      }

      // 驗證發送對象相關欄位
      if (values.target_audience === 'filtered' && (!values.target_tags || values.target_tags.length === 0)) {
        message.error('篩選目標對象時，請至少選擇一個會員標籤');
        return;
      }

      if (values.schedule_type === 'scheduled' && !values.scheduled_at) {
        message.error('自訂發送時間時，請選擇發送時間');
        return;
      }

      setLoading(true);

      const surveyData: SurveyCreate = {
        name: values.name,
        template_id: values.template_id,
        description: values.description,
        target_audience: values.target_audience,
        target_tags: values.target_audience === 'filtered' ? values.target_tags : undefined,
        schedule_type: values.schedule_type,
        scheduled_at: values.schedule_type === 'scheduled' ? values.scheduled_at?.toISOString() : undefined,
        questions: questions,
      };

      // 步驟 1: 創建問卷（狀態為 draft）
      const createdSurvey = await createSurvey(surveyData);

      // 步驟 2: 發布問卷（狀態變為 published）
      await publishSurvey(createdSurvey.id);

      message.success('問卷已發布給用戶');
      navigate('/surveys');
    } catch (error: any) {
      if (error.errorFields) {
        message.error('請填寫所有必填欄位');
      } else {
        message.error('發布問卷失敗');
        console.error('Publish survey error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="survey-create-page">
      <div className="page-header">
        <div className="header-content">
          <Breadcrumb
            items={[
              { title: <a onClick={() => navigate('/surveys')}>問卷模板</a> },
              { title: '建立問卷' },
            ]}
          />
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/surveys')}
          >
            返回列表
          </Button>
        </div>
      </div>

      <div className="editor-container">
        {/* Left Side - Form Section */}
        <div className="form-section">
          <Card title="基本設定" className="form-card">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                target_audience: 'all',
                schedule_type: 'immediate',
              }}
              onValuesChange={handleFormValuesChange}
            >
              <Form.Item
                label="問卷名稱"
                name="name"
                rules={[{ required: true, message: '請輸入問卷名稱' }]}
              >
                <Input
                  placeholder="例如：2024 住客滿意度調查"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="問卷範本"
                name="template_id"
                rules={[{ required: true, message: '請選擇問卷範本' }]}
              >
                <Select
                  placeholder="選擇適合的範本"
                  size="large"
                  onChange={handleTemplateChange}
                >
                  {templates.map((template) => (
                    <Option key={template.id} value={template.id}>
                      <Space>
                        <span>{template.icon}</span>
                        <span>{template.name}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedTemplate && (
                <div className="template-description">
                  <p>{selectedTemplate.description}</p>
                </div>
              )}

              {/* 發送設定 Section - Moved inside the same Form */}
              <Divider orientation="left" style={{ marginTop: 32, marginBottom: 24 }}>
                發送設定
              </Divider>

              <Form.Item shouldUpdate noStyle>
                {() => (
                  <AudienceSelector
                    value={targetAudience}
                    onChange={(value) => {
                      setTargetAudience(value);
                      form.setFieldsValue({ target_audience: value });
                    }}
                    selectedTags={selectedTags}
                    onTagsChange={(tags) => {
                      setSelectedTags(tags);
                      form.setFieldsValue({ target_tags: tags.map(String) });
                    }}
                  />
                )}
              </Form.Item>

              <Form.Item
                label="排程發送"
                name="schedule_type"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="immediate">立即發送</Radio>
                    <Radio value="scheduled">自訂發送時間</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.schedule_type !== currentValues.schedule_type
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('schedule_type') === 'scheduled' ? (
                    <Form.Item
                      label="發送時間"
                      name="scheduled_at"
                      rules={[{ required: true, message: '請選擇發送時間' }]}
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Form>
          </Card>

          <Card
            title="問卷內容"
            className="form-card"
            style={{ marginTop: 16 }}
            extra={
              questions.length > 0 && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={handleAddQuestion}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  新增題目
                </Button>
              )
            }
          >
            <div className="questions-editor">
              {questions.length === 0 ? (
                <div className="empty-state">
                  <p>尚未新增題目</p>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="large"
                    block
                    onClick={handleAddQuestion}
                  >
                    新增題目
                  </Button>
                </div>
              ) : (
                <div className="questions-list">
                  {questions.map((question, index) => (
                    <React.Fragment key={index}>
                      <div className="question-card">
                        <div className="question-header">
                          <span className="question-number">題目 {index + 1}</span>
                          <Space>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleEditQuestion(index)}
                            >
                              編輯
                            </Button>
                            <Button
                              type="link"
                              size="small"
                              danger
                              onClick={() => handleDeleteQuestion(index)}
                            >
                              刪除
                            </Button>
                          </Space>
                        </div>
                        <div className="question-body">
                          <p className="question-text">{question.question_text}</p>
                          <div className="question-type-badge">
                            {question.question_type}
                          </div>
                        </div>
                      </div>

                      {/* Add button between questions */}
                      <div className="question-divider">
                        <Button
                          type="text"
                          icon={<PlusCircleOutlined />}
                          className="add-question-between"
                          onClick={handleAddQuestion}
                        >
                          新增題目
                        </Button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="form-actions">
            <Button
              size="large"
              onClick={() => navigate('/surveys')}
            >
              取消
            </Button>
            <Space>
              <Button
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
                loading={loading}
              >
                儲存草稿
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handlePublish}
                loading={loading}
              >
                發布給用戶
              </Button>
            </Space>
          </div>
        </div>

        {/* Right Side - Preview Section */}
        <div className="preview-section">
          <div className="phone-simulator">
            <div className="phone-frame">
              <div className="phone-header">
                <div className="status-bar">
                  <span className="time">9:41</span>
                  <div className="status-icons">
                    <span>📶</span>
                    <span>📡</span>
                    <span>🔋</span>
                  </div>
                </div>
                <div className="app-header">
                  <h3>問卷預覽</h3>
                </div>
              </div>
              <div className="phone-content">
                <div className="survey-preview">
                  <h2 title={`Current state: "${surveyName}"`}>
                    {surveyName || '問卷名稱'}
                  </h2>
                  <Divider />
                  {questions.length === 0 ? (
                    <div className="empty-questions">
                      <p>尚未新增題目</p>
                      <p className="hint">請在左側新增問卷題目</p>
                    </div>
                  ) : (
                    <div className="questions-preview">
                      {questions.map((question, index) => (
                        <div key={index} className="question-item">
                          <div className="question-number">Q{index + 1}</div>
                          <div
                            className="question-text"
                            style={{ fontSize: `${question.font_size || 14}px` }}
                          >
                            {question.question_text}
                            {question.is_required && <span className="required">*</span>}
                          </div>
                          {question.description && (
                            <div className="question-desc">{question.description}</div>
                          )}
                          <div className="question-input-preview">
                            {renderQuestionInput(question)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Editor Modal */}
      <QuestionEditor
        visible={editorVisible}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => {
          setEditorVisible(false);
          setEditingQuestion(undefined);
          setEditingIndex(null);
        }}
      />
    </div>
  );
};

export default SurveyCreatePage;
