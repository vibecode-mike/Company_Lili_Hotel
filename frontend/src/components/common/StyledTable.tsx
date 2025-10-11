/**
 * 自定義樣式表格組件
 * 符合原型圖設計規範：圓角 12px、淺灰背景標題
 */
import { Table } from 'antd';
import type { TableProps } from 'antd';
import './StyledTable.css';

interface StyledTableProps<T> extends TableProps<T> {
  // 可以添加自定義屬性
}

function StyledTable<T extends object>({ className, ...props }: StyledTableProps<T>) {
  return (
    <div className="styled-table-container">
      <Table<T>
        {...props}
        className={`styled-table ${className || ''}`}
      />
    </div>
  );
}

export default StyledTable;
