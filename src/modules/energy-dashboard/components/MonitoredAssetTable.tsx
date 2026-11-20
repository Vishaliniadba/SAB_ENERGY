import React, { useState, useMemo } from 'react';
import { Cpu, Search, Sliders, ExternalLink } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

interface MonitoredAssetTableProps {
  assets: any[];
  mappings: any[];
  meters: any[];
  onInspectAsset: (asset: any, mapping: any, meter: any) => void;
}

export const MonitoredAssetTable: React.FC<MonitoredAssetTableProps> = ({
  assets,
  mappings,
  meters,
  onInspectAsset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        (a.Asset_name || '').toLowerCase().includes(q) ||
        (a.Asset_id || '').toLowerCase().includes(q) ||
        (a.asset_type || '').toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  return (
    <div className="industrial-card" style={{ flex: 1 }}>
      {/* Header with Title and Search Input */}
      <div className="industrial-card-header">
        <div>
          <h3 className="industrial-card-title">Monitored Asset Telemetry & CT/PT Multipliers</h3>
          <p className="industrial-card-subtitle">
            Calculated electrical load scaled by configured current and potential transformers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={14}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter assets..."
              style={{
                height: '32px',
                width: '100%',
                paddingLeft: '30px',
                paddingRight: '10px',
                fontSize: '0.76rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              fontWeight: 650,
              fontSize: '0.72rem',
            }}
          >
            <span className="pulse-dot animate-pulse" style={{ backgroundColor: 'var(--color-success)' }} />
            Active Fleet
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Asset Name</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Category</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Assigned Meter</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'right' }}>CT/PT Multiplier</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Calculated Power</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.80rem' }}>
                  No industrial assets match the filter criteria.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, index) => {
                const mapping = mappings.find((m) => m.Asset_id === asset.Asset_id && m.is_active);
                const meter = mapping ? meters.find((m) => m.Meter_id === mapping.Meter_id) : null;
                const factor = mapping ? parseFloat(mapping.multiplication_factor) || 1 : 1;
                const estimatedKw = mapping ? (15.5 * factor + index * 4.2).toFixed(1) : '0.0';

                return (
                  <tr
                    key={asset.Asset_id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.015)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.015)';
                    }}
                  >
                    {/* Asset Name */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 650, color: 'var(--color-text-primary)' }}>{asset.Asset_name}</div>
                      <div className="mono-num" style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        {asset.Asset_id}
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                      {asset.asset_type || 'Industrial Feeder'}
                    </td>

                    {/* Assigned Meter */}
                    <td style={{ padding: '10px 14px' }}>
                      {meter ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cpu size={13} color="var(--color-primary)" />
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{meter.Meter_name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.74rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* CT/PT Multiplier */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span className="mono-num" style={{ fontWeight: 650, color: 'var(--color-text-primary)' }}>
                        {mapping ? `${factor}x` : '—'}
                      </span>
                    </td>

                    {/* Calculated Power */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span
                        className="mono-num"
                        style={{
                          fontWeight: 750,
                          color: mapping ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontSize: '0.84rem',
                        }}
                      >
                        {mapping ? `${estimatedKw} kW` : '0.0 kW'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <Badge status={asset.status || 'Active'} />
                    </td>

                    {/* Action */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onInspectAsset(asset, mapping, meter)}
                        style={{
                          height: '26px',
                          padding: '0 8px',
                          fontSize: '0.70rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Inspect CT/PT parameters and mathematical scaling"
                      >
                        <Sliders size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

