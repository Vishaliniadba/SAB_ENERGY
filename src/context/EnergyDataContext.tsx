import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialGateways,
  initialGatewayMakes,
  initialGatewayModels,
  initialChannels,
  initialMeters,
  initialAssets,
  initialAssetMeterMappings,
  initialConfig,
  initialMeterProfiles,
  initialMakes,
  initialModels,
  initialStandardParameters
} from '../mock/initialData';
import {
  INITIAL_CONCERNS,
  INITIAL_LOCATIONS,
  INITIAL_SERVICE_NOS,
  ConcernRecord,
  LocationRecord,
  ServiceNoRecord,
} from '../modules/masters/service-master/api/serviceMasterApi';
import { gatewayApi } from '../modules/gateways-devices/api/gatewayApi';
import { channelApi } from '../modules/gateways-devices/api/channelApi';
import { meterApi } from '../modules/gateways-devices/api/meterApi';
import { gatewayMakeApi } from '../modules/masters/gateway-master/api/gatewayMakeApi';
import { gatewayModelApi } from '../modules/masters/gateway-master/api/gatewayModelApi';
import { meterMakeApi } from '../modules/masters/meter-master/api/meterMakeApi';
import { meterModelApi } from '../modules/masters/meter-master/api/meterModelApi';
import { meterProfileApi } from '../modules/masters/meter-master/api/meterProfileApi';
import { parameterMasterApi } from '../modules/masters/meter-master/api/parameterMasterApi';

const EnergyDataContext = createContext(null);

// Automatic one-time cleanup of stale legacy dummy mock cache keys (never clear real user sites like NavaNala)
(() => {
  if (typeof window === 'undefined') return;
  try {
    const cachedTel = localStorage.getItem('sab_cached_telemetry');
    if (cachedTel && cachedTel.includes('DUMMY')) {
      localStorage.removeItem('sab_cached_telemetry');
    }
    const cachedMtrs = localStorage.getItem('sab_meters');
    if (cachedMtrs && cachedMtrs.includes('DUMMY')) {
      localStorage.removeItem('sab_meters');
    }
    const cachedGws = localStorage.getItem('sab_gateways');
    if (cachedGws && (cachedGws.includes('GW-101') || cachedGws.includes('00:1B:44:11:3A:B7'))) {
      localStorage.removeItem('sab_gateways');
    }
  } catch {}
})();

