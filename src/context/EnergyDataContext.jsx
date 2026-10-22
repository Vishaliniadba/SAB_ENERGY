import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialGateways,
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
  // Load from localStorage or fallback to initial data
  const [gateways, setGateways] = useState(() => {
    const saved = localStorage.getItem('sab_gateways');
    return saved ? JSON.parse(saved) : initialGateways;
  });

  const [channels, setChannels] = useState(() => {
    const saved = localStorage.getItem('sab_channels');
    return saved ? JSON.parse(saved) : initialChannels;
  });

  const [meters, setMeters] = useState(() => {
    const saved = localStorage.getItem('sab_meters');
    return saved ? JSON.parse(saved) : initialMeters;
  });

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('sab_assets');
    return saved ? JSON.parse(saved) : initialAssets;
  });

  const [mappings, setMappings] = useState(() => {
    const saved = localStorage.getItem('sab_mappings');
    return saved ? JSON.parse(saved) : initialAssetMeterMappings;
  });

  const [meterProfiles, setMeterProfiles] = useState(() => {
    const saved = localStorage.getItem('sab_meter_profiles');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure make_id and model_id are present on default profile if loaded from old cache
      return parsed.map(p => {
        if (p.model === 'LG5310' && !p.make_id) {
          return { ...p, make_id: 'MAKE-ELM', model_id: 'MOD-LG5310' };
        }
        if (p.model === 'EM6400NG' && !p.make_id) {
          return { ...p, make_id: 'MAKE-SCH', model_id: 'MOD-EM6400NG' };
        }
        return p;
      });
    }
    return initialMeterProfiles;
  });

  const [makes, setMakes] = useState(() => {
    const saved = localStorage.getItem('sab_makes');
    return saved ? JSON.parse(saved) : initialMakes;
  });

  const [models, setModels] = useState(() => {
    const saved = localStorage.getItem('sab_models');
    return saved ? JSON.parse(saved) : initialModels;
  });

  const [standardParameters, setStandardParameters] = useState(() => {
    const saved = localStorage.getItem('sab_standard_parameters');
    return saved ? JSON.parse(saved) : initialStandardParameters;
  });

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('sab_config');
    return saved ? JSON.parse(saved) : initialConfig;
  });

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('sab_gateways', JSON.stringify(gateways));
  }, [gateways]);

  useEffect(() => {
    localStorage.setItem('sab_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('sab_meters', JSON.stringify(meters));
  }, [meters]);

  useEffect(() => {
    localStorage.setItem('sab_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('sab_mappings', JSON.stringify(mappings));
  }, [mappings]);

  useEffect(() => {
    localStorage.setItem('sab_meter_profiles', JSON.stringify(meterProfiles));
  }, [meterProfiles]);

  useEffect(() => {
    localStorage.setItem('sab_makes', JSON.stringify(makes));
  }, [makes]);

  useEffect(() => {
    localStorage.setItem('sab_models', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem('sab_standard_parameters', JSON.stringify(standardParameters));
  }, [standardParameters]);

  useEffect(() => {
    localStorage.setItem('sab_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('sab_meters', JSON.stringify(meters));
  }, [meters]);

  useEffect(() => {
    localStorage.setItem('sab_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('sab_mappings', JSON.stringify(mappings));
  }, [mappings]);

  useEffect(() => {
    localStorage.setItem('sab_meter_profiles', JSON.stringify(meterProfiles));
  }, [meterProfiles]);

  useEffect(() => {
    localStorage.setItem('sab_config', JSON.stringify(config));
  }, [config]);

  // Helper date formatter
  const getNowFormatted = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  };

  // --- GATEWAY OPERATIONS ---
  const addGateway = (gateway) => {
    const newGw = {
      ...gateway,
      Gateway_id: gateway.Gateway_id || `GW-${Math.floor(100 + Math.random() * 900)}`,
      created_at: getNowFormatted(),
      updated_at: getNowFormatted()
    };
    setGateways(prev => [newGw, ...prev]);
  };

  const updateGateway = (id, updatedFields) => {
    setGateways(prev => prev.map(g => 
      g.Gateway_id === id ? { ...g, ...updatedFields, updated_at: getNowFormatted() } : g
    ));
  };

  const deleteGateway = (id) => {
    setGateways(prev => prev.filter(g => g.Gateway_id !== id));
  };

  // --- CHANNEL OPERATIONS ---
  const addChannel = (channel) => {
    const newCh = {
      ...channel,
      Channel_id: channel.Channel_id || `CH-${Math.floor(10 + Math.random() * 90)}`,
      created_at: getNowFormatted(),
      updated_at: getNowFormatted()
    };
    setChannels(prev => [newCh, ...prev]);
  };

  const updateChannel = (id, updatedFields) => {
    setChannels(prev => prev.map(c => 
      c.Channel_id === id ? { ...c, ...updatedFields, updated_at: getNowFormatted() } : c
    ));
  };

  const deleteChannel = (id) => {
    setChannels(prev => prev.filter(c => c.Channel_id !== id));
  };

  // --- METER OPERATIONS ---
  const addMeter = (meter) => {
    const newMtr = {
      ...meter,
      Meter_id: meter.Meter_id || `MTR-${Math.floor(100 + Math.random() * 900)}`,
      created_at: getNowFormatted(),
      updated_at: getNowFormatted()
    };
    setMeters(prev => [newMtr, ...prev]);
  };

  const updateMeter = (id, updatedFields) => {
    setMeters(prev => prev.map(m => 
      m.Meter_id === id ? { ...m, ...updatedFields, updated_at: getNowFormatted() } : m
    ));
  };

  const deleteMeter = (id) => {
    setMeters(prev => prev.filter(m => m.Meter_id !== id));
  };

  // --- ASSET OPERATIONS ---
  const addAsset = (asset) => {
    const newAst = {
      ...asset,
      Asset_id: asset.Asset_id || `AST-${Math.floor(500 + Math.random() * 400)}`,
      created_at: getNowFormatted(),
      updated_at: getNowFormatted()
    };
    setAssets(prev => [newAst, ...prev]);
  };

  const updateAsset = (id, updatedFields) => {
    setAssets(prev => prev.map(a => 
      a.Asset_id === id ? { ...a, ...updatedFields, updated_at: getNowFormatted() } : a
    ));
  };

  const deleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.Asset_id !== id));
  };

  // --- MAPPING OPERATIONS ---
  const addMapping = (mapping) => {
    const newMap = {
      ...mapping,
      Mapping_id: mapping.Mapping_id || `MAP-${Math.floor(100 + Math.random() * 900)}`,
      multiplication_factor: mapping.multiplication_factor || "1",
      is_active: mapping.is_active !== undefined ? mapping.is_active : true,
      created_at: getNowFormatted(),
      updated_at: getNowFormatted()
    };
    setMappings(prev => [newMap, ...prev]);
  };

  const updateMapping = (id, updatedFields) => {
    setMappings(prev => prev.map(m => 
      m.Mapping_id === id ? { ...m, ...updatedFields, updated_at: getNowFormatted() } : m
    ));
  };

  const deleteMapping = (id) => {
    setMappings(prev => prev.filter(m => m.Mapping_id !== id));
  };

  const toggleMappingActive = (id) => {
    setMappings(prev => prev.map(m => 
      m.Mapping_id === id ? { ...m, is_active: !m.is_active, updated_at: getNowFormatted() } : m
    ));
  };

  // Configure Meter directly as an Asset (Creates or updates Asset + Mapping)
  const configureMeterAsAsset = ({ meterId, assetData, multiplicationFactor, effectiveFrom, effectiveTo }) => {
    let assetId = assetData.Asset_id;
    if (!assetId) {
      assetId = `AST-${Math.floor(500 + Math.random() * 400)}`;
      const newAsset = {
        ...assetData,
        Asset_id: assetId,
        created_at: getNowFormatted(),
        updated_at: getNowFormatted()
      };
      setAssets(prev => [newAsset, ...prev]);
    } else {
      setAssets(prev => prev.map(a => a.Asset_id === assetId ? { ...a, ...assetData, updated_at: getNowFormatted() } : a));
    }

    const existingMapping = mappings.find(m => m.Meter_id === meterId);
    if (existingMapping) {
      setMappings(prev => prev.map(m => 
        m.Mapping_id === existingMapping.Mapping_id ? {
          ...m,
          Asset_id: assetId,
          multiplication_factor: multiplicationFactor || m.multiplication_factor || "1",
          effective_from: effectiveFrom || m.effective_from,
          effective_to: effectiveTo || m.effective_to,
          is_active: true,
          updated_at: getNowFormatted()
        } : m
      ));
    } else {
      addMapping({
        Asset_id: assetId,
        Meter_id: meterId,
        multiplication_factor: multiplicationFactor || "1",
        effective_from: effectiveFrom || new Date().toISOString().substring(0, 10),
        effective_to: effectiveTo || "2027-12-31",
        is_active: true
      });
    }
  };

  // --- MAKE (MANUFACTURER) MASTER OPERATIONS ---
  const addMake = (make) => {
    const newMake = {
      ...make,
      make_id: make.make_id || `MAKE-${make.make_name ? make.make_name.toUpperCase().slice(0, 3) : 'NEW'}-${Date.now().toString().slice(-4)}`,
      created_at: getNowFormatted()
    };
    setMakes(prev => [...prev, newMake]);
    return newMake;
  };

  const updateMake = (makeId, updatedFields) => {
    setMakes(prev => prev.map(m => m.make_id === makeId ? { ...m, ...updatedFields } : m));
    // Also cascade update make_name in profiles if changed
    if (updatedFields.make_name) {
      setMeterProfiles(prev => prev.map(p => p.make_id === makeId ? { ...p, make: updatedFields.make_name } : p));
    }
  };

  const deleteMake = (makeId) => {
    setMakes(prev => prev.filter(m => m.make_id !== makeId));
  };

  // --- MODEL MASTER OPERATIONS ---
  const addModel = (model) => {
    const newModel = {
      ...model,
      model_id: model.model_id || `MOD-${model.model_name ? model.model_name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) : 'NEW'}`,
      created_at: getNowFormatted()
    };
    setModels(prev => [...prev, newModel]);
    return newModel;
  };

  const updateModel = (modelId, updatedFields) => {
    setModels(prev => prev.map(m => m.model_id === modelId ? { ...m, ...updatedFields } : m));
    // Cascade update model in profiles if changed
    if (updatedFields.model_name) {
      setMeterProfiles(prev => prev.map(p => p.model_id === modelId ? { ...p, model: updatedFields.model_name } : p));
    }
  };

  const deleteModel = (modelId) => {
    setModels(prev => prev.filter(m => m.model_id !== modelId));
  };

  // --- STANDARD PARAMETERS MASTER OPERATIONS ---
  const addStandardParameter = (param) => {
    setStandardParameters(prev => [...prev.filter(p => p.key !== param.key), param]);
  };

  const deleteStandardParameter = (key) => {
    setStandardParameters(prev => prev.filter(p => p.key !== key));
  };

  // --- METER PROFILE OPERATIONS ---
  const addMeterProfile = (profile) => {
    const newProf = {
      ...profile,
      profile_id: profile.profile_id || `PROF-${profile.make ? profile.make.toUpperCase().slice(0, 3) : 'GEN'}-${Date.now().toString().slice(-4)}`,
      parameters: profile.parameters || []
    };
    setMeterProfiles(prev => [newProf, ...prev]);
    return newProf;
  };

  const updateMeterProfile = (id, updatedFields) => {
    setMeterProfiles(prev => prev.map(p => 
      p.profile_id === id ? { ...p, ...updatedFields } : p
    ));
  };

  const deleteMeterProfile = (id) => {
    setMeterProfiles(prev => prev.filter(p => p.profile_id !== id));
  };

  const addParameterToProfile = (profileId, param) => {
    setMeterProfiles(prev => prev.map(p => {
      if (p.profile_id === profileId) {
        return {
          ...p,
          parameters: [...(p.parameters || []), param]
        };
      }
      return p;
    }));
  };

  const updateParameterInProfile = (profileId, paramKey, updatedFields) => {
    setMeterProfiles(prev => prev.map(p => {
      if (p.profile_id === profileId) {
        return {
          ...p,
          parameters: (p.parameters || []).map(item => item.key === paramKey ? { ...item, ...updatedFields } : item)
        };
      }
      return p;
    }));
  };

  const bulkAddParametersToProfile = (profileId, paramsArray) => {
    setMeterProfiles(prev => prev.map(p => {
      if (p.profile_id === profileId) {
        const existingKeys = new Set((p.parameters || []).map(x => x.key));
        const newToAdd = paramsArray.filter(x => !existingKeys.has(x.key));
        return {
          ...p,
          parameters: [...(p.parameters || []), ...newToAdd]
        };
      }
      return p;
    }));
  };

  const deleteParameterFromProfile = (profileId, paramKey) => {
    setMeterProfiles(prev => prev.map(p => {
      if (p.profile_id === profileId) {
        return {
          ...p,
          parameters: (p.parameters || []).filter(item => item.key !== paramKey)
        };
      }
      return p;
    }));
  };

  // --- CONFIG OPERATIONS ---
  const updateConfig = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetToFactoryDefaults = () => {
    setGateways(initialGateways);
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
    <EnergyDataContext.Provider
      value={{
        gateways,
        channels,
        meters,
        assets,
        mappings,
        makes,
        models,
        standardParameters,
        meterProfiles,
        config,
        addGateway,
        updateGateway,
        deleteGateway,
        addChannel,
        updateChannel,
        deleteChannel,
        addMeter,
        updateMeter,
        deleteMeter,
        addAsset,
        updateAsset,
        deleteAsset,
        addMapping,
        updateMapping,
        deleteMapping,
        toggleMappingActive,
        configureMeterAsAsset,
        addMake,
        updateMake,
        deleteMake,
        addModel,
        updateModel,
        deleteModel,
        addStandardParameter,
        deleteStandardParameter,
        addMeterProfile,
        updateMeterProfile,
        deleteMeterProfile,
        addParameterToProfile,
        updateParameterInProfile,
        bulkAddParametersToProfile,
        deleteParameterFromProfile,
        updateConfig,
        resetToFactoryDefaults
      }}
    >
      {children}
    </EnergyDataContext.Provider>
  );
};

export const useEnergyData = () => {
  const context = useContext(EnergyDataContext);
  if (!context) {
    throw new Error('useEnergyData must be used within an EnergyDataProvider');
  }
  return context;
};
