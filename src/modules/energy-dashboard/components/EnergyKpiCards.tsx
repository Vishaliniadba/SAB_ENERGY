import React from 'react';
import { Zap, Activity, Gauge, Radio, ShieldCheck, CheckCircle2 } from 'lucide-react';

const CardWaves: React.FC = () => (
  <svg
    viewBox="0 0 320 90"
    preserveAspectRatio="none"
    className="card-waves-svg"
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
    }}
  >
    <path
      d="M0,52 C65,38 135,72 200,48 C255,30 290,44 320,38 L320,90 L0,90 Z"
      fill="rgba(255, 255, 255, 0.09)"
    />
    <path
      d="M0,66 C70,54 135,78 195,62 C250,50 285,64 320,54 L320,90 L0,90 Z"
      fill="rgba(255, 255, 255, 0.07)"
    />
  </svg>
);

export interface EnergyTelemetryKpis {
  activePower: number;
  dailyGeneration: number;
  dailyConsumption?: number;
  powerFactor: number;
  gridFrequency: number;
}

interface EnergyKpiCardsProps {
  telemetry: EnergyTelemetryKpis;
  activeMetersCount?: number;
}

export const EnergyKpiCards: React.FC<EnergyKpiCardsProps> = ({ telemetry, activeMetersCount = 2 }) => {
  const pfValue = Number(telemetry.powerFactor) || 0.95;
  const isPfGood = pfValue >= 0.95;

  const freqValue = Number(telemetry.gridFrequency) || 50.0;
  const isFreqNormal = freqValue >= 49.5 && freqValue <= 50.5;

  return (
    <div className="dashboard-kpi-grid">
      {/* ── Card 1: Active Power ── */}
      <div
        className="kpi-card architect-card emerald-card"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 55%, #047857 100%)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '13px',
          padding: '12px 14px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px -1px rgba(5, 150, 105, 0.38), 0 2px 5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          transition: 'all 0.18s ease',
        }}
      >
        <CardWaves />
        <div className="kpi-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1, position: 'relative', gap: '8px', margin: 'auto 0' }}>
          <div className="kpi-left-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '2px', minWidth: 0 }}>
            <div className="architect-number" style={{ fontSize: '1.42rem', fontWeight: 850, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono, monospace)', display: 'flex', alignItems: 'baseline', gap: '4px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)' }}>
              {telemetry.activePower.toFixed(2)}
              <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>kW</span>
            </div>
            <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ACTIVE POWER
            </div>
          </div>
          <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div className="architect-icon-wrap" title="Active Power" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <Zap size={20} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Cumulative Energy ── */}
      <div
        className="kpi-card architect-card blue-card"
        style={{
          background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 55%, #1D4ED8 100%)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '13px',
          padding: '12px 14px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px -1px rgba(37, 99, 235, 0.38), 0 2px 5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          transition: 'all 0.18s ease',
        }}
      >
        <CardWaves />
        <div className="kpi-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1, position: 'relative', gap: '8px', margin: 'auto 0' }}>
          <div className="kpi-left-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '2px', minWidth: 0 }}>
            <div className="architect-number" style={{ fontSize: '1.42rem', fontWeight: 850, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono, monospace)', display: 'flex', alignItems: 'baseline', gap: '4px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)' }}>
              {telemetry.dailyGeneration.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>kWh</span>
            </div>
            <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              CUMULATIVE ENERGY
            </div>
          </div>
          <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div className="architect-icon-wrap" title="Cumulative Energy" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <Activity size={20} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 3: Average Power Factor ── */}
      <div
        className="kpi-card architect-card amber-card"
        style={{
          background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 50%, #C2410C 100%)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '13px',
          padding: '12px 14px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px -1px rgba(234, 88, 12, 0.38), 0 2px 5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          transition: 'all 0.18s ease',
        }}
      >
        <CardWaves />
        <div className="kpi-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1, position: 'relative', gap: '8px', margin: 'auto 0' }}>
          <div className="kpi-left-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '2px', minWidth: 0 }}>
            <div className="architect-number" style={{ fontSize: '1.42rem', fontWeight: 850, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono, monospace)', display: 'flex', alignItems: 'baseline', gap: '4px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)' }}>
              {pfValue.toFixed(2)}
              <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>cos φ</span>
            </div>
            <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              POWER FACTOR
            </div>
          </div>
          <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div className="architect-icon-wrap" title="Power Factor" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <Gauge size={20} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 4: Grid Frequency ── */}
      <div
        className="kpi-card architect-card cyan-card"
        style={{
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 55%, #0E7490 100%)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '13px',
          padding: '12px 14px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px -1px rgba(8, 145, 178, 0.38), 0 2px 5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          transition: 'all 0.18s ease',
        }}
      >
        <CardWaves />
        <div className="kpi-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1, position: 'relative', gap: '8px', margin: 'auto 0' }}>
          <div className="kpi-left-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '2px', minWidth: 0 }}>
            <div className="architect-number" style={{ fontSize: '1.42rem', fontWeight: 850, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono, monospace)', display: 'flex', alignItems: 'baseline', gap: '4px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)' }}>
              {freqValue.toFixed(2)}
              <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>Hz</span>
            </div>
            <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              GRID FREQUENCY
            </div>
          </div>
          <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div className="architect-icon-wrap" title="Grid Frequency" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <Radio size={20} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyKpiCards;

