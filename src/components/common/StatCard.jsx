import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'cyan' }) => {
  const colorMap = {
    cyan: {
      accent: '#0284c7',
      bgGlow: '#f0f9ff',
      border: '#bae6fd'
    },
    emerald: {
      accent: '#059669',
      bgGlow: '#ecfdf5',
      border: '#a7f3d0'
    },
    amber: {
      accent: '#d97706',
      bgGlow: '#fffbeb',
      border: '#fde68a'
    },
    purple: {
      accent: '#7c3aed',
      bgGlow: '#f5f3ff',
      border: '#ddd6fe'
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
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.07)';
        e.currentTarget.style.borderColor = scheme.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
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
              justifyContent: 'center'
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h2 style={{ fontSize: '1.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {value}
        </h2>
      </div>

      {(subtext || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
          {trend && (
            <span style={{ color: trend.startsWith('+') ? '#059669' : '#e11d48', fontWeight: 600 }}>
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
