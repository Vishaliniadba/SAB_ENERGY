import React from 'react';

export const Badge = ({ status, text }) => {
  const label = text || (status === true ? 'Active' : status === false ? 'Inactive' : status) || 'Unknown';
  const s = String(status ?? '').toLowerCase().trim();

  let badgeClass = 'status-badge status-badge-info';
  let dotColor = 'currentColor';

  if (s === 'active' || s === 'online' || status === true) {
    badgeClass = 'status-badge status-badge-online';
    dotColor = 'var(--status-success-text)';
  } else if (s === 'offline' || s === 'inactive' || s === 'danger' || status === false) {
    badgeClass = 'status-badge status-badge-offline';
    dotColor = 'var(--status-danger-text)';
  } else if (s === 'warning' || s === 'intermittent' || s === 'standby' || s === 'idle') {
    badgeClass = 'status-badge status-badge-warning';
    dotColor = 'var(--status-warning-text)';
  } else if (s === 'maintenance') {
    badgeClass = 'status-badge';
  }

  const isLive = s === 'active' || s === 'online' || status === true;

  return (
    <span className={badgeClass} style={{ textTransform: 'capitalize' }}>
      <span
        className={`pulse-dot ${isLive ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </span>
  );
};
