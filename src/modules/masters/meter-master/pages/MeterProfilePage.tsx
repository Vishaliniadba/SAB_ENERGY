import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Check,
  Save,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Building2,
  Activity,
  Play,
  RefreshCw,
  Terminal,
  FileJson,
  Copy,
  Download,
  Code2,
  Upload,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useEnergyData } from '../../../../context/EnergyDataContext';
import { Modal } from '../../../../components/common/Modal';
import { SearchInput } from '../../../../components/common/SearchInput';
import { DataTable } from '../../../../components/common/DataTable';
import { InputField, SelectField, Select2 } from '../../../../components/common/FormField';
import { meterProfileApi } from '../api/meterProfileApi';
import { meterMakeApi } from '../api/meterMakeApi';
import { meterModelApi } from '../api/meterModelApi';
import { parameterMasterApi } from '../api/parameterMasterApi';
import { toIntegerId, resolveIntegerId, ensureValidIntegerId } from '../../../../services/idHelper';
import { enerlinkApi, DEFAULT_DEVICE_ID } from '../../../../services/enerlinkApi';
import { gatewayApi } from '../../../gateways-devices/api/gatewayApi';
import { channelApi } from '../../../gateways-devices/api/channelApi';
import '../styles/meterMaster.css';

// ─── Data Type & Byte Order Mappings ──────────────────────────────────────────

const mapDataTypeToInt = (type: string | number): number => {
  if (typeof type === 'number') return type;
  const t = String(type).toLowerCase().trim();
  if (t === 'uint16' || t === 'int16') return 1;
  if (t === 'float32') return 2;
  if (t === 'int32' || t === 'uint32') return 3;
  if (t === 'float64' || t === 'int64' || t === 'uint64') return 4;
  if (t === 'string') return 5;
  return 2;
};

const mapIntToDataType = (code: number | string): string => {
  const num = Number(code);
  if (num === 1) return 'uint16';
  if (num === 2) return 'float32';
  if (num === 3) return 'int32';
  if (num === 4) return 'float64';
  if (num === 5) return 'string';
  return typeof code === 'string' && code ? code : 'float32';
};

const mapByteOrderToInt = (bo: string | number): number => {
  if (typeof bo === 'number') return bo;
  const s = String(bo).toUpperCase().trim();
  if (s === 'ABCD') return 1;
  if (s === 'CDAB') return 2;
  if (s === 'BADC') return 3;
  if (s === 'DCBA') return 4;
  return 2;
};

const mapIntToByteOrder = (code: number | string): string => {
  const num = Number(code);
  if (num === 1) return 'ABCD';
  if (num === 2) return 'CDAB';
  if (num === 3) return 'BADC';
  if (num === 4) return 'DCBA';
  return typeof code === 'string' && code ? code : 'CDAB';
};

// ─── Standard Default Registers for LG5310 Modbus Catalog ────────────────────
export const STANDARD_LG5310_REGISTERS = [
  { parameterMasterId: 1, key: 'power_active_total', display_name: 'Total Active Power', address: 40101, datatype: 'float32', multiplier: 1, unit: 'W' },
  { parameterMasterId: 2, key: 'phase1_active_power', display_name: 'Phase 1 Active Power (R)', address: 40103, datatype: 'float32', multiplier: 1, unit: 'W' },
  { parameterMasterId: 3, key: 'phase2_active_power', display_name: 'Phase 2 Active Power (Y)', address: 40105, datatype: 'float32', multiplier: 1, unit: 'W' },
  { parameterMasterId: 4, key: 'phase3_active_power', display_name: 'Phase 3 Active Power (B)', address: 40107, datatype: 'float32', multiplier: 1, unit: 'W' },
  { parameterMasterId: 5, key: 'line_to_line_voltage', display_name: 'Line-to-Line Voltage (VLL)', address: 40121, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 6, key: 'l1_to_l2_voltage', display_name: 'Voltage L1 to L2 (VRY)', address: 40123, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 7, key: 'l2_to_l3_voltage', display_name: 'Voltage L2 to L3 (VYB)', address: 40125, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 8, key: 'l3_to_l1_voltage', display_name: 'Voltage L3 to L1 (VBR)', address: 40127, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 9, key: 'line_to_neutral_voltage', display_name: 'Line-to-Neutral Voltage (VLN)', address: 40129, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 10, key: 'l1_to_neutral_voltage', display_name: 'Voltage L1 to Neutral (VRN)', address: 40131, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 11, key: 'l2_to_neutral_voltage', display_name: 'Voltage L2 to Neutral (VYN)', address: 40133, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 12, key: 'l3_to_neutral_voltage', display_name: 'Voltage L3 to Neutral (VBN)', address: 40135, datatype: 'float32', multiplier: 1, unit: 'V' },
  { parameterMasterId: 13, key: 'average_current', display_name: 'Average Current (Iavg)', address: 40137, datatype: 'float32', multiplier: 1, unit: 'A' },
  { parameterMasterId: 14, key: 'l1_current', display_name: 'Current Phase 1 (IR)', address: 40139, datatype: 'float32', multiplier: 1, unit: 'A' },
  { parameterMasterId: 15, key: 'l2_current', display_name: 'Current Phase 2 (IY)', address: 40141, datatype: 'float32', multiplier: 1, unit: 'A' },
  { parameterMasterId: 16, key: 'l3_current', display_name: 'Current Phase 3 (IB)', address: 40143, datatype: 'float32', multiplier: 1, unit: 'A' },
  { parameterMasterId: 17, key: 'total_apparent_power', display_name: 'Total Apparent Power', address: 40113, datatype: 'float32', multiplier: 1, unit: 'VA' },
  { parameterMasterId: 18, key: 'phase1_apparent_power', display_name: 'Phase 1 Apparent Power', address: 40115, datatype: 'float32', multiplier: 1, unit: 'VA' },
  { parameterMasterId: 19, key: 'phase2_apparent_power', display_name: 'Phase 2 Apparent Power', address: 40117, datatype: 'float32', multiplier: 1, unit: 'VA' },
  { parameterMasterId: 20, key: 'phase3_apparent_power', display_name: 'Phase 3 Apparent Power', address: 40119, datatype: 'float32', multiplier: 1, unit: 'VA' },
  { parameterMasterId: 21, key: 'power_factor', display_name: 'Total Power Factor (PF)', address: 40145, datatype: 'float32', multiplier: 1, unit: '' },
  { parameterMasterId: 22, key: 'phase1_power_factor', display_name: 'Phase 1 Power Factor', address: 40147, datatype: 'float32', multiplier: 1, unit: '' },
  { parameterMasterId: 23, key: 'phase2_power_factor', display_name: 'Phase 2 Power Factor', address: 40149, datatype: 'float32', multiplier: 1, unit: '' },
  { parameterMasterId: 24, key: 'phase3_power_factor', display_name: 'Phase 3 Power Factor', address: 40151, datatype: 'float32', multiplier: 1, unit: '' },
  { parameterMasterId: 25, key: 'frequency', display_name: 'System Frequency', address: 40153, datatype: 'float32', multiplier: 1, unit: 'Hz' },
  { parameterMasterId: 26, key: 'active_energy', display_name: 'Cumulative Active Energy', address: 40155, datatype: 'float32', multiplier: 1, unit: 'kWh' },
];

// ─── Normalisation ────────────────────────────────────────────────────────────

const normaliseArray = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

