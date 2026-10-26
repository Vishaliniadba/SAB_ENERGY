import React from 'react';

export const PageHeader = ({ title, subtitle, icon: Icon, badge, actions }) => {
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
                backgroundColor: 'var(--brand-surface)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-border)',
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </div>
          )}
          <span>{title}</span>
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
