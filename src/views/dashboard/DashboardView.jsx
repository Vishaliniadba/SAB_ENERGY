import React, { useState, useEffect } from 'react';
import {
  Zap,
  Radio,
  Cpu,
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const DashboardView = () => {
  const { gateways, channels, meters, assets, mappings } = useEnergyData();

  // Simulated live fluctuating telemetry data
  const [telemetry, setTelemetry] = useState({
    activePower: 412.8,
    dailyGeneration: 1850.4,
    dailyConsumption: 1420.2,
    powerFactor: 0.98,
    gridFrequency: 50.02
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        activePower: +(prev.activePower + (Math.random() * 4 - 2)).toFixed(1),
        dailyGeneration: +(prev.dailyGeneration + 0.1).toFixed(1),
        dailyConsumption: +(prev.dailyConsumption + 0.08).toFixed(1),
        powerFactor: +(0.97 + Math.random() * 0.02).toFixed(2),
        gridFrequency: +(49.98 + Math.random() * 0.05).toFixed(2)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeGateways = gateways.filter(g => g.status === 'Active').length;
  const activeMeters = meters.filter(m => m.status === 'Active').length;
  const activeAssets = assets.filter(a => a.status === 'Active').length;
  const activeMappings = mappings.filter(m => m.is_active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <StatCard
          title="Active Gateways"
          value={`${activeGateways} / ${gateways.length}`}
          subtext="Online SCADA nodes"
          icon={Radio}
          color="cyan"
          trend="+100% Online"
        />
        <StatCard
          title="Meters Monitored"
          value={`${activeMeters} / ${meters.length}`}
          subtext="Modbus / TCP connected"
          icon={Cpu}
          color="emerald"
          trend="+1.2% healthy"
        />
        <StatCard
          title="Mapped Energy Assets"
          value={`${activeMappings} / ${assets.length}`}
          subtext="CT/PT ratio configured"
          icon={Boxes}
          color="purple"
        />
        <StatCard
          title="Total Generation Today"
          value={`${telemetry.dailyGeneration} kWh`}
          subtext="Solar & Wind combined"
          icon={Zap}
          color="amber"
          trend="+8.4% vs yesterday"
        />
      </div>

      {/* Real-Time Telemetry & Active Asset Feed */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px'
        }}
      >
        {/* Active Asset Meter Feed Table */}
        <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Asset Telemetry & CT/PT Calculation
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, backgroundColor: 'var(--accent-emerald-glow)', padding: '4px 11px', borderRadius: '20px', border: '1px solid var(--accent-emerald-border)' }}>
              <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-emerald)' }} />
              Live Stream
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', borderRadius: '6px 0 0 6px' }}>Asset</th>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Assigned Meter</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>CT/PT Multiplier</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Calculated Power</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', borderRadius: '0 6px 6px 0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => {
                  const mapping = mappings.find(m => m.Asset_id === asset.Asset_id && m.is_active);
                  const meter = mapping ? meters.find(m => m.Meter_id === mapping.Meter_id) : null;
                  const factor = mapping ? parseFloat(mapping.multiplication_factor) || 1 : 1;
                  const estimatedKw = mapping ? (15.5 * factor + (index * 4.2)).toFixed(1) : 0;

                  return (
                    <tr
                      key={asset.Asset_id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 12px', color: 'var(--text-primary)' }}>
                        {asset.Asset_name}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.Asset_id}</div>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{asset.asset_type}</td>
                      <td style={{ padding: '14px 12px' }}>
                        {meter ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Cpu size={14} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-primary)' }}>{meter.Meter_name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No Meter Mapped</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {mapping ? `${factor}x` : '—'}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {mapping ? `${estimatedKw} kW` : '0 kW'}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
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
        <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Grid Telemetry
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Live Active Power</span>
                <span style={{ color: 'var(--primary-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{telemetry.activePower} kW</span>
              </div>
              <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (telemetry.activePower / 600) * 100)}%`, backgroundColor: 'var(--primary-cyan)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Power Factor (cos φ)</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{telemetry.powerFactor}</span>
              </div>
              <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ height: '100%', width: `${telemetry.powerFactor * 100}%`, backgroundColor: 'var(--accent-emerald)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Grid Frequency</span>
                <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{telemetry.gridFrequency} Hz</span>
              </div>
              <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ height: '100%', width: `${((telemetry.gridFrequency - 49) / 2) * 100}%`, backgroundColor: 'var(--accent-amber)', borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-cyan-glow)',
              border: '1px solid var(--primary-cyan-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <CheckCircle2 size={18} color="var(--primary-cyan)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>
              All {channels.filter(c => c.status === 'Active').length} communication channels transmitting telemetry normally.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
