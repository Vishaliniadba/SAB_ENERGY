import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Enterprise DataTable Component
 * Standardizes table markup, styling, empty states, and toolbars across all views.
 */
export function DataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  toolbar,
  emptyMessage = 'No records found.',
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  isLoading = false,
  className = '',
  containerClassName = '',
  containerStyle = {},
  tableStyle = {},
  onRowClick,
  rowClassName,
  children,
}) {
  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return row?.[rowKey] !== undefined ? row[rowKey] : index;
  };

  return (
    <div className={`table-container ${containerClassName}`.trim()} style={containerStyle}>
      {toolbar && <div className="table-toolbar">{toolbar}</div>}

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className={`enterprise-table ${className}`.trim()} style={tableStyle}>
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((col, idx) => {
                  const headerText = col.header !== undefined ? col.header : col.title || col.label || '';
                  const align = col.headerAlign || col.align || 'left';
                  const style = {
                    width: col.width,
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                    textAlign: align,
                    ...col.headerStyle,
                  };

                  return (
                    <th key={col.key || col.dataIndex || idx} style={style} className={col.headerClassName || ''}>
                      {headerText}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      className="animate-pulse"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-surface)',
                        border: '2px solid var(--brand-primary)',
                      }}
                    />
                    <span style={{ fontSize: '0.8125rem' }}>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    {EmptyIcon && <EmptyIcon size={32} style={{ opacity: 0.4 }} />}
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {emptyMessage}
                    </div>
                    {emptyAction && <div style={{ marginTop: '4px' }}>{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : children ? (
              children
            ) : (
              data.map((row, index) => {
                const key = getRowKey(row, index);
                const customRowClass = typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName || '';

                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                    className={customRowClass}
                  >
                    {columns.map((col, colIdx) => {
                      const align = col.align || 'left';
                      const cellStyle = {
                        textAlign: align,
                        width: col.width,
                        ...col.style,
                      };

                      let content;
                      if (typeof col.render === 'function') {
                        content = col.render(row, index);
                      } else if (col.key) {
                        content = row[col.key];
                      } else if (col.dataIndex) {
                        content = row[col.dataIndex];
                      } else {
                        content = null;
                      }

                      return (
                        <td key={col.key || col.dataIndex || colIdx} style={cellStyle} className={col.className || ''}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableToolbar({ children, className = '', style = {} }) {
  return (
    <div className={`table-toolbar ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export default DataTable;