// Normalises profile object whether backend returns PascalCase, camelCase or snake_case
const normaliseProfile = (
  p: any,
  fallbackId: string | number = 1,
  makesList: any[] = [],
  modelsList: any[] = [],
  paramsList: any[] = [],
  paramMastersList: any[] = []
) => {
  if (!p) return null;
  const dbId = toIntegerId(p.id ?? p.ProfileId) ?? resolveIntegerId(p.profile_id ?? p.Profile_id ?? fallbackId, 1)!;
  const displayProfileId = p.profile_id && typeof p.profile_id === 'string' && isNaN(Number(p.profile_id))
    ? p.profile_id
    : `PROF-${dbId}`;

  // Resolve make
  const resolvedMakeId = toIntegerId(p.makeId ?? p.make_id ?? p.MakeId) ?? resolveIntegerId(p.make_id, 1);
  let makeName = p.makeName ?? p.MakeName ?? p.make ?? p.make_name ?? '';
  if (!makeName && resolvedMakeId && makesList.length > 0) {
    const found = makesList.find((m) => resolveIntegerId(m.id ?? m.make_id, 0) === resolvedMakeId);
    if (found) makeName = found.meterMakeName ?? found.make_name ?? '';
  }

  // Resolve model
  const resolvedModelId = toIntegerId(p.modelId ?? p.model_id ?? p.ModelId) ?? resolveIntegerId(p.model_id, 1);
  let modelName = p.modelName ?? p.ModelName ?? p.model ?? p.model_name ?? '';
  if (!modelName && resolvedModelId && modelsList.length > 0) {
    const found = modelsList.find((m) => resolveIntegerId(m.id ?? m.model_id, 0) === resolvedModelId);
    if (found) modelName = found.meterModelName ?? found.model_name ?? '';
  }

  // Address Offset
  const addressOffset =
    p.addressOffest !== undefined
      ? Number(p.addressOffest)
      : p.address_offset !== undefined
      ? Number(p.address_offset)
      : p.AddressOffset !== undefined
      ? Number(p.AddressOffset)
      : -40001;

  // Function Code
  const functionCode =
    p.holdingRegister !== undefined
      ? Number(p.holdingRegister)
      : p.function_code !== undefined
      ? Number(p.function_code)
      : p.FunctionCode !== undefined
      ? Number(p.FunctionCode)
      : 3;

  // Byte Order
  const byteOrder = mapIntToByteOrder(p.byteOrder ?? p.byte_order ?? p.ByteOrder ?? 2);

  // Link parameter registers
  let rawParams = p.parameters || p.Parameters || p.parameter_list || [];
  if ((!rawParams || rawParams.length === 0) && paramsList.length > 0 && dbId) {
    rawParams = paramsList.filter((param) => {
      const pId = resolveIntegerId(param.meterProfileId ?? param.meter_profile_id ?? param.MeterProfileId, null);
      return (
        pId === dbId ||
        (param.profileVersion && String(param.profileVersion) === String(p.profileVersion || p.profile_version))
      );
    });
  }

  // If no registers configured yet, provide standard LG5310 Modbus registers catalog
  if (!rawParams || rawParams.length === 0) {
    rawParams = STANDARD_LG5310_REGISTERS;
  }

  // Address lookup map from standard catalog to recover true keys if backend data has missing/duplicate keys
  const addressToStandardMap = new Map<number, any>();
  for (const reg of STANDARD_LG5310_REGISTERS) {
    if (reg.address) {
      addressToStandardMap.set(Number(reg.address), reg);
    }
  }

  // ParameterMaster lookup map
  const masterIdMap = new Map<number, any>();
  for (const pm of paramMastersList) {
    const pmId = toIntegerId(pm.id ?? pm.parameterMasterId);
    if (pmId) {
      masterIdMap.set(pmId, pm);
    }
  }

  const seenKeysInProfile = new Set<string>();

  const parameters = (Array.isArray(rawParams) ? rawParams : []).map((param, pIdx) => {
    const rawAddr = param.address !== undefined ? Number(param.address) : (param.Address !== undefined ? Number(param.Address) : undefined);
    const pMasterId = toIntegerId(param.parameterMasterId ?? param.parameter_master_id);

    let resolvedKey = String(param.key || param.Key || param.param_key || '').trim();
    let resolvedDisplayName = String(param.displayName || param.display_name || param.name || param.Name || '').trim();
    let resolvedUnit = String(param.unit || param.Unit || '').trim();
    let resolvedDataType = param.dataType ?? param.datatype ?? param.DataType ?? 'float32';
    let resolvedMultiplier = param.multiplier !== undefined ? Number(param.multiplier) : (param.Multiplier !== undefined ? Number(param.Multiplier) : 1);

    // If key is missing or already seen in this profile (e.g. duplicate parameterMasterId=1 from backend),
    // restore it from standard Modbus register address
    if ((!resolvedKey || seenKeysInProfile.has(resolvedKey.toLowerCase())) && rawAddr && addressToStandardMap.has(rawAddr)) {
      const std = addressToStandardMap.get(rawAddr);
      resolvedKey = std.key;
      resolvedDisplayName = std.display_name || resolvedDisplayName;
      resolvedUnit = std.unit || resolvedUnit;
      resolvedDataType = std.datatype || resolvedDataType;
    }

    // Lookup by parameterMasterId if still missing
    if ((!resolvedKey || seenKeysInProfile.has(resolvedKey.toLowerCase())) && pMasterId && masterIdMap.has(pMasterId)) {
      const pm = masterIdMap.get(pMasterId);
      if (!seenKeysInProfile.has(String(pm.key || '').toLowerCase())) {
        resolvedKey = String(pm.key || '').trim();
        resolvedDisplayName = String(pm.displayName || pm.display_name || pm.name || resolvedKey).trim();
        resolvedUnit = String(pm.unit || '').trim();
      }
    }

    // If still missing or duplicate, make key uniquely identifiable by register address
    if (!resolvedKey || seenKeysInProfile.has(resolvedKey.toLowerCase())) {
      if (rawAddr && !seenKeysInProfile.has(`reg_${rawAddr}`)) {
        resolvedKey = `reg_${rawAddr}`;
        resolvedDisplayName = resolvedDisplayName || `Register ${rawAddr}`;
      } else {
        resolvedKey = `param_${pIdx + 1}`;
        resolvedDisplayName = resolvedDisplayName || `Parameter ${pIdx + 1}`;
      }
    }

    seenKeysInProfile.add(resolvedKey.toLowerCase());

    return {
      id: toIntegerId(param.id ?? param.parameter_id),
      meterProfileId: dbId,
      parameterMasterId: pMasterId ?? (pIdx + 1),
      key: resolvedKey,
      display_name: resolvedDisplayName || resolvedKey,
      address: rawAddr !== undefined ? rawAddr : (40101 + pIdx * 2),
      datatype: mapIntToDataType(resolvedDataType),
      multiplier: resolvedMultiplier,
      unit: resolvedUnit || 'W',
    };
  });

  return {
    id: dbId,
    profile_id: displayProfileId,
    profile_version: p.profileVersion || p.ProfileVersion || p.profile_version || p.version || '1.0.0',
    make_id: String(resolvedMakeId),
    make: makeName || (resolvedMakeId ? `Make #${resolvedMakeId}` : 'Elmasure'),
    model_id: String(resolvedModelId),
    model: modelName || (resolvedModelId ? `Model #${resolvedModelId}` : 'LG5310'),
    address_offset: addressOffset,
    function_code: functionCode,
    byte_order: byteOrder,
    description: p.description || p.Description || '',
    parameters,
  };
};

const apiProfiles = {
  getAll: async () => {
    const [profilesRes, paramsRes, makesRes, modelsRes, pmRes] = await Promise.allSettled([
      meterProfileApi.getAll(),
      meterProfileApi.getAllParameters(),
      meterMakeApi.getAll(),
      meterModelApi.getAll(),
      parameterMasterApi.getAll(),
    ]);

    const rawProfiles = profilesRes.status === 'fulfilled' ? normaliseArray(profilesRes.value) : [];
    const allParams = paramsRes.status === 'fulfilled' ? normaliseArray(paramsRes.value) : [];
    const liveMakes = makesRes.status === 'fulfilled' ? normaliseArray(makesRes.value) : [];
    const liveModels = modelsRes.status === 'fulfilled' ? normaliseArray(modelsRes.value) : [];
    const pMasters = pmRes.status === 'fulfilled' ? normaliseArray(pmRes.value) : [];

    return rawProfiles.map((item, idx) =>
      normaliseProfile(item, `PROF-${idx + 1}`, liveMakes, liveModels, allParams, pMasters)
    );
  },

  getById: async (id: number | string, liveMakes: any[] = [], liveModels: any[] = [], liveParamMasters: any[] = []) => {
    const [profileRes, paramsRes, pmRes] = await Promise.allSettled([
      meterProfileApi.getById(id),
      meterProfileApi.getAllParameters(),
      parameterMasterApi.getAll(),
    ]);

    const rawProfile = profileRes.status === 'fulfilled' ? (profileRes.value?.data || profileRes.value) : null;
    const allParams = paramsRes.status === 'fulfilled' ? normaliseArray(paramsRes.value) : [];
    const pMasters = pmRes.status === 'fulfilled' ? normaliseArray(pmRes.value) : liveParamMasters;

    return normaliseProfile(rawProfile, String(id), liveMakes, liveModels, allParams, pMasters);
  },

  create: async (payload: any) => meterProfileApi.create(payload),
  update: async (payload: any) => meterProfileApi.update(payload),
  delete: async (id: number | string) => meterProfileApi.delete(id),
};

