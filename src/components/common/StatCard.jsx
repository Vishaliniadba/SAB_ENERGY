import React from 'react';

export const StatCard = ({ title, value, unit, subtext, icon: Icon, trend, color = 'green' }) => {
  return (
    <div
      className="panel-card panel-card-hover"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
        <span
          className="mono-num"
          style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginTop: '2px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '6px',
          }}
        >
          {subtext && <span>{subtext}</span>}
          {trend && (
            <span
              style={{
                fontWeight: 600,
                color: trend.startsWith('+') ? 'var(--status-success-text)' : 'var(--text-secondary)',
              }}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
