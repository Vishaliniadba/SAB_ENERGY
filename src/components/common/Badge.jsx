import React from 'react';

export const Badge = ({ status, text }) => {
  const label = text || status;
  const s = (status || '').toLowerCase();

  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';

  if (s === 'active' || s === 'online' || status === true) {
    bg = '#ecfdf5';
    color = '#059669';
    border = '#a7f3d0';
  } else if (s === 'offline' || s === 'inactive' || status === false) {
    bg = '#fff1f2';
    color = '#e11d48';
    border = '#fecdd3';
  } else if (s === 'standby' || s === 'warning') {
    bg = '#fffbeb';
    color = '#d97706';
    border = '#fde68a';
  } else if (s === 'maintenance') {
    bg = '#f5f3ff';
    color = '#7c3aed';
    border = '#ddd6fe';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
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
          backgroundColor: color
        }}
      />
      {label}
    </span>
  );
};
