import React, { useMemo } from 'react';
import { Cpu, Clock } from 'lucide-react';
import type { EnerlinkTelemetryReading } from '../api/enerlinkApi';

interface MeterTelemetryCardProps {
  reading?: EnerlinkTelemetryReading;
  readings?: EnerlinkTelemetryReading[];
  selectedMeterId?: string; // '1' | '2' | 'all'
  onSelectMeter?: (id: string) => void;
  defaultDeviceId?: string;
  index?: number;
  lastUpdatedTime?: number;
}

/**
 * Precision dual translucent wave curves for architect KPI cards
 */
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

export const MeterTelemetryCard: React.FC<MeterTelemetryCardProps> = ({
  reading,
  readings = [],
  selectedMeterId = '1',
  onSelectMeter,
  index = 0,
  lastUpdatedTime,
}) => {
  // If multiple readings provided, pick the reading corresponding to selectedMeterId
  const activeReading = React.useMemo(() => {
    if (reading) return reading;
    if (readings.length === 0) return null;
    if (selectedMeterId === 'all') return readings[0];
    const match = readings.find((r) => String(r.slave_id) === String(selectedMeterId));
    return match || readings[0];
  }, [reading, readings, selectedMeterId]);

  const v = activeReading?.values?.[0] || (activeReading as any) || {};

  // Active Power (kW)
  const powerW =
    v.total_active_power !== undefined &&
    v.total_active_power !== null &&
    v.total_active_power !== ''
      ? Number(v.total_active_power)
      : null;
  const powerKwDisplay = powerW !== null ? (powerW / 1000).toFixed(2) : '0.00';

  // Voltage (V)
  const voltage =
    v.line_to_line_voltage !== undefined &&
    v.line_to_line_voltage !== null &&
    v.line_to_line_voltage !== ''
      ? Number(v.line_to_line_voltage).toFixed(2)
      : v.line_to_neutral_voltage !== undefined && v.line_to_neutral_voltage !== null && v.line_to_neutral_voltage !== ''
      ? Number(v.line_to_neutral_voltage).toFixed(2)
      : '0.00';

  // Current Average (A)
  const current =
    v.average_current !== undefined &&
    v.average_current !== null &&
    v.average_current !== ''
      ? Number(v.average_current).toFixed(2)
      : '0.00';

  // Power Factor
  const pf =
    v.power_factor !== undefined &&
    v.power_factor !== null &&
    v.power_factor !== ''
      ? Number(v.power_factor).toFixed(2)
      : '0.00';

  // Frequency (Hz)
  const freq =
    v.frequency !== undefined &&
    v.frequency !== null &&
    v.frequency !== ''
      ? Number(v.frequency).toFixed(2)
      : '0.00';

  // Active Energy (kWh)
  const energyKwh =
    v.active_energy !== undefined &&
    v.active_energy !== null &&
    v.active_energy !== ''
      ? (Number(v.active_energy) / 1000).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00';

  const slaveId = activeReading?.slave_id || (selectedMeterId !== 'all' ? Number(selectedMeterId) : 1);
  const actualMeterName =
    activeReading?.meter_name ||
    (activeReading as any)?.customName ||
    (activeReading as any)?.Meter_name ||
    activeReading?.meter_serial ||
    (activeReading?.slave_id ? `Meter #${activeReading.slave_id}` : selectedMeterId !== 'all' ? `Meter #${selectedMeterId}` : 'Meter');

  // Resolve actual packet timestamp and status from device reading
  const isHistorical = Boolean((activeReading as any)?.historical);

  // Resolve last updated time strictly based on the device's actual packet timestamp (log_ts / timestamp_ms)
  const { lastUpdatedFormatted, isOnline, isStale } = useMemo(() => {
    if (activeReading?.isOffline) {
      return { lastUpdatedFormatted: null, isOnline: false, isStale: true };
    }

    let dateObj: Date | null = null;
    const rawTs = activeReading?.log_ts;
    const rawMs = activeReading?.timestamp_ms;

    if (rawTs && typeof rawTs === 'string') {
      const parsed = new Date(rawTs.trim().replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (!dateObj && rawMs && typeof rawMs === 'number' && !isNaN(rawMs)) {
      const parsed = new Date(rawMs);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (!dateObj && lastUpdatedTime) {
      const parsed = new Date(lastUpdatedTime);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (!dateObj) {
      dateObj = new Date();
    }

    const timeStr = dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const packetAgeMs = Date.now() - dateObj.getTime();
    // Packet is considered stale if marked historical by backend or older than 5 minutes
    const stale = isHistorical || packetAgeMs > 5 * 60 * 1000;
    const online = Boolean(activeReading && !activeReading.isOffline && !stale);

    return {
      lastUpdatedFormatted: {
        time: timeStr,
        full: dateObj.toLocaleString(),
      },
      isOnline: online,
      isStale: stale,
    };
  }, [activeReading?.log_ts, activeReading?.timestamp_ms, activeReading?.isOffline, lastUpdatedTime, isHistorical]);

  // Theme accent colors: Meter 1 Rust (#BD621F), Meter 2 Deep Navy (#0C1E36)
  const isMeter2 = String(slaveId) === '2';
  const theme = {
    topStripe: isMeter2 ? '#0C1E36' : '#BD621F',
    iconBg: isMeter2 ? 'rgba(12, 30, 54, 0.10)' : 'rgba(189, 98, 31, 0.10)',
    iconColor: isMeter2 ? '#0C1E36' : '#BD621F',
    iconBorder: isMeter2 ? '1px solid rgba(12, 30, 54, 0.20)' : '1px solid rgba(189, 98, 31, 0.22)',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8E5)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow, 0 1px 3px rgba(15, 23, 42, 0.04))',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      {/* ── Card Header with Meter Selection Tabs ── */}
      <div
        style={{
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid var(--border-color, #E2E8E5)',
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          flexShrink: 0,
        }}
      >
        {/* Left: Icon, Meter Tag & Display Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: theme.iconBg,
              color: theme.iconColor,
              border: theme.iconBorder,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cpu size={15} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.90rem',
                fontWeight: 700,
                color: 'var(--text-primary, #1F2937)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
              title={actualMeterName}
            >
              {actualMeterName}
            </span>
          </div>
        </div>

        {/* Right: Status Badge & Last Updated Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {lastUpdatedFormatted && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2.5px 3px 2.5px 9px',
                borderRadius: '7px',
                backgroundColor: 'rgba(189, 98, 31, 0.08)', // Light rust orange soft touch container
                border: '1px solid rgba(189, 98, 31, 0.25)', // Subtle rust orange outline
                fontSize: '0.68rem',
                lineHeight: 1,
                userSelect: 'none',
                boxShadow: '0 1px 2px rgba(189, 98, 31, 0.05)',
              }}
              title={
                isOnline
                  ? `Live telemetry recorded at: ${lastUpdatedFormatted.full}`
                  : `Last recorded data: ${lastUpdatedFormatted.full} (${isHistorical ? 'Historical' : 'Standby'})`
              }
            >
              <Clock size={11} style={{ color: '#BD621F', flexShrink: 0 }} />
              <span style={{ color: '#BD621F', fontWeight: 650, letterSpacing: '0.015em' }}>
                Last Update:
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 800,
                  color: '#FFFFFF', // High-contrast crisp white font
                  backgroundColor: '#BD621F', // Dark rust orange chip for the time
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  boxShadow: '0 1px 2px rgba(189, 98, 31, 0.25)',
                  letterSpacing: '0.02em',
                }}
              >
                {lastUpdatedFormatted.time}
              </span>
            </span>
          )}

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: isOnline
                ? 'rgba(16, 185, 129, 0.10)'
                : isHistorical
                ? 'rgba(100, 116, 139, 0.10)'
                : 'rgba(100, 116, 139, 0.10)',
              border: `1px solid ${
                isOnline
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(100, 116, 139, 0.20)'
              }`,
              color: isOnline ? '#15803D' : '#64748B',
              fontSize: '0.66rem',
              fontWeight: 700,
            }}
            title={
              isOnline
                ? 'Live Telemetry'
                : isHistorical
                ? 'Historical Telemetry Record'
                : 'Standby - No fresh data received recently'
              }
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10B981' : '#94A3B8',
              }}
            />
            {isOnline ? 'Live' : isHistorical ? 'Historical' : 'Standby'}
          </span>
        </div>
      </div>

      {/* ── 6 Electrical Measurements in Responsive Grid ── */}
      <div
        className="meter-tile-grid"
        style={{
          gap: '8px',
          padding: '8px 10px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Cell 1: Active Power (Vibrant Amber to Sunset Orange KPI Card) */}
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
                {powerKwDisplay}
                <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>kW</span>
              </div>
              <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ACTIVE POWER
              </div>
            </div>
            <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="architect-icon-wrap" title="Active Power (kW)" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cell 2: Voltage (L-L) (Vivid Sky to Royal Blue KPI Card) */}
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
                {voltage}
                <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>V</span>
              </div>
              <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                VOLTAGE (L-L)
              </div>
            </div>
            <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="architect-icon-wrap" title="Voltmeter (V)" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="8 8 12 16 16 8" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cell 3: Current Average (Vivid Emerald to Deep Mint/Jade KPI Card) */}
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
                {current}
                <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>A</span>
              </div>
              <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                CURRENT (AVG)
              </div>
            </div>
            <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="architect-icon-wrap" title="Ammeter (A)" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 7l-4 10h8l-4-10z" />
                  <line x1="9.5" y1="13.5" x2="14.5" y2="13.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cell 4: Power Factor (Radiant Violet to Royal Indigo KPI Card) */}
        <div
          className="kpi-card architect-card violet-card"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 55%, #4F46E5 100%)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: '13px',
            padding: '12px 14px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 14px -1px rgba(99, 102, 241, 0.38), 0 2px 5px rgba(0, 0, 0, 0.08)',
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
                {pf}
                <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>cos φ</span>
              </div>
              <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                POWER FACTOR
              </div>
            </div>
            <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="architect-icon-wrap" title="Phase Angle (cos φ)" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <ellipse cx="12" cy="12" rx="4.5" ry="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cell 5: Frequency (Cyan to Deep Ocean Teal KPI Card) */}
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
                {freq}
                <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>Hz</span>
              </div>
              <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                FREQUENCY
              </div>
            </div>
            <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="architect-icon-wrap" title="AC Frequency (Hz)" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4 12c2.5-6 5.5-6 8 0s5.5 6 8 0" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cell 6: Active Energy (Rose Pink to Vibrant Crimson Ruby KPI Card) */}
        <div
          className="kpi-card architect-card pink-card"
          style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #E11D48 55%, #9F1239 100%)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: '13px',
            padding: '12px 14px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 14px -1px rgba(225, 29, 72, 0.38), 0 2px 5px rgba(0, 0, 0, 0.08)',
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
                {energyKwh}
                <span className="architect-unit" style={{ fontSize: '0.74rem', fontWeight: 750, color: 'rgba(255, 255, 255, 0.95)', letterSpacing: '0.01em' }}>kWh</span>
              </div>
              <div className="architect-label" style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ACTIVE ENERGY
              </div>
            </div>
            <div className="kpi-right-side" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div className="architect-icon-wrap" title="Energy Accumulator (kWh)" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.20)', border: '1px solid rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="15" rx="3" />
                  <polyline points="13 8 9 13 12 13 11 17 15 12 12 12 13 8" />
                  <line x1="6" y1="2" x2="18" y2="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeterTelemetryCard;



