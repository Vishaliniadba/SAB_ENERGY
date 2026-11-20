import React, { useState, useMemo } from 'react';
import { PieChart as PieChartIcon, Activity } from 'lucide-react';
import type { EnerlinkTelemetryReading } from '../api/enerlinkApi';

interface EnergyDistributionPieChartProps {
  liveReadings?: EnerlinkTelemetryReading[];
  selectedMeterId?: string; // '1' | '2' | 'all'
}

interface SliceData {
  id: string;
  label: string;
  value: number;
  unit: string;
  percentage: number;
  color: string;
  textColor?: string;
  subtext?: string;
}

export type DistributionMetric = 'voltage' | 'phase_current' | 'feeders' | 'powerQuality' | 'phase_power';

// Helper to convert polar coordinates to Cartesian for exact SVG arcs
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(2)),
    y: Number((cy + r * Math.sin(rad)).toFixed(2)),
  };
}

// Generates an exact SVG donut sector path (eliminates manual divider lines & line-cap bleeding)
function describeArc(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number
) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0.05) return '';

  if (sweep >= 359.95) {
    const midAngle = startAngle + 180;
    const p1 = polarToCartesian(cx, cy, rOut, startAngle);
    const p2 = polarToCartesian(cx, cy, rOut, midAngle);
    const p3 = polarToCartesian(cx, cy, rIn, midAngle);
    const p4 = polarToCartesian(cx, cy, rIn, startAngle);
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOut} ${rOut} 0 1 1 ${p2.x} ${p2.y}`,
      `A ${rOut} ${rOut} 0 1 1 ${p1.x} ${p1.y}`,
      `M ${p4.x} ${p4.y}`,
      `A ${rIn} ${rIn} 0 1 0 ${p3.x} ${p3.y}`,
      `A ${rIn} ${rIn} 0 1 0 ${p4.x} ${p4.y}`,
      'Z',
    ].join(' ');
  }

  const p1 = polarToCartesian(cx, cy, rOut, startAngle);
  const p2 = polarToCartesian(cx, cy, rOut, endAngle);
  const p3 = polarToCartesian(cx, cy, rIn, endAngle);
  const p4 = polarToCartesian(cx, cy, rIn, startAngle);

  const largeArcFlag = sweep > 180 ? 1 : 0;

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

interface DonutSubPanelProps {
  title: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  themeColor: string;
  slices: SliceData[];
  totalValue: string;
  totalUnit: string;
  centerLabel: string;
  hoveredSlice?: string | null;
  onHoverSlice?: (id: string | null) => void;
  style?: React.CSSProperties;
  className?: string;
}

const DonutSubPanel: React.FC<DonutSubPanelProps> = ({
  title,
  badgeText,
  badgeBg,
  badgeColor,
  themeColor,
  slices,
  totalValue,
  totalUnit,
  centerLabel,
  hoveredSlice: externalHovered,
  onHoverSlice,
  style,
  className,
}) => {
  const [internalHovered, setInternalHovered] = useState<string | null>(null);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);

  const activeSliceId = selectedSliceId || internalHovered || externalHovered;
  const activeSlice = slices.find((s) => s.id === activeSliceId) || null;

  const handleHover = (id: string | null) => {
    setInternalHovered(id);
    if (onHoverSlice) onHoverSlice(id);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedSliceId((prev) => (prev === id ? null : id));
  };

  // Dynamic center hero metrics based on active phase or overall baseline
  const displayValue = activeSlice
    ? Number(activeSlice.value).toFixed(2)
    : Number(totalValue).toFixed(2);
  const displayUnit = activeSlice ? activeSlice.unit : totalUnit;
  const displayLabel = activeSlice
    ? activeSlice.label.toUpperCase()
    : centerLabel;
  const displayColor = activeSlice ? (activeSlice.textColor || activeSlice.color) : '#0F172A';
  const displayBadgeColor = activeSlice ? (activeSlice.textColor || activeSlice.color) : badgeColor;

  const rOut = 68;
  const rIn = 46;

  let accumulatedPercent = 0;
  const renderedSlices = slices.map((slice) => {
    const slicePct = Math.max(0, slice.percentage);
    const startPct = accumulatedPercent;
    const startDeg = (startPct / 100) * 360;
    const sweepDeg = (slicePct / 100) * 360;
    const endDeg = startDeg + sweepDeg;

    accumulatedPercent += slicePct;

    const pathD = describeArc(80, 80, rIn, rOut, startDeg, endDeg);

    return {
      ...slice,
      startDeg,
      sweepDeg,
      endDeg,
      pathD,
    };
  });

  return (
    <div
      className={`donut-subpanel ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* ── Sub-header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '3px',
          marginBottom: '4px',
          borderBottom: '1px dashed var(--border-color, #E2E8E5)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: themeColor,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{                                                                                                                                    
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text-primary, #1F2937)',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* ── Visual Flow: Enlarged Donut (Top) + Interactive 3-Phase Pills (Aligned at Bottom) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
          paddingBottom: '2px',
        }}
      >
        {/* Interactive SVG Donut — Precision Sector Paths & Clean White Boundaries */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            width: '100%',
            minHeight: 0,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 160 160"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', overflow: 'visible', maxHeight: '100%', maxWidth: '100%' }}
          >
            {/* Background Track Ring */}
            <path
              d={describeArc(80, 80, rIn, rOut, 0, 359.99)}
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth={1}
            />

            {/* Slices Rendered with Geometrically Pure Sector Paths */}
            {renderedSlices.map((slice, idx) => {
              if (slice.sweepDeg <= 0.05 || !slice.pathD) return null;
              const isHovered = (internalHovered || externalHovered) === slice.id;
              const isSelected = selectedSliceId === slice.id;
              const isActive = isHovered || isSelected;

              return (
                <path
                  key={`slice-${slice.id}-${idx}`}
                  d={slice.pathD}
                  fill={slice.color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: activeSliceId && !isActive ? 0.35 : 1,
                    filter: isActive ? `drop-shadow(0 0 7px ${slice.color}95)` : 'none',
                    transform: isActive ? 'scale(1.025)' : 'scale(1)',
                    transformOrigin: '80px 80px',
                  }}
                  onMouseEnter={() => handleHover(slice.id)}
                  onMouseLeave={() => handleHover(null)}
                  onClick={() => handleToggleSelect(slice.id)}
                >
                  <title>{`${slice.label}: ${Number(slice.value).toFixed(2)} ${slice.unit} (${slice.percentage}%) — Click to lock`}</title>
                </path>
              );
            })}
          </svg>

          {/* Centered Stat Badge — Properly Centered Value + Unit & Subtext */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'max-content',
            }}
          >
            {/* Primary Value + Unit Inline (Balanced Centerpiece) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: '3px',
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.22rem, 2vw, 1.62rem)',
                  fontWeight: 500,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontVariantNumeric: 'tabular-nums',
                  color: displayColor,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  transition: 'color 0.16s ease',
                }}
              >
                {displayValue}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  color: displayBadgeColor,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  transition: 'color 0.16s ease',
                }}
              >
                {displayUnit}
              </span>
            </div>

            {/* Subtext Label */}
            <div
              style={{
                fontSize: 'clamp(0.50rem, 0.76vw, 0.65rem)',
                color: activeSlice ? (activeSlice.textColor || activeSlice.color) : '#64748B',
                fontWeight: 500,
                marginTop: '4px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                transition: 'color 0.16s ease',
              }}
            >
              {displayLabel}
            </div>
          </div>
        </div>

        {/* 3-Phase Interactive Legend Pills — Clean, Single-Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            width: '100%',
            flexShrink: 0,
            marginTop: 'auto',
            padding: '4px 2px 2px 2px',
          }}
        >
          {slices.map((slice, idx) => {
            const isHovered = (internalHovered || externalHovered) === slice.id;
            const isSelected = selectedSliceId === slice.id;
            const isActive = isHovered || isSelected;

            return (
              <button
                key={`slice-legend-${slice.id}-${idx}`}
                type="button"
                onMouseEnter={() => handleHover(slice.id)}
                onMouseLeave={() => handleHover(null)}
                onClick={() => handleToggleSelect(slice.id)}
                title={`${slice.label} (${slice.percentage}%) — Click to inspect in center`}
                style={{
                  padding: '5px 7px',
                  borderRadius: '6px',
                  backgroundColor: isActive ? `${slice.color}20` : '#FFFFFF',
                  border: `1.5px solid ${isActive ? (slice.textColor || slice.color) : '#E2E8E5'}`,
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '5px',
                  minWidth: 0,
                  boxShadow: isActive
                    ? `0 2px 6px ${slice.color}25`
                    : '0 1px 2px rgba(15, 23, 42, 0.03)',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                  outline: 'none',
                }}
              >
                {/* Marker + Phase Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <span
                    style={{
                      width: '9px',
                      height: '3.5px',
                      borderRadius: '2px',
                      backgroundColor: slice.color,
                      boxShadow: isActive ? `0 0 5px ${slice.color}` : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 800 : 700,
                      color: isActive ? (slice.textColor || slice.color) : '#334155',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {slice.label}
                  </span>
                </div>

                {/* Percentage Badge */}
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    color: slice.textColor || slice.color,
                    backgroundColor: `${slice.color}22`,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    lineHeight: 1.1,
                  }}
                >
                  {slice.percentage}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const EnergyDistributionPieChart: React.FC<EnergyDistributionPieChartProps> = ({
  liveReadings = [],
  selectedMeterId = '1',
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const isHistorical = liveReadings.some((r) => Boolean((r as any)?.historical));

  // Dynamic names
  const r1 = liveReadings.find((r) => String(r.slave_id) === '1');
  const r2 = liveReadings.find((r) => String(r.slave_id) === '2');

  // Robust Extractor for 3-Phase Live Telemetry
  const { activeData } = useMemo(() => {
    const extract = (
      r: EnerlinkTelemetryReading | undefined,
      fallback: {
        p1: number;
        p2: number;
        p3: number;
        pTot: number;
        c1: number;
        c2: number;
        c3: number;
        v1: number;
        v2: number;
        v3: number;
        vAvg: number;
        pf: number;
      }
    ) => {
      if (!r) {
        return {
          p1Kw: fallback.p1,
          p2Kw: fallback.p2,
          p3Kw: fallback.p3,
          totalKw: fallback.pTot,
          c1: fallback.c1,
          c2: fallback.c2,
          c3: fallback.c3,
          totalCurrent: +(fallback.c1 + fallback.c2 + fallback.c3).toFixed(2),
          v1: fallback.v1,
          v2: fallback.v2,
          v3: fallback.v3,
          vAvg: fallback.vAvg,
          pf: fallback.pf,
        };
      }

      const v: any = r.values?.[0] || r;
      if (!v) {
        return {
          p1Kw: fallback.p1,
          p2Kw: fallback.p2,
          p3Kw: fallback.p3,
          totalKw: fallback.pTot,
          c1: fallback.c1,
          c2: fallback.c2,
          c3: fallback.c3,
          totalCurrent: +(fallback.c1 + fallback.c2 + fallback.c3).toFixed(2),
          v1: fallback.v1,
          v2: fallback.v2,
          v3: fallback.v3,
          vAvg: fallback.vAvg,
          pf: fallback.pf,
        };
      }

      const toKw = (val: any, d: number): number => {
        if (val === undefined || val === null || val === '') return d;
        const n = Number(val);
        if (isNaN(n)) return d;
        return n > 50 ? n / 1000 : n;
      };

      const toFloat = (val: any, d: number): number => {
        if (val === undefined || val === null || val === '') return d;
        const n = Number(val);
        return isNaN(n) ? d : n;
      };

      const p1 = toKw(v.phase1_active_power, fallback.p1);
      const p2 = toKw(v.phase2_active_power, fallback.p2);
      const p3 = toKw(v.phase3_active_power, fallback.p3);
      const rawTot = toKw(v.total_active_power, +(p1 + p2 + p3).toFixed(2));
      const totalKw = rawTot > 0 ? rawTot : +(p1 + p2 + p3).toFixed(2);

      const c1 = toFloat(v.l1_current, fallback.c1);
      const c2 = toFloat(v.l2_current, fallback.c2);
      const c3 = toFloat(v.l3_current, fallback.c3);
      const totalCurrent = +(c1 + c2 + c3).toFixed(2);

      const rawV1 = toFloat(
        v.l1_to_neutral_voltage ?? v.phase1_voltage ?? v.v1 ?? v.voltage_v1 ?? v.l1_to_l2_voltage,
        fallback.v1
      );
      const rawV2 = toFloat(
        v.l2_to_neutral_voltage ?? v.phase2_voltage ?? v.v2 ?? v.voltage_v2 ?? v.l2_to_l3_voltage,
        fallback.v2
      );
      const rawV3 = toFloat(
        v.l3_to_neutral_voltage ?? v.phase3_voltage ?? v.v3 ?? v.voltage_v3 ?? v.l3_to_l1_voltage,
        fallback.v3
      );
      const rawVavg = toFloat(
        v.line_to_neutral_voltage ?? v.average_voltage ?? v.line_to_line_voltage ?? v.v_avg,
        +((rawV1 + rawV2 + rawV3) / 3).toFixed(2)
      );

      const pf = toFloat(v.power_factor, fallback.pf);

      return {
        p1Kw: Number(p1.toFixed(2)),
        p2Kw: Number(p2.toFixed(2)),
        p3Kw: Number(p3.toFixed(2)),
        totalKw: Number(totalKw.toFixed(2)),
        c1: Number(c1.toFixed(2)),
        c2: Number(c2.toFixed(2)),
        c3: Number(c3.toFixed(2)),
        totalCurrent: Number(totalCurrent.toFixed(2)),
        v1: Number(rawV1.toFixed(2)),
        v2: Number(rawV2.toFixed(2)),
        v3: Number(rawV3.toFixed(2)),
        vAvg: Number(rawVavg.toFixed(2)),
        pf,
      };
    };

    const zeroFallback = {
      p1: 0, p2: 0, p3: 0, pTot: 0,
      c1: 0, c2: 0, c3: 0,
      v1: 0, v2: 0, v3: 0, vAvg: 0,
      pf: 0,
    };

    const d1 = extract(r1, zeroFallback);
    const d2 = extract(r2, zeroFallback);

    let soleData = null;
    if (liveReadings.length === 1) {
      soleData = extract(liveReadings[0], zeroFallback);
    }

    let active = d1;
    if (selectedMeterId !== 'all') {
      const match = liveReadings.find((r) => String(r.slave_id) === String(selectedMeterId)) || soleData;
      if (match) {
        active = extract(match, zeroFallback);
      } else {
        active = selectedMeterId === '2' ? d2 : d1;
      }
    } else {
      active = {
        p1Kw: Number((d1.p1Kw + d2.p1Kw).toFixed(2)),
        p2Kw: Number((d1.p2Kw + d2.p2Kw).toFixed(2)),
        p3Kw: Number((d1.p3Kw + d2.p3Kw).toFixed(2)),
        totalKw: Number((d1.totalKw + d2.totalKw).toFixed(2)),
        c1: Number((d1.c1 + d2.c1).toFixed(2)),
        c2: Number((d1.c2 + d2.c2).toFixed(2)),
        c3: Number((d1.c3 + d2.c3).toFixed(2)),
        totalCurrent: Number((d1.totalCurrent + d2.totalCurrent).toFixed(2)),
        v1: Number(((d1.v1 + d2.v1) / (d2.v1 > 0 ? 2 : 1)).toFixed(2)),
        v2: Number(((d1.v2 + d2.v2) / (d2.v2 > 0 ? 2 : 1)).toFixed(2)),
        v3: Number(((d1.v3 + d2.v3) / (d2.v3 > 0 ? 2 : 1)).toFixed(2)),
        vAvg: Number(((d1.vAvg + d2.vAvg) / (d2.vAvg > 0 ? 2 : 1)).toFixed(2)),
        pf: +((d1.pf + d2.pf) / (d2.pf > 0 ? 2 : 1)).toFixed(2),
      };
    }

    return { m1Data: d1, m2Data: d2, activeData: active };
  }, [liveReadings, selectedMeterId, r1, r2]);

  // Compute Voltage and Current data simultaneously
  const { voltageData, currentData } = useMemo(() => {
    // 1. Voltage (V1, V2, V3)
    const sumV = +(activeData.v1 + activeData.v2 + activeData.v3).toFixed(2);
    const v1Pct = sumV > 0 ? Math.round((activeData.v1 / sumV) * 100) : 34;
    const v2Pct = sumV > 0 ? Math.round((activeData.v2 / sumV) * 100) : 33;
    const v3Pct = sumV > 0 ? Math.max(0, 100 - v1Pct - v2Pct) : 33;

    const voltageSlices: SliceData[] = [
      {
        id: 'voltage_phaseR_V1',
        label: 'Phase R',
        value: activeData.v1,
        unit: 'V',
        percentage: v1Pct,
        color: '#DC2626',
        textColor: '#B91C1C',
      },
      {
        id: 'voltage_phaseY_V2',
        label: 'Phase Y',
        value: activeData.v2,
        unit: 'V',
        percentage: v2Pct,
        color: '#F59E0B',
        textColor: '#B45309',
      },
      {
        id: 'voltage_phaseB_V3',
        label: 'Phase B',
        value: activeData.v3,
        unit: 'V',
        percentage: v3Pct,
        color: '#2563EB',
        textColor: '#1D4ED8',
      },
    ];

    // 2. Current (C1, C2, C3)
    const sumC =
      activeData.totalCurrent > 0
        ? activeData.totalCurrent
        : +(activeData.c1 + activeData.c2 + activeData.c3).toFixed(2);
    const c1Pct = sumC > 0 ? Math.round((activeData.c1 / sumC) * 100) : 34;
    const c2Pct = sumC > 0 ? Math.round((activeData.c2 / sumC) * 100) : 33;
    const c3Pct = sumC > 0 ? Math.max(0, 100 - c1Pct - c2Pct) : 33;

    const currentSlices: SliceData[] = [
      {
        id: 'current_phaseR_C1',
        label: 'Phase R',
        value: activeData.c1,
        unit: 'A',
        percentage: c1Pct,
        color: '#DC2626',
        textColor: '#B91C1C',
      },
      {
        id: 'current_phaseY_C2',
        label: 'Phase Y',
        value: activeData.c2,
        unit: 'A',
        percentage: c2Pct,
        color: '#F59E0B',
        textColor: '#B45309',
      },
      {
        id: 'current_phaseB_C3',
        label: 'Phase B',
        value: activeData.c3,
        unit: 'A',
        percentage: c3Pct,
        color: '#2563EB',
        textColor: '#1D4ED8',
      },
    ];

    return {
      voltageData: {
        slices: voltageSlices,
        totalValue: activeData.vAvg.toFixed(2),
        totalUnit: 'V',
        centerLabel: 'Average',
        badgeText: `${activeData.vAvg.toFixed(1)} V`,
      },
      currentData: {
        slices: currentSlices,
        totalValue: activeData.totalCurrent.toFixed(2),
        totalUnit: 'A',
        centerLabel: 'Total',
        badgeText: `${activeData.totalCurrent.toFixed(1)} A`,
      },
    };
  }, [activeData]);

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
      }}
    >
      {/* ── Card Header ── */}
      <div
        style={{
          padding: '6px 14px',
          borderBottom: '1px solid var(--border-color, #E2E8E5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: 'rgba(189, 98, 31, 0.10)',
              color: '#BD621F',
              border: '1px solid rgba(189, 98, 31, 0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PieChartIcon size={14} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-primary, #1F2937)',
                letterSpacing: '-0.01em',
              }}
            >
              Energy &amp; Load Distribution
            </div>
          </div>
        </div>

        {/* Clean Live Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-color, #E2E8E5)',
            borderRadius: '6px',
            padding: '2px 8px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            fontSize: '0.68rem',
            fontWeight: 650,
            color: '#BD621F',
          }}
        >
          <Activity size={12} style={{ color: isHistorical ? '#64748B' : '#BD621F', flexShrink: 0 }} />
          <span style={{ color: isHistorical ? '#64748B' : '#BD621F' }}>{isHistorical ? '3-Phase Telemetry' : '3-Phase Live'}</span>
        </div>
      </div>

      {/* ── Dual Side-by-Side Charts: Voltage (Left) & Current (Right) ── */}
      <div
        className="donut-dual-container"
        style={{
          padding: '4px 8px 6px 8px',
          gap: '8px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left Sub-Card: Voltage (L-N) */}
        <DonutSubPanel
          className="donut-subpanel-left"
          title="Voltage (L-N)"
          badgeText={voltageData.badgeText}
          badgeBg="rgba(12, 30, 54, 0.08)"
          badgeColor="#0C1E36"
          themeColor="#0C1E36"
          slices={voltageData.slices}
          totalValue={voltageData.totalValue}
          totalUnit={voltageData.totalUnit}
          centerLabel={voltageData.centerLabel}
          hoveredSlice={hoveredSlice}
          onHoverSlice={setHoveredSlice}
          style={{
            borderRight: '1px solid var(--border-color, #E2E8E5)',
            paddingRight: '8px',
          }}
        />

        {/* Right Sub-Card: Phase Current */}
        <DonutSubPanel
          className="donut-subpanel-right"
          title="Phase Current"
          badgeText={currentData.badgeText}
          badgeBg="rgba(189, 98, 31, 0.10)"
          badgeColor="#BD621F"
          themeColor="#BD621F"
          slices={currentData.slices}
          totalValue={currentData.totalValue}
          totalUnit={currentData.totalUnit}
          centerLabel={currentData.centerLabel}
          hoveredSlice={hoveredSlice}
          onHoverSlice={setHoveredSlice}
          style={{
            paddingLeft: '8px',
          }}
        />
      </div>
    </div>
  );
};

export default EnergyDistributionPieChart;
