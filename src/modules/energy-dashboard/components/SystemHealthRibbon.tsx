import React from 'react';
import { Server, Cpu, Boxes, Radio, ChevronRight } from 'lucide-react';

interface GatewayHealth {
  total: number;
  online: number;
  intermittent: number;
  offline: number;
}

interface SystemHealthRibbonProps {
  gatewayHealth: GatewayHealth;
  metersCount: number;
  mappedAssetsCount: number;
  totalAssetsCount: number;
  brokerOnline: boolean | null;
  isLiveStream: boolean;
  defaultDeviceId: string;
  onNavigate?: (tab: string) => void;
}

export const SystemHealthRibbon: React.FC<SystemHealthRibbonProps> = ({
  gatewayHealth,
  metersCount,
  mappedAssetsCount,
  totalAssetsCount,
  brokerOnline,
  isLiveStream,
  defaultDeviceId,
  onNavigate,
}) => {
  return (
    <div className="health-ribbon">
      {/* Title */}
      <div className="health-ribbon-title">
        <Server size={16} color="var(--color-primary)" />
        <span>System Health Summary:</span>
      </div>

      {/* Metrics Strip */}
      <div className="health-ribbon-metrics">
        {/* Total Gateways */}
        <button
          type="button"
          className="health-metric-chip"
          onClick={() => onNavigate?.('devices')}
          title="Click to view all Gateway devices"
        >
          <span style={{ color: 'var(--color-text-muted)' }}>Gateways:</span>
          <span className="mono-num" style={{ fontWeight: 750, color: 'var(--color-text-primary)' }}>
            {gatewayHealth.total}
          </span>
        </button>

        {/* Online Gateways */}
        <button
          type="button"
          className="health-metric-chip"
          onClick={() => onNavigate?.('devices')}
          title="Click to view Online Gateways"
        >
          <span className="pulse-dot" style={{ backgroundColor: 'var(--color-success)' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>Online:</span>
          <span className="mono-num" style={{ fontWeight: 750, color: 'var(--color-success)' }}>
            {gatewayHealth.online}
          </span>
        </button>

        {/* Intermittent Gateways */}
        <button
          type="button"
          className="health-metric-chip"
          onClick={() => onNavigate?.('devices')}
          title="Click to view Intermittent Gateways"
        >
          <span className="pulse-dot" style={{ backgroundColor: 'var(--color-warning)' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>Intermittent:</span>
          <span className="mono-num" style={{ fontWeight: 750, color: 'var(--color-warning)' }}>
            {gatewayHealth.intermittent}
          </span>
        </button>

        {/* Offline Gateways */}
        <button
          type="button"
          className="health-metric-chip"
          onClick={() => onNavigate?.('devices')}
          title="Click to view Offline Gateways"
        >
          <span className="pulse-dot" style={{ backgroundColor: 'var(--color-danger)' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>Offline:</span>
          <span className="mono-num" style={{ fontWeight: 750, color: 'var(--color-danger)' }}>
            {gatewayHealth.offline}
          </span>
        </button>

        <div className="health-ribbon-divider" />

        {/* Meters Monitored */}
        <button
          type="button"
          className="health-metric-chip"
          onClick={() => onNavigate?.('meter-profile')}
          title="Click to view Meter Master Profiles"
        >
          <Cpu size={14} color="var(--color-text-muted)" />
          <span style={{ color: 'var(--color-text-muted)' }}>Meters:</span>
          <span className="mono-num" style={{ fontWeight: 750, color: 'var(--color-text-primary)' }}>
            {metersCount}
          </span>
        </button>

        {/* Mapped Assets */}
        <button
          type="button"
          className="health-metric-chip"
          onClick={() => onNavigate?.('asset-mapping')}
          title="Click to view Asset-to-Meter Mappings"
        >
          <Boxes size={14} color="var(--color-text-muted)" />
          <span style={{ color: 'var(--color-text-muted)' }}>Mapped Assets:</span>
          <span className="mono-num" style={{ fontWeight: 750, color: 'var(--color-text-primary)' }}>
            {mappedAssetsCount} / {totalAssetsCount}
          </span>
        </button>

        <div className="health-ribbon-divider" />

        {/* MQTT Broker Status */}
        <div className="health-metric-chip" style={{ cursor: 'default' }}>
          <span
            className="pulse-dot animate-pulse"
            style={{
              backgroundColor: brokerOnline ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>Broker:</span>
          <span
            style={{
              fontWeight: 750,
              color: brokerOnline ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {brokerOnline === null ? 'Checking...' : brokerOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Live Hardware Badge */}
        {isLiveStream && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              fontWeight: 650,
              fontSize: '0.72rem',
            }}
          >
            <span className="pulse-dot animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span>Hardware ({defaultDeviceId})</span>
          </div>
        )}
      </div>
    </div>
  );
};

