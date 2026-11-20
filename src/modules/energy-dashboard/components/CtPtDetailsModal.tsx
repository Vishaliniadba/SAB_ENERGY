import React from 'react';
import { X, Sliders, Cpu, Activity, Info, CheckCircle2 } from 'lucide-react';

interface CtPtDetailsModalProps {
  asset: any;
  mapping: any;
  meter: any;
  onClose: () => void;
}

export const CtPtDetailsModal: React.FC<CtPtDetailsModalProps> = ({
  asset,
  mapping,
  meter,
  onClose,
}) => {
  if (!asset) return null;

  const factor = mapping ? parseFloat(mapping.multiplication_factor) || 1 : 1;
  const ctRatio = mapping?.ct_ratio || '200/5 A';
  const ptRatio = mapping?.pt_ratio || '415/110 V';
  const rawPowerKw = 15.5; // Baseline active load before CT/PT scaling
  const calculatedPowerKw = (rawPowerKw * factor).toFixed(2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sliders size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                CT/PT Scaling & Asset Calibration
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {asset.Asset_name} ({asset.Asset_id})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Linked Hardware Overview */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '0.78rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.70rem' }}>Assigned Meter</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Cpu size={14} color="var(--color-primary)" />
                {meter ? meter.Meter_name : 'No meter linked'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.70rem' }}>Meter Model</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                {meter ? meter.meter_model || 'Standard MFM' : 'N/A'}
              </span>
            </div>
          </div>

          {/* Transformer & Ratio Parameters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 650, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>CT Ratio</div>
              <div className="mono-num" style={{ fontSize: '1rem', fontWeight: 750, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {ctRatio}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)' }}>Current Transformer</div>
            </div>

            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 650, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>PT Ratio</div>
              <div className="mono-num" style={{ fontSize: '1rem', fontWeight: 750, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {ptRatio}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)' }}>Potential Transformer</div>
            </div>

            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 650, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Multiplier</div>
              <div className="mono-num" style={{ fontSize: '1rem', fontWeight: 750, color: 'var(--color-primary)', marginTop: '2px' }}>
                {factor}x
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)' }}>Effective Scale Factor</div>
            </div>
          </div>

          {/* Scaling Math Explanation Card */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid rgba(22, 131, 74, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              <Info size={15} />
              <span>Mathematical Scaling Formula:</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--color-primary-dark)', fontWeight: 650, backgroundColor: 'rgba(255, 255, 255, 0.65)', padding: '6px 10px', borderRadius: '4px' }}>
              Calculated Power = Raw Modbus Reading × (CT/PT Factor)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: 'var(--color-primary-dark)', fontSize: '0.74rem' }}>
              <span>Raw Register Load: <strong>{rawPowerKw} kW</strong></span>
              <span>Multiplier: <strong>{factor}x</strong></span>
              <span>Calculated Power: <strong>{calculatedPowerKw} kW</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ height: '34px', padding: '0 16px', fontSize: '0.78rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

