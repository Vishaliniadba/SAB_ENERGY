import React from 'react';

export const Badge = ({ status, text }) => {
  const label = text || status;
  const s = (status || '').toLowerCase();

  let bg = 'rgba(148, 163, 184, 0.12)';
  let color = 'var(--text-muted)';
  let border = 'rgba(148, 163, 184, 0.25)';

  if (s === 'active' || s === 'online' || status === true) {
    bg = 'var(--accent-emerald-glow)';
    color = 'var(--accent-emerald)';
    border = 'var(--accent-emerald-border)';
  } else if (s === 'offline' || s === 'inactive' || status === false) {
    bg = 'var(--accent-rose-glow)';
    color = 'var(--accent-rose)';
    border = 'var(--accent-rose-border)';
  } else if (s === 'standby' || s === 'warning') {
    bg = 'var(--accent-amber-glow)';
    color = 'var(--accent-amber)';
    border = 'var(--accent-amber-border)';
  } else if (s === 'maintenance') {
    bg = 'var(--accent-purple-glow)';
    color = 'var(--accent-purple)';
    border = 'rgba(139, 92, 246, 0.35)';
  }

  return (
    <span
      className="scada-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.74rem',
        fontWeight: '700',
        letterSpacing: '0.02em',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: (s === 'active' || s === 'online') ? '0 0 8px currentColor' : 'none'
        }}
      />
      {label}
    </span>
  );
};
