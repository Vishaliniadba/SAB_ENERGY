import React, { createContext, useContext, useState, useEffect } from 'react';
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

const EnergyDataContext = createContext(null);

export const EnergyDataProvider = ({ children }) => {
  const load = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  };

  const [gateways, setGateways] = useState(() => load('sab_gateways', initialGateways));
  const [gatewayMakes, setGatewayMakes] = useState(() => load('sab_gw_makes', initialGatewayMakes));
  const [gatewayModels, setGatewayModels] = useState(() => load('sab_gw_models', initialGatewayModels));
  const [channels, setChannels] = useState(() => load('sab_channels', initialChannels));
  const [meters, setMeters] = useState(() => load('sab_meters', initialMeters));
  const [assets, setAssets] = useState(() => load('sab_assets', initialAssets));
  const [mappings, setMappings] = useState(() => load('sab_mappings', initialAssetMeterMappings));
  const [makes, setMakes] = useState(() => load('sab_makes', initialMakes));
  const [models, setModels] = useState(() => load('sab_models', initialModels));
  const [standardParameters, setStandardParameters] = useState(() => load('sab_standard_parameters', initialStandardParameters));
  const [meterProfiles, setMeterProfiles] = useState(() => {
    const saved = localStorage.getItem('sab_meter_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(p => {
          let params = p.parameters || [];
          if (p.profile_id === 'PROF-ELM-01' && params.length < 30) {
            const elmDefault = initialMeterProfiles.find(ip => ip.profile_id === 'PROF-ELM-01');
            if (elmDefault && elmDefault.parameters) {
              params = elmDefault.parameters;
            }
          }
          return {
            ...p,
            parameters: params.map(param => ({
              ...param,
              multiplier: param.multiplier !== undefined ? param.multiplier : (param.scale !== undefined ? param.scale : 1.0)
            }))
          };
        });
      } catch (e) {
        return initialMeterProfiles;
      }
    }
    return initialMeterProfiles;
  });
  const [config, setConfig] = useState(() => load('sab_config', initialConfig));

  // Persist
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
    setGateways(prev => prev.filter(g => g.Gateway_id !== id));
  };

  // ─── CHANNEL OPERATIONS ───────────────────────────────────────────────────
  const addChannel = (ch) => {
    const newCh = {
      ...ch,
      Channel_id: ch.Channel_id || `CH-${Math.floor(10 + Math.random() * 90)}`,
      created_at: getNow(),
      updated_at: getNow()
    };
    setChannels(prev => [newCh, ...prev]);
  };
  const updateChannel = (id, fields) => {
    setChannels(prev => prev.map(c => c.Channel_id === id ? { ...c, ...fields, updated_at: getNow() } : c));
  };
  const deleteChannel = (id) => {
    setChannels(prev => prev.filter(c => c.Channel_id !== id));
  };

  // ─── METER OPERATIONS ─────────────────────────────────────────────────────
  const addMeter = (meter) => {
    const newMtr = {
      ...meter,
      Meter_id: meter.Meter_id || `MTR-${Math.floor(100 + Math.random() * 900)}`,
      created_at: getNow(),
      updated_at: getNow()
    };
    setMeters(prev => [newMtr, ...prev]);
  };
  const updateMeter = (id, fields) => {
    setMeters(prev => prev.map(m => m.Meter_id === id ? { ...m, ...fields, updated_at: getNow() } : m));
  };
  const deleteMeter = (id) => {
    setMeters(prev => prev.filter(m => m.Meter_id !== id));
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
  };

  return (
    <EnergyDataContext.Provider value={{
      gateways, gatewayMakes, gatewayModels,
      channels, meters, assets, mappings,
      makes, models, standardParameters, meterProfiles, config,
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
