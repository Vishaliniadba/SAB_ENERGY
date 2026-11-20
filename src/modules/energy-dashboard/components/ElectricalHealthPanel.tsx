import React from 'react';
import { CheckCircle2, AlertTriangle, Radio, Activity, Zap, Gauge } from 'lucide-react';

interface ElectricalHealthPanelProps {
  telemetry: {
    activePower: number;
    powerFactor: number;
    gridFrequency: number;
  };
  channels: any[];
}

export const ElectricalHealthPanel: React.FC<ElectricalHealthPanelProps> = ({
  telemetry,
  channels,
}) => {
  const maxCapacityKw = 600; // Transformer incoming capacity limit
  const demandPercentage = Math.min(100, Math.max(0, (telemetry.activePower / maxCapacityKw) * 100));

  const pfValue = Number(telemetry.powerFactor) || 0.95;
  const isPfHealthy = pfValue >= 0.95;

  const freqValue = Number(telemetry.gridFrequency) || 50.0;
  const isFreqNormal = freqValue >= 49.5 && freqValue <= 50.5;
  const freqProgress = Math.min(100, Math.max(0, ((freqValue - 49) / 2) * 100));

  const activeChannelsCount = channels.filter((c) => c.status === 'Active').length;

  return (
    <div className="industrial-card" style={{ flex: '0 1 360px', width: '100%' }}>
      {/* Header */}
      <div className="industrial-card-header">
        <div>
          <h3 className="industrial-card-title">Live Electrical Parameters</h3>
          <p className="industrial-card-subtitle">
            Instantaneous telemetry readings across high-voltage incoming line.
          </p>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            fontWeight: 700,
          }}
        >
          SCADA
        </span>
      </div>

      {/* Gauges & Indicators List */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Metric 1: Active Demand vs Capacity */}
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 650, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={13} color="var(--color-primary)" />
              Active Demand
            </span>
            <span className="mono-num" style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--color-primary)' }}>
              {telemetry.activePower.toFixed(2)} kW
            </span>
          </div>

          {/* Bar */}
          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${demandPercentage}%`,
                backgroundColor: demandPercentage > 85 ? 'var(--color-danger)' : 'var(--color-primary)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            <span>0 kW</span>
            <span>Capacity: {maxCapacityKw} kW ({demandPercentage.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Metric 2: Power Factor (cos φ) */}
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 650, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Gauge size={13} color={isPfHealthy ? 'var(--color-success)' : 'var(--color-warning)'} />
              Power Factor (cos φ)
            </span>
            <span
              className="mono-num"
              style={{
                fontSize: '0.85rem',
                fontWeight: 750,
                color: isPfHealthy ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              {pfValue.toFixed(2)}
            </span>
          </div>

          {/* Bar */}
          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, pfValue * 100)}%`,
                backgroundColor: isPfHealthy ? 'var(--color-success)' : 'var(--color-warning)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            <span>Target: ≥ 0.95</span>
            <span style={{ color: isPfHealthy ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 650 }}>
              {isPfHealthy ? 'Capacitor Bank Synchronized' : 'Capacitor Boost Required'}
            </span>
          </div>
        </div>

        {/* Metric 3: Grid Frequency */}
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 650, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={13} color="var(--color-primary)" />
              Grid Frequency
            </span>
            <span className="mono-num" style={{ fontSize: '0.85rem', fontWeight: 750, color: isFreqNormal ? 'var(--color-text-primary)' : 'var(--color-warning)' }}>
              {freqValue.toFixed(2)} Hz
            </span>
          </div>

          {/* Bar */}
          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${freqProgress}%`,
                backgroundColor: isFreqNormal ? 'var(--color-primary)' : 'var(--color-warning)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            <span>Nominal: 50.00 Hz</span>
            <span>Range: 49.50 – 50.50 Hz</span>
          </div>
        </div>

        {/* Metric 4: RS-485 Bus Communication Health */}
        <div
          style={{
            marginTop: 'auto',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid rgba(22, 131, 74, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.74rem', color: 'var(--color-primary-dark)', fontWeight: 650 }}>
            All {activeChannelsCount} RS-485 communication channels polling telemetry normally.
          </span>
        </div>
      </div>
    </div>
  );
};

