import React from 'react';

export interface StatCardProps {
  title?: React.ReactNode;
  value?: React.ReactNode;
  unit?: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: any;
  trend?: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  trend,
  color = 'green',
}) => {
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
            className="mono-num"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginTop: '4px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
        }}
      >
        <span
          style={{
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {subtext}
        </span>

        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
              color: color === 'green' ? 'var(--status-success-text)' : 'var(--brand-primary)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