export const MeterProfilePage = () => {
  // Master data for test panel, parameters catalog & dropdowns
  const {
    deleteMeterProfile,
    standardParameters = [],
    gateways = [],
    channels = [],
    meters = [],
    makes = [],
    models = [],
    meterProfiles: fallbackProfiles = [],
  } = useEnergyData();

  // ─── API State ─────────────────────────────────────────────────────────────
  const [meterProfiles, setMeterProfiles] = useState<any[]>([]);
  const [liveMakes, setLiveMakes] = useState<any[]>([]);
  const [liveModels, setLiveModels] = useState<any[]>([]);
  const [paramMasters, setParamMasters] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Mode: 'list' (Table view shown first) OR 'create' (Create/Edit page)
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // Search filter for list view
  const [searchTerm, setSearchTerm] = useState('');

  // Active editing profile ID ('NEW' for create, or existing numeric database id)
  const [currentProfileId, setCurrentProfileId] = useState<number | string>('NEW');

  // General profile form fields
  const [profileForm, setProfileForm] = useState({
    profile_version: '1.0.0',
    make_id: '1',
    make: 'Elmasure',
    model_id: '1',
    model: 'LG5310',
    address_offset: -40001,
    function_code: 3,
    byte_order: 'CDAB',
    description: '',
  });

  // Parameter Registers table rows
  const [parameterRows, setParameterRows] = useState<any[]>([]);

  // Toast / Feedback messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeEditingIndex, setActiveEditingIndex] = useState(null);

  // ── JSON View Modal State ──────────────────────────────────────────────────
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalProfile, setJsonModalProfile] = useState(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [jsonTab, setJsonTab] = useState('view'); // 'view' | 'import'
  const [jsonImportText, setJsonImportText] = useState('');
  const [jsonImportError, setJsonImportError] = useState('');

  // ── Test Telemetry Modal State ─────────────────────────────────────────────
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingProfile, setTestingProfile] = useState<any>(null);
  const [liveGateways, setLiveGateways] = useState<any[]>([]);
  const [liveChannels, setLiveChannels] = useState<any[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [testSlaveId, setTestSlaveId] = useState(1);
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failure'
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testSummary, setTestSummary] = useState<any>(null);

  // Stable refs to prevent flickering and circular loads
  const hasInitiallyLoaded = useRef(false);
  const fallbackProfilesRef = useRef(fallbackProfiles);
  fallbackProfilesRef.current = fallbackProfiles;

  // ── Fetch profiles and masters from API (Smooth, zero-glitch) ───────────────
  const fetchProfiles = useCallback(async () => {
    if (!hasInitiallyLoaded.current) {
      setProfilesLoading(true);
    }
    setFetchError('');
    try {
      const [profilesData, makesRes, modelsRes, paramMastersRes, gwsRes, chsRes] = await Promise.allSettled([
        apiProfiles.getAll(),
        meterMakeApi.getAll(),
        meterModelApi.getAll(),
        parameterMasterApi.getAll(),
        gatewayApi.getAll(),
        channelApi.getAll(),
      ]);

      if (makesRes.status === 'fulfilled') {
        const mList = normaliseArray(makesRes.value);
        setLiveMakes(mList);
      }
      if (modelsRes.status === 'fulfilled') {
        const modArr = normaliseArray(modelsRes.value);
        setLiveModels(modArr);
      }
      if (paramMastersRes.status === 'fulfilled') {
        const pmArr = normaliseArray(paramMastersRes.value);
        setParamMasters(pmArr);
      }
      if (gwsRes.status === 'fulfilled') {
        const gwArr = normaliseArray(gwsRes.value);
        setLiveGateways(gwArr);
      }
      if (chsRes.status === 'fulfilled') {
        const chArr = normaliseArray(chsRes.value);
        setLiveChannels(chArr);
      }

      if (profilesData.status === 'fulfilled' && Array.isArray(profilesData.value)) {
        setMeterProfiles(profilesData.value);
      } else {
        setFetchError(`API connection issue. Using local cache.`);
        setMeterProfiles(fallbackProfilesRef.current.map((p, idx) => normaliseProfile(p, `PROF-${idx + 1}`)));
      }
      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setFetchError(`API connection issue (${err.message}). Using local cache.`);
      setMeterProfiles(fallbackProfilesRef.current.map((p, idx) => normaliseProfile(p, `PROF-${idx + 1}`)));
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Combined parameter options from live parameter master and standard catalog
  const parameterOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id?: number; key: string; display_name: string; unit?: string; datatype?: string; multiplier?: number }> = [];

    for (const pm of paramMasters) {
      const k = (pm.key || '').trim();
      if (k && !seen.has(k.toLowerCase())) {
        seen.add(k.toLowerCase());
        list.push({
          id: pm.id,
          key: k,
          display_name: pm.displayName || pm.display_name || k,
          unit: pm.unit || '',
          datatype: 'float32',
          multiplier: 1,
        });
      }
    }

    for (const sp of standardParameters) {
      const k = (sp.key || '').trim();
      if (k && !seen.has(k.toLowerCase())) {
        seen.add(k.toLowerCase());
        list.push(sp);
      }
    }

    return list;
  }, [paramMasters, standardParameters]);

  // Duplicate key detection in Parameter Registers
  const duplicateKeyCountsInRows = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of parameterRows) {
      const k = (r.key || '').trim().toLowerCase();
      if (k) {
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return counts;
  }, [parameterRows]);

  const hasDuplicateRowKeys = useMemo(() => {
    return Object.values(duplicateKeyCountsInRows).some((c: any) => Number(c) > 1);
  }, [duplicateKeyCountsInRows]);

  // Available makes pool
  const availableMakes = useMemo(() => {
    return liveMakes.length > 0 ? liveMakes : makes;
  }, [liveMakes, makes]);

  // Filtered models by selected make
  const availableModels = useMemo(() => {
    const pool = liveModels.length > 0 ? liveModels : models;
    if (!profileForm.make_id) return pool;
    const filtered = pool.filter(
      (m) => String(m.meterMakeId ?? m.make_id) === String(profileForm.make_id)
    );
    return filtered.length > 0 ? filtered : pool;
  }, [liveModels, models, profileForm.make_id]);

  // ── Navigation between List & Create/Edit ──────────────────────────────────
  const handleOpenCreatePage = () => {
    const poolMakes = availableMakes;
    const dm =
      poolMakes.find(
        (m) =>
          (m.meterMakeName || m.make_name || '').toLowerCase().includes('elmeasure') ||
          (m.meterMakeName || m.make_name || '').toLowerCase().includes('elmasure')
      ) ||
      poolMakes[0] || { id: 1, make_id: '1', meterMakeName: 'Elmasure', make_name: 'Elmasure' };

    const poolModels = liveModels.length > 0 ? liveModels : models;
    const validMods = poolModels.filter((m) => String(m.meterMakeId ?? m.make_id) === String(dm.id ?? dm.make_id));
    const mod = validMods[0] || poolModels[0] || { id: 1, model_id: '1', meterModelName: 'LG5310', model_name: 'LG5310' };

    setCurrentProfileId('NEW');
    setProfileForm({
      profile_version: '1.0.0',
      make_id: String(dm.id ?? dm.make_id ?? '1'),
      make: dm.meterMakeName || dm.make_name || 'Elmasure',
      model_id: String(mod.id ?? mod.model_id ?? '1'),
      model: mod.meterModelName || mod.model_name || 'LG5310',
      address_offset: -40001,
      function_code: 3,
      byte_order: 'CDAB',
      description: '',
    });

    const firstParam = parameterOptions[0] || {
      id: 1,
      key: 'power_active_total',
      display_name: 'Watts Total',
      unit: 'W',
    };

    setParameterRows([
      {
        parameterMasterId: firstParam.id || 1,
        key: firstParam.key || 'power_active_total',
        display_name: firstParam.display_name || 'Watts Total',
        address: 40101,
        datatype: 'float32',
        multiplier: 1,
        unit: firstParam.unit || 'W',
      },
    ]);
    setErrorMsg('');
    setViewMode('create');
  };

  const handleOpenEditPage = async (profile: any) => {
    const profileDbId = toIntegerId(profile.id) ?? resolveIntegerId(profile.profile_id, 1)!;
    setCurrentProfileId(profileDbId);
    setErrorMsg('');

    // Fetch latest details from GetById if available
    let active = profile;
    try {
      const detailed = await apiProfiles.getById(profileDbId, liveMakes, liveModels, paramMasters);
      if (detailed) active = detailed;
    } catch (_) {
      // Use profile from table row if GetById is unavailable
    }

    const poolMakes = availableMakes;
    const poolModels = liveModels.length > 0 ? liveModels : models;

    const matchedMake = poolMakes.find(
      (m) =>
        String(m.id ?? m.make_id) === String(active.make_id) ||
        (m.meterMakeName || m.make_name || '').toLowerCase() === (active.make || '').toLowerCase()
    );
    const matchedModel = poolModels.find(
      (m) =>
        String(m.id ?? m.model_id) === String(active.model_id) ||
        (m.meterModelName || m.model_name || '').toLowerCase() === (active.model || '').toLowerCase()
    );

    const makeId = String(active.make_id || matchedMake?.id || matchedMake?.make_id || poolMakes[0]?.id || '1');
    const makeName = active.make || matchedMake?.meterMakeName || matchedMake?.make_name || 'Elmasure';
    const modelId = String(active.model_id || matchedModel?.id || matchedModel?.model_id || poolModels[0]?.id || '1');
    const modelName = active.model || matchedModel?.meterModelName || matchedModel?.model_name || 'LG5310';

    setProfileForm({
      profile_version: active.profile_version || '1.0.0',
      make_id: makeId,
      make: makeName,
      model_id: modelId,
      model: modelName,
      address_offset: active.address_offset !== undefined ? active.address_offset : -40001,
      function_code: active.function_code !== undefined ? active.function_code : 3,
      byte_order: active.byte_order || 'CDAB',
      description: active.description || '',
    });

    const seenRowKeys = new Set<string>();
    const mappedRows = (active.parameters || []).map((p: any, idx: number) => {
      let k = (p.key || '').trim();
      let dName = (p.display_name || '').trim();
      const addr = p.address !== undefined ? Number(p.address) : 40101;

      if (!k || seenRowKeys.has(k.toLowerCase())) {
        const std = STANDARD_LG5310_REGISTERS.find((s) => s.address === addr);
        if (std && !seenRowKeys.has(std.key.toLowerCase())) {
          k = std.key;
          dName = std.display_name;
        } else if (addr && !seenRowKeys.has(`reg_${addr}`)) {
          k = `reg_${addr}`;
          dName = dName || `Register ${addr}`;
        } else {
          k = `param_${idx + 1}`;
          dName = dName || `Parameter ${idx + 1}`;
        }
      }
      seenRowKeys.add(k.toLowerCase());

      return {
        id: p.id,
        meterProfileId: p.meterProfileId,
        parameterMasterId: p.parameterMasterId,
        key: k,
        display_name: dName || k,
        address: addr,
        datatype: p.datatype || 'float32',
        multiplier: p.multiplier !== undefined ? p.multiplier : 1,
        unit: p.unit || 'W',
      };
    });

    setParameterRows(mappedRows);

    setViewMode('create');
  };

  // Cascading Make -> Model selection
  const handleMakeChange = (makeId: string) => {
    const poolMakes = availableMakes;
    const mk = poolMakes.find((m) => String(m.id ?? m.make_id) === String(makeId));

    const poolModels = liveModels.length > 0 ? liveModels : models;
    const validMods = poolModels.filter((m) => String(m.meterMakeId ?? m.make_id) === String(makeId));
    const firstMod = validMods[0] || poolModels[0];

    const makeName = mk ? (mk.meterMakeName || mk.make_name) : makeId;
    const modelId = firstMod ? String(firstMod.id ?? firstMod.model_id) : profileForm.model_id;
    const modelName = firstMod ? (firstMod.meterModelName || firstMod.model_name) : profileForm.model;

    setProfileForm((prev) => ({
      ...prev,
      make_id: makeId,
      make: makeName,
      model_id: modelId,
      model: modelName,
    }));
  };

  const handleModelChange = (modelId: string) => {
    const poolModels = liveModels.length > 0 ? liveModels : models;
    const mod = poolModels.find((m) => String(m.id ?? m.model_id) === String(modelId));
    if (!mod) return;
    setProfileForm((prev) => ({
      ...prev,
      model_id: modelId,
      model: mod.meterModelName || mod.model_name,
    }));
  };

  // ── Parameter Registers handlers ───────────────────────────────────────────
  const calculateNextAddress = () => {
    if (!parameterRows.length) {
      return Number(profileForm.address_offset) === 0 ? 3001 : 40101;
    }
    const lastRow = parameterRows[parameterRows.length - 1];
    const span = lastRow.datatype === 'uint16' || lastRow.datatype === 'int16' ? 1 : 2;
    return Number(lastRow.address || 40101) + span;
  };

  const handleAddRow = () => {
    const nextAddr = calculateNextAddress();
    const newRow = {
      key: '',
      display_name: '',
      address: nextAddr,
      datatype: 'float32',
      multiplier: 1,
      unit: '',
    };
    setParameterRows((prev) => [...prev, newRow]);
    setActiveEditingIndex(parameterRows.length);
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    setParameterRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      // Autocomplete standard parameters metadata when key is selected
      if (field === 'key') {
        const found = parameterOptions.find(
          (p) => p.key.toLowerCase().trim() === String(value).toLowerCase().trim()
        );
        if (found) {
          row.parameterMasterId = found.id;
          row.display_name = found.display_name || row.display_name;
          row.datatype = found.datatype || row.datatype || 'float32';
          row.multiplier = found.multiplier !== undefined ? found.multiplier : 1;
          row.unit = found.unit || row.unit || '';
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setParameterRows((prev) => prev.filter((_, i) => i !== index));
    if (activeEditingIndex === index) setActiveEditingIndex(null);
  };

  const handleToggleEditRow = (index: number) => {
    setActiveEditingIndex(activeEditingIndex === index ? null : index);
  };

  // ── Save Profile (Create / Update) ─────────────────────────────────────────
  const handleSaveProfile = async () => {
    setErrorMsg('');

    if (!profileForm.make_id) {
      setErrorMsg('Please select a Make.');
      return;
    }
    if (!profileForm.model_id) {
      setErrorMsg('Please select a Model.');
      return;
    }

    const cleanedParams = parameterRows
      .filter((r) => (r.display_name || '').trim() || (r.key || '').trim())
      .map((r) => ({
        id: r.id,
        parameterMasterId: r.parameterMasterId,
        key: (r.key || '').trim() || (r.display_name || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
        display_name: (r.display_name || '').trim() || (r.key || '').trim(),
        address: Number(r.address) || 40101,
        datatype: r.datatype || 'float32',
        multiplier: r.multiplier !== undefined && r.multiplier !== '' ? Number(r.multiplier) : 1,
        unit: (r.unit || '').trim(),
      }));

    if (cleanedParams.length === 0) {
      setErrorMsg('Please add at least one parameter row in the Parameter Registers table.');
      return;
    }

    if (hasDuplicateRowKeys) {
      setErrorMsg('Duplicate parameter key detected. Each parameter must have a unique key.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const makeIdNum = resolveIntegerId(profileForm.make_id, 1)!;
      const modelIdNum = resolveIntegerId(profileForm.model_id, 1)!;
      const boInt = mapByteOrderToInt(profileForm.byte_order);

      if (currentProfileId !== 'NEW') {
        const profileDbId = resolveIntegerId(currentProfileId, 1)!;
        const updateDto = {
          profileVersion: profileForm.profile_version || '1.0.0',
          makeId: makeIdNum,
          modelId: modelIdNum,
          addressOffest: Number(profileForm.address_offset),
          holdingRegister: Number(profileForm.function_code),
          byteOrder: boInt,
          isActive: true,
        };
        await meterProfileApi.update(profileDbId, updateDto);

        // Sync parameters
        for (let i = 0; i < cleanedParams.length; i++) {
          const row = cleanedParams[i];
          const pMaster = parameterOptions.find(
            (pm) => (pm.key || '').toLowerCase().trim() === (row.key || '').toLowerCase().trim()
          );
          const stdFound = STANDARD_LG5310_REGISTERS.find(
            (s) => (s.key || '').toLowerCase().trim() === (row.key || '').toLowerCase().trim()
          );
          const pMasterId = toIntegerId(pMaster?.id ?? stdFound?.parameterMasterId ?? row.parameterMasterId) ?? (i + 1);
          const pDto = {
            meterProfileId: profileDbId,
            parameterMasterId: pMasterId,
            address: Number(row.address),
            dataType: mapDataTypeToInt(row.datatype),
            multiplier: Number(row.multiplier || 1),
          };
          if (row.id) {
            try {
              const pRowId = toIntegerId(row.id);
              if (pRowId) {
                await meterProfileApi.updateParameter(pRowId, { ...pDto, isActive: true });
              }
            } catch (_) {
              // Ignore individual update error
            }
          } else {
            try {
              await meterProfileApi.createParameter(pDto);
            } catch (_) {
              // Ignore individual create error
            }
          }
        }

        setSuccessMsg(`✓ Profile "${profileForm.make} ${profileForm.model}" updated successfully.`);
      } else {
        const createDto = {
          profileVersion: profileForm.profile_version || '1.0.0',
          makeId: makeIdNum,
          modelId: modelIdNum,
          addressOffest: Number(profileForm.address_offset),
          holdingRegister: Number(profileForm.function_code),
          byteOrder: boInt,
        };
        const res: any = await meterProfileApi.create(createDto);
        const newProfileId = toIntegerId(res?.data?.id ?? res?.data?.profile_id ?? res?.id ?? res?.data);

        if (newProfileId) {
          for (let i = 0; i < cleanedParams.length; i++) {
            const row = cleanedParams[i];
            const pMaster = parameterOptions.find(
              (pm) => (pm.key || '').toLowerCase().trim() === (row.key || '').toLowerCase().trim()
            );
            const stdFound = STANDARD_LG5310_REGISTERS.find(
              (s) => (s.key || '').toLowerCase().trim() === (row.key || '').toLowerCase().trim()
            );
            const pMasterId = toIntegerId(pMaster?.id ?? stdFound?.parameterMasterId ?? row.parameterMasterId) ?? (i + 1);
            try {
              await meterProfileApi.createParameter({
                meterProfileId: newProfileId,
                parameterMasterId: pMasterId,
                address: Number(row.address),
                dataType: mapDataTypeToInt(row.datatype),
                multiplier: Number(row.multiplier || 1),
              });
            } catch (_) {
              // Ignore individual parameter error to avoid failing whole profile
            }
          }
        }

        setSuccessMsg(`✓ Profile "${profileForm.make} ${profileForm.model}" created successfully.`);
      }

      setViewMode('list');
      await fetchProfiles();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save meter profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Delete Profile ─────────────────────────────────────────────────────────
  const handleDeleteProfile = async (profileId: any, make: string, model: string) => {
    const profileDbId = resolveIntegerId(profileId, null);
    if (window.confirm(`Are you sure you want to delete profile "${make} ${model}"?`)) {
      try {
        if (profileDbId) {
          try {
            await apiProfiles.delete(profileDbId);
          } catch (err: any) {
            const msg = (err?.message || '').toLowerCase();
            if (!msg.includes('not found') && !msg.includes('404')) {
              throw err;
            }
          }
        }
        if (typeof deleteMeterProfile === 'function') {
          deleteMeterProfile(profileId);
          if (profileDbId) deleteMeterProfile(profileDbId);
        }
        setMeterProfiles((prev) =>
          prev.filter((p) => {
            return (
              String(p.id) !== String(profileId) &&
              String(p.profile_id) !== String(profileId) &&
              (!profileDbId || String(p.id) !== String(profileDbId))
            );
          })
        );
        setSuccessMsg(`✓ Profile "${make} ${model}" deleted successfully.`);
        setFetchError('');
        setTimeout(() => setSuccessMsg(''), 3500);
      } catch (err: any) {
        setFetchError(`Failed to delete profile: ${err.message}`);
      }
    }
  };

  // ── JSON Format Helpers ───────────────────────────────────────────────────
  const getActiveProfileJson = (targetProfile: any = null) => {
    if (targetProfile) {
      const pList =
        targetProfile.parameters && targetProfile.parameters.length > 0
          ? targetProfile.parameters
          : STANDARD_LG5310_REGISTERS;

      return {
        profile_version: targetProfile.profile_version || '1.0.0',
        make: targetProfile.make || 'Elmasure',
        model: targetProfile.model || 'LG5310',
        address_offset: Number(targetProfile.address_offset !== undefined ? targetProfile.address_offset : -40001),
        function_code: Number(targetProfile.function_code !== undefined ? targetProfile.function_code : 3),
        byte_order: targetProfile.byte_order || 'CDAB',
        parameters: pList.map((p: any) => ({
          key: p.key || '',
          display_name: p.display_name || p.displayName || p.name || p.key || '',
          address: Number(p.address) || 40101,
          datatype: p.datatype || 'float32',
          multiplier: Number(p.multiplier !== undefined ? p.multiplier : 1),
          unit: p.unit || '',
        })),
      };
    }
    const currentRows = parameterRows.length > 0 ? parameterRows : STANDARD_LG5310_REGISTERS;
    return {
      profile_version: profileForm.profile_version || '1.0.0',
      make: profileForm.make || 'Elmasure',
      model: profileForm.model || 'LG5310',
      address_offset: Number(profileForm.address_offset !== undefined ? profileForm.address_offset : -40001),
      function_code: Number(profileForm.function_code !== undefined ? profileForm.function_code : 3),
      byte_order: profileForm.byte_order || 'CDAB',
      parameters: currentRows.map((r: any) => ({
        key: r.key || '',
        display_name: r.display_name || r.displayName || r.name || r.key || '',
        address: Number(r.address) || 40101,
        datatype: r.datatype || 'float32',
        multiplier: Number(r.multiplier !== undefined ? r.multiplier : 1),
        unit: r.unit || '',
      })),
    };
  };

  const handleCopyJson = (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const onDone = () => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(onDone).catch(onDone);
    } else {
      onDone();
    }
  };

  const handleDownloadJson = (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meter_profile_${(data.make || 'make').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${(data.model || 'model').toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyImportedJson = () => {
    try {
      setJsonImportError('');
      if (!jsonImportText.trim()) {
        setJsonImportError('Please paste valid profile JSON content.');
        return;
      }
      const parsed = JSON.parse(jsonImportText);
      const matchedMake = makes.find((m) => m.make_name.toLowerCase() === (parsed.make || '').toLowerCase());
      const matchedModel = models.find((m) => m.model_name.toLowerCase() === (parsed.model || '').toLowerCase());

      setProfileForm((prev) => ({
        ...prev,
        profile_version: parsed.profile_version || prev.profile_version || '1.0.0',
        make: parsed.make || prev.make,
        make_id: matchedMake?.make_id || prev.make_id,
        model: parsed.model || prev.model,
        model_id: matchedModel?.model_id || prev.model_id,
        address_offset: parsed.address_offset !== undefined ? Number(parsed.address_offset) : prev.address_offset,
        function_code: parsed.function_code !== undefined ? Number(parsed.function_code) : prev.function_code,
        byte_order: parsed.byte_order || prev.byte_order || 'CDAB',
      }));

      if (Array.isArray(parsed.parameters)) {
        setParameterRows(
          parsed.parameters.map((p) => ({
            key: p.key || '',
            display_name: p.display_name || '',
            address: p.address !== undefined ? Number(p.address) : 40101,
            datatype: p.datatype || 'float32',
            multiplier: p.multiplier !== undefined ? Number(p.multiplier) : (p.scale !== undefined ? Number(p.scale) : 1),
            unit: p.unit || '',
          }))
        );
      }

      setIsJsonModalOpen(false);
      setSuccessMsg('✓ Profile configuration applied from JSON successfully!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setJsonImportError('Invalid JSON format: ' + err.message);
    }
  };

  // ── Gateway Telemetry Test Handler ─────────────────────────────────────────
  const handleOpenTestProfile = (profile: any) => {
    setTestingProfile(profile);
    const poolGw = liveGateways.length > 0 ? liveGateways : gateways;
    const defaultGwId = poolGw[0]?.id || poolGw[0]?.Gateway_id || DEFAULT_DEVICE_ID;
    setSelectedGatewayId(String(defaultGwId));
    const poolCh = liveChannels.length > 0 ? liveChannels : channels;
    const availableChannels = poolCh.filter(
      (c) => String(c.gatewayId || c.Gateway_id) === String(defaultGwId)
    );
    setSelectedChannelId(String(availableChannels[0]?.id || availableChannels[0]?.Channel_id || '1'));
    setTestSlaveId(1);
    setTestStatus('idle');
    setTestProgress(0);
    setTestLogs([]);
    setTestResults([]);
    setTestSummary(null);
    setIsTestModalOpen(true);
  };

  const handleGatewayChange = (gwId: string) => {
    setSelectedGatewayId(gwId);
    const poolCh = liveChannels.length > 0 ? liveChannels : channels;
    const available = poolCh.filter(
      (c) => String(c.gatewayId || c.Gateway_id) === String(gwId)
    );
    setSelectedChannelId(String(available[0]?.id || available[0]?.Channel_id || '1'));
  };

  const runGatewayProfileTest = async () => {
    if (!testingProfile) return;
    const poolGw = liveGateways.length > 0 ? liveGateways : gateways;
    const currentGw = poolGw.find((g) => String(g.id || g.Gateway_id) === String(selectedGatewayId)) || {
      Gateway_name: 'Enerlink IoT Gateway',
      ip_address: '192.23.0.190',
      mac_address: DEFAULT_DEVICE_ID,
    };
    const poolCh = liveChannels.length > 0 ? liveChannels : channels;
    const currentCh = poolCh.find((c) => String(c.id || c.Channel_id) === String(selectedChannelId)) || {
      Channel_name: 'Channel 1',
      baud_rate: '9600',
      protocol: 'Modbus RTU',
    };

    const targetMac =
      String(selectedGatewayId) === DEFAULT_DEVICE_ID
        ? DEFAULT_DEVICE_ID
        : (currentGw.mac_address || currentGw.macAddress || DEFAULT_DEVICE_ID).replace(/[:-]/g, '');

    setTestStatus('testing');
    setTestProgress(15);
    setTestResults([]);
    setTestSummary(null);

    const now = () => new Date().toLocaleTimeString();

    setTestLogs([
      { time: now(), text: `Connecting to Gateway [${currentGw.deviceName || currentGw.Gateway_name || targetMac}] at ${currentGw.ipAddress || currentGw.ip_address || '192.23.0.190:8007'}...`, type: 'info' },
    ]);

    setTestProgress(40);
    setTestLogs((prev) => [
      ...prev,
      { time: now(), text: `RS485 Channel [${currentCh.channelName || currentCh.Channel_name || 'Channel 1'}] active (Baud: ${currentCh.baud_rate || '9600'}, Protocol: ${currentCh.protocol || 'Modbus RTU'}).`, type: 'info' },
    ]);

    let liveReadingsMap: Record<string, any> = {};
    let latencyMs = 38;
    let matchedMeter: any = null;

    try {
      const startTime = Date.now();
      const activeDeviceId =
        targetMac.length >= 8 && targetMac !== '001B44113AB7'
          ? targetMac
          : DEFAULT_DEVICE_ID;

      // Probe hardware connection
      await enerlinkApi.testConnection(activeDeviceId).catch(() => {});
      // Fetch latest telemetry for selected slave
      const teleRes = await enerlinkApi.getLatestTelemetry(activeDeviceId, testSlaveId);
      latencyMs = Math.max(12, Date.now() - startTime);

      const rawData = teleRes?.data !== undefined ? teleRes.data : teleRes;
      if (Array.isArray(rawData)) {
        matchedMeter = rawData.find((it: any) => Number(it.slave_id) === Number(testSlaveId));
      } else if (rawData && typeof rawData === 'object') {
        if (rawData.slave_id !== undefined) {
          if (Number(rawData.slave_id) === Number(testSlaveId)) {
            matchedMeter = rawData;
          }
        } else {
          matchedMeter = rawData;
        }
      }

      if (matchedMeter?.values?.[0]) {
        liveReadingsMap = matchedMeter.values[0];
      }
    } catch (_) {
      // connection error
    }

    setTestProgress(75);
    setTestLogs((prev) => [
      ...prev,
      { time: now(), text: `TX Polling registers for Slave #${testSlaveId} (FC: 0${testingProfile.function_code || 3}, Offset: ${testingProfile.address_offset || 0})...`, type: 'info' },
    ]);

    setTimeout(() => {
      // Build decoded results from both configured parameters and standard LG5310 catalog
      const configuredParams = testingProfile.parameters || [];
      const basePool = configuredParams.length > 0 ? configuredParams : STANDARD_LG5310_REGISTERS;

      // Merge so all available live registers from STANDARD_LG5310_REGISTERS are included
      const seenKeys = new Set(basePool.map((p: any) => (p.key || '').toLowerCase()));
      const allToDecode = [...basePool];
      for (const std of STANDARD_LG5310_REGISTERS) {
        if (!seenKeys.has(std.key.toLowerCase())) {
          seenKeys.add(std.key.toLowerCase());
          allToDecode.push(std);
        }
      }

      const decodedResults = allToDecode.map((param: any) => {
        let val: string | null = null;
        let isLive = false;
        const k = (param.key || '').toLowerCase();

        // Check if real live telemetry frame has this parameter
        if (liveReadingsMap[param.key] !== undefined && liveReadingsMap[param.key] !== null) {
          val = String(liveReadingsMap[param.key]);
          isLive = true;
        } else if ((k.includes('power_active_total') || k === 'total_active_power') && liveReadingsMap.total_active_power !== undefined) {
          val = String(liveReadingsMap.total_active_power);
          isLive = true;
        } else if ((k.includes('phase1_active_power') || k === 'r_active_power') && liveReadingsMap.phase1_active_power !== undefined) {
          val = String(liveReadingsMap.phase1_active_power);
          isLive = true;
        } else if ((k.includes('phase2_active_power') || k === 'y_active_power') && liveReadingsMap.phase2_active_power !== undefined) {
          val = String(liveReadingsMap.phase2_active_power);
          isLive = true;
        } else if ((k.includes('phase3_active_power') || k === 'b_active_power') && liveReadingsMap.phase3_active_power !== undefined) {
          val = String(liveReadingsMap.phase3_active_power);
          isLive = true;
        } else if (k.includes('active_energy') && liveReadingsMap.active_energy !== undefined) {
          val = String(liveReadingsMap.active_energy);
          isLive = true;
        } else if (k.includes('line_to_line_voltage') && liveReadingsMap.line_to_line_voltage !== undefined) {
          val = String(liveReadingsMap.line_to_line_voltage);
          isLive = true;
        } else if (k.includes('l1_to_l2_voltage') && liveReadingsMap.l1_to_l2_voltage !== undefined) {
          val = String(liveReadingsMap.l1_to_l2_voltage);
          isLive = true;
        } else if (k.includes('l2_to_l3_voltage') && liveReadingsMap.l2_to_l3_voltage !== undefined) {
          val = String(liveReadingsMap.l2_to_l3_voltage);
          isLive = true;
        } else if (k.includes('l3_to_l1_voltage') && liveReadingsMap.l3_to_l1_voltage !== undefined) {
          val = String(liveReadingsMap.l3_to_l1_voltage);
          isLive = true;
        } else if (k.includes('line_to_neutral_voltage') && liveReadingsMap.line_to_neutral_voltage !== undefined) {
          val = String(liveReadingsMap.line_to_neutral_voltage);
          isLive = true;
        } else if (k.includes('l1_to_neutral_voltage') && liveReadingsMap.l1_to_neutral_voltage !== undefined) {
          val = String(liveReadingsMap.l1_to_neutral_voltage);
          isLive = true;
        } else if (k.includes('l2_to_neutral_voltage') && liveReadingsMap.l2_to_neutral_voltage !== undefined) {
          val = String(liveReadingsMap.l2_to_neutral_voltage);
          isLive = true;
        } else if (k.includes('l3_to_neutral_voltage') && liveReadingsMap.l3_to_neutral_voltage !== undefined) {
          val = String(liveReadingsMap.l3_to_neutral_voltage);
          isLive = true;
        } else if (k.includes('average_current') && liveReadingsMap.average_current !== undefined) {
          val = String(liveReadingsMap.average_current);
          isLive = true;
        } else if (k.includes('l1_current') && liveReadingsMap.l1_current !== undefined) {
          val = String(liveReadingsMap.l1_current);
          isLive = true;
        } else if (k.includes('l2_current') && liveReadingsMap.l2_current !== undefined) {
          val = String(liveReadingsMap.l2_current);
          isLive = true;
        } else if (k.includes('l3_current') && liveReadingsMap.l3_current !== undefined) {
          val = String(liveReadingsMap.l3_current);
          isLive = true;
        } else if (k.includes('total_apparent_power') && liveReadingsMap.total_apparent_power !== undefined) {
          val = String(liveReadingsMap.total_apparent_power);
          isLive = true;
        } else if (k.includes('phase1_apparent_power') && liveReadingsMap.phase1_apparent_power !== undefined) {
          val = String(liveReadingsMap.phase1_apparent_power);
          isLive = true;
        } else if (k.includes('phase2_apparent_power') && liveReadingsMap.phase2_apparent_power !== undefined) {
          val = String(liveReadingsMap.phase2_apparent_power);
          isLive = true;
        } else if (k.includes('phase3_apparent_power') && liveReadingsMap.phase3_apparent_power !== undefined) {
          val = String(liveReadingsMap.phase3_apparent_power);
          isLive = true;
        } else if (k === 'power_factor' && liveReadingsMap.power_factor !== undefined) {
          val = String(liveReadingsMap.power_factor);
          isLive = true;
        } else if (k.includes('phase1_power_factor') && liveReadingsMap.phase1_power_factor !== undefined) {
          val = String(liveReadingsMap.phase1_power_factor);
          isLive = true;
        } else if (k.includes('phase2_power_factor') && liveReadingsMap.phase2_power_factor !== undefined) {
          val = String(liveReadingsMap.phase2_power_factor);
          isLive = true;
        } else if (k.includes('phase3_power_factor') && liveReadingsMap.phase3_power_factor !== undefined) {
          val = String(liveReadingsMap.phase3_power_factor);
          isLive = true;
        } else if (k === 'frequency' && liveReadingsMap.frequency !== undefined) {
          val = String(liveReadingsMap.frequency);
          isLive = true;
        }

        const mult = Number(param.multiplier) || 1.0;
        let finalVal = '—';
        if (isLive && val !== null) {
          const numVal = parseFloat(val);
          finalVal = !isNaN(numVal) && mult !== 1.0 ? (numVal * mult).toFixed(2) : val;
        }

        return {
          key: param.key,
          display_name: param.display_name || param.displayName || param.key,
          address: param.address || 40101,
          datatype: param.datatype || 'float32',
          multiplier: mult,
          unit: param.unit || '',
          value: finalVal,
          status: isLive ? 'Active' : 'Inactive',
        };
      });

      setTestResults(decodedResults);
      setTestStatus('success');
      setTestProgress(100);

      const activeCount = decodedResults.filter((r) => r.status === 'Active').length;
      const inactiveCount = decodedResults.length - activeCount;

      if (matchedMeter && activeCount > 0) {
        setTestLogs((prev) => [
          ...prev,
          { time: now(), text: `RX Hardware Frame Verified: Reached Gateway [${matchedMeter.device_id || DEFAULT_DEVICE_ID}], Channel ${matchedMeter.channel || 1}, Meter Slave #${testSlaveId} (${matchedMeter.meter_name || matchedMeter.meter_serial || 'Meter'}).`, type: 'success' },
          { time: now(), text: `Telemetry Polling Successful: ${activeCount} Active, ${inactiveCount} Inactive registers decoded in ${latencyMs}ms.`, type: 'success' },
        ]);
      } else {
        setTestLogs((prev) => [
          ...prev,
          { time: now(), text: `RX Modbus Timeout / No Acknowledgment: Gateway did not receive telemetry from Slave #${testSlaveId} on Channel ${currentCh.channelName || currentCh.Channel_name || 'selected channel'}.`, type: 'error' },
          { time: now(), text: `Hardware Result: 0 Active, ${decodedResults.length} Inactive registers.`, type: 'warning' },
        ]);
      }

      setTestSummary({
        success: true,
        latencyMs: latencyMs,
        registersRead: decodedResults.length,
        voltage: liveReadingsMap.line_to_line_voltage !== undefined ? `${liveReadingsMap.line_to_line_voltage} V` : '—',
        power: liveReadingsMap.total_active_power !== undefined ? `${liveReadingsMap.total_active_power} W` : '—',
        current: liveReadingsMap.average_current !== undefined ? `${liveReadingsMap.average_current} A` : '—',
        frequency: liveReadingsMap.frequency !== undefined ? `${liveReadingsMap.frequency} Hz` : '—',
        powerFactor: liveReadingsMap.power_factor !== undefined ? String(liveReadingsMap.power_factor) : '—',
        energy: liveReadingsMap.active_energy !== undefined ? `${liveReadingsMap.active_energy} kWh` : '—',
      });
    }, 450);
  };

  // Filtered profiles for list view table
  const filteredProfiles = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return meterProfiles;
    return meterProfiles.filter(
      (p) =>
        (p.make || '').toLowerCase().includes(q) ||
        (p.model || '').toLowerCase().includes(q) ||
        (p.profile_version && p.profile_version.toLowerCase().includes(q)) ||
        (p.byte_order && p.byte_order.toLowerCase().includes(q))
    );
  }, [meterProfiles, searchTerm]);

  // ── JSON Modal Renderer ────────────────────────────────────────────────────
  const renderJsonModal = () => {
    const activeData = getActiveProfileJson(jsonModalProfile);
    const jsonStr = JSON.stringify(activeData, null, 2);

    return (
      <Modal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        title={`Profile JSON Format: ${activeData.make || 'Meter'} ${activeData.model || 'Profile'}`}
        maxWidth="760px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Info Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeData.make} {activeData.model}
              </span>
              <span className="badge badge-primary">v{activeData.profile_version || '1.0.0'}</span>
              <span className="badge badge-success">{activeData.parameters?.length || 0} Registers</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Offset: {activeData.address_offset} • FC: 0{activeData.function_code} • {activeData.byte_order}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCopyJson(activeData)}
                className="btn btn-primary"
                style={{ height: '32px', fontSize: '0.78rem' }}
              >
                {jsonCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{jsonCopied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadJson(activeData)}
                className="btn btn-secondary"
                style={{ height: '32px', fontSize: '0.78rem' }}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '6px' }}>
            <button
              type="button"
              onClick={() => setJsonTab('view')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: jsonTab === 'view' ? 'var(--brand-surface)' : 'transparent',
                color: jsonTab === 'view' ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: jsonTab === 'view' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Code2 size={14} />
              <span>JSON View</span>
            </button>

            {viewMode === 'create' && (
              <button
                type="button"
                onClick={() => {
                  setJsonTab('import');
                  if (!jsonImportText) setJsonImportText(jsonStr);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: jsonTab === 'import' ? 'var(--brand-surface)' : 'transparent',
                  color: jsonTab === 'import' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: jsonTab === 'import' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Upload size={14} />
                <span>Paste / Import JSON</span>
              </button>
            )}
          </div>

          {jsonTab === 'view' ? (
            <div
              style={{
                maxHeight: '420px',
                overflowY: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                backgroundColor: '#0b1117',
                padding: '14px 16px',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.80rem',
                  lineHeight: '1.55',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                }}
              >
                {jsonStr}
              </pre>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                value={jsonImportText}
                onChange={(e) => setJsonImportText(e.target.value)}
                rows={12}
                placeholder="Paste valid profile JSON here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0b1117',
                  border: jsonImportError ? '1px solid var(--status-danger-border)' : '1px solid var(--border-default)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '0.80rem',
                  boxSizing: 'border-box',
                }}
              />
              {jsonImportError && (
                <div style={{ color: 'var(--status-danger-text)', fontSize: '0.78rem' }}>{jsonImportError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={handleApplyImportedJson} className="btn btn-primary">
                  <Check size={14} />
                  <span>Apply JSON to Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // VIEW 1: TABLE VIEW (LIST VIEW AS IN SCREENSHOT 2)
  // ═════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {/* Feedback banners */}
        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-success-bg)',
              border: '1px solid var(--status-success-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-success-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {fetchError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-danger-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Table View matching Screenshot 2 */}
        <DataTable
          columns={[
            {
              header: '#',
              width: '45px',
              render: (_, idx) => <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{idx + 1}</span>,
            },
            {
              header: 'MAKE',
              render: (p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 550, color: 'var(--text-primary)' }}>
                  <Building2 size={15} color="var(--text-muted)" />
                  <span>{p.make || p.makeName || 'Elmeasure'}</span>
                </div>
              ),
            },
            {
              header: 'MODEL',
              render: (p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 550, color: 'var(--text-primary)' }}>
                  <Cpu size={15} color="var(--text-muted)" />
                  <span>{p.model || p.modelName || 'LG5310'}</span>
                </div>
              ),
            },
            {
              header: 'VERSION',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  v{p.profile_version || '1.0.0'}
                </span>
              ),
            },
            {
              header: 'ADDRESS OFFSET',
              align: 'center',
              render: (p) => (
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                  {p.address_offset}
                </span>
              ),
            },
            {
              header: 'FUNCTION CODE',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {Number(p.function_code) === 3
                    ? '03 - Holding Reg'
                    : Number(p.function_code) === 4
                    ? '04 - Input Reg'
                    : `FC 0${p.function_code || 3}`}
                </span>
              ),
            },
            {
              header: 'BYTE ORDER',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {p.byte_order || 'CDAB'}
                </span>
              ),
            },
            {
              header: 'REGISTERS COUNT',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {(p.parameters && p.parameters.length > 0) ? p.parameters.length : 26} registers
                </span>
              ),
            },
            {
              header: 'ACTIONS',
              align: 'center',
              width: '180px',
              render: (p) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {/* Test button */}
                  <button
                    onClick={() => handleOpenTestProfile(p)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid rgba(22, 128, 93, 0.35)',
                      backgroundColor: 'rgba(22, 128, 93, 0.08)',
                      color: '#166534',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                    }}
                    title="Test telemetry registers via gateway"
                  >
                    <Activity size={12} />
                    <span>Test</span>
                  </button>

                  {/* JSON button */}
                  <button
                    type="button"
                    onClick={() => {
                      setJsonModalProfile(p);
                      setJsonTab('view');
                      setJsonImportError('');
                      setIsJsonModalOpen(true);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid rgba(2, 132, 199, 0.35)',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                    }}
                    title="View & copy profile JSON configuration"
                  >
                    <FileJson size={12} />
                    <span>JSON</span>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => handleOpenEditPage(p)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid rgba(2, 132, 199, 0.35)',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                    }}
                    title="Edit Meter Profile"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteProfile(p.id ?? p.profile_id, p.make, p.model)}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '5px',
                      border: '1px solid rgba(225, 29, 72, 0.35)',
                      backgroundColor: 'rgba(225, 29, 72, 0.08)',
                      color: '#e11d48',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.74rem',
                    }}
                    title="Delete Meter Profile"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredProfiles}
          rowKey="profile_id"
          loading={profilesLoading}
          toolbar={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SearchInput
                  placeholder="Search by Make, Model, Version..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  width="280px"
                />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Total Profiles: <strong style={{ color: 'var(--brand-primary, #0284c7)' }}>{meterProfiles.length}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={fetchProfiles}
                  className="btn btn-secondary"
                  disabled={profilesLoading}
                  title="Refresh profiles from server"
                >
                  <RefreshCw size={14} className={profilesLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreatePage}
                  className="btn btn-primary"
                >
                  <Plus size={15} />
                  <span>Add Profile</span>
                </button>
              </div>
            </div>
          }
          emptyMessage="No meter profiles found. Click '+ Add Profile' to create one."
        />

        {/* ── Test Telemetry Modal ── */}
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          title="Test Meter Profile Data via Gateway"
          maxWidth="840px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 650, color: 'var(--text-primary)' }}>
                  {testingProfile?.make} • {testingProfile?.model}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  v{testingProfile?.profile_version || '1.0.0'} • FC: 0{testingProfile?.function_code || 3} • Offset: {testingProfile?.address_offset || 0} • {testingProfile?.byte_order || 'CDAB'}
                </div>
              </div>
              <span className="badge badge-primary">
                {(testingProfile?.parameters && testingProfile.parameters.length > 0 ? testingProfile.parameters.length : (testResults.length || 26))} Registers Active
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                alignItems: 'end',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Target Gateway
                </label>
                <Select2
                  value={selectedGatewayId}
                  onChange={(val) => handleGatewayChange(val)}
                  size="sm"
                  options={[
                    { value: DEFAULT_DEVICE_ID, label: `Enerlink IoT Gateway (${DEFAULT_DEVICE_ID})` },
                    ...(liveGateways.length > 0 ? liveGateways : gateways).map((gw: any) => {
                      const gId = String(gw.id || gw.Gateway_id);
                      return {
                        value: gId,
                        label: `${gw.deviceName || gw.Gateway_name} (${gw.ipAddress || gw.ip_address || 'TCP'})`,
                      };
                    }),
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Channel (Port)
                </label>
                <Select2
                  value={selectedChannelId}
                  onChange={(val) => setSelectedChannelId(val)}
                  size="sm"
                  searchable={false}
                  options={(() => {
                    const poolCh = liveChannels.length > 0 ? liveChannels : channels;
                    const matched = poolCh.filter(
                      (c: any) => String(c.gatewayId || c.Gateway_id) === String(selectedGatewayId)
                    );
                    if (matched.length > 0) {
                      return matched.map((ch: any) => ({
                        value: String(ch.id || ch.Channel_id),
                        label: `${ch.channelName || ch.Channel_name} (${ch.protocol || 'Modbus RTU'})`,
                      }));
                    }
                    return [{ value: '1', label: 'Channel 1 (RS-485 Modbus RTU)' }];
                  })()}
                />
              </div>

              <div style={{ maxWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Slave ID
                </label>
                <input
                  type="number"
                  min="1"
                  max="247"
                  value={testSlaveId}
                  onChange={(e) => setTestSlaveId(Math.max(1, Number(e.target.value)))}
                  className="form-input"
                  style={{ width: '100%', height: '34px', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={runGatewayProfileTest}
                  disabled={testStatus === 'testing'}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '34px', fontSize: '0.80rem' }}
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Polling...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Start Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Console */}
            {testLogs.length > 0 && (
              <div
                style={{
                  backgroundColor: '#0b1117',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {testLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.type === 'error' ? '#f87171' : log.type === 'success' ? '#4ade80' : '#94a3b8' }}>
                    [{log.time}] {log.text}
                  </div>
                ))}
              </div>
            )}

            {/* Live Telemetry KPI Cards */}
            {testSummary && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                }}
              >
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Power</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>{testSummary.power}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Voltage L-L</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{testSummary.voltage}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Avg</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{testSummary.current}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Frequency</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{testSummary.frequency}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Power Factor</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{testSummary.powerFactor}</div>
                </div>
              </div>
            )}

            {/* Decoded Results Table */}
            {testResults.length > 0 && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Modbus Key</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Display Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Address</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Live Reading</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-primary)' }}>{r.key}</td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>{r.display_name}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.address}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.datatype}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: r.status === 'Active' ? '#16a34a' : 'var(--text-muted)' }}>
                          {r.status === 'Active' ? `${r.value} ${r.unit}`.trim() : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          {r.status === 'Active' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.70rem', color: '#16a34a', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '12px', fontWeight: 650 }}>
                              <CheckCircle2 size={11} /> Active
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.70rem', color: '#dc2626', backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '12px', fontWeight: 650 }}>
                              <XCircle size={11} /> Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button type="button" onClick={() => setIsTestModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>

        {renderJsonModal()}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // VIEW 2: CREATE / EDIT METER PROFILE PAGE (MATCHING SCREENSHOT 1)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* ── Top Header with Back button, Title & Actions without card background ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'transparent',
          padding: '4px 0',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setViewMode('list')}
            className="btn-icon"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-secondary)',
            }}
            title="Back to Meter Profiles"
          >
            <ArrowLeft size={16} />
          </button>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {currentProfileId === 'NEW' ? 'Create Meter Profile' : `Edit Meter Profile: ${profileForm.make} ${profileForm.model}`}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setViewMode('list')} className="btn btn-secondary" disabled={isSavingProfile}>
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile || hasDuplicateRowKeys}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            title={hasDuplicateRowKeys ? 'Please resolve duplicate keys before saving' : 'Save Meter Profile'}
          >
            {isSavingProfile ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger-text)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Row 1 & Row 2: General Profile Configuration (Screenshot 1) ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-default)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Row 1: Profile Version, Make, Model */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <InputField
            label="Profile Version"
            required
            value={profileForm.profile_version}
            onChange={(e) => setProfileForm({ ...profileForm, profile_version: e.target.value })}
            placeholder="1.0.0"
          />

          <SelectField
            label="Make"
            required
            value={profileForm.make_id}
            onChange={(e) => handleMakeChange(e.target.value)}
            options={availableMakes.map((m) => ({
              value: String(resolveIntegerId(m.id ?? m.make_id, 1)),
              label: m.meterMakeName || m.make_name,
            }))}
          />

          <SelectField
            label="Model"
            required
            value={profileForm.model_id}
            onChange={(e) => handleModelChange(e.target.value)}
            options={availableModels.map((mod) => ({
              value: String(resolveIntegerId(mod.id ?? mod.model_id, 1)),
              label: mod.meterModelName || mod.model_name,
            }))}
          />
        </div>

        {/* Row 2: Address Offset, Function Code, Byte Order */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <InputField
            label="Address Offset"
            value={profileForm.address_offset}
            onChange={(e) => setProfileForm({ ...profileForm, address_offset: (e.target.value as any) })}
            placeholder="-40001"
          />

          <SelectField
            label="Function Code"
            value={profileForm.function_code}
            onChange={(e) => setProfileForm({ ...profileForm, function_code: Number(e.target.value) })}
            options={[
              { value: 3, label: 'Holding Register' },
              { value: 4, label: 'Input Register' },
              { value: 1, label: 'Coil Status' },
              { value: 2, label: 'Discrete Input' },
            ]}
          />

          <SelectField
            label="Byte Order"
            value={profileForm.byte_order}
            onChange={(e) => setProfileForm({ ...profileForm, byte_order: e.target.value })}
            options={[
              { value: 'CDAB', label: 'CDAB' },
              { value: 'ABCD', label: 'ABCD' },
              { value: 'BADC', label: 'BADC' },
              { value: 'DCBA', label: 'DCBA' },
            ]}
          />
        </div>
      </div>

      {/* ── Parameter Registers Card (Screenshot 1) ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Card Header matching Screenshot 1 */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--bg-surface-secondary, #f8fafc)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} color="#166534" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Parameter Registers
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    backgroundColor: 'rgba(22, 128, 93, 0.1)',
                    color: '#166534',
                    border: '1px solid rgba(22, 128, 93, 0.25)',
                    padding: '1px 8px',
                    borderRadius: '4px',
                    fontWeight: 650,
                  }}
                >
                  {parameterRows.length} {parameterRows.length === 1 ? 'Parameter' : 'Parameters'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setJsonModalProfile(null);
                setJsonTab('view');
                setJsonImportError('');
                setIsJsonModalOpen(true);
              }}
              className="btn btn-secondary"
              style={{ height: '32px', fontSize: '0.78rem' }}
              title="View JSON Format"
            >
              <FileJson size={14} />
              <span>JSON View</span>
            </button>

            <button
              type="button"
              onClick={handleAddRow}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
              <span>Add Parameter</span>
            </button>
          </div>
        </div>

        {/* Registers Table matching Screenshot 1 */}
        <div style={{ overflowX: 'auto', padding: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.80rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-table-header, #1e293b)', color: '#ffffff', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 10px', width: '36px', textAlign: 'center', color: '#ffffff' }}>#</th>
                <th style={{ padding: '10px 10px', width: '22%', textAlign: 'left', color: '#ffffff' }}>KEY</th>
                <th style={{ padding: '10px 10px', width: '22%', textAlign: 'left', color: '#ffffff' }}>DISPLAY NAME</th>
                <th style={{ padding: '10px 10px', width: '12%', textAlign: 'center', color: '#ffffff' }}>ADDRESS</th>
                <th style={{ padding: '10px 10px', width: '14%', textAlign: 'center', color: '#ffffff' }}>DATA TYPE</th>
                <th style={{ padding: '10px 10px', width: '10%', textAlign: 'center', color: '#ffffff' }}>MULTIPLIER</th>
                <th style={{ padding: '10px 10px', width: '10%', textAlign: 'center', color: '#ffffff' }}>UNIT</th>
                <th style={{ padding: '10px 10px', width: '80px', textAlign: 'center', color: '#ffffff' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {parameterRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No parameter registers added yet. Click <strong style={{ color: '#166534' }}>"+ Add Parameter"</strong> to configure registers.
                  </td>
                </tr>
              ) : (
                parameterRows.map((row, index) => {
                  const isHighlighted = activeEditingIndex === index;
                  const isRowKeyDuplicate = Boolean(row.key && (duplicateKeyCountsInRows[row.key.trim().toLowerCase()] || 0) > 1);

                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        backgroundColor: isHighlighted ? 'var(--bg-table-row-hover, #f1f5f9)' : 'transparent',
                      }}
                    >
                      {/* # */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {index + 1}
                      </td>

                      {/* KEY dropdown (Select2) */}
                      <td style={{ padding: '8px 10px', minWidth: '180px' }}>
                        <Select2
                          size="sm"
                          searchable={true}
                          value={row.key}
                          onChange={(val) => {
                            if (val === '__custom__') {
                              const custom = window.prompt('Enter custom register key (e.g. custom_energy_total):');
                              if (custom && custom.trim()) {
                                handleRowChange(index, 'key', custom.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                              }
                            } else {
                              handleRowChange(index, 'key', val);
                            }
                          }}
                          placeholder="Select Key..."
                          style={{
                            width: '100%',
                            borderColor: isRowKeyDuplicate ? 'var(--status-danger-border)' : undefined,
                          }}
                          options={[
                            ...parameterOptions.map((sp) => ({ value: sp.key, label: sp.key })),
                            ...(row.key && !parameterOptions.some((sp) => sp.key === row.key) ? [{ value: row.key, label: row.key }] : []),
                            { value: '__custom__', label: '+ Custom Key...' },
                          ]}
                        />
                        {isRowKeyDuplicate && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--status-danger-text)', display: 'block', marginTop: '2px' }}>
                            Duplicate key
                          </span>
                        )}
                      </td>

                      {/* DISPLAY NAME */}
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="text"
                          value={row.display_name}
                          onChange={(e) => handleRowChange(index, 'display_name', e.target.value)}
                          placeholder="e.g. Watts Total"
                          className="form-input"
                          style={{ width: '100%', height: '32px', fontSize: '0.78rem', fontWeight: 600 }}
                        />
                      </td>

                      {/* ADDRESS */}
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="number"
                          value={row.address}
                          onChange={(e) => handleRowChange(index, 'address', e.target.value)}
                          placeholder="40101"
                          className="form-input"
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.78rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        />
                      </td>

                      {/* DATA TYPE (Select2) */}
                      <td style={{ padding: '8px 10px', minWidth: '110px' }}>
                        <Select2
                          size="sm"
                          searchable={false}
                          value={row.datatype}
                          onChange={(val) => handleRowChange(index, 'datatype', val)}
                          options={[
                            { value: 'float32', label: 'float32' },
                            { value: 'uint32', label: 'uint32' },
                            { value: 'int32', label: 'int32' },
                            { value: 'uint16', label: 'uint16' },
                            { value: 'int16', label: 'int16' },
                            { value: 'int64', label: 'int64' },
                            { value: 'uint64', label: 'uint64' },
                          ]}
                          style={{ width: '100%' }}
                        />
                      </td>

                      {/* MULTIPLIER */}
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="number"
                          step="any"
                          value={row.multiplier !== undefined ? row.multiplier : 1}
                          onChange={(e) => handleRowChange(index, 'multiplier', e.target.value === '' ? '' : e.target.value)}
                          placeholder="1"
                          className="form-input"
                          style={{ width: '100%', height: '32px', fontSize: '0.78rem', textAlign: 'center', fontFamily: 'monospace' }}
                        />
                      </td>

                      {/* UNIT (Select2) */}
                      <td style={{ padding: '8px 10px', minWidth: '100px' }}>
                        <Select2
                          size="sm"
                          searchable={true}
                          value={row.unit || ''}
                          onChange={(val) => {
                            if (val === '__custom__') {
                              const custom = window.prompt('Enter custom unit (e.g. kV, MWh, °C):');
                              if (custom !== null && custom.trim()) {
                                handleRowChange(index, 'unit', custom.trim());
                              }
                            } else {
                              handleRowChange(index, 'unit', val);
                            }
                          }}
                          placeholder="Unit"
                          style={{ width: '100%' }}
                          options={[
                            ...Array.from(
                              new Set([
                                'W', 'kW', 'MW', 'Wh', 'kWh', 'MWh',
                                'V', 'kV', 'A', 'kA', 'Hz', 'PF',
                                'VA', 'kVA', 'VAR', 'kVAR', 'hrs', 's', 'RPM',
                                ...standardParameters.map((p) => p.unit).filter(Boolean),
                              ])
                            ).map((u) => ({ value: u, label: u })),
                            { value: '__custom__', label: '+ Custom...' },
                          ]}
                        />
                      </td>

                      {/* ACTIONS: Edit (pencil) & Delete (trash) matching Screenshot 1 */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleEditRow(index)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '5px',
                              border: '1px solid #bae6fd',
                              backgroundColor: '#f0f9ff',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Highlight row"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRow(index)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '5px',
                              border: '1px solid #fecdd3',
                              backgroundColor: '#fff1f2',
                              color: '#e11d48',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {renderJsonModal()}
    </div>
  );
};

export const MeterProfileView = MeterProfilePage;
export default MeterProfilePage;

