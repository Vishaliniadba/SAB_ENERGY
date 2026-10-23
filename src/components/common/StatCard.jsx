import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'cyan' }) => {
  const colorMap = {
    cyan: {
      accent: 'var(--primary-cyan)',
      bgGlow: 'var(--primary-cyan-glow)',
      border: 'var(--primary-cyan-border)'
    },
    emerald: {
      accent: 'var(--accent-emerald)',
      bgGlow: 'var(--accent-emerald-glow)',
      border: 'var(--accent-emerald-border)'
    },
    amber: {
      accent: 'var(--accent-amber)',
      bgGlow: 'var(--accent-amber-glow)',
      border: 'var(--accent-amber-border)'
    },
    purple: {
      accent: 'var(--accent-purple)',
      bgGlow: 'var(--accent-purple-glow)',
      border: 'rgba(139, 92, 246, 0.35)'
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        e.currentTarget.style.borderColor = scheme.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '8px',
              borderRadius: '10px',
              backgroundColor: scheme.bgGlow,
              color: scheme.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${scheme.border}`
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h2 style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {value}
        </h2>
      </div>

      {(subtext || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {trend && (
            <span style={{ color: trend.startsWith('+') ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
