/**
 * 會員管理列表頁面
 */
import React, { useState } from 'react';
import { Input, Button, Space, Tag, Avatar, Modal } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMembers, useDeleteMember } from '../hooks/useMembers';
import StyledTable from '@/components/common/StyledTable';
import type { MemberListItem, MemberSearchParams } from '@/types/member';
import type { ColumnsType } from 'antd/es/table';
import './MemberListPage.css';

const MemberListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    page: 1,
    page_size: 20,
    sort_by: 'last_interaction_at',
    order: 'desc',
  });

  const { data, isLoading } = useMembers(searchParams);
  const deleteMember = useDeleteMember();

  const handleSearch = (value: string) => {
    setSearchParams({ ...searchParams, search: value, page: 1 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setSearchParams({ ...searchParams, page, page_size: pageSize });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '確認刪除',
      content: '確定要刪除此會員嗎？',
      okText: '確認',
      cancelText: '取消',
      onOk: () => deleteMember.mutate(id),
    });
  };

  const columns: ColumnsType<MemberListItem> = [
    {
      title: '會員資訊',
      key: 'member',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.line_picture_url} size={40}>
            {record.last_name?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.last_name}
              {record.first_name}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              LINE: {record.line_display_name || '-'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '電子信箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => email || '-',
    },
    {
      title: '手機號碼',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone) => phone || '-',
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      width: 250,
      render: (tags: any[]) => (
        <>
          {tags?.map((tag) => (
            <Tag
              key={tag.id}
              color={tag.type === 'member' ? 'blue' : 'orange'}
            >
              {tag.name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '建立時間',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('zh-TW'),
    },
    {
      title: '最後互動',
      dataIndex: 'last_interaction_at',
      key: 'last_interaction_at',
      width: 150,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString('zh-TW') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/members/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<MessageOutlined />}
            onClick={() => navigate(`/messages/${record.id}`)}
          >
            聊天
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="member-list-page">
      <div className="breadcrumb">
        會員管理 <span>&gt;</span> 會員列表
      </div>

      <div className="page-header">
        <h1 className="page-title">會員列表</h1>
        <p className="page-description">管理所有會員資料與互動記錄</p>
      </div>

      <div className="toolbar">
        <div className="search-filter">
          <div className="search-box">
            <Input
              placeholder="搜尋姓名、Email、手機號碼"
              prefix={<SearchOutlined />}
              className="search-input"
              onPressEnter={(e) => handleSearch(e.currentTarget.value)}
              allowClear
            />
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/members/create')}
        >
          新增會員
        </Button>
      </div>

      <div className="stats-info">
        共 {data?.data?.total || 0} 位會員
      </div>

      <StyledTable
        columns={columns}
        dataSource={data?.data?.items || []}
        loading={isLoading}
        pagination={{
          current: searchParams.page,
          pageSize: searchParams.page_size,
          total: data?.data?.total || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 位會員`,
        }}
        rowKey="id"
        scroll={{ x: 1400 }}
      />
    </div>
  );
};

export default MemberListPage;
