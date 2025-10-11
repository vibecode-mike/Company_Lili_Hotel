/**
 * 活動與訊息推播列表頁面
 */
import { useState, useEffect } from 'react';
import { Input, Button, Tag, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCampaigns } from '@/services/api/campaign';
import StyledTable from '@/components/common/StyledTable';
import TemplateSelectionModal from '../components/TemplateSelectionModal';
import type { ColumnsType } from 'antd/es/table';
import './CampaignListPage.css';

interface CampaignListItem {
  id: number;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  tags?: string[];
  platforms?: string;
  status: 'sent' | 'scheduled' | 'draft';
  target_count?: number;
  open_count?: number;
  click_count?: number;
  sent_at?: string;
  template?: {
    name?: string;
    type?: string;
  };
}

const CampaignListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 獲取活動列表
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      console.log('開始獲取活動列表...');
      const data = await getCampaigns();
      console.log('獲取到的數據:', data);
      console.log('數據類型:', typeof data);
      console.log('是否為陣列:', Array.isArray(data));
      console.log('數據長度:', data?.length);
      setCampaigns(data as any);
      console.log('設置成功，campaigns 狀態已更新');
    } catch (error) {
      console.error('獲取活動列表失敗:', error);
      console.error('錯誤詳情:', JSON.stringify(error, null, 2));
      message.error('獲取活動列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 舊的模擬資料（備用）
  // @ts-ignore - 保留備用資料
  const mockData: CampaignListItem[] = [
    {
      id: 1,
      title: '中秋 送禮 KOL',
      subtitle: '首圖頭圖一 紀圖滾透',
      tags: ['中秋', '送禮', 'KOL'],
      platforms: 'LINE, Messenger',
      status: 'sent',
      target_count: 100,
      open_count: 80,
      click_count: 40,
      sent_at: '2025-10-02 22:47',
    },
    {
      id: 2,
      title: '聖誕住品 送享天倫',
      subtitle: '聖誕住品 送享天倫',
      tags: ['中秋', '活動'],
      platforms: 'Facebook, WhatsApp',
      status: 'sent',
      target_count: 150,
      open_count: 100,
      click_count: 60,
      sent_at: '2025-09-30 18:30',
    },
    {
      id: 3,
      title: '月餅禮盒 精緻享受',
      subtitle: '月餅禮盒 精緻享受',
      tags: ['中秋', '促銷'],
      platforms: 'Instagram, WhatsApp',
      status: 'draft',
    },
    {
      id: 4,
      title: '月購人圖 幸福共享',
      subtitle: '月購人圖 幸福共享',
      tags: ['中秋', '慶祝'],
      platforms: 'LINE, Telegram',
      status: 'draft',
    },
    {
      id: 5,
      title: '與家人一起過中秋',
      subtitle: '與家人一起過中秋',
      tags: ['中秋', '文化'],
      platforms: 'LINE, TikTok',
      status: 'scheduled',
    },
    {
      id: 6,
      title: '與家人一起過中秋',
      subtitle: '與家人一起過中秋',
      tags: ['中秋', '文化'],
      platforms: 'LINE, Messenger',
      status: 'scheduled',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      sent: { text: '已發布 ✓', className: 'status-sent' },
      scheduled: { text: '尚未發佈', className: 'status-scheduled' },
      draft: { text: '草稿', className: 'status-draft' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  const columns: ColumnsType<CampaignListItem> = [
    {
      title: '發送標題',
      key: 'title',
      width: 300,
      render: (_, record) => (
        <div className="campaign-title-cell">
          <div className="thumbnail">首圖</div>
          <div>
            <div className="title">{record.title}</div>
            <div className="subtitle">{record.subtitle || ''}</div>
          </div>
        </div>
      ),
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags && tags.length > 0 ? (
            tags.map((tag, index) => (
              <Tag key={index} className="campaign-tag">
                {tag}
              </Tag>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platforms',
      key: 'platforms',
      width: 180,
      render: (platforms) => platforms || 'LINE',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: '發送人數',
      dataIndex: 'target_count',
      key: 'target_count',
      width: 100,
      render: (count) => (count ? `${count} 人` : 'N/A'),
    },
    {
      title: '已開啟次數 📊',
      dataIndex: 'open_count',
      key: 'open_count',
      width: 140,
      render: (count) => (count ? <span className="percentage">{count} 次</span> : 'N/A'),
    },
    {
      title: '點擊次數',
      dataIndex: 'click_count',
      key: 'click_count',
      width: 120,
      render: (count) => (count ? <span className="percentage">{count} 次</span> : 'N/A'),
    },
    {
      title: '發送時間',
      dataIndex: 'sent_at',
      key: 'sent_at',
      width: 160,
      render: (time) => time || '尚未發佈',
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <div className="actions">
          <a href="#" className="icon-btn">
            📊
          </a>
          <a
            href="#"
            className="icon-btn"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/campaigns/${record.id}`);
            }}
          >
            詳細 &gt;
          </a>
        </div>
      ),
    },
  ];

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter((d) => d.status === 'sent').length,
    scheduled: campaigns.filter((d) => d.status === 'scheduled').length,
    draft: campaigns.filter((d) => d.status === 'draft').length,
    archived: 0,
  };

  return (
    <div className="campaign-list-page">
      <div className="breadcrumb">
        群發訊息 <span>&gt;</span> 活動與訊息推播
      </div>

      <div className="page-header">
        <h1 className="page-title">活動與訊息推播</h1>
        <p className="page-description">管理所有群發訊息與活動推播</p>
      </div>

      <div className="toolbar">
        <div className="search-filter">
          <div className="search-box">
            <Input
              placeholder="輸入搜尋"
              prefix={<SearchOutlined />}
              className="search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          <a href="#" className="filter-link">
            清除全部條件
          </a>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          建立
        </Button>
      </div>

      <div className="stats-info">
        共 {stats.total} 筆（已發送 {stats.sent} 筆、已排程 {stats.scheduled} 筆、草稿{' '}
        {stats.draft} 筆、已封存 {stats.archived} 筆）
      </div>

      <StyledTable
        columns={columns}
        dataSource={campaigns}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 筆`,
        }}
        scroll={{ x: 1400 }}
      />

      <TemplateSelectionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default CampaignListPage;
