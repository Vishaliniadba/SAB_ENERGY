import React, { useState, useMemo } from 'react';
import {
  Inbox,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ThemeDotsLoader } from './ThemeDotsLoader';

export interface ColumnDef<T = any> {
  key?: string;
  dataIndex?: string;
  header?: React.ReactNode;
  title?: React.ReactNode;
  label?: React.ReactNode;
  align?: 'left' | 'center' | 'right' | string;
  headerAlign?: 'left' | 'center' | 'right' | string;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  style?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  className?: string;
  headerClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns?: ColumnDef<T>[];
  data?: T[];
  rowKey?: string | ((row: T, index: number) => string | number);
  toolbar?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  emptyIcon?: any;
  emptyAction?: React.ReactNode;
  isLoading?: boolean;
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  loadingVariant?: 'navy' | 'theme' | 'rust' | 'original' | 'brand';
  className?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  tableStyle?: React.CSSProperties;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  children?: React.ReactNode;

  // Modern UI & Pagination controls matching enterprise specifications
  showIndexColumn?: boolean;
  indexColumnHeader?: string;
  indexColumnWidth?: string | number;

  pagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  currentPage?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  headerVariant?: 'forest' | 'navy';
}

/**
 * Enterprise Reusable DataTable Component
 * Features dark navy blue header (#0C1E36), rounded corners, built-in client/server pagination,
 * sequential index column (#), responsive design, and status badge & action helpers.
 */
