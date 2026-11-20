import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Wifi, Cpu, Layers } from 'lucide-react';
import { useEnergyData } from '../../../context/EnergyDataContext';
import { enerlinkApi, DEFAULT_DEVICE_ID, type EnerlinkTelemetryReading } from '../api/enerlinkApi';
import { gatewayApi } from '../../gateways-devices/api/gatewayApi';
import { channelApi } from '../../gateways-devices/api/channelApi';
import { meterApi } from '../../gateways-devices/api/meterApi';
import {
  TelemetryFilterToolbar,
  MeterTelemetryCard,
  ModbusRegisterTable,
  EnergyConsumptionBarChart,
  EnergyDistributionPieChart,
  PowerTrendLineGraph,
} from '../components';
import { LoadingScreen } from '../../../components/common/LoadingScreen';
import '../styles/dashboard.css';

interface EnergyDashboardPageProps {
  onNavigate?: (tab: string) => void;
}

// Persistent in-memory and storage telemetry cache to eliminate the "flash of 0.00" on navigation
let cachedLiveReadings: EnerlinkTelemetryReading[] = (() => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('sab_cached_telemetry');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
})();

// Module-level guard: loading screen should ONLY show once on initial application load / login,
// and NEVER when returning from other sidebar tabs (Gateways, Asset Mapping, Masters, etc.)
let hasInitialDashboardLoaded = false;

export const resetDashboardInitialLoad = () => {
  hasInitialDashboardLoaded = false;
};

