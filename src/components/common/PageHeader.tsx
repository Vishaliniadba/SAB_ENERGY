import React from 'react';

export interface PageHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: any;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon: Icon, badge, actions }) => {
  return (
    <div className="page-header-container">
      <div>
        <div className="page-header-title">
          {Icon && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(189, 98, 31, 0.1)',
                color: 'var(--ca-badge-rust, #BD621F)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(189, 98, 31, 0.25)',
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </div>
          )}
          <span style={{ color: 'var(--ca-badge-rust, #BD621F)', fontWeight: 700 }}>{title}</span>
          {badge}
        </div>
        {subtitle && <p className="page-header-desc">{subtitle}</p>}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
