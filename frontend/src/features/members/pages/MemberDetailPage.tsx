/**
 * 會員詳細頁面 - v0.1 設計風格（僅內容區域）
 */
import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useMemberDetail } from '../hooks/useMembers';
import './MemberDetailPage.css';

const { TextArea } = Input;

const MemberDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useMemberDetail(Number(id));
  const member = data?.data;

  const [notes, setNotes] = useState(member?.notes || '');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);

  const handleBack = () => {
    navigate('/members');
  };

  const handleChatClick = () => {
    if (member) {
      navigate(`/messages/${member.id}`);
    }
  };

  const handleEditInfo = () => {
    setIsEditingInfo(!isEditingInfo);
    if (isEditingInfo) {
      // TODO: Save member info
      console.log('Save member info');
    }
  };

  const handleEditTags = () => {
    setIsEditingTags(!isEditingTags);
    if (isEditingTags) {
      // TODO: Save tags
      console.log('Save tags');
    }
  };

  const handleSaveNotes = () => {
    // TODO: Save notes to API
    console.log('Save notes:', notes);
  };

  if (isLoading) {
    return (
      <div className="member-detail-content-v01">
        <div className="loading-state-v01">載入中...</div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="member-detail-content-v01">
        <div className="error-state-v01">
          載入失敗：{(error as any)?.response?.data?.detail || '找不到會員資料'}
        </div>
      </div>
    );
  }

  return (
    <div className="member-detail-content-v01">
      {/* Breadcrumb */}
      <div className="breadcrumb-v01">
        <button onClick={handleBack} className="breadcrumb-link-v01">
          會員管理
        </button>
        <svg className="breadcrumb-arrow-v01" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="breadcrumb-current-v01">會員個人資訊</span>
      </div>

      {/* Header */}
      <div className="page-header-v01">
        <h1 className="page-title-v01">會員個人資訊</h1>
        <p className="page-description-v01">查看與編輯會員的詳細資料</p>
      </div>

      {/* Profile Content */}
      <div className="profile-container-v01">
        {/* Left: Avatar & Chat Button */}
        <div className="profile-avatar-section-v01">
          <div className="member-avatar-large-v01">
            {member.line_picture_url ? (
              <img src={member.line_picture_url} alt={member.line_display_name || ''} />
            ) : (
              <span>{member.last_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <p className="member-username-large-v01">
            {member.line_display_name || `${member.last_name || ''}${member.first_name || ''}`}
          </p>
          <Button
            onClick={handleChatClick}
            className="chat-btn-v01"
          >
            聊天
          </Button>
        </div>

        {/* Right: Member Info */}
        <div className="profile-info-section-v01">
          {/* Basic Info Section */}
          <div className="info-block-v01">
            <div className="info-rows-v01">
              <div className="info-row-v01">
                <span className="info-label-v01">會員姓名</span>
                <span className="info-value-v01">
                  {member.last_name || ''}{member.first_name || '-'}
                </span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">身分證字號 / 護照號碼</span>
                <span className="info-value-v01">-</span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">生日</span>
                <span className="info-value-v01">
                  {member.birthday ? new Date(member.birthday).toLocaleDateString('zh-TW') : '-'}
                </span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">生理性別</span>
                <span className="info-value-v01">
                  {member.gender === 'male' ? '男性' : member.gender === 'female' ? '女性' : '-'}
                </span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">會員建立時間</span>
                <span className="info-value-v01">
                  {member.created_at ? new Date(member.created_at).toLocaleDateString('zh-TW') : '-'}
                </span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">加入來源</span>
                <span className="info-value-v01">
                  {member.line_uid ? `LINE (LINE UID: ${member.line_uid})` : 'CRM'}
                </span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">最後回覆日期</span>
                <span className="info-value-v01">
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
              <div className="info-row-v01">
                <span className="info-label-v01">電子信箱</span>
                <span className="info-value-v01">{member.email || '-'}</span>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">手機號碼</span>
                <span className="info-value-v01">{member.phone || '-'}</span>
              </div>
            </div>
            <button
              onClick={handleEditInfo}
              className="edit-btn-v01"
              title="編輯基本資料"
            >
              <svg className="edit-icon-v01" viewBox="0 0 28 28" fill="none">
                <path
                  d="M4.8697e-05 7.88939V10.0174C4.8697e-05 10.2134 0.154049 10.3674 0.350049 10.3674H2.47805C2.56905 10.3674 2.66005 10.3324 2.72305 10.2624L10.367 2.62539L7.74205 0.000390456L0.105049 7.63739C0.0350488 7.70739 4.8697e-05 7.79139 4.8697e-05 7.88939Z"
                  fill="#0F6BEB"
                  transform="translate(5.6, 5.6) scale(1.2)"
                />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="divider-horizontal-v01" />

          {/* Tags Section */}
          <div className="info-block-v01">
            <div className="info-rows-v01">
              <div className="info-row-v01">
                <span className="info-label-v01">會員標籤</span>
                <div className="tags-wrapper-v01">
                  {member.tags && member.tags.length > 0 ? (
                    member.tags.map((tag, i) => (
                      <span key={i} className="tag-large-v01">
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="info-value-v01">尚無標籤</span>
                  )}
                </div>
              </div>
              <div className="info-row-v01">
                <span className="info-label-v01">互動標籤</span>
                <div className="tags-wrapper-v01">
                  <span className="tag-large-v01">優惠活動</span>
                  <span className="tag-large-v01">限時折扣</span>
                  <span className="tag-large-v01">滿額贈品</span>
                  <span className="tag-large-v01">會員專屬優惠</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleEditTags}
              className="edit-btn-v01"
              title="編輯標籤"
            >
              <svg className="edit-icon-v01" viewBox="0 0 28 28" fill="none">
                <path
                  d="M4.8697e-05 7.88939V10.0174C4.8697e-05 10.2134 0.154049 10.3674 0.350049 10.3674H2.47805C2.56905 10.3674 2.66005 10.3324 2.72305 10.2624L10.367 2.62539L7.74205 0.000390456L0.105049 7.63739C0.0350488 7.70739 4.8697e-05 7.79139 4.8697e-05 7.88939Z"
                  fill="#0F6BEB"
                  transform="translate(5.6, 5.6) scale(1.2)"
                />
              </svg>
            </button>
          </div>

          {/* Notes Section */}
          <div className="notes-container-v01">
            <TextArea
              placeholder="留下備註"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-textarea-v01"
              rows={4}
              bordered={false}
            />
            <button
              onClick={handleSaveNotes}
              className="save-notes-btn-v01"
              title="儲存備註"
            >
              <svg className="edit-icon-v01" viewBox="0 0 28 28" fill="none">
                <path
                  d="M-0.000195444 7.88939V10.0174C-0.000195444 10.2134 0.153805 10.3674 0.349805 10.3674H2.4778C2.5688 10.3674 2.6598 10.3324 2.7228 10.2624L10.3668 2.62539L7.7418 0.000390456L0.104805 7.63739C0.0348046 7.70739 -0.000195444 7.79139 -0.000195444 7.88939Z"
                  fill="#0F6BEB"
                  transform="translate(5.6, 5.6) scale(1.2)"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="transaction-section-v01">
        <p className="results-count-v01">共 0 筆</p>
        <div className="table-container-v01">
          {/* Table Header */}
          <div className="table-header-transaction-v01">
            <div className="table-cell-transaction-v01" style={{ width: '290px' }}>
              <span>欄位</span>
            </div>
            <div className="divider-v01" />
            <div className="table-cell-transaction-v01" style={{ width: '180px' }}>
              <span>欄位</span>
              <span className="sort-icon-v01">⇅</span>
            </div>
            <div className="divider-v01" />
            <div className="table-cell-transaction-v01" style={{ flex: 1 }}>
              <span>欄位</span>
              <span className="sort-icon-v01 active">⇅</span>
            </div>
          </div>

          {/* Empty State */}
          <div className="empty-transaction-v01">
            <p className="empty-text-v01">尚無消費紀錄</p>
            <Button className="connect-pms-btn-v01">
              串接 PMS 系統
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailPage;