export function DataTable<T = any>({
  columns = [],
  data = [],
  rowKey = 'id',
  toolbar,
  emptyMessage = 'No records found.',
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  isLoading = false,
  loading = false,
  loadingMessage,
  loadingVariant = 'navy',
  className = '',
  containerClassName = '',
  containerStyle = {},
  tableStyle = {},
  onRowClick,
  rowClassName,
  children,

  showIndexColumn = true,
  indexColumnHeader = '#',
  indexColumnWidth = '56px',

  pagination = true,
  defaultPageSize = 5,
  pageSizeOptions = [5, 10, 25, 50],
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalRecords: controlledTotal,
  onPageChange,
  onPageSizeChange,
  headerVariant = 'navy',
}: DataTableProps<T>) {
  const isDataLoading = isLoading || loading;

  // Internal pagination state for client-side pagination
  const [internalPage, setInternalPage] = useState<number>(1);
  const [internalPageSize, setInternalPageSize] = useState<number>(defaultPageSize);

  const isServerPaged = controlledPage !== undefined;
  const page = isServerPaged ? controlledPage : internalPage;
  const size = controlledPageSize !== undefined ? controlledPageSize : internalPageSize;

  const total = controlledTotal !== undefined ? controlledTotal : (data ? data.length : 0);
  const totalPages = Math.max(1, Math.ceil(total / (size || 1)));

  // Safely adjust page if out of bounds
  const safePage = Math.min(Math.max(1, page), totalPages);

  // Paginated slice for client-side data
  const displayData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (!pagination || isServerPaged) return data;
    const startIdx = (safePage - 1) * size;
    return data.slice(startIdx, startIdx + size);
  }, [data, pagination, isServerPaged, safePage, size]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.min(Math.max(1, newPage), totalPages);
    if (!isServerPaged) {
      setInternalPage(clamped);
    }
    if (onPageChange) {
      onPageChange(clamped);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (controlledPageSize === undefined) {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const getRowKey = (row: any, index: number) => {
    if (typeof rowKey === 'function') {
      return (rowKey as Function)(row, index);
    }
    return row?.[rowKey] !== undefined ? row[rowKey] : index;
  };

  // Compute final columns list, prepending the index column if requested
  const finalColumns = useMemo(() => {
    if (!showIndexColumn) return columns;

    const existingIndexIdx = columns.findIndex(
      (c) =>
        c.header === '#' ||
        c.title === '#' ||
        c.key === '#' ||
        c.dataIndex === '#' ||
        c.key === '__table_index_col' ||
        c.header === 'S.No' ||
        c.header === 'S.NO' ||
        c.header === 'S.No.' ||
        c.header === 'Sl.No' ||
        c.header === 'Sl No'
    );

    if (existingIndexIdx !== -1) {
      // Standardize the existing index column with correct pagination offset
      return columns.map((col, i) => {
        if (i !== existingIndexIdx) return col;
        return {
          ...col,
          header: col.header || '#',
          align: 'center' as const,
          headerAlign: 'center' as const,
          width: col.width || indexColumnWidth,
          headerStyle: { width: col.width || indexColumnWidth, textAlign: 'center' as const, ...col.headerStyle },
          style: {
            width: col.width || indexColumnWidth,
            textAlign: 'center' as const,
            fontWeight: 700,
            color: '#0F172A',
            ...col.style,
          },
          render: (_row: any, idx: number) => {
            const offset = pagination ? (safePage - 1) * size : 0;
            return <span>{offset + idx + 1}</span>;
          },
        };
      });
    }

    const indexCol: ColumnDef<T> = {
      key: '__table_index_col',
      header: indexColumnHeader,
      width: indexColumnWidth,
      align: 'center' as const,
      headerAlign: 'center' as const,
      headerStyle: { width: indexColumnWidth, textAlign: 'center' as const },
      style: {
        width: indexColumnWidth,
        textAlign: 'center' as const,
        fontWeight: 700,
        color: '#0F172A',
      },
      render: (_row, idx) => {
        const offset = pagination ? (safePage - 1) * size : 0;
        return <span>{offset + idx + 1}</span>;
      },
    };

    return [indexCol, ...columns];
  }, [columns, showIndexColumn, indexColumnHeader, indexColumnWidth, pagination, safePage, size]);

  // Pagination boundaries
  const startEntry = total === 0 ? 0 : (safePage - 1) * size + 1;
  const endEntry = Math.min(total, safePage * size);

  // Generate page numbers for pagination bar
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, safePage - 2);
      let end = Math.min(totalPages, safePage + 2);
      if (start === 1) end = Math.min(5, totalPages);
      if (end === totalPages) start = Math.max(1, totalPages - 4);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [safePage, totalPages]);

  const headerBgColor = '#0C1E36';

  return (
    <div
      className={`table-container ${containerClassName}`.trim()}
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        ...containerStyle,
      }}
    >
      {toolbar && <div className="table-toolbar">{toolbar}</div>}

      <div style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
        {/* Active Refreshing Overlay for existing rows */}
        {isDataLoading && data.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.76)',
              backdropFilter: 'blur(2px)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '120px',
              transition: 'opacity 0.2s ease',
            }}
          >
            <ThemeDotsLoader
              message={loadingMessage || 'Refreshing records...'}
              variant={loadingVariant}
            />
          </div>
        )}

        <table
          className={`enterprise-table ${className}`.trim()}
          style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, ...tableStyle }}
        >
          {finalColumns.length > 0 && (
            <thead>
              <tr>
                {finalColumns.map((col, idx) => {
                  const headerText = col.header !== undefined ? col.header : col.title || col.label || '';
                  const align = col.headerAlign || col.align || 'left';
                  const isFirst = idx === 0;
                  const isLast = idx === finalColumns.length - 1;

                  const style: React.CSSProperties = {
                    width: col.width,
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                    textAlign: (align || 'left') as React.CSSProperties['textAlign'],
                    backgroundColor: headerBgColor,
                    color: '#FFFFFF',
                    borderTopLeftRadius: isFirst ? '8px' : undefined,
                    borderTopRightRadius: isLast ? '8px' : undefined,
                    ...(col.headerStyle as any),
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
            {isDataLoading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={finalColumns.length || 1}
                  style={{ padding: '56px 16px', textAlign: 'center' }}
                >
                  <ThemeDotsLoader
                    message={loadingMessage || 'Loading records...'}
                    variant={loadingVariant}
                  />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={finalColumns.length || 1}
                  style={{ padding: '40px 16px', textAlign: 'center', color: '#64748B' }}
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
                    {EmptyIcon && <EmptyIcon size={32} style={{ opacity: 0.35, color: '#94A3B8' }} />}
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#475569' }}>
                      {emptyMessage}
                    </div>
                    {emptyAction && <div style={{ marginTop: '4px' }}>{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : children ? (
              children
            ) : (
              displayData.map((row, index) => {
                const key = getRowKey(row, index);
                const customRowClass = typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName || '';

                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                    className={customRowClass}
                  >
                    {finalColumns.map((col, colIdx) => {
                      const align = col.align || 'left';
                      const cellStyle: React.CSSProperties = {
                        textAlign: (align || 'left') as React.CSSProperties['textAlign'],
                        width: col.width,
                        ...(col.style as any),
                      };

                      let content: React.ReactNode;
                      if (typeof col.render === 'function') {
                        content = col.render(row, index);
                      } else if (col.key && (row as any)[col.key] !== undefined) {
                        content = (row as any)[col.key];
                      } else if (col.dataIndex && (row as any)[col.dataIndex] !== undefined) {
                        content = (row as any)[col.dataIndex];
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

      {/* ── Modern Enterprise Pagination Footer ── */}
      {pagination && (
        <div className="table-pagination-footer">
          <div className="table-pagination-info">
            Showing {startEntry} to {endEntry} of {total} entries
          </div>

          <div className="table-pagination-controls">
            {/* Rows Per Page Selector */}
            <div className="table-page-size-wrapper">
              <span>Rows:</span>
              <select
                aria-label="Rows per page"
                className="table-page-size-select"
                value={size}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Previous Page Chevron Button */}
            <button
              type="button"
              className="table-page-nav-btn"
              title="Previous page"
              aria-label="Previous page"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(safePage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Pills */}
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                className={`table-page-num-btn ${p === safePage ? 'active' : ''}`}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </button>
            ))}

            {/* Next Page Chevron Button */}
            <button
              type="button"
              className="table-page-nav-btn"
              title="Next page"
              aria-label="Next page"
              disabled={safePage >= totalPages}
              onClick={() => handlePageChange(safePage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Pill Badge Component (Matches Design Spec) ───────────────────────
export interface TableBadgeProps {
  variant?:
    | 'approved'
    | 'placed'
    | 'received'
    | 'urgent'
    | 'normal'
    | 'active'
    | 'inactive'
    | 'offline'
    | 'pending'
    | 'warning'
    | string;
  status?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TableBadge({
  variant,
  status,
  children,
  className = '',
  style = {},
}: TableBadgeProps) {
  // Normalize status text to compute badge style
  const rawKey = (variant || status || (typeof children === 'string' ? children : '') || 'normal')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');

  let resolvedVariant = 'normal';
  if (['approved', 'active', 'online', 'completed', 'success'].includes(rawKey)) {
    resolvedVariant = 'approved';
  } else if (['placed', 'info', 'pending', 'open'].includes(rawKey)) {
    resolvedVariant = 'placed';
  } else if (['received', 'received-at-branch'].includes(rawKey)) {
    resolvedVariant = 'received';
  } else if (['urgent', 'critical', 'danger', 'high', 'failed', 'error'].includes(rawKey)) {
    resolvedVariant = 'urgent';
  } else if (['warning', 'in-progress', 'medium'].includes(rawKey)) {
    resolvedVariant = 'warning';
  } else {
    resolvedVariant = 'normal';
  }

  const label = children || status || variant?.toUpperCase() || '';

  return (
    <span className={`table-pill-badge ${resolvedVariant} ${className}`.trim()} style={style}>
      {label}
    </span>
  );
}

// ─── Reusable Action Button (Eye, Document, Edit, Delete) ────────────────────
export interface TableActionButtonProps {
  variant?: 'view' | 'document' | 'edit' | 'delete' | 'custom';
  icon?: React.ReactNode;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function TableActionButton({
  variant = 'custom',
  icon,
  title,
  onClick,
  disabled = false,
  className = '',
  style = {},
  children,
}: TableActionButtonProps) {
  let defaultIcon: React.ReactNode = null;
  let defaultTitle = '';

  if (variant === 'view') {
    defaultIcon = <Eye size={15} />;
    defaultTitle = 'View Details';
  } else if (variant === 'document') {
    defaultIcon = <FileText size={15} />;
    defaultTitle = 'View Document';
  } else if (variant === 'edit') {
    defaultIcon = <Edit3 size={14} />;
    defaultTitle = 'Edit';
  } else if (variant === 'delete') {
    defaultIcon = <Trash2 size={14} />;
    defaultTitle = 'Delete';
  }

  return (
    <button
      type="button"
      className={`table-action-btn ${className}`.trim()}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children || icon || defaultIcon}
    </button>
  );
}

// ─── Action Group Wrapper ────────────────────────────────────────────────────
export function TableActionGroup({
  children,
  align = 'center',
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`table-action-group ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        width: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Cell Text with Primary / Subtitle Format ────────────────────────────────
export function TableCellText({
  primary,
  secondary,
  className = '',
  style = {},
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`table-cell-text ${className}`.trim()} style={style}>
      <div className="table-cell-primary">{primary}</div>
      {secondary && <div className="table-cell-secondary">{secondary}</div>}
    </div>
  );
}

// ─── Table Toolbar ───────────────────────────────────────────────────────────
export function TableToolbar({
  children,
  className = '',
  style = {},
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`table-toolbar ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export default DataTable;
