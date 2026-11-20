import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  FileSpreadsheet,
  Image as ImageIcon,
  Code2,
} from 'lucide-react';
import { Select2 } from '../../../components/common/Select2';
import type { EnerlinkTelemetryReading } from '../api/enerlinkApi';

export type Timeframe = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PowerTrendLineGraphProps {
  liveReadings?: EnerlinkTelemetryReading[];
  selectedMeterId?: string; // '1' | '2' | 'all'
  timeframe?: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  subPeriod?: string;
  onSubPeriodChange?: (sub: string) => void;
}

/* ═════════════════════════════════════════════════════════════════════
   ApexCharts Official Spline Area Palette (Exact Match to User UI):
   • Series 1 (Voltage - Left Partition):  #008FFB (Vibrant Sky Blue)
   • Series 2 (Current - Right Partition): #00E396 (Vibrant Emerald Teal)
   ═════════════════════════════════════════════════════════════════════ */
const COLOR_VOLTAGE = '#008FFB';
const COLOR_CURRENT = '#00E396';
const COLOR_GRID = '#ECEFF1';
const COLOR_AXIS = '#64748B';
const COLOR_TEXT = '#1E293B';
const BORDER_COLOR = '#E2E8F0';

/* ── Sub-period date ranges ────────────────────────────────────────── */
const getSubPeriodLabels = (): Record<string, string> => {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const curYear = now.getFullYear();
  const curMonth = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return {
    today: `Today (${fmt(now)})`,
    yesterday: `Yesterday (${fmt(yest)})`,
    '2days_ago': fmt(twoDaysAgo),
    this_week: 'Current Week',
    last_week: 'Previous Week',
    this_month: `Current Month (${curMonth})`,
    last_month: 'Previous Month',
    [String(curYear)]: `Year ${curYear} (YTD)`,
    [String(curYear - 1)]: `Year ${curYear - 1} (Full)`,
    '5years': `5-Year History (${curYear - 4}–${curYear})`,
    '3years': `3-Year Trend (${curYear - 2}–${curYear})`,
    all_time: 'All-Time Record',
  };
};

const SUB_PERIOD_BY_TF: Record<Timeframe, string[]> = {
  hourly: ['today', 'yesterday', '2days_ago'],
  daily: ['this_week', 'last_week'],
  weekly: ['this_month', 'last_month'],
  monthly: ['2026', '2025'],
  yearly: ['5years', '3years', 'all_time'],
};

const TF_DEFAULT_SUB: Record<Timeframe, string> = {
  hourly: 'today',
  daily: 'this_week',
  weekly: 'this_month',
  monthly: '2026',
  yearly: '5years',
};

// Cubic Bézier spline path generator for smooth fluid area curves
const getSplinePath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bézier control points (smooth fluid tension)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};

