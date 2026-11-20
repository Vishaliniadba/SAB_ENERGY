import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X, ChevronRight } from 'lucide-react';

interface DashboardAlertsBannerProps {
  brokerOnline: boolean | null;
  offlineGatewaysCount: number;
  powerFactor: number;
  onNavigate?: (tab: string) => void;
}

export const DashboardAlertsBanner: React.FC<DashboardAlertsBannerProps> = ({
  brokerOnline,
  offlineGatewaysCount,
  powerFactor,
  onNavigate,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const alerts: Array<{ type: 'danger' | 'warning'; text: string; actionText?: string; targetTab?: string }> = [];

  if (brokerOnline === false) {
    alerts.push({
      type: 'danger',
      text: 'MQTT Broker disconnected. Real-time telemetry frames may be delayed.',
      actionText: 'Check Connectivity',
      targetTab: 'communication-config',
    });
  }

  if (offlineGatewaysCount > 0) {
    alerts.push({
      type: 'warning',
      text: `${offlineGatewaysCount} gateway device${offlineGatewaysCount > 1 ? 's are' : ' is'} currently offline or failing keepalive heartbeat.`,
      actionText: 'View Gateways',
      targetTab: 'devices',
    });
  }

  if (powerFactor < 0.90) {
    alerts.push({
      type: 'warning',
      text: `Average Power Factor is sub-optimal (${powerFactor.toFixed(2)}). Check power factor correction capacitor banks.`,
    });
  }

  if (alerts.length === 0) return null;

  const primaryAlert = alerts[0];
  const isDanger = primaryAlert.type === 'danger';

  return (
    <div
      style={{
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: isDanger ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
        border: `1px solid ${isDanger ? 'rgba(220, 38, 38, 0.28)' : 'rgba(183, 121, 31, 0.28)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.78rem',
        color: isDanger ? 'var(--color-danger)' : 'var(--color-warning)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isDanger ? <AlertCircle size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
        <span style={{ fontWeight: 650 }}>{primaryAlert.text}</span>
        {alerts.length > 1 && (
          <span style={{ fontSize: '0.70rem', opacity: 0.85, fontWeight: 500 }}>
            (+{alerts.length - 1} other notice{alerts.length > 2 ? 's' : ''})
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {primaryAlert.actionText && primaryAlert.targetTab && (
          <button
            type="button"
            onClick={() => onNavigate?.(primaryAlert.targetTab!)}
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: isDanger ? 'var(--color-danger)' : 'var(--color-warning)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{primaryAlert.actionText}</span>
            <ChevronRight size={12} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
          title="Dismiss alert"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

