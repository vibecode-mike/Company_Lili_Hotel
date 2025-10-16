import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Empty,
  Spin,
  message,
  Modal,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { fetchSurveys, deleteSurvey, publishSurvey } from '@/services/api/survey';
import type { Survey } from '@/types/survey';
import { SurveyStatus } from '@/types/survey';
import './SurveyListPage.css';

const { Search } = Input;
const { Option } = Select;

const SurveyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadSurveys();
  }, [statusFilter]);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await fetchSurveys(params);
      setSurveys(data);
    } catch (error) {
      message.error('載入問卷列表失敗');
      console.error('Load surveys error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value.toLowerCase());
  };

  const handleDelete = (id: number, name: string) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除問卷「${name}」嗎？此操作無法復原。`,
      okText: '確認刪除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSurvey(id);
          message.success('問卷已刪除');
          loadSurveys();
        } catch (error) {
          message.error('刪除問卷失敗');
          console.error('Delete survey error:', error);
        }
      },
    });
  };

  const handlePublish = async (id: number, name: string) => {
    Modal.confirm({
      title: '確認發布',
      content: `確定要發布問卷「${name}」嗎？發布後將無法修改問卷內容。`,
      okText: '確認發布',
      cancelText: '取消',
      onOk: async () => {
        try {
          await publishSurvey(id);
          message.success('問卷已發布');
          loadSurveys();
        } catch (error) {
          message.error('發布問卷失敗');
          console.error('Publish survey error:', error);
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      [SurveyStatus.DRAFT]: { color: 'default', text: '草稿' },
      [SurveyStatus.PUBLISHED]: { color: 'success', text: '已發布' },
      [SurveyStatus.ARCHIVED]: { color: 'warning', text: '已封存' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const filteredSurveys = surveys.filter((survey) =>
    survey.name.toLowerCase().includes(searchText)
  );

  return (
    <div className="survey-list-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>問卷模板</h1>
            <p className="page-description">建立和管理客戶問卷，收集寶貴的意見回饋</p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/surveys/create')}
          >
            建立問卷
          </Button>
        </div>
      </div>

      <div className="page-content">
        <div className="filter-section">
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size="middle">
              <Search
                placeholder="搜尋問卷名稱"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
              >
                <Option value="all">全部狀態</Option>
                <Option value={SurveyStatus.DRAFT}>草稿</Option>
                <Option value={SurveyStatus.PUBLISHED}>已發布</Option>
                <Option value={SurveyStatus.ARCHIVED}>已封存</Option>
              </Select>
            </Space>
            <span className="result-count">共 {filteredSurveys.length} 個問卷</span>
          </Space>
        </div>

        <Spin spinning={loading}>
          {filteredSurveys.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={searchText ? '沒有找到符合的問卷' : '尚無問卷，立即建立第一個問卷吧！'}
            >
              {!searchText && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/surveys/create')}
                >
                  建立問卷
                </Button>
              )}
            </Empty>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredSurveys.map((survey) => (
                <Col xs={24} sm={24} md={12} lg={8} xl={6} key={survey.id}>
                  <Card
                    className="survey-card"
                    hoverable
                    actions={[
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/surveys/${survey.id}`)}
                      >
                        查看
                      </Button>,
                      survey.status === SurveyStatus.DRAFT ? (
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                        >
                          編輯
                        </Button>
                      ) : (
                        <Button
                          type="text"
                          icon={<FileTextOutlined />}
                          onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                        >
                          回應
                        </Button>
                      ),
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(survey.id, survey.name)}
                      >
                        刪除
                      </Button>,
                    ]}
                  >
                    <div className="card-header">
                      <div className="card-title-row">
                        <h3 className="card-title" title={survey.name}>
                          {survey.name}
                        </h3>
                        {getStatusTag(survey.status)}
                      </div>
                      {survey.template && (
                        <div className="template-badge">
                          <span className="template-icon">{survey.template.icon}</span>
                          <span className="template-name">{survey.template.name}</span>
                        </div>
                      )}
                    </div>

                    {survey.description && (
                      <p className="card-description">{survey.description}</p>
                    )}

                    <div className="card-stats">
                      <Statistic
                        title="回應數"
                        value={survey.response_count || 0}
                        valueStyle={{ fontSize: 20 }}
                      />
                      <Statistic
                        title="瀏覽數"
                        value={survey.view_count || 0}
                        valueStyle={{ fontSize: 20 }}
                      />
                    </div>

                    <div className="card-footer">
                      <span className="created-time">
                        {new Date(survey.created_at).toLocaleDateString('zh-TW')}
                      </span>
                      {survey.status === SurveyStatus.DRAFT && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<SendOutlined />}
                          onClick={() => handlePublish(survey.id, survey.name)}
                        >
                          發布
                        </Button>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default SurveyListPage;