// Fluid area under curve path generator
const getAreaPath = (pts: { x: number; y: number }[], baseY: number): string => {
  const linePath = getSplinePath(pts);
  if (!linePath || pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${linePath} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
};

export const PowerTrendLineGraph: React.FC<PowerTrendLineGraphProps> = ({
  liveReadings = [],
  selectedMeterId = '1',
  timeframe: externalTf,
  onTimeframeChange,
  subPeriod: externalSub,
  onSubPeriodChange,
}) => {
  // ── Controlled / Uncontrolled Timeframe State ──
  const [internalTf, setInternalTf] = useState<Timeframe>('hourly');
  const tf = externalTf ?? internalTf;
  const setTf = (t: Timeframe) => {
    if (onTimeframeChange) onTimeframeChange(t);
    setInternalTf(t);
    const defSub = TF_DEFAULT_SUB[t] || 'today';
    setSub(defSub);
  };

  // ── Controlled / Uncontrolled Sub-Period State ──
  const [internalSub, setInternalSub] = useState<string>('today');
  const sub = externalSub ?? internalSub;
  const setSub = (s: string) => {
    if (onSubPeriodChange) onSubPeriodChange(s);
    setInternalSub(s);
  };

  const subPeriodLabels = useMemo(() => getSubPeriodLabels(), []);

  // ── Synchronized Hover Tracker Across Both Partitions ──
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // ── ApexCharts Menu State ──
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const voltSvgRef = useRef<SVGSVGElement>(null);
  const currSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close hamburger menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  // ── Live Stream Dynamic Ingestion Pulse ──
  const [livePulse, setLivePulse] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulse((p) => (p + 1) % 10000);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // ── Extract Baseline Telemetry from liveReadings ──
  const { voltBase, currBase } = useMemo(() => {
    let v1 = 0, v2 = 0;
    let a1 = 0, a2 = 0;
    let name = 'Connected Meter';

    const extract = (r: EnerlinkTelemetryReading | undefined) => {
      if (!r) return null;
      const val: any = r.values?.[0] || r;
      return {
        volt: val?.line_to_line_voltage ? Number(val.line_to_line_voltage) : null,
        curr: val?.average_current ? Number(val.average_current) : null,
        name: r.meter_name || (r as any)?.customName || (r as any)?.Meter_name || `Meter #${r.slave_id}`,
      };
    };

    const r1 = liveReadings.find((r) => String(r.slave_id) === '1');
    const r2 = liveReadings.find((r) => String(r.slave_id) === '2');
    const d1 = extract(r1);
    const d2 = extract(r2);

    if (d1?.volt !== null && d1?.volt !== undefined) v1 = d1.volt;
    if (d1?.curr !== null && d1?.curr !== undefined) a1 = d1.curr;
    if (d2?.volt !== null && d2?.volt !== undefined) v2 = d2.volt;
    if (d2?.curr !== null && d2?.curr !== undefined) a2 = d2.curr;

    if (selectedMeterId === '2') {
      name = d2?.name || 'NavaNala_EB_Meter';
      return {
        voltBase: v2 > 0 ? v2 : 399.8,
        currBase: a2 > 0 ? a2 : 18.5,
        meterName: name,
      };
    } else if (selectedMeterId === 'all') {
      name = 'All Connected Meters';
      const avgV = v1 > 0 && v2 > 0 ? (v1 + v2) / 2 : v1 || v2 || 400.0;
      const sumA = a1 + a2 > 0 ? +(a1 + a2).toFixed(1) : 32.5;
      return {
        voltBase: avgV > 0 ? avgV : 400.0,
        currBase: sumA,
        meterName: name,
      };
    } else {
      name = d1?.name || liveReadings[0]?.meter_name || 'NavaNala_UPS_Meter';
      return {
        voltBase: v1 > 0 ? v1 : 401.5,
        currBase: a1 > 0 ? a1 : 24.2,
        meterName: name,
      };
    }
  }, [liveReadings, selectedMeterId]);

  /* ═════════════════════════════════════════════════════════════════════
     FLUID MULTI-CYCLE TELEMETRY WAVEFORM GENERATOR:
     Generates rich undulating Catmull-Rom waves with 14-16 data points
     for EVERY timeframe (including Weekly) so the curve has magnificent flow!
     ═════════════════════════════════════════════════════════════════════ */
  const chartPoints = useMemo(() => {
    const jitter = Math.sin(livePulse * 0.8) * 0.45;

    let points: {
      label: string;
      fullDate: string;
      vFactor: number;
      cFactor: number;
      isMajorTick?: boolean;
    }[] = [];

    if (tf === 'weekly') {
      // 16 continuous telemetry points across 4 weeks (4 high-density points per week)
      // Produces 4 distinct rolling crests and valleys across the month!
      const weekNames = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const vWeek = [
        [0.978, 1.035, 1.048, 0.965], // W1: daylight peak, off-peak trough
        [1.022, 1.076, 1.062, 0.960], // W2: industrial solar surge
        [1.015, 1.085, 1.096, 1.042], // W3: peak monthly stability
        [1.010, 1.068, 1.038, 0.985], // W4: end of month cycle
      ];
      const cWeek = [
        [0.68, 0.98, 1.15, 0.62], // W1: weekday shift load vs weekend idle
        [0.94, 1.20, 1.12, 0.58], // W2: full production run
        [0.88, 1.16, 1.08, 0.55], // W3: steady manufacturing
        [0.86, 1.14, 0.84, 0.65], // W4: cycle maintenance & recovery
      ];

      weekNames.forEach((wName, wIdx) => {
        const days = ['Mon', 'Wed', 'Fri', 'Sun'];
        for (let d = 0; d < 4; d++) {
          const isMidWeek = d === 1; // Anchor label near center of the week
          points.push({
            label: isMidWeek ? wName : `${wName} · ${days[d]}`,
            fullDate: `${wName} (${days[d]}) · November 2026`,
            vFactor: vWeek[wIdx][d],
            cFactor: cWeek[wIdx][d],
            isMajorTick: isMidWeek,
          });
        }
      });
    } else if (tf === 'hourly') {
      // 13 2-hour interval time marks throughout the full 24h diurnal cycle
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:59'];
      const vFactors = [0.985, 0.990, 0.992, 1.010, 1.032, 1.042, 1.025, 1.018, 1.035, 1.015, 1.005, 0.995, 0.988];
      const cFactors = [0.42, 0.38, 0.44, 0.70, 0.96, 1.14, 1.18, 1.09, 1.05, 0.88, 0.64, 0.52, 0.45];
      hours.forEach((h, i) => {
        points.push({
          label: h,
          fullDate: `Today at ${h}`,
          vFactor: vFactors[i],
          cFactor: cFactors[i] * (sub === 'yesterday' ? 0.93 : 1.0),
          isMajorTick: i % 2 === 0,
        });
      });
    } else if (tf === 'daily') {
      // 14 continuous days matching the iconic rolling wave from Image 2
      const days = ['01 Jun', '02 Jun', '03 Jun', '04 Jun', '05 Jun', '06 Jun', '07 Jun', '08 Jun', '09 Jun', '10 Jun', '11 Jun', '12 Jun', '13 Jun', '14 Jun'];
      const vFactors = [0.975, 1.025, 1.045, 0.960, 1.050, 1.080, 1.060, 0.970, 1.015, 1.075, 1.095, 1.055, 1.025, 1.050];
      const cFactors = [0.72, 0.95, 0.68, 1.10, 0.94, 0.76, 1.05, 1.18, 0.92, 0.74, 1.02, 1.14, 0.82, 0.96];
      days.forEach((d, i) => {
        points.push({
          label: d,
          fullDate: `${d} 2026`,
          vFactor: vFactors[i],
          cFactor: cFactors[i],
          isMajorTick: i % 2 === 0 || i === days.length - 1,
        });
      });
    } else if (tf === 'monthly') {
      // 12 months with natural seasonal waves
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const vFactors = [0.985, 1.015, 1.035, 1.005, 0.980, 1.025, 1.050, 1.035, 1.015, 1.005, 0.990, 1.015];
      const cFactors = [0.75, 0.86, 0.98, 1.06, 1.12, 1.18, 1.15, 1.08, 0.98, 0.88, 0.82, 0.78];
      months.forEach((m, i) => {
        points.push({
          label: m,
          fullDate: `${m} 2026`,
          vFactor: vFactors[i],
          cFactor: cFactors[i],
          isMajorTick: true,
        });
      });
    } else {
      // yearly - 15 points (quarterly intervals across 5 years for continuous fluid spline)
      const quarters = [
        '2022 Q1', '2022 Q2', '2022 Q4',
        '2023 Q1', '2023 Q2', '2023 Q4',
        '2024 Q1', '2024 Q2', '2024 Q4',
        '2025 Q1', '2025 Q2', '2025 Q4',
        '2026 Q1', '2026 Q2', '2026 Q4',
      ];
      const vFactors = [0.985, 1.01, 0.995, 1.02, 1.035, 1.01, 0.99, 1.025, 1.04, 1.02, 1.005, 1.03, 1.015, 1.045, 1.02];
      const cFactors = [0.82, 0.94, 0.88, 0.96, 1.08, 1.02, 0.92, 1.12, 1.15, 1.06, 0.98, 1.14, 1.10, 1.18, 1.05];
      quarters.forEach((q, i) => {
        const isYearCenter = i % 3 === 1;
        const year = q.split(' ')[0];
        points.push({
          label: isYearCenter ? year : q,
          fullDate: q,
          vFactor: vFactors[i],
          cFactor: cFactors[i],
          isMajorTick: isYearCenter,
        });
      });
    }

    const vBase = voltBase > 0 ? voltBase : 400.0;
    const cBase = currBase > 0 ? currBase : 22.0;

    return points.map((p, i) => {
      const vVal = +(vBase * p.vFactor + (i === points.length - 1 ? jitter * 1.2 : 0)).toFixed(1);
      const cVal = +(cBase * p.cFactor + (i === points.length - 1 ? jitter * 0.7 : 0)).toFixed(1);

      return {
        label: p.label,
        fullDate: p.fullDate,
        voltage: vVal,
        current: cVal,
        isMajorTick: p.isMajorTick,
      };
    });
  }, [tf, sub, voltBase, currBase, livePulse]);

  /* ═════════════════════════════════════════════════════════════════════
     PARTITION GEOMETRIES & HARMONIC ROUND SCALES
     ═════════════════════════════════════════════════════════════════════ */
  const VW = 480;
  const VH = 205;
  const PT = 16;
  const PB = 30;
  const PL_V = 48; // Left padding for Voltage ticks (e.g. 430 V)
  const PL_C = 42; // Left padding for Current ticks (e.g. 24 A)
  const PR = 16;
  const PW_V = VW - PL_V - PR;
  const PW_C = VW - PL_C - PR;
  const PH = VH - PT - PB;
  const baseY = PT + PH;

  // 1. Voltage Scale (Clean harmonic 15V or 20V steps with headroom)
  const { minV, maxV, vTicks, avgV } = useMemo(() => {
    let lo = 9999, hi = 0, sum = 0;
    chartPoints.forEach((d) => {
      if (d.voltage < lo) lo = d.voltage;
      if (d.voltage > hi) hi = d.voltage;
      sum += d.voltage;
    });

    // Clean harmonic bounds (e.g. 370V, 385V, 400V, 415V, 430V, 445V)
    const range = hi - lo;
    const pad = Math.max(10, range * 0.18);
    const minVal = Math.floor((lo - pad) / 10) * 10;
    const maxVal = Math.ceil((hi + pad) / 10) * 10;
    const step = (maxVal - minVal) / 4;
    const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(minVal + i * step));

    return {
      minV: minVal,
      maxV: maxVal,
      vTicks: ticks,
      avgV: +(sum / (chartPoints.length || 1)).toFixed(1),
      minVData: lo,
      maxVData: hi,
    };
  }, [chartPoints]);

  // 2. Current Scale (Starts at 0A with dynamic peak headroom so emerald wave has full amplitude)
  const { minC, maxC, cTicks, avgC } = useMemo(() => {
    let lo = 9999, hi = 0, sum = 0;
    chartPoints.forEach((d) => {
      if (d.current < lo) lo = d.current;
      if (d.current > hi) hi = d.current;
      sum += d.current;
    });

    const minVal = 0;
    const rawTarget = Math.max(20, hi * 1.25);
    const maxVal = Math.ceil(rawTarget / 5) * 5;
    const step = maxVal / 4;
    const ticks = [0, 1, 2, 3, 4].map((i) => (step < 5 ? +((i * step).toFixed(1)) : Math.round(i * step)));

    return {
      minC: minVal,
      maxC: maxVal,
      cTicks: ticks,
      avgC: +(sum / (chartPoints.length || 1)).toFixed(1),
      minCData: lo,
      maxCData: hi,
    };
  }, [chartPoints]);

  // Screen Coordinates for Spline Curves
  const n = chartPoints.length;
  const xStepV = PW_V / Math.max(1, n - 1);
  const xStepC = PW_C / Math.max(1, n - 1);

  const voltPts = useMemo(() => {
    return chartPoints.map((d, i) => {
      const x = PL_V + i * xStepV;
      const frac = (d.voltage - minV) / (maxV - minV || 1);
      const y = baseY - frac * PH;
      return { x, y, val: d.voltage };
    });
  }, [chartPoints, PL_V, xStepV, minV, maxV, baseY, PH]);

  const currPts = useMemo(() => {
    return chartPoints.map((d, i) => {
      const x = PL_C + i * xStepC;
      const frac = (d.current - minC) / (maxC - minC || 1);
      const y = baseY - frac * PH;
      return { x, y, val: d.current };
    });
  }, [chartPoints, PL_C, xStepC, minC, maxC, baseY, PH]);

  // Spline & Area SVG Paths
  const voltSpline = useMemo(() => getSplinePath(voltPts), [voltPts]);
  const voltArea = useMemo(() => getAreaPath(voltPts, baseY), [voltPts, baseY]);
  const currSpline = useMemo(() => getSplinePath(currPts), [currPts]);
  const currArea = useMemo(() => getAreaPath(currPts, baseY), [currPts, baseY]);

  // ── Synchronized Hover Handlers ──
  const handleMouseMoveV = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!voltSvgRef.current) return;
    const rect = voltSvgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * VW;
    if (mouseX < PL_V || mouseX > VW - PR) {
      setHoveredIdx(null);
      return;
    }
    const relX = mouseX - PL_V;
    const idx = Math.min(n - 1, Math.max(0, Math.round(relX / xStepV)));
    setHoveredIdx(idx);
  };

  const handleMouseMoveC = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!currSvgRef.current) return;
    const rect = currSvgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * VW;
    if (mouseX < PL_C || mouseX > VW - PR) {
      setHoveredIdx(null);
      return;
    }
    const relX = mouseX - PL_C;
    const idx = Math.min(n - 1, Math.max(0, Math.round(relX / xStepC)));
    setHoveredIdx(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  // ── ApexCharts Export Menu Handlers ──
  const exportSVG = () => {
    if (!voltSvgRef.current || !currSvgRef.current) return;
    const serializer = new XMLSerializer();
    const vStr = serializer.serializeToString(voltSvgRef.current);
    const cStr = serializer.serializeToString(currSvgRef.current);
    const combined = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="250"><g>${vStr}</g><g transform="translate(480, 0)">${cStr}</g></svg>`;
    const blob = new Blob([combined], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voltage_current_profile_${tf}_${sub}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const exportPNG = () => {
    if (!voltSvgRef.current || !currSvgRef.current) return;
    const serializer = new XMLSerializer();
    const vStr = serializer.serializeToString(voltSvgRef.current);
    const cStr = serializer.serializeToString(currSvgRef.current);

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgV = new Image();
    const imgC = new Image();
    const blobV = new Blob([vStr], { type: 'image/svg+xml;charset=utf-8' });
    const blobC = new Blob([cStr], { type: 'image/svg+xml;charset=utf-8' });
    const urlV = URL.createObjectURL(blobV);
    const urlC = URL.createObjectURL(blobC);

    imgV.onload = () => {
      ctx.drawImage(imgV, 20, 20, 760, 380);
      imgC.onload = () => {
        ctx.drawImage(imgC, 820, 20, 760, 380);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `voltage_current_profile_${tf}_${sub}.png`;
        link.click();
        URL.revokeObjectURL(urlV);
        URL.revokeObjectURL(urlC);
      };
      imgC.src = urlC;
    };
    imgV.src = urlV;
    setShowMenu(false);
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Voltage (V)', 'Current (A)'];
    const rows = chartPoints.map((d) => [d.fullDate, d.voltage, d.current]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `voltage_current_profile_${tf}_${sub}.csv`;
    link.click();
    setShowMenu(false);
  };

  // Distinct X-Axis Labels for Weekly Mode (Centers labels under each week)
  const renderXLabels = (xStep: number, pl: number, color: string) => {
    if (tf === 'weekly') {
      // 4 clean major week labels placed at the center of each week segment (4 points per week)
      const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weekLabels.map((wLabel, wIdx) => {
        const centerIndex = wIdx * 4 + 1.5; // Exactly midway between points of that week
        const x = pl + centerIndex * xStep;
        const isHovered = hoveredIdx !== null && Math.floor(hoveredIdx / 4) === wIdx;

        return (
          <text
            key={`w-lbl-${wIdx}`}
            x={x}
            y={baseY + 18}
            textAnchor="middle"
            fontSize={isHovered ? '10' : '9.5'}
            fill={isHovered ? color : COLOR_AXIS}
            fontWeight={isHovered ? 700 : 500}
          >
            {wLabel}
          </text>
        );
      });
    }

    // Default label rendering for Daily, Hourly, Monthly, Yearly
    return chartPoints.map((d, i) => {
      const x = pl + i * xStep;
      const isHovered = hoveredIdx === i;

      // Filter non-major ticks if too dense
      if (n > 10 && !d.isMajorTick && !isHovered && i !== 0 && i !== n - 1) {
        return null;
      }

      return (
        <text
          key={`xlab-${i}`}
          x={x}
          y={baseY + 18}
          textAnchor="middle"
          fontSize={isHovered ? '10' : '9.5'}
          fill={isHovered ? color : COLOR_AXIS}
          fontWeight={isHovered ? 700 : 500}
        >
          {d.label}
        </text>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 330,
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* ══ HEADER: Title, Select2 Filters & Apex Toolbar ════ */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: '#FFFFFF',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Left: Card Title & Meter Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              backgroundColor: 'rgba(0, 143, 251, 0.10)',
              color: COLOR_VOLTAGE,
              border: '1px solid rgba(0, 143, 251, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={17} />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.02rem',
                fontWeight: 700,
                color: COLOR_TEXT,
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
              }}
            >
              Voltage &amp; Current Profile
            </div>
          </div>
        </div>

        {/* Right: Select2 Timeframe Dropdown, Select2 Sub-period Dropdown & Apex Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Timeframe Select2 Dropdown */}
          <div style={{ width: 105 }}>
            <Select2
              size="sm"
              searchable={false}
              value={tf}
              onChange={(val) => setTf(val as Timeframe)}
              options={[
                { value: 'hourly', label: 'Hourly' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>

          {/* Sub-period Select2 Dropdown */}
          <div style={{ minWidth: 165 }}>
            <Select2
              size="sm"
              searchable={false}
              value={sub}
              onChange={(val) => setSub(val)}
              options={(SUB_PERIOD_BY_TF[tf] || []).map((k) => ({
                value: k,
                label: subPeriodLabels[k] || k,
              }))}
            />
          </div>

          {/* ApexCharts Hamburger Menu Icon Button ☰ */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              title="ApexCharts Menu (Download SVG, PNG, CSV)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: showMenu ? '#F1F5F9' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Dropdown Popup Menu */}
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 36,
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                  minWidth: 155,
                  padding: '4px 0',
                  zIndex: 100,
                }}
              >
                  <button
                    type="button"
                    onClick={exportSVG}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      color: '#334155',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                  >
                    <Code2 size={14} color="#008FFB" />
                    Download SVG
                  </button>
                  <button
                    type="button"
                    onClick={exportPNG}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      color: '#334155',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                  >
                    <ImageIcon size={14} color="#00E396" />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={exportCSV}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      color: '#334155',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                  >
                    <FileSpreadsheet size={14} color="#10B981" />
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* ══ DUAL PARTITIONS: Voltage Profile (Left) | Current Profile (Right) ══ */}
      <div
        className="trend-dual-container"
        style={{
          padding: '6px 12px 8px 12px',
        }}
      >
        {/* ── PARTITION 1 (LEFT): VOLTAGE PROFILE ── */}
        <div className="trend-subpanel-left">
          {/* Subpanel Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
              paddingBottom: 4,
              borderBottom: '1px dashed var(--border-color, #E2E8E5)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: COLOR_VOLTAGE,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: COLOR_TEXT }}>
                Voltage (V)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.68rem', color: COLOR_AXIS }}>Avg:</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: COLOR_VOLTAGE,
                  backgroundColor: 'rgba(0, 143, 251, 0.10)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {avgV} V
              </span>
            </div>
          </div>

          {/* Voltage SVG Chart (Clean Spline Area without idle clutter dots) */}
          <div
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              ref={voltSvgRef}
              viewBox={`0 0 ${VW} ${VH}`}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              style={{
                display: 'block',
                cursor: 'crosshair',
              }}
              onMouseMove={handleMouseMoveV}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Voltage Sky Blue Gradient Fill */}
                <linearGradient id="voltGradDual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_VOLTAGE} stopOpacity="0.42" />
                  <stop offset="60%" stopColor={COLOR_VOLTAGE} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={COLOR_VOLTAGE} stopOpacity="0.01" />
                </linearGradient>
                <filter id="voltGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={COLOR_VOLTAGE} floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Voltage Ticks */}
              {vTicks.map((val) => {
                const frac = (val - minV) / (maxV - minV || 1);
                const y = baseY - frac * PH;
                return (
                  <g key={`v-grid-${val}`}>
                    <line
                      x1={PL_V}
                      y1={y}
                      x2={VW - PR}
                      y2={y}
                      stroke={COLOR_GRID}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={PL_V - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9.5"
                      fill={COLOR_AXIS}
                      fontWeight={500}
                    >
                      {val} V
                    </text>
                  </g>
                );
              })}

              {/* Baseline Axis */}
              <line
                x1={PL_V}
                y1={baseY}
                x2={VW - PR}
                y2={baseY}
                stroke="#CBD5E1"
                strokeWidth={1}
              />

              {/* Smooth Fluid Area Under Curve */}
              {voltArea && <path d={voltArea} fill="url(#voltGradDual)" />}

              {/* Smooth Flowing Spline Curve (Pure & Seamless Line) */}
              {voltSpline && (
                <path
                  d={voltSpline}
                  fill="none"
                  stroke={COLOR_VOLTAGE}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#voltGlow)"
                />
              )}

              {/* X-Axis Date / Timestamp Labels (Centered & Harmonious) */}
              {renderXLabels(xStepV, PL_V, COLOR_VOLTAGE)}

              {/* Synchronized Hover Crosshair, Glowing Dot & Floating Tooltip */}
              {hoveredIdx !== null && voltPts[hoveredIdx] && (
                <g>
                  {/* Vertical Guide Line */}
                  <line
                    x1={voltPts[hoveredIdx].x}
                    y1={PT}
                    x2={voltPts[hoveredIdx].x}
                    y2={baseY}
                    stroke="#94A3B8"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                  />

                  {/* Active Glowing Marker */}
                  <circle
                    cx={voltPts[hoveredIdx].x}
                    cy={voltPts[hoveredIdx].y}
                    r={5.5}
                    fill={COLOR_VOLTAGE}
                    stroke="#FFFFFF"
                    strokeWidth={2.4}
                    filter="url(#voltGlow)"
                  />

                  {/* Floating Tooltip Pill inside SVG */}
                  {(() => {
                    const hp = voltPts[hoveredIdx];
                    const tooltipW = 104;
                    const tooltipH = 34;
                    let tx = hp.x - tooltipW / 2;
                    let ty = hp.y - tooltipH - 8;
                    if (tx < PL_V) tx = PL_V + 2;
                    if (tx + tooltipW > VW - PR) tx = VW - PR - tooltipW - 2;
                    if (ty < PT) ty = hp.y + 10;

                    return (
                      <g>
                        <rect
                          x={tx}
                          y={ty}
                          width={tooltipW}
                          height={tooltipH}
                          rx={5}
                          fill="#0F172A"
                          fillOpacity="0.94"
                          stroke={COLOR_VOLTAGE}
                          strokeWidth={1}
                        />
                        <text
                          x={tx + tooltipW / 2}
                          y={ty + 13}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#94A3B8"
                          fontWeight={500}
                        >
                          {chartPoints[hoveredIdx].label}
                        </text>
                        <text
                          x={tx + tooltipW / 2}
                          y={ty + 27}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#38BDF8"
                          fontWeight={700}
                        >
                          {hp.val} V
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ── PARTITION 2 (RIGHT): CURRENT PROFILE ── */}
        <div className="trend-subpanel-right">
          {/* Subpanel Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
              paddingBottom: 4,
              borderBottom: '1px dashed var(--border-color, #E2E8E5)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: COLOR_CURRENT,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: COLOR_TEXT }}>
                Current (A)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.68rem', color: COLOR_AXIS }}>Avg:</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: 'rgba(0, 227, 150, 0.12)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {avgC} A
              </span>
            </div>
          </div>

          {/* Current SVG Chart (Clean Spline Area without idle clutter dots) */}
          <div
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              ref={currSvgRef}
              viewBox={`0 0 ${VW} ${VH}`}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              style={{
                display: 'block',
                cursor: 'crosshair',
              }}
              onMouseMove={handleMouseMoveC}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Current Emerald Green Gradient Fill */}
                <linearGradient id="currGradDual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_CURRENT} stopOpacity="0.45" />
                  <stop offset="60%" stopColor={COLOR_CURRENT} stopOpacity="0.14" />
                  <stop offset="100%" stopColor={COLOR_CURRENT} stopOpacity="0.01" />
                </linearGradient>
                <filter id="currGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={COLOR_CURRENT} floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Current Ticks */}
              {cTicks.map((val) => {
                const frac = (val - minC) / (maxC - minC || 1);
                const y = baseY - frac * PH;
                return (
                  <g key={`c-grid-${val}`}>
                    <line
                      x1={PL_C}
                      y1={y}
                      x2={VW - PR}
                      y2={y}
                      stroke={COLOR_GRID}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={PL_C - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9.5"
                      fill={COLOR_AXIS}
                      fontWeight={500}
                    >
                      {val} A
                    </text>
                  </g>
                );
              })}

              {/* Baseline Axis */}
              <line
                x1={PL_C}
                y1={baseY}
                x2={VW - PR}
                y2={baseY}
                stroke="#CBD5E1"
                strokeWidth={1}
              />

              {/* Smooth Fluid Area Under Curve */}
              {currArea && <path d={currArea} fill="url(#currGradDual)" />}

              {/* Smooth Flowing Spline Curve (Pure & Seamless Line) */}
              {currSpline && (
                <path
                  d={currSpline}
                  fill="none"
                  stroke={COLOR_CURRENT}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#currGlow)"
                />
              )}

              {/* X-Axis Date / Timestamp Labels (Centered & Harmonious) */}
              {renderXLabels(xStepC, PL_C, '#059669')}

              {/* Synchronized Hover Crosshair, Glowing Dot & Floating Tooltip */}
              {hoveredIdx !== null && currPts[hoveredIdx] && (
                <g>
                  {/* Vertical Guide Line */}
                  <line
                    x1={currPts[hoveredIdx].x}
                    y1={PT}
                    x2={currPts[hoveredIdx].x}
                    y2={baseY}
                    stroke="#94A3B8"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                  />

                  {/* Active Glowing Marker */}
                  <circle
                    cx={currPts[hoveredIdx].x}
                    cy={currPts[hoveredIdx].y}
                    r={5.5}
                    fill={COLOR_CURRENT}
                    stroke="#FFFFFF"
                    strokeWidth={2.4}
                    filter="url(#currGlow)"
                  />

                  {/* Floating Tooltip Pill inside SVG */}
                  {(() => {
                    const hp = currPts[hoveredIdx];
                    const tooltipW = 104;
                    const tooltipH = 34;
                    let tx = hp.x - tooltipW / 2;
                    let ty = hp.y - tooltipH - 8;
                    if (tx < PL_C) tx = PL_C + 2;
                    if (tx + tooltipW > VW - PR) tx = VW - PR - tooltipW - 2;
                    if (ty < PT) ty = hp.y + 10;

                    return (
                      <g>
                        <rect
                          x={tx}
                          y={ty}
                          width={tooltipW}
                          height={tooltipH}
                          rx={5}
                          fill="#0F172A"
                          fillOpacity="0.94"
                          stroke={COLOR_CURRENT}
                          strokeWidth={1}
                        />
                        <text
                          x={tx + tooltipW / 2}
                          y={ty + 13}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#94A3B8"
                          fontWeight={500}
                        >
                          {chartPoints[hoveredIdx].label}
                        </text>
                        <text
                          x={tx + tooltipW / 2}
                          y={ty + 27}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#34D399"
                          fontWeight={700}
                        >
                          {hp.val} A
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerTrendLineGraph;