export const EnergyDataProvider = ({ children }) => {
  const load = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  };

  // Filter legacy dummy demo data
  const isDummyGateway = (gw: any) =>
    gw.Gateway_id === 'GW-101' || gw.Gateway_id === 'GW-102' || gw.Gateway_id === 'GW-103' ||
    gw.mac_address === '00:1B:44:11:3A:B7' || gw.mac_address === '00:1B:44:22:9C:14' || gw.mac_address === '00:1B:44:7F:50:88';

  const isDummyChannel = (ch: any) =>
    ch.Gateway_id === 'GW-101' || ch.Gateway_id === 'GW-102' || ch.Gateway_id === 'GW-103' ||
    (ch.Channel_id && ch.Channel_id.startsWith('CH-') && (
      ch.Channel_name === 'Main Feeder RS485 Loop' ||
      ch.Channel_name === 'Plant Grid TCP Link' ||
      ch.Channel_name === 'Solar Array Modbus Line' ||
      ch.Channel_name === 'MQTT Edge Telemetry'
    ));

  const isDummyMeter = (m: any) =>
    m.Meter_id === 'MTR-001' || m.Meter_id === 'MTR-002' || m.Meter_id === 'MTR-003' || m.Meter_id === 'MTR-004' ||
    m.meter_serial_number === 'SCH-EM-9921' || m.meter_serial_number === 'ELM-LG-4401' ||
    m.meter_serial_number === 'SLC-MFM-3840' || m.meter_serial_number === 'SCH-PM-5300' ||
    (m.customName && m.customName.toUpperCase().includes('DUMMY')) ||
    (m.name && m.name.toUpperCase().includes('DUMMY'));

  const isDummyAsset = (a: any) =>
    a.Asset_id === 'AST-501' || a.Asset_id === 'AST-502' || a.Asset_id === 'AST-503' || a.Asset_id === 'AST-504';

  const isDummyMapping = (m: any) =>
    m.Mapping_id === 'MAP-001' || m.Mapping_id === 'MAP-002' || m.Mapping_id === 'MAP-003' ||
    m.Meter_id === 'MTR-001' || m.Meter_id === 'MTR-002' || m.Meter_id === 'MTR-003' || m.Meter_id === 'MTR-004';

  const isDummyGwMake = (m: any) =>
    m.gw_make_id === 'GWMAKE-ADV' || m.gw_make_id === 'GWMAKE-SEI' || m.gw_make_id === 'GWMAKE-WEG';

  const isDummyGwModel = (m: any) =>
    m.gw_model_id === 'GWMOD-SAB-G2' || m.gw_model_id === 'GWMOD-ADV-EKI' || m.gw_model_id === 'GWMOD-WEG-750';

  const [gateways, setGateways] = useState(() => {
    const raw = load('sab_gateways', initialGateways);
    const cleaned = (Array.isArray(raw) ? raw : []).filter(gw => !isDummyGateway(gw));
    return cleaned.map((gw, idx) => {
      const rawCount = Number(gw.channel_count || gw.channelCount || 2);
      const gwIntId = typeof gw.id === 'number' && gw.id > 0 ? gw.id : idx + 1;
      return {
        ...gw,
        id: gwIntId,
        gatewayMakeId: typeof gw.gatewayMakeId === 'number' ? gw.gatewayMakeId : 1,
        gatewayModelId: typeof gw.gatewayModelId === 'number' ? gw.gatewayModelId : 1,
        gw_make_name: gw.gw_make_name || '',
        gw_model_name: gw.gw_model_name || '',
        channel_count: rawCount,
        status: gw.status || 'Active',
        last_communicate_time: gw.last_communicate_time || new Date().toISOString()
      };
    });
  });

  const [gatewayMakes, setGatewayMakes] = useState(() => {
    const raw = load('sab_gw_makes', initialGatewayMakes);
    return (Array.isArray(raw) ? raw : [])
      .filter(m => !isDummyGwMake(m))
      .map((m, idx) => ({
        ...m,
        id: typeof m.id === 'number' && m.id > 0 ? m.id : idx + 1,
      }));
  });
  const [gatewayModels, setGatewayModels] = useState(() => {
    const raw = load('sab_gw_models', initialGatewayModels);
    return (Array.isArray(raw) ? raw : [])
      .filter(m => !isDummyGwModel(m))
      .map((mod, idx) => {
        const count = Number(mod.channel_count || 2);
        const names = (mod.channel_names && mod.channel_names.length)
          ? mod.channel_names.slice(0, count)
          : Array.from({ length: count }, (_, i) => `Channel ${i + 1}`);

        return {
          ...mod,
          id: typeof mod.id === 'number' && mod.id > 0 ? mod.id : idx + 1,
          gatewayMakeId: typeof mod.gatewayMakeId === 'number' ? mod.gatewayMakeId : 1,
          channel_count: count,
          channel_names: names
        };
      });
  });

  const [channels, setChannels] = useState(() => {
    const raw = load('sab_channels', initialChannels);
    const cleaned = (Array.isArray(raw) ? raw : []).filter(ch => !isDummyChannel(ch));
    return cleaned.map((ch, idx) => ({
      ...ch,
      id: typeof ch.id === 'number' && ch.id > 0 ? ch.id : idx + 1,
      gatewayId: Number(ch.gatewayId || ch.Gateway_id || 1),
      Gateway_id: Number(ch.gatewayId || ch.Gateway_id || 1),
    }));
  });

  const [meters, setMeters] = useState(() => {
    const raw = load('sab_meters', initialMeters);
    const cleaned = (Array.isArray(raw) ? raw : []).filter(m => !isDummyMeter(m));
    return cleaned.map((m, idx) => ({
      ...m,
      id: typeof m.id === 'number' && m.id > 0 ? m.id : idx + 1,
      channelId: typeof m.channelId === 'number' ? m.channelId : 1,
      deviceProfileId: typeof m.deviceProfileId === 'number' ? m.deviceProfileId : 1,
      meterMakeId: typeof m.meterMakeId === 'number' ? m.meterMakeId : 1,
      meterModelId: typeof m.meterModelId === 'number' ? m.meterModelId : 1,
    }));
  });
  const [assets, setAssets] = useState(() => {
    const raw = load('sab_assets', initialAssets);
    return (Array.isArray(raw) ? raw : []).filter(a => !isDummyAsset(a));
  });
  const [mappings, setMappings] = useState(() => {
    const raw = load('sab_mappings', initialAssetMeterMappings);
    return (Array.isArray(raw) ? raw : []).filter(m => !isDummyMapping(m));
  });
  const [makes, setMakes] = useState(() => {
    const raw = load('sab_makes', initialMakes);
    return (Array.isArray(raw) ? raw : []).map((m, idx) => ({
      ...m,
      id: typeof m.id === 'number' && m.id > 0 ? m.id : idx + 1,
    }));
  });
  const [models, setModels] = useState(() => {
    const raw = load('sab_models', initialModels);
    return (Array.isArray(raw) ? raw : []).map((m, idx) => ({
      ...m,
      id: typeof m.id === 'number' && m.id > 0 ? m.id : idx + 1,
      meterMakeId: typeof m.meterMakeId === 'number' ? m.meterMakeId : 1,
    }));
  });
  const [standardParameters, setStandardParameters] = useState(() => load('sab_standard_parameters', initialStandardParameters));
  const [meterProfiles, setMeterProfiles] = useState(() => {
    const saved = localStorage.getItem('sab_meter_profiles');
    let list = initialMeterProfiles;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch (e) {
        list = initialMeterProfiles;
      }
    }
    return list.map((p, idx) => ({
      ...p,
      id: typeof p.id === 'number' && p.id > 0 ? p.id : idx + 1,
      makeId: typeof p.makeId === 'number' ? p.makeId : (idx === 1 ? 2 : 1),
      modelId: typeof p.modelId === 'number' ? p.modelId : (idx === 1 ? 3 : 1),
      parameters: (p.parameters || []).map((param: any, pIdx: number) => ({
        ...param,
        id: typeof param.id === 'number' ? param.id : pIdx + 1,
        meterProfileId: typeof p.id === 'number' ? p.id : idx + 1,
        parameterMasterId: typeof param.parameterMasterId === 'number' ? param.parameterMasterId : pIdx + 1,
        multiplier: param.multiplier !== undefined ? param.multiplier : (param.scale !== undefined ? param.scale : 1.0)
      }))
    }));
  });
  const [config, setConfig] = useState(() => load('sab_config', initialConfig));

  // ─── Concern, Location & Service No Masters ──────────────────────────────
  const [concerns, setConcerns] = useState<ConcernRecord[]>(() => {
    const raw = load('sab_concerns', INITIAL_CONCERNS);
    return Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_CONCERNS;
  });
  const [locations, setLocations] = useState<LocationRecord[]>(() => {
    const raw = load('sab_locations', INITIAL_LOCATIONS);
    return Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_LOCATIONS;
  });
  const [serviceNos, setServiceNos] = useState<ServiceNoRecord[]>(() => {
    const raw = load('sab_service_nos', INITIAL_SERVICE_NOS);
    return Array.isArray(raw) && raw.length > 0 ? raw : INITIAL_SERVICE_NOS;
  });

  // Persist
  useEffect(() => { localStorage.setItem('sab_concerns', JSON.stringify(concerns)); }, [concerns]);
  useEffect(() => { localStorage.setItem('sab_locations', JSON.stringify(locations)); }, [locations]);
  useEffect(() => { localStorage.setItem('sab_service_nos', JSON.stringify(serviceNos)); }, [serviceNos]);
  useEffect(() => { localStorage.setItem('sab_gateways', JSON.stringify(gateways)); }, [gateways]);
  useEffect(() => { localStorage.setItem('sab_gw_makes', JSON.stringify(gatewayMakes)); }, [gatewayMakes]);
  useEffect(() => { localStorage.setItem('sab_gw_models', JSON.stringify(gatewayModels)); }, [gatewayModels]);
  useEffect(() => { localStorage.setItem('sab_channels', JSON.stringify(channels)); }, [channels]);
  useEffect(() => { localStorage.setItem('sab_meters', JSON.stringify(meters)); }, [meters]);
  useEffect(() => { localStorage.setItem('sab_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('sab_mappings', JSON.stringify(mappings)); }, [mappings]);
  useEffect(() => { localStorage.setItem('sab_makes', JSON.stringify(makes)); }, [makes]);
  useEffect(() => { localStorage.setItem('sab_models', JSON.stringify(models)); }, [models]);
  useEffect(() => { localStorage.setItem('sab_standard_parameters', JSON.stringify(standardParameters)); }, [standardParameters]);
  useEffect(() => { localStorage.setItem('sab_meter_profiles', JSON.stringify(meterProfiles)); }, [meterProfiles]);
  useEffect(() => { localStorage.setItem('sab_config', JSON.stringify(config)); }, [config]);

  // Track database synchronization state
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);

  // Initial synchronization with backend DB entities (gateways, channels, meters, masters)
  const syncWithBackend = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const [
        gwsRes,
        chsRes,
        metersRes,
        gwMakesRes,
        gwModelsRes,
        meterMakesRes,
        meterModelsRes,
        meterProfilesRes,
        paramsRes,
      ] = await Promise.allSettled([
        gatewayApi.getAll(),
        channelApi.getAll(),
        meterApi.getAll(),
        gatewayMakeApi.getAll(),
        gatewayModelApi.getAll(),
        meterMakeApi.getAll(),
        meterModelApi.getAll(),
        meterProfileApi.getAll(),
        parameterMasterApi.getAll(),
      ]);

      if (gwsRes.status === 'fulfilled') {
        const raw = gwsRes.value?.data ?? gwsRes.value;
        if (Array.isArray(raw) && raw.length > 0) {
          setGateways(raw.map((g: any) => ({
            ...g,
            id: Number(g.id || 1),
            Gateway_id: g.Gateway_id || `GW-${g.id}`,
            Gateway_name: g.deviceName || g.Gateway_name || `Gateway #${g.id}`,
            deviceName: g.deviceName || g.Gateway_name || `Gateway #${g.id}`,
            mac_address: g.macAddress || g.mac_address || '',
            macAddress: g.macAddress || g.mac_address || '',
            serial_number: g.serialNo || g.serial_number || '',
            serialNo: g.serialNo || g.serial_number || '',
            ip_address: g.ipAddress || g.ip_address || '',
            ipAddress: g.ipAddress || g.ip_address || '',
            channel_count: Number(g.channelCount || g.channel_count || 2),
            status: g.isActive !== false ? 'Active' : 'Offline',
          })));
        }
      }

      if (chsRes.status === 'fulfilled') {
        const raw = chsRes.value?.data ?? chsRes.value;
        if (Array.isArray(raw) && raw.length > 0) {
          setChannels(raw.map((c: any) => ({
            ...c,
            id: Number(c.id || 1),
            Channel_id: c.Channel_id || `CH-${c.id}`,
            Channel_name: c.channelName || c.Channel_name || `Channel ${c.id}`,
            channelName: c.channelName || c.Channel_name || `Channel ${c.id}`,
            gatewayId: Number(c.gatewayId || 1),
            Gateway_id: Number(c.gatewayId || 1),
            status: c.isActive !== false ? 'Active' : 'Inactive',
          })));
        }
      }

      if (metersRes.status === 'fulfilled') {
        const raw = metersRes.value?.data ?? metersRes.value;
        if (Array.isArray(raw) && raw.length > 0) {
          setMeters(raw.map((m: any) => ({
            ...m,
            id: Number(m.id || 1),
            Meter_id: m.Meter_id || `MTR-${m.id}`,
            Meter_name: m.customName || m.Meter_name || `Meter #${m.id}`,
            customName: m.customName || m.Meter_name || `Meter #${m.id}`,
            channelId: Number(m.channelId || 1),
            Channel_id: Number(m.channelId || 1),
            slave_id: String(m.slaveId ?? m.slave_id ?? 1),
            slaveId: Number(m.slaveId ?? m.slave_id ?? 1),
            meter_serial_number: m.serialNo || m.meter_serial_number || '',
            serialNo: m.serialNo || m.meter_serial_number || '',
            status: m.isActive !== false ? 'Active' : 'Offline',
          })));
        }
      }

      if (gwMakesRes.status === 'fulfilled') {
        const val: any = gwMakesRes.value;
        const raw = val?.data ?? val;
        if (Array.isArray(raw) && raw.length > 0) {
          setGatewayMakes(raw.map((m: any, idx: number) => ({
            ...m,
            id: Number(m.id || idx + 1),
            gw_make_id: m.gw_make_id || `GWMAKE-${m.id || idx + 1}`,
            gw_make_name: m.gatewayMakeName || m.gw_make_name || '',
            gatewayMakeName: m.gatewayMakeName || m.gw_make_name || '',
          })));
        }
      }

      if (gwModelsRes.status === 'fulfilled') {
        const val: any = gwModelsRes.value;
        const raw = val?.data ?? val;
        if (Array.isArray(raw) && raw.length > 0) {
          setGatewayModels(raw.map((mod: any, idx: number) => {
            const count = Number(mod.channel_count || mod.channelCount || 2);
            return {
              ...mod,
              id: Number(mod.id || idx + 1),
              gw_model_id: mod.gw_model_id || `GWMOD-${mod.id || idx + 1}`,
              gw_model_name: mod.gatewayModelName || mod.gw_model_name || '',
              gatewayModelName: mod.gatewayModelName || mod.gw_model_name || '',
              channel_count: count,
              channelCount: count,
            };
          }));
        }
      }

      if (meterMakesRes.status === 'fulfilled') {
        const val: any = meterMakesRes.value;
        const raw = val?.data ?? val;
        if (Array.isArray(raw) && raw.length > 0) {
          setMakes(raw.map((m: any, idx: number) => ({
            ...m,
            id: Number(m.id || idx + 1),
            make_id: Number(m.id || idx + 1),
            make_name: m.meterMakeName || m.make_name || '',
            meterMakeName: m.meterMakeName || m.make_name || '',
          })));
        }
      }

      if (meterModelsRes.status === 'fulfilled') {
        const val: any = meterModelsRes.value;
        const raw = val?.data ?? val;
        if (Array.isArray(raw) && raw.length > 0) {
          setModels(raw.map((m: any, idx: number) => ({
            ...m,
            id: Number(m.id || idx + 1),
            model_id: Number(m.id || idx + 1),
            model_name: m.meterModelName || m.model_name || '',
            meterModelName: m.meterModelName || m.model_name || '',
          })));
        }
      }

      if (meterProfilesRes.status === 'fulfilled') {
        const val: any = meterProfilesRes.value;
        const raw = val?.data ?? val;
        if (Array.isArray(raw) && raw.length > 0) {
          setMeterProfiles(raw.map((p: any, idx: number) => ({
            ...p,
            id: Number(p.id || idx + 1),
            profile_name: p.profileName || p.profile_name || '',
            profileName: p.profileName || p.profile_name || '',
          })));
        }
      }

      if (paramsRes.status === 'fulfilled') {
        const val: any = paramsRes.value;
        const raw = val?.data ?? val;
        if (Array.isArray(raw) && raw.length > 0) {
          setStandardParameters(raw.map((p: any, idx: number) => ({
            ...p,
            id: Number(p.id || idx + 1),
            parameter_name: p.parameterName || p.parameter_name || '',
            parameterName: p.parameterName || p.parameter_name || '',
          })));
        }
      }
    } catch (_) {
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  const getNow = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

  // ─── GATEWAY MAKE OPERATIONS ───────────────────────────────────────────────
  const addGatewayMake = (make) => {
    const newMake = {
      ...make,
      gw_make_id: make.gw_make_id || `GWMAKE-${(make.gw_make_name || 'NEW').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)}-${Date.now().toString().slice(-4)}`,
      created_at: getNow()
    };
    setGatewayMakes(prev => [...prev, newMake]);
    return newMake;
  };
  const updateGatewayMake = (id, fields) => {
    setGatewayMakes(prev => prev.map(m => m.gw_make_id === id ? { ...m, ...fields } : m));
  };
  const deleteGatewayMake = (id) => {
    setGatewayMakes(prev => prev.filter(m => m.gw_make_id !== id));
  };

  // ─── GATEWAY MODEL OPERATIONS ──────────────────────────────────────────────
  const addGatewayModel = (model) => {
    const newModel = {
      ...model,
      gw_model_id: model.gw_model_id || `GWMOD-${(model.gw_model_name || 'NEW').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Date.now().toString().slice(-4)}`,
      created_at: getNow()
    };
    setGatewayModels(prev => [...prev, newModel]);
    return newModel;
  };
  const updateGatewayModel = (id, fields) => {
    setGatewayModels(prev => prev.map(m => m.gw_model_id === id ? { ...m, ...fields } : m));
  };
  const deleteGatewayModel = (id) => {
    setGatewayModels(prev => prev.filter(m => m.gw_model_id !== id));
  };

  // ─── GATEWAY (DEVICE) OPERATIONS ──────────────────────────────────────────
  const addGateway = (gw) => {
    const newGw = {
      ...gw,
      Gateway_id: gw.Gateway_id || `GW-${Math.floor(100 + Math.random() * 900)}`,
      created_at: getNow(),
      updated_at: getNow(),
      last_communicate_time: null
    };
    setGateways(prev => [newGw, ...prev]);
  };
  const updateGateway = (id, fields) => {
    setGateways(prev => prev.map(g => g.Gateway_id === id ? { ...g, ...fields, updated_at: getNow() } : g));
  };
  const deleteGateway = (id) => {
    setGateways(prev => prev.filter(g => g.Gateway_id !== id && g.id !== id && String(g.id) !== String(id) && String(g.Gateway_id) !== String(id)));
  };

  // ─── CHANNEL OPERATIONS ───────────────────────────────────────────────────
  const addChannel = (ch) => {
    const newCh = {
      ...ch,
      Channel_id: ch.Channel_id || `CH-${Math.floor(10 + Math.random() * 90)}`,
      created_at: getNow(),
      updated_at: getNow()
    };
    setChannels(prev => [...prev, newCh]);
  };
  const updateChannel = (id, fields) => {
    setChannels(prev => prev.map(c => c.Channel_id === id || c.id === id ? { ...c, ...fields, updated_at: getNow() } : c));
  };
  const deleteChannel = (id) => {
    setChannels(prev => prev.filter(c => c.Channel_id !== id && c.id !== id && String(c.id) !== String(id) && String(c.Channel_id) !== String(id)));
  };

  // ─── METER OPERATIONS ─────────────────────────────────────────────────────
  const addMeter = (meter) => {
    const nextIntId = meters.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0) + 1;
    const finalId = typeof meter.id === 'number' && meter.id > 0 ? meter.id : nextIntId;
    const channelId = typeof meter.channelId === 'number' ? meter.channelId : (Number(meter.Channel_id) || 1);
    const slaveId = Number(meter.slaveId || meter.slave_id || 1);
    const meterName = meter.customName || meter.Meter_name || meter.name || `Meter #${slaveId}`;

    const newMtr = {
      ...meter,
      id: finalId,
      Meter_id: finalId,
      channelId: channelId,
      Channel_id: channelId,
      slaveId: slaveId,
      slave_id: slaveId,
      tag: meter.tag || meter.meter_serial_number || `MTR-${String(slaveId).padStart(3, '0')}`,
      meter_serial_number: meter.meter_serial_number || meter.serialNo || '',
      customName: meterName,
      name: meterName,
      concern: meter.concern || '',
      placementLocation: meter.placementLocation || meter.location || '',
      serviceNo: meter.serviceNo || '',
      status: meter.status || 'Active',
      isActive: true,
      created_at: getNow(),
      updated_at: getNow()
    };
    setMeters(prev => [newMtr, ...prev]);
  };
  const updateMeter = (id, fields) => {
    setMeters(prev => prev.map(m => {
      const match = m.Meter_id === id || m.id === id || String(m.id) === String(id) || String(m.Meter_id) === String(id);
      if (!match) return m;
      const sId = fields.slaveId !== undefined ? Number(fields.slaveId) : (fields.slave_id !== undefined ? Number(fields.slave_id) : m.slaveId);
      const chId = fields.channelId !== undefined ? Number(fields.channelId) : (fields.Channel_id !== undefined ? Number(fields.Channel_id) : m.channelId);
      const name = fields.Meter_name || fields.customName || fields.name || m.customName;
      return {
        ...m,
        ...fields,
        channelId: chId,
        Channel_id: chId,
        slaveId: sId,
        slave_id: sId,
        customName: name,
        name: name,
        updated_at: getNow()
      };
    }));
  };
  const deleteMeter = (id) => {
    setMeters(prev => prev.filter(m => m.Meter_id !== id && m.id !== id && String(m.id) !== String(id) && String(m.Meter_id) !== String(id)));
  };

  // ─── ASSET OPERATIONS ─────────────────────────────────────────────────────
  const addAsset = (asset) => {
    const newAst = {
      ...asset,
      Asset_id: asset.Asset_id || `AST-${Math.floor(500 + Math.random() * 400)}`,
      created_at: getNow(),
      updated_at: getNow()
    };
    setAssets(prev => [newAst, ...prev]);
  };
  const updateAsset = (id, fields) => {
    setAssets(prev => prev.map(a => a.Asset_id === id ? { ...a, ...fields, updated_at: getNow() } : a));
  };
  const deleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.Asset_id !== id));
  };

  // ─── MAPPING OPERATIONS ───────────────────────────────────────────────────
  const addMapping = (mapping) => {
    const newMap = {
      ...mapping,
      Mapping_id: mapping.Mapping_id || `MAP-${Math.floor(100 + Math.random() * 900)}`,
      multiplication_factor: mapping.multiplication_factor || '1',
      is_active: mapping.is_active !== undefined ? mapping.is_active : true,
      created_at: getNow(),
      updated_at: getNow()
    };
    setMappings(prev => [newMap, ...prev]);
  };
  const updateMapping = (id, fields) => {
    setMappings(prev => prev.map(m => m.Mapping_id === id ? { ...m, ...fields, updated_at: getNow() } : m));
  };
  const deleteMapping = (id) => {
    setMappings(prev => prev.filter(m => m.Mapping_id !== id));
  };
  const toggleMappingActive = (id) => {
    setMappings(prev => prev.map(m => m.Mapping_id === id ? { ...m, is_active: !m.is_active, updated_at: getNow() } : m));
  };
  const configureMeterAsAsset = ({ meterId, assetData, multiplicationFactor, effectiveFrom, effectiveTo }) => {
    let assetId = assetData.Asset_id;
    if (!assetId) {
      assetId = `AST-${Math.floor(500 + Math.random() * 400)}`;
      setAssets(prev => [{ ...assetData, Asset_id: assetId, created_at: getNow(), updated_at: getNow() }, ...prev]);
    } else {
      setAssets(prev => prev.map(a => a.Asset_id === assetId ? { ...a, ...assetData, updated_at: getNow() } : a));
    }
    const existingMapping = mappings.find(m => m.Meter_id === meterId);
    if (existingMapping) {
      setMappings(prev => prev.map(m => m.Mapping_id === existingMapping.Mapping_id ? {
        ...m, Asset_id: assetId, multiplication_factor: multiplicationFactor || m.multiplication_factor || '1',
        effective_from: effectiveFrom || m.effective_from, effective_to: effectiveTo || m.effective_to,
        is_active: true, updated_at: getNow()
      } : m));
    } else {
      addMapping({ Asset_id: assetId, Meter_id: meterId, multiplication_factor: multiplicationFactor || '1',
        effective_from: effectiveFrom || new Date().toISOString().substring(0, 10),
        effective_to: effectiveTo || '2027-12-31', is_active: true });
    }
  };

  // ─── METER MAKE OPERATIONS ────────────────────────────────────────────────
  const addMake = (make) => {
    const newMake = {
      ...make,
      make_id: make.make_id || `MAKE-${(make.make_name || 'NEW').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      created_at: getNow()
    };
    setMakes(prev => [...prev, newMake]);
    return newMake;
  };
  const updateMake = (makeId, fields) => {
    setMakes(prev => prev.map(m => m.make_id === makeId ? { ...m, ...fields } : m));
    if (fields.make_name) {
      setMeterProfiles(prev => prev.map(p => p.make_id === makeId ? { ...p, make: fields.make_name } : p));
    }
  };
  const deleteMake = (makeId) => {
    setMakes(prev => prev.filter(m => m.make_id !== makeId));
  };

  // ─── METER MODEL OPERATIONS ───────────────────────────────────────────────
  const addModel = (model) => {
    const newModel = {
      ...model,
      model_id: model.model_id || `MOD-${(model.model_name || 'NEW').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`,
      created_at: getNow()
    };
    setModels(prev => [...prev, newModel]);
    return newModel;
  };
  const updateModel = (modelId, fields) => {
    setModels(prev => prev.map(m => m.model_id === modelId ? { ...m, ...fields } : m));
    if (fields.model_name) {
      setMeterProfiles(prev => prev.map(p => p.model_id === modelId ? { ...p, model: fields.model_name } : p));
    }
  };
  const deleteModel = (modelId) => {
    setModels(prev => prev.filter(m => m.model_id !== modelId));
  };

  // ─── STANDARD PARAMETER OPERATIONS ───────────────────────────────────────
  const addStandardParameter = (param) => {
    setStandardParameters(prev => [...prev.filter(p => p.key !== param.key), param]);
  };
  const updateStandardParameter = (key, fields) => {
    setStandardParameters(prev => prev.map(p => p.key === key ? { ...p, ...fields } : p));
  };
  const deleteStandardParameter = (key) => {
    setStandardParameters(prev => prev.filter(p => p.key !== key));
  };

  // ─── METER PROFILE OPERATIONS ─────────────────────────────────────────────
  const addMeterProfile = (profile) => {
    const newProf = {
      ...profile,
      profile_id: profile.profile_id || `PROF-${(profile.make || 'GEN').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      parameters: profile.parameters || []
    };
    setMeterProfiles(prev => [newProf, ...prev]);
    return newProf;
  };
  const updateMeterProfile = (id, fields) => {
    setMeterProfiles(prev => prev.map(p => p.profile_id === id ? { ...p, ...fields } : p));
  };
  const deleteMeterProfile = (id) => {
    setMeterProfiles(prev => prev.filter(p => p.profile_id !== id));
  };
  const addParameterToProfile = (profileId, param) => {
    setMeterProfiles(prev => prev.map(p => p.profile_id === profileId ? { ...p, parameters: [...(p.parameters || []), param] } : p));
  };
  const updateParameterInProfile = (profileId, paramKey, fields) => {
    setMeterProfiles(prev => prev.map(p => p.profile_id === profileId ? {
      ...p, parameters: (p.parameters || []).map(item => item.key === paramKey ? { ...item, ...fields } : item)
    } : p));
  };
  const bulkAddParametersToProfile = (profileId, paramsArray) => {
    setMeterProfiles(prev => prev.map(p => {
      if (p.profile_id === profileId) {
        const existingKeys = new Set((p.parameters || []).map(x => x.key));
        const newToAdd = paramsArray.filter(x => !existingKeys.has(x.key));
        return { ...p, parameters: [...(p.parameters || []), ...newToAdd] };
      }
      return p;
    }));
  };
  const deleteParameterFromProfile = (profileId, paramKey) => {
    setMeterProfiles(prev => prev.map(p => p.profile_id === profileId ? {
      ...p, parameters: (p.parameters || []).filter(item => item.key !== paramKey)
    } : p));
  };

  // ─── CONCERN OPERATIONS ──────────────────────────────────────────────────
  const addConcern = (concern: any) => {
    const newConcern: ConcernRecord = {
      ...concern,
      id: concern.id || `CON-${Date.now().toString().slice(-4)}`,
      status: concern.status || 'Active',
      created_at: getNow(),
    };
    setConcerns(prev => [newConcern, ...prev]);
    return newConcern;
  };
  const updateConcern = (id: string, fields: Partial<ConcernRecord>) => {
    setConcerns(prev => prev.map(c => c.id === id ? { ...c, ...fields, updated_at: getNow() } : c));
  };
  const deleteConcern = (id: string) => {
    const target = concerns.find(c => c.id === id);
    const targetName = target ? target.concern_name : '';
    setConcerns(prev => prev.filter(c => c.id !== id));
    if (targetName) {
      setLocations(prev => prev.filter(l => l.concern_name !== targetName));
      setServiceNos(prev => prev.filter(s => s.concern_name !== targetName));
      setMeters(prev => prev.map(m => (m.concern === targetName ? { ...m, concern: '' } : m)));
    }
  };

  // ─── LOCATION OPERATIONS ─────────────────────────────────────────────────
  const addLocation = (loc: any) => {
    const newLoc: LocationRecord = {
      ...loc,
      id: loc.id || `LOC-${Date.now().toString().slice(-4)}`,
      status: loc.status || 'Active',
      created_at: getNow(),
    };
    setLocations(prev => [newLoc, ...prev]);
    return newLoc;
  };
  const updateLocation = (id: string, fields: Partial<LocationRecord>) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...fields, updated_at: getNow() } : l));
  };
  const deleteLocation = (id: string) => {
    const target = locations.find(l => l.id === id);
    const targetName = target ? target.location_name : '';
    setLocations(prev => prev.filter(l => l.id !== id));
    if (targetName) {
      setServiceNos(prev => prev.filter(s => s.location_name !== targetName));
      setMeters(prev => prev.map(m => (m.placementLocation === targetName ? { ...m, placementLocation: '' } : m)));
    }
  };

  // ─── SERVICE NO OPERATIONS ───────────────────────────────────────────────
  const addServiceNo = (svc: any) => {
    const newSvc: ServiceNoRecord = {
      ...svc,
      id: svc.id || `SVC-${Date.now().toString().slice(-4)}`,
      status: svc.status || 'Active',
      created_at: getNow(),
    };
    setServiceNos(prev => [newSvc, ...prev]);
    return newSvc;
  };
  const updateServiceNo = (id: string, fields: Partial<ServiceNoRecord>) => {
    setServiceNos(prev => prev.map(s => s.id === id ? { ...s, ...fields, updated_at: getNow() } : s));
  };
  const deleteServiceNo = (id: string) => {
    const target = serviceNos.find(s => s.id === id);
    const targetNo = target ? target.service_no : '';
    setServiceNos(prev => prev.filter(s => s.id !== id));
    if (targetNo) {
      setMeters(prev => prev.map(m => (m.serviceNo === targetNo ? { ...m, serviceNo: '' } : m)));
    }
  };

  // ─── CONFIG OPERATIONS ────────────────────────────────────────────────────
  const updateConfig = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };
  const resetToFactoryDefaults = () => {
    setGateways(initialGateways);
    setGatewayMakes(initialGatewayMakes);
    setGatewayModels(initialGatewayModels);
    setChannels(initialChannels);
    setMeters(initialMeters);
    setAssets(initialAssets);
    setMappings(initialAssetMeterMappings);
    setMakes(initialMakes);
    setModels(initialModels);
    setStandardParameters(initialStandardParameters);
    setMeterProfiles(initialMeterProfiles);
    setConfig(initialConfig);
    setConcerns(INITIAL_CONCERNS);
    setLocations(INITIAL_LOCATIONS);
    setServiceNos(INITIAL_SERVICE_NOS);
  };

  return (
    <EnergyDataContext.Provider value={{
      gateways, gatewayMakes, gatewayModels,
      channels, meters, assets, mappings,
      makes, models, standardParameters, meterProfiles, config,
      concerns, locations, serviceNos,
      isDbLoading, refreshDbData: syncWithBackend,
      addGatewayMake, updateGatewayMake, deleteGatewayMake,
      addGatewayModel, updateGatewayModel, deleteGatewayModel,
      addGateway, updateGateway, deleteGateway,
      addChannel, updateChannel, deleteChannel,
      addMeter, updateMeter, deleteMeter,
      addAsset, updateAsset, deleteAsset,
      addMapping, updateMapping, deleteMapping, toggleMappingActive, configureMeterAsAsset,
      addMake, updateMake, deleteMake,
      addModel, updateModel, deleteModel,
      addStandardParameter, updateStandardParameter, deleteStandardParameter,
      addMeterProfile, updateMeterProfile, deleteMeterProfile,
      addParameterToProfile, updateParameterInProfile, bulkAddParametersToProfile, deleteParameterFromProfile,
      addConcern, updateConcern, deleteConcern,
      addLocation, updateLocation, deleteLocation,
      addServiceNo, updateServiceNo, deleteServiceNo,
      updateConfig, resetToFactoryDefaults
    }}>
      {children}
    </EnergyDataContext.Provider>
  );
};

export const useEnergyData = () => {
  const ctx = useContext(EnergyDataContext);
  if (!ctx) throw new Error('useEnergyData must be used within an EnergyDataProvider');
  return ctx;
};
