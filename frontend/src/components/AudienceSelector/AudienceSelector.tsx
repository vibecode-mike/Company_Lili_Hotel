import React, { useState, useEffect } from 'react';
import { Radio, Select, Progress, Space, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { fetchMemberCount } from '@/services/api/audience';
import { fetchTags } from '@/services/api/tag';
import type { RadioChangeEvent } from 'antd';
import './AudienceSelector.css';

const { Option } = Select;

export type TargetAudience = 'all' | 'filtered';

interface Tag {
  id: number;
  name: string;
  type: string;
  member_count?: number;
  created_at: string;
}

interface AudienceSelectorProps {
  value: TargetAudience;
  onChange: (value: TargetAudience) => void;
  selectedTags?: number[];
  onTagsChange?: (tags: number[]) => void;
}

const AudienceSelector: React.FC<AudienceSelectorProps> = ({
  value,
  onChange,
  selectedTags = [],
  onTagsChange,
}) => {
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState<boolean>(false);

  // Load tags on mount
  useEffect(() => {
    loadTags();
  }, []);

  // Load member count when audience selection or tags change
  useEffect(() => {
    loadMemberCount();
  }, [value, selectedTags]);

  const loadTags = async () => {
    try {
      setTagsLoading(true);
      const response = await fetchTags({ type: 'member', page: 1, page_size: 100 });
      if (response.code === 200 && response.data) {
        setTags(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setTagsLoading(false);
    }
  };

  const loadMemberCount = async () => {
    try {
      setLoading(true);
      const tagIds = value === 'filtered' && selectedTags.length > 0
        ? selectedTags.join(',')
        : undefined;

      const response = await fetchMemberCount({
        target_audience: value,
        tag_ids: tagIds,
      });

      console.log('Member count response:', JSON.stringify(response, null, 2));
      console.log('Response code:', response.code);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      if (response.code === 200 && response.data) {
        console.log('Setting member count to:', response.data.count);
        setMemberCount(response.data.count || 0);
      } else {
        console.log('Response code is not 200 or data is missing');
        setMemberCount(0);
      }
    } catch (error) {
      console.error('Failed to load member count:', error);
      setMemberCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceChange = (e: RadioChangeEvent) => {
    onChange(e.target.value);
  };

  const handleTagsChange = (tagIds: number[]) => {
    if (onTagsChange) {
      onTagsChange(tagIds);
    }
  };

  return (
    <div className="audience-selector">
      <div className="audience-selector-header">
        <label className="audience-selector-label">
          發送對象<span className="required">*</span>
          <InfoCircleOutlined className="info-icon" />
        </label>
      </div>

      <Radio.Group value={value} onChange={handleAudienceChange} className="audience-radio-group">
        <Space direction="vertical">
          <Radio value="all">所有好友</Radio>
          <Radio value="filtered">篩選目標對象</Radio>
        </Space>
      </Radio.Group>

      {value === 'filtered' && (
        <div className="audience-tags-selector">
          <Select
            mode="multiple"
            placeholder="選擇會員標籤"
            value={selectedTags}
            onChange={handleTagsChange}
            style={{ width: '100%', marginTop: 12 }}
            loading={tagsLoading}
            allowClear
          >
            {tags.map((tag) => (
              <Option key={tag.id} value={tag.id}>
                {tag.name} {tag.member_count ? `(${tag.member_count}人)` : ''}
              </Option>
            ))}
          </Select>
        </div>
      )}

      <div className="audience-stats">
        <div className="audience-progress">
          <Spin spinning={loading}>
            <Progress
              type="circle"
              percent={100}
              format={() => '100%'}
              width={80}
              strokeColor="#52c41a"
            />
          </Spin>
        </div>
        <div className="audience-count">
          預計發送好友人數：{loading ? '計算中...' : `${memberCount}人`}
        </div>
      </div>
    </div>
  );
};

export default AudienceSelector;
