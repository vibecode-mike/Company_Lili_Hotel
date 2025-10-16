/**
 * 會員管理列表頁面 - v0.1 設計風格（僅內容區域）
 */
import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined, CloseOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../hooks/useMembers';
import type { MemberSearchParams } from '@/types/member';
import './MemberListPage.css';

type SortField = 'name' | 'email' | 'phone' | 'created_at' | 'last_interaction_at';
type SortDirection = 'asc' | 'desc' | null;

const MemberListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>('last_interaction_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    page: 1,
    page_size: 20,
    sort_by: 'last_interaction_at',
    order: 'desc',
  });

  const { data, isLoading, error } = useMembers(searchParams);
  const members = data?.data?.items || [];

  const handleSort = (field: SortField) => {
    let newDirection: SortDirection;

    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
        setSortField(null);
        setSearchParams({
          ...searchParams,
          sort_by: undefined,
          order: undefined,
          page: 1,
        });
        return;
      } else {
        newDirection = 'asc';
      }
    } else {
      setSortField(field);
      newDirection = 'asc';
    }

    setSortDirection(newDirection);
    setSearchParams({
      ...searchParams,
      sort_by: field,
      order: newDirection || 'desc',
      page: 1,
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSearchParams({
      ...searchParams,
      search: value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortField('last_interaction_at');
    setSortDirection('desc');
    setSearchParams({
      page: 1,
      page_size: 20,
      sort_by: 'last_interaction_at',
      order: 'desc',
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="member-list-content-v01">
      {/* Breadcrumb */}
      <div className="breadcrumb-v01">
        <span>會員管理</span>
      </div>

      {/* Header */}
      <div className="page-header-v01">
        <h1 className="page-title-v01">會員管理</h1>
        <p className="page-description-v01">管理會員資料與聊天記錄</p>
      </div>

      {/* Search & Actions */}
      <div className="toolbar-v01">
        <div className="search-wrapper-v01">
          <SearchOutlined className="search-icon-v01" />
          <Input
            type="text"
            placeholder="輸入搜尋"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-v01"
            bordered={false}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="clear-search-btn-v01"
            >
              <CloseOutlined />
            </button>
          )}
        </div>
        <Button
          type="text"
          onClick={handleClearFilters}
          className="clear-filters-btn-v01"
        >
          清除全部條件
        </Button>
        <div className="flex-spacer" />
        <Button
          className="create-btn-v01"
          onClick={() => navigate('/members/create')}
        >
          建立
        </Button>
      </div>

      {/* Results Count */}
      <div className="results-count-v01">
        <p>共 {data?.data?.total || 0} 筆</p>
      </div>

      {/* Table */}
      <div className="table-container-v01">
        <div className="table-scroll-v01">
          {/* Table Header */}
          <div className="table-header-v01">
            <div className="table-cell-v01 cell-member-v01">
              <span>會員</span>
            </div>
            <div className="divider-v01" />
            <button
              onClick={() => handleSort('name')}
              className={`table-cell-v01 cell-name-v01 sortable-v01 ${sortField === 'name' ? 'active' : ''}`}
            >
              <span>姓名</span>
              <span className="sort-icon-v01">{getSortIcon('name')}</span>
            </button>
            <div className="divider-v01" />
            <div className="table-cell-v01 cell-tags-v01">
              <span>標籤</span>
              <span className="sort-icon-v01">⇅</span>
            </div>
            <div className="divider-v01" />
            <button
              onClick={() => handleSort('email')}
              className={`table-cell-v01 cell-email-v01 sortable-v01 ${sortField === 'email' ? 'active' : ''}`}
            >
              <span>電子信箱</span>
              <span className="sort-icon-v01">{getSortIcon('email')}</span>
            </button>
            <div className="divider-v01" />
            <button
              onClick={() => handleSort('phone')}
              className={`table-cell-v01 cell-phone-v01 sortable-v01 ${sortField === 'phone' ? 'active' : ''}`}
            >
              <span>手機號碼</span>
              <span className="sort-icon-v01">{getSortIcon('phone')}</span>
            </button>
            <div className="divider-v01" />
            <button
              onClick={() => handleSort('created_at')}
              className={`table-cell-v01 cell-created-v01 sortable-v01 ${sortField === 'created_at' ? 'active' : ''}`}
            >
              <span>建立時間</span>
              <span className="sort-icon-v01">{getSortIcon('created_at')}</span>
            </button>
            <div className="divider-v01" />
            <button
              onClick={() => handleSort('last_interaction_at')}
              className={`table-cell-v01 cell-last-reply-v01 sortable-v01 ${sortField === 'last_interaction_at' ? 'active' : ''}`}
            >
              <span>最後回覆日期</span>
              <span className="sort-icon-v01">{getSortIcon('last_interaction_at')}</span>
            </button>
            <div className="divider-v01" />
            <div className="table-cell-v01 cell-actions-v01">
              <span>操作</span>
            </div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="loading-state-v01">載入中...</div>
          ) : error ? (
            <div className="empty-state-v01">
              載入失敗：{(error as any)?.response?.data?.detail || '請檢查後端 API 服務'}
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state-v01">暫無會員資料</div>
          ) : (
            members.map((member, index) => (
              <div
                key={member.id}
                className={`table-row-v01 ${index !== members.length - 1 ? 'with-border-v01' : ''}`}
              >
                {/* 會員 */}
                <div className="table-cell-v01 cell-member-v01">
                  <div className="member-avatar-v01">
                    {member.line_picture_url ? (
                      <img src={member.line_picture_url} alt={member.line_display_name || ''} />
                    ) : (
                      <span>{member.last_name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <span className="member-username-v01 truncate">
                    {member.line_display_name || `${member.last_name || ''}${member.first_name || ''}`}
                  </span>
                </div>

                <div className="divider-transparent-v01" />

                {/* 姓名 */}
                <div className="table-cell-v01 cell-name-v01">
                  <span className="truncate">
                    {member.last_name || ''}{member.first_name || ''}
                  </span>
                </div>

                <div className="divider-transparent-v01" />

                {/* 標籤 */}
                <div className="table-cell-v01 cell-tags-v01">
                  <div className="tags-wrapper-v01">
                    {member.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="tag-v01"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="divider-transparent-v01" />

                {/* 電子信箱 */}
                <div className="table-cell-v01 cell-email-v01">
                  <span className="truncate">{member.email || '-'}</span>
                </div>

                <div className="divider-transparent-v01" />

                {/* 手機號碼 */}
                <div className="table-cell-v01 cell-phone-v01">
                  <span>{member.phone || '-'}</span>
                </div>

                <div className="divider-transparent-v01" />

                {/* 建立時間 */}
                <div className="table-cell-v01 cell-created-v01">
                  <span>
                    {member.created_at
                      ? new Date(member.created_at).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>

                <div className="divider-transparent-v01" />

                {/* 最後回覆日期 */}
                <div className="table-cell-v01 cell-last-reply-v01">
                  <span>
                    {member.last_interaction_at
                      ? new Date(member.last_interaction_at).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>

                <div className="divider-transparent-v01" />

                {/* 操作 */}
                <div className="table-cell-v01 cell-actions-v01">
                  <button
                    onClick={() => navigate(`/messages/${member.id}`)}
                    className="action-icon-btn-v01"
                    title="聊天"
                  >
                    <MessageOutlined className="message-icon-v01" />
                  </button>

                  <button
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="action-detail-btn-v01"
                  >
                    <span>詳細</span>
                    <svg
                      className="arrow-icon-v01"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberListPage;
