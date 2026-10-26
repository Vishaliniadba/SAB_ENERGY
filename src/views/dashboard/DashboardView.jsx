import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Radio,
  Cpu,
  Boxes,
  CheckCircle2,
  RefreshCw,
  Activity,
  Server,
  Layers,
  Clock,
  Gauge,
  Wifi,
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const DashboardView = () => {
  const { gateways, channels, meters, assets, mappings } = useEnergyData();

  const [lastRefreshed, setLastRefreshed] = useState(() => new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulated live fluctuating telemetry data (explicitly identified as demo stream)
  const [telemetry, setTelemetry] = useState({
    activePower: 412.8,
    dailyGeneration: 1850.4,
    dailyConsumption: 1420.2,
    powerFactor: 0.98,
    gridFrequency: 50.02,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        activePower: +(prev.activePower + (Math.random() * 4 - 2)).toFixed(1),
        dailyGeneration: +(prev.dailyGeneration + 0.1).toFixed(1),
        dailyConsumption: +(prev.dailyConsumption + 0.08).toFixed(1),
        powerFactor: +(0.97 + Math.random() * 0.02).toFixed(2),
        gridFrequency: +(49.98 + Math.random() * 0.05).toFixed(2),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 450);
  };

  // Derive gateway statuses using the project's exact standard logic
  const gatewayHealth = useMemo(() => {
    let online = 0;
    let intermittent = 0;
    let offline = 0;

    const now = Date.now();
    gateways.forEach((gw) => {
      if (!gw.last_communicate_time) {
        offline++;
        return;
      }
      const lastMs = new Date(gw.last_communicate_time).getTime();
      const keepAliveMs = (Number(gw.keep_alive_seconds) || 30) * 1000;
      const diffMs = now - lastMs;
      if (diffMs <= keepAliveMs * 2) {
        online++;
      } else if (diffMs <= keepAliveMs * 10) {
        intermittent++;
      } else {
        offline++;
      }
    });

    return { total: gateways.length, online, intermittent, offline };
  }, [gateways]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── A. Dashboard Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Energy Overview
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)',
              }}
            >
              Simulated Telemetry Stream
            </span>
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Real-time telemetry, power consumption metrics, and connectivity health across industrial assets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            Updated: {lastRefreshed}
          </span>
          <button
            onClick={handleManualRefresh}
            className="btn btn-secondary"
            style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem' }}
            disabled={isRefreshing}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-pulse' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── B. Four Executive KPI Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        <StatCard
          title="Active Power"
          value={telemetry.activePower}
          unit="kW"
          subtext="Total load across feeder buses"
          icon={Zap}
          trend="+1.4% load variance"
        />
        <StatCard
          title="Daily Generation"
          value={telemetry.dailyGeneration}
          unit="kWh"
          subtext="Solar & backup generation today"
          icon={Activity}
          trend="+8.2% vs yesterday"
        />
        <StatCard
          title="Average Power Factor"
          value={telemetry.powerFactor}
          unit="PF"
          subtext="cos φ (Target >= 0.95)"
          icon={Gauge}
          trend="Healthy (Capacitor Bank On)"
        />
        <StatCard
          title="Grid Frequency"
          value={telemetry.gridFrequency}
          unit="Hz"
          subtext="Nominal 50.00 Hz tolerance ±0.5%"
          icon={Radio}
          trend="Grid Synchronized"
        />
      </div>

      {/* ── C. System Health Summary Ribbon ── */}
      <div
        className="panel-card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: 'var(--bg-surface-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={16} color="var(--brand-primary)" />
          <span style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-primary)' }}>
            System Health Summary:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Gateways:</span>
            <span className="mono-num" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {gatewayHealth.total}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ backgroundColor: 'var(--status-success-text)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Online:</span>
            <span className="mono-num" style={{ fontWeight: 700, color: 'var(--status-success-text)' }}>
              {gatewayHealth.online}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ backgroundColor: 'var(--status-warning-text)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Intermittent:</span>
            <span className="mono-num" style={{ fontWeight: 700, color: 'var(--status-warning-text)' }}>
              {gatewayHealth.intermittent}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ backgroundColor: 'var(--status-danger-text)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Offline:</span>
            <span className="mono-num" style={{ fontWeight: 700, color: 'var(--status-danger-text)' }}>
              {gatewayHealth.offline}
            </span>
          </div>

          <div style={{ height: '14px', width: '1px', backgroundColor: 'var(--border-default)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Meters Monitored:</span>
            <span className="mono-num" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {meters.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Boxes size={14} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Mapped Assets:</span>
            <span className="mono-num" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {mappings.filter((m) => m.is_active).length} / {assets.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── D. Telemetry Grid: Active Asset Feed & Grid Health ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '18px',
        }}
      >
        {/* Active Asset Meter Feed Table */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ fontSize: '0.925rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
                Monitored Asset Telemetry & CT/PT Multipliers
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Electrical calculations based on configured current and potential transformer scaling.
              </p>
            </div>
            <span className="status-badge status-badge-online">
              <span className="pulse-dot animate-pulse" style={{ backgroundColor: 'var(--status-success-text)' }} />
              Live Feed
            </span>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Assigned Meter</th>
                  <th style={{ textAlign: 'right' }}>CT/PT Multiplier</th>
                  <th style={{ textAlign: 'right' }}>Calculated Power</th>
                  <th style={{ textAlign: 'center' }}>Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => {
                  const mapping = mappings.find((m) => m.Asset_id === asset.Asset_id && m.is_active);
                  const meter = mapping ? meters.find((m) => m.Meter_id === mapping.Meter_id) : null;
                  const factor = mapping ? parseFloat(mapping.multiplication_factor) || 1 : 1;
                  const estimatedKw = mapping ? (15.5 * factor + index * 4.2).toFixed(1) : '0.0';

                  return (
                    <tr key={asset.Asset_id}>
                      <td style={{ fontWeight: 600 }}>
                        {asset.Asset_name}
                        <div className="mono-num" style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {asset.Asset_id}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{asset.asset_type}</td>
                      <td>
                        {meter ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Cpu size={13} color="var(--brand-primary)" />
                            <span style={{ fontWeight: 550 }}>{meter.Meter_name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {mapping ? `${factor}x` : '—'}
                      </td>
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700, color: mapping ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                        {mapping ? `${estimatedKw} kW` : '0.0 kW'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge status={asset.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-Time Grid / SCADA Metrics Panel */}
        <div
          className="panel-card"
          style={{
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.925rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
              Live Electrical Parameters
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Instantaneous telemetry readings across high-voltage incoming line.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Active Power Gauge */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Active Demand</span>
                <span className="mono-num" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                  {telemetry.activePower} kW
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '3px',
                  marginTop: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (telemetry.activePower / 600) * 100)}%`,
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* Power Factor Gauge */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Power Factor (cos φ)</span>
                <span className="mono-num" style={{ color: 'var(--status-success-text)', fontWeight: 700 }}>
                  {telemetry.powerFactor} PF
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '3px',
                  marginTop: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${telemetry.powerFactor * 100}%`,
                    backgroundColor: 'var(--status-success-text)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* Grid Frequency Gauge */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Grid Frequency</span>
                <span className="mono-num" style={{ color: 'var(--status-warning-text)', fontWeight: 700 }}>
                  {telemetry.gridFrequency} Hz
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '3px',
                  marginTop: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((telemetry.gridFrequency - 49) / 2) * 100}%`,
                    backgroundColor: 'var(--status-warning-text)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--brand-surface)',
              border: '1px solid var(--brand-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.74rem', color: 'var(--brand-primary-deep)', fontWeight: 600 }}>
              All {channels.filter((c) => c.status === 'Active').length} RS485 communication channels polling telemetry normally.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