export const EnergyDashboardPage: React.FC<EnergyDashboardPageProps> = ({ onNavigate }) => {
  const {
    gateways,
    channels,
    meters,
    concerns,
    locations,
    serviceNos,
    isDbLoading,
    refreshDbData,
  } = useEnergyData();

  // ── High-Tech Telemetry & Database Loading Screen State (Initial App Boot / Login) ──
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => !hasInitialDashboardLoaded);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // ── Live fleet from Edge / Database API ─────────────────────────────────
  const [liveGateways, setLiveGateways] = useState<any[]>([]);
  const [liveChannels, setLiveChannels] = useState<any[]>([]);
  const [liveMeters, setLiveMeters] = useState<any[]>([]);

  // ── Raw readings from edge broker / telemetry API (initialized from cache to eliminate 0.00 glitch) ──
  const [liveReadings, setLiveReadings] = useState<EnerlinkTelemetryReading[]>(() => cachedLiveReadings);

  const updateLiveReadings = useCallback((readings: EnerlinkTelemetryReading[]) => {
    if (!readings || readings.length === 0) return;
    cachedLiveReadings = readings;
    try {
      localStorage.setItem('sab_cached_telemetry', JSON.stringify(readings));
    } catch {}
    setLiveReadings(readings);
  }, []);

  const fetchFleet = useCallback(async () => {
    try {
      const [gwsRes, chsRes, metersRes] = await Promise.allSettled([
        gatewayApi.getAll(),
        channelApi.getAll(),
        meterApi.getAll(),
      ]);

      if (gwsRes.status === 'fulfilled') {
        const raw = gwsRes.value?.data ?? gwsRes.value;
        if (Array.isArray(raw) && raw.length > 0) setLiveGateways(raw);
      }
      if (chsRes.status === 'fulfilled') {
        const raw = chsRes.value?.data ?? chsRes.value;
        if (Array.isArray(raw) && raw.length > 0) setLiveChannels(raw);
      }
      if (metersRes.status === 'fulfilled') {
        const raw = metersRes.value?.data ?? metersRes.value;
        if (Array.isArray(raw) && raw.length > 0) setLiveMeters(raw);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  // ── Multi-Parameter Filter toolbar state: Asset, Location, Concern, Service No ───
  const [deviceIdInput, setDeviceIdInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [concernInput, setConcernInput] = useState<string>('');
  const [serviceNoInput, setServiceNoInput] = useState<string>('');

  // ── Applied Filter State ─────────────────────────────────────────────────
  const [appliedDeviceId, setAppliedDeviceId] = useState<string>('');
  const [appliedLocation, setAppliedLocation] = useState<string>('');
  const [appliedConcern, setAppliedConcern] = useState<string>('');
  const [appliedServiceNo, setAppliedServiceNo] = useState<string>('');

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [telemetryViewMode, setTelemetryViewMode] = useState<'cards' | 'table'>('cards');
  const [queryError, setQueryError] = useState<string>('');
  const [lastTelemetryReceivedAt, setLastTelemetryReceivedAt] = useState<number>(() => Date.now());

  // ── Timeframe & SubPeriod for charts ─────────────────────────────────────
  const [timeframe, setTimeframe] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('hourly');
  const [subPeriod, setSubPeriod] = useState<string>('today');

  const handleTimeframeChange = (tf: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setTimeframe(tf);
    const defaults: Record<string, string> = {
      hourly: 'today',
      daily: 'this_week',
      weekly: 'this_month',
      monthly: '2026',
      yearly: '5years',
    };
    setSubPeriod(defaults[tf] || 'today');
  };

  const poolGateways = useMemo(() => (liveGateways.length > 0 ? liveGateways : gateways), [liveGateways, gateways]);
  const poolChannels = useMemo(() => (liveChannels.length > 0 ? liveChannels : channels), [liveChannels, channels]);
  const poolMeters = useMemo(() => (liveMeters.length > 0 ? liveMeters : meters), [liveMeters, meters]);

  // ── 1. Resolve Active Gateway ─────────────────────────────────────────────
  const activeGateway = useMemo(() => {
    if (appliedDeviceId) {
      const clean = appliedDeviceId.trim().toLowerCase().replace(/[:-]/g, '');
      const match = poolGateways.find((gw: any) => {
        const mac = (gw.mac_address || gw.macAddress || '').toLowerCase().replace(/[:-]/g, '');
        const sn = (gw.serial_number || gw.serialNo || '').toLowerCase();
        const id = String(gw.Gateway_id || gw.id || '').toLowerCase();
        return (mac && mac.includes(clean)) || (sn && sn.includes(clean)) || (id && id === clean);
      });
      if (match) return match;
    }
    const found = poolGateways.find((gw: any) => gw.isActive !== false && (gw.status || 'Active').toLowerCase() === 'active') || poolGateways[0];
    return found || null;
  }, [poolGateways, appliedDeviceId]);

  // ── 2. Resolve Active Channels belonging strictly to this Gateway ──────────
  const activeGatewayChannels = useMemo(() => {
    if (!activeGateway) return [];
    const gwId = Number(activeGateway.id || activeGateway.Gateway_id);
    const matched = poolChannels.filter((ch: any) => {
      const chGwId = Number(ch.gatewayId || ch.Gateway_id);
      return chGwId === gwId || (!isNaN(gwId) && chGwId === gwId);
    });
    if (matched.length > 0) return matched;
    return poolChannels.length > 0 ? poolChannels : [];
  }, [activeGateway, poolChannels]);

  // ── 3. Resolve Connected Meters belonging strictly to these Channels ────────
  const activeGatewayMeters = useMemo(() => {
    const chIds = new Set(activeGatewayChannels.map((ch: any) => Number(ch.id || ch.Channel_id)));
    const matched = poolMeters.filter((m: any) => {
      const mChId = Number(m.channelId || m.Channel_id);
      return chIds.has(mChId);
    });
    if (matched.length > 0) return matched;
    return poolMeters.length > 0 ? poolMeters : [];
  }, [activeGatewayChannels, poolMeters]);

  // ── Hierarchy Validation Status (Gateway ➔ Channel ➔ Meter) ───────────────
  const hierarchyStatus = useMemo(() => {
    if (!activeGateway && poolGateways.length === 0) {
      return { ok: false, level: 'gateway', message: 'No Active Gateway Configured' };
    }
    // Connected if live telemetry is received OR if channels & meters are present
    if (liveReadings.length > 0 || (activeGatewayChannels.length > 0 && activeGatewayMeters.length > 0)) {
      return { ok: true, level: 'connected', message: 'Hierarchy Connected' };
    }
    if (activeGatewayChannels.length === 0) {
      return {
        ok: false,
        level: 'channel',
        message: `No Communication Channels Configured for Gateway "${activeGateway?.Gateway_name || activeGateway?.deviceName || 'Gateway'}"`,
      };
    }
    if (activeGatewayMeters.length === 0) {
      return {
        ok: false,
        level: 'meter',
        message: `No Meters Connected to Channels of Gateway "${activeGateway?.Gateway_name || activeGateway?.deviceName || 'Gateway'}"`,
      };
    }
    return { ok: true, level: 'connected', message: 'Hierarchy Connected' };
  }, [activeGateway, poolGateways, activeGatewayChannels, activeGatewayMeters, liveReadings.length]);

  // ── Derive selectedMeterId strictly from appliedServiceNo (updates ONLY on View click) ──
  const selectedMeterId = useMemo<string>(() => {
    const s = (appliedServiceNo || '').trim();
    if (!s || s.toLowerCase() === 'all') return 'all';
    return s;
  }, [appliedServiceNo]);

  // ── Filter readings strictly for the configured hierarchy ─────────────────
  const filteredReadings = useMemo<EnerlinkTelemetryReading[]>(() => {
    let targetMeters = activeGatewayMeters;

    // Filter by Concern
    if (appliedConcern && appliedConcern !== 'all') {
      const cQ = appliedConcern.toLowerCase();
      targetMeters = targetMeters.filter(
        (m: any) => (m.concern || '').toLowerCase() === cQ || (m.concern || '').toLowerCase().includes(cQ)
      );
    }

    // Filter by Location
    if (appliedLocation && appliedLocation !== 'all') {
      const lQ = appliedLocation.toLowerCase();
      targetMeters = targetMeters.filter(
        (m: any) =>
          (m.placementLocation || m.location || '').toLowerCase() === lQ ||
          (m.placementLocation || m.location || '').toLowerCase().includes(lQ)
      );
    }

    // Filter by Service No / Sub-Meter
    if (appliedServiceNo && appliedServiceNo !== 'all') {
      const sQ = appliedServiceNo.toLowerCase().trim();
      targetMeters = targetMeters.filter((m: any) => {
        const sId = String(m.slave_id !== undefined ? m.slave_id : m.slaveId !== undefined ? m.slaveId : m.Meter_id || '');
        const cName = (m.customName || '').toLowerCase().trim();
        const mName = (m.Meter_name || '').toLowerCase().trim();
        const svcNo = (m.serviceNo || '').toLowerCase().trim();
        const tag = (m.tag || '').toLowerCase().trim();
        const serial = (m.meter_serial_number || m.serialNo || '').toLowerCase().trim();

        return (
          sId === appliedServiceNo ||
          svcNo === sQ ||
          cName === sQ ||
          mName === sQ ||
          tag === sQ ||
          serial === sQ ||
          (cName && (cName.includes(sQ) || sQ.includes(cName))) ||
          (mName && (mName.includes(sQ) || sQ.includes(mName)))
        );
      });
    }

    const targetDevId = (
      activeGateway?.mac_address ||
      activeGateway?.macAddress ||
      activeGateway?.serial_number ||
      activeGateway?.serialNo ||
      DEFAULT_DEVICE_ID
    ).replace(/[:-]/g, '').trim();

    // Map configured meters against live telemetry
    const result: EnerlinkTelemetryReading[] = targetMeters.map((m: any) => {
      const sId = Number(m.slave_id || m.slaveId || 1);
      const live = liveReadings.find((r) => Number(r.slave_id) === sId);

      const mName = m.customName || m.Meter_name || m.name || `Meter #${sId}`;
      const placement = m.placementLocation || m.location || 'Panel A';
      const concern = m.concern || 'Plant Operations';
      
      // Resolve EB Service Connection No from serviceNos if not directly attached
      const matchingSvc = (serviceNos || []).find((s: any) => {
        if (m.serviceNo && s.service_no && m.serviceNo.toLowerCase() === s.service_no.toLowerCase()) return true;
        if (Array.isArray(s.sub_meters) && s.sub_meters.some((sm: string) => sm.toLowerCase() === mName.toLowerCase())) return true;
        if (s.meter_name && s.meter_name.toLowerCase() === mName.toLowerCase()) return true;
        if (s.concern_name && concern && s.concern_name.toLowerCase() === concern.toLowerCase()) return true;
        return false;
      });
      const serviceNo = m.serviceNo || matchingSvc?.service_no || m.tag || `SC-0${sId}`;
      const model = m.meter_model || m.meterModelName || 'LG5310';

      if (live) {
        return {
          ...live,
          slave_id: sId,
          meter_name: mName,
          placementLocation: placement,
          concern: concern,
          serviceNo: serviceNo,
          meter_model: model,
          isOffline: false,
          timestamp_ms: live.timestamp_ms || Date.now(),
        };
      }

      // Standby state: when device is in hierarchy but waiting for edge poll
      return {
        profile_id: model,
        device_id: targetDevId,
        meter_serial: m.meter_serial_number || m.serialNo || m.tag || `MTR-${sId}`,
        channel: Number(m.channelId || m.Channel_id || 1),
        slave_id: sId,
        meter_name: mName,
        log_ts: 'Awaiting edge telemetry...',
        timestamp_ms: 0,
        message_id: 0,
        placementLocation: placement,
        concern: concern,
        serviceNo: serviceNo,
        isOffline: true,
        values: [
          {
            total_active_power: 0,
            line_to_line_voltage: 0,
            line_to_neutral_voltage: 0,
            l1_to_neutral_voltage: 0,
            l2_to_neutral_voltage: 0,
            l3_to_neutral_voltage: 0,
            average_current: 0,
            l1_current: 0,
            l2_current: 0,
            l3_current: 0,
            power_factor: 0,
            frequency: 0,
            active_energy: 0,
          },
        ],
      };
    });

    // Also include any live telemetry slaves received from the edge that aren't yet explicitly created in DB
    const mappedSlaveIds = new Set(targetMeters.map((m: any) => Number(m.slave_id || m.slaveId || 1)));
    for (const live of liveReadings) {
      const liveSlave = Number(live.slave_id || 1);
      if (!mappedSlaveIds.has(liveSlave)) {
        if (appliedServiceNo && appliedServiceNo !== 'all' && String(liveSlave) !== appliedServiceNo) {
          continue;
        }
        result.push({
          ...live,
          slave_id: liveSlave,
          meter_name: live.meter_name || `Modbus Slave #${liveSlave}`,
          placementLocation: live.placementLocation || 'Main Incomer',
          concern: live.concern || 'Plant Operations',
          serviceNo: live.serviceNo || `SC-0${liveSlave}`,
          meter_model: live.profile_id || 'LG5310',
          isOffline: false,
        });
      }
    }

    return result;
  }, [activeGatewayMeters, liveReadings, appliedConcern, appliedLocation, appliedServiceNo, activeGateway]);

  // ── Fetch & View telemetry strictly for Active Gateway & Configured Meters ──
  const handleView = useCallback(
    async (
      targetDev = deviceIdInput,
      targetLoc = locationInput,
      targetConcern = concernInput,
      targetServiceNo = serviceNoInput,
      opts?: { silent?: boolean; message?: string; subMessage?: string }
    ) => {
      setAppliedDeviceId(targetDev);
      setAppliedLocation(targetLoc);
      setAppliedConcern(targetConcern);
      setAppliedServiceNo(targetServiceNo);

      const devId = (
        activeGateway?.mac_address ||
        activeGateway?.macAddress ||
        activeGateway?.serial_number ||
        activeGateway?.serialNo ||
        targetDev ||
        DEFAULT_DEVICE_ID
      ).replace(/[:-]/g, '').trim() || DEFAULT_DEVICE_ID;

      const isSilent = Boolean(opts?.silent);
      if (!isSilent) {
        setIsFadingOut(false);
        setIsLoadingData(true);
      }

      setIsExecuting(true);
      setQueryError('');

      const options: any = {};
      const slVal = targetServiceNo.trim();
      let resolvedNumericSlave: number | null = null;

      if (slVal && slVal.toLowerCase() !== 'all') {
        const num = Number(slVal);
        if (!isNaN(num) && Number.isInteger(num) && num > 0) {
          resolvedNumericSlave = num;
          options.slaveId = num;
        } else {
          // Resolve numeric slave ID from meters list
          const found = (meters || []).find((m: any) =>
            (m.customName || '').toLowerCase() === slVal.toLowerCase() ||
            (m.Meter_name || '').toLowerCase() === slVal.toLowerCase() ||
            (m.tag || '').toLowerCase() === slVal.toLowerCase() ||
            (m.meter_serial_number || '').toLowerCase() === slVal.toLowerCase()
          );
          if (found) {
            const sId = Number(found.slave_id ?? found.slaveId);
            if (!isNaN(sId) && sId > 0) {
              resolvedNumericSlave = sId;
              options.slaveId = sId;
            }
          }
        }
      }

      const minDuration = !isSilent
        ? new Promise((resolve) => setTimeout(resolve, 500))
        : Promise.resolve();

      try {
        const [readingsRes] = await Promise.all([
          enerlinkApi.getLatestTelemetry(devId, options),
          minDuration,
          fetchFleet(),
        ]);

        if (readingsRes && readingsRes.isSuccess === false) {
          setQueryError(readingsRes.message || 'Connecting to edge telemetry feed...');
          return;
        }
        const rawData = readingsRes?.data !== undefined ? readingsRes.data : readingsRes;
        let readingsList: EnerlinkTelemetryReading[] = [];
        if (Array.isArray(rawData)) {
          readingsList = rawData.map((r: any) => ({
            ...r,
            slave_id: r.slave_id !== undefined ? Number(r.slave_id) : (resolvedNumericSlave || 1),
          }));
        } else if (rawData && typeof rawData === 'object') {
          if (rawData.values || rawData.slave_id) {
            const single = rawData as EnerlinkTelemetryReading;
            readingsList = [
              {
                ...single,
                slave_id: single.slave_id !== undefined ? Number(single.slave_id) : (resolvedNumericSlave || 1),
              },
            ];
          }
        }

        if (readingsList.length > 0) {
          const first = readingsList[0];
          let packetTs: number | null = null;
          if (first?.log_ts) {
            const d = new Date(String(first.log_ts).replace(' ', 'T'));
            if (!isNaN(d.getTime())) packetTs = d.getTime();
          } else if (first?.timestamp_ms) {
            packetTs = Number(first.timestamp_ms);
          }
          setLastTelemetryReceivedAt(packetTs && !isNaN(packetTs) ? packetTs : Date.now());
          updateLiveReadings(readingsList);
          setQueryError('');
        }
      } catch (_err: any) {
        // Keep current state during transient poll issues
      } finally {
        setIsExecuting(false);
        if (!isSilent) {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsLoadingData(false);
          }, 260);
        }
      }
    },
    [activeGateway, deviceIdInput, locationInput, concernInput, serviceNoInput, fetchFleet]
  );

  // ── Reset handler ────────────────────────────────────────────────────────
  const handleClearExplorer = () => {
    setDeviceIdInput('');
    setLocationInput('');
    setConcernInput('');
    setServiceNoInput('');
    setAppliedDeviceId('');
    setAppliedLocation('');
    setAppliedConcern('');
    setAppliedServiceNo('');
    setQueryError('');
    handleView('', '', '', '', { silent: true });
  };

  // ── Initial Telemetry & Database Ingestion (Animated Splash Screen only on first app load) ───
  useEffect(() => {
    let isMounted = true;
    const isFirstAppLoad = !hasInitialDashboardLoaded;

    const loadInitialData = async () => {
      const minDurationPromise = isFirstAppLoad
        ? new Promise((resolve) => setTimeout(resolve, 2400))
        : Promise.resolve();

      try {
        await Promise.allSettled([
          refreshDbData ? refreshDbData() : Promise.resolve(),
          fetchFleet(),
          handleView(appliedDeviceId, appliedLocation, appliedConcern, appliedServiceNo, { silent: true }),
          minDurationPromise,
        ]);
      } finally {
        hasInitialDashboardLoaded = true;
        if (isMounted) {
          if (isFirstAppLoad) {
            setIsFadingOut(true);
            setTimeout(() => {
              if (isMounted) {
                setIsLoadingData(false);
              }
            }, 300);
          } else {
            setIsLoadingData(false);
          }
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Periodic Edge Broker Auto-Poll (Every 5 minutes) ───────────────────
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      handleView(appliedDeviceId, appliedLocation, appliedConcern, appliedServiceNo, { silent: true });
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [appliedDeviceId, appliedLocation, appliedConcern, appliedServiceNo, autoPoll, handleView]);

  return (
    <>
      {/* ── High-Tech SCADA Loading Screen During Data Ingestion (Light Orange Theme) ── */}
      {isLoadingData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: '#FFF7ED',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 45%, #FDEEE2 100%)',
            opacity: isFadingOut ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
            pointerEvents: isFadingOut ? 'none' : 'auto',
          }}
        >
          <LoadingScreen
            fullScreen={true}
            theme="light-rust"
            size={220}
          />
        </div>
      )}

      <div
        className="energy-dashboard"
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
      <div
        className="industrial-card"
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* ── Hierarchical Filter Toolbar (1. Concern -> 2. Location -> 3. Service No) ── */}
        <TelemetryFilterToolbar
          concernInput={concernInput}
          setConcernInput={setConcernInput}
          locationInput={locationInput}
          setLocationInput={setLocationInput}
          serviceNoInput={serviceNoInput}
          setServiceNoInput={setServiceNoInput}
          meters={activeGatewayMeters}
          concerns={concerns}
          locations={locations}
          serviceNos={serviceNos}
          isExecuting={isExecuting || isLoadingData}
          onExecute={() => handleView(deviceIdInput, locationInput, concernInput, serviceNoInput, { silent: true })}
          onReset={handleClearExplorer}
        />

        {/* ── Error notice ── */}
        {queryError && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: '#FFFBEB',
              borderBottom: '1px solid #FEF3C7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.74rem',
              color: '#B45309',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{queryError}</span>
          </div>
        )}

        {/* ── Content Area: Hierarchy Empty State OR Telemetry Views ── */}
        <div
          className="dashboard-content-area"
          style={{
            padding: '8px 10px',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!hierarchyStatus.ok ? (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                margin: '12px',
                border: '1px dashed #CBD5E1',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  marginBottom: '16px',
                }}
              >
                {hierarchyStatus.level === 'gateway' ? (
                  <Wifi size={28} />
                ) : hierarchyStatus.level === 'channel' ? (
                  <Layers size={28} />
                ) : (
                  <Cpu size={28} />
                )}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#0F172A', fontWeight: 700 }}>
                {hierarchyStatus.message}
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.84rem', color: '#64748B', maxWidth: '480px', lineHeight: 1.5 }}>
                {hierarchyStatus.level === 'gateway' &&
                  'An active IoT Gateway device must be registered in Connectivity > Gateway to stream live edge telemetry.'}
                {hierarchyStatus.level === 'channel' &&
                  `Gateway "${activeGateway?.Gateway_name || 'Gateway'}" requires at least one configured RS-485 / Modbus channel to attach energy meters.`}
                {hierarchyStatus.level === 'meter' &&
                  `Channels are configured for "${activeGateway?.Gateway_name || 'Gateway'}", but no meters are connected. Add a Modbus meter in Connectivity > Gateway to view real-time power and energy data.`}
              </p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('gateway')}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 650,
                    backgroundColor: 'var(--ca-rust-primary, #BD621F)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Configure in Connectivity &gt; Gateway
                </button>
              )}
            </div>
          ) : telemetryViewMode === 'cards' ? (
            <div className="energy-dashboard-grid">
              {/* ── Top row: Pie chart | Meter card ── */}
              <div className="dashboard-top-row">
                {/* Pie / donut — always shows selected meter(s) */}
                <div className="dashboard-grid-card">
                  <EnergyDistributionPieChart
                    liveReadings={filteredReadings}
                    selectedMeterId={selectedMeterId}
                  />
                </div>

                {/* Meter telemetry card — only shows selected meter(s) */}
                <div className="dashboard-grid-card">
                  <MeterTelemetryCard
                    readings={filteredReadings}
                    selectedMeterId={selectedMeterId}
                    lastUpdatedTime={lastTelemetryReceivedAt}
                    onSelectMeter={(id) => {
                      const nextVal = id === 'all' ? '' : id;
                      setServiceNoInput(nextVal);
                    }}
                  />
                </div>
              </div>

              {/* ── Bottom row: Line graph (Voltage vs Current) | Bar chart (Energy Consumption) ── */}
              <div className="dashboard-bottom-row">
                <div className="dashboard-grid-card">
                  <PowerTrendLineGraph
                    liveReadings={filteredReadings}
                    selectedMeterId={selectedMeterId}
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    subPeriod={subPeriod}
                    onSubPeriodChange={setSubPeriod}
                  />
                </div>
                <div className="dashboard-grid-card">
                  <EnergyConsumptionBarChart
                    liveReadings={filteredReadings}
                    selectedMeterId={selectedMeterId}
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    subPeriod={subPeriod}
                    onSubPeriodChange={setSubPeriod}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Modbus raw table view ── */
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <ModbusRegisterTable liveReadings={filteredReadings} />
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
};

export default EnergyDashboardPage;