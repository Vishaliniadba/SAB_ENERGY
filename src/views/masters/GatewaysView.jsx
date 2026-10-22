import React, { useState } from 'react';
import {
  Plus,
  Search,
  Radio,
  Edit2,
  Trash2,
  Network,
  Cpu,
  Boxes,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Zap,
  Sliders,
  Settings2,
  Sun,
  Wind,
  Flame,
  Layers,
  ChevronRight,
  ChevronDown,
  Activity,
  HardDrive,
  MoreVertical,
  Link2,
  ShieldCheck
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const GatewaysView = () => {
  const {
    gateways,
    channels,
    meters,
    assets,
    mappings,
    addGateway,
    updateGateway,
    deleteGateway,
    addChannel,
    updateChannel,
    deleteChannel,
    addMeter,
    updateMeter,
    deleteMeter,
    configureMeterAsAsset
  } = useEnergyData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGatewayId, setSelectedGatewayId] = useState(gateways[0]?.Gateway_id || '');

  // Modal States
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);

  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [targetGatewayId, setTargetGatewayId] = useState('');

  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [targetChannelId, setTargetChannelId] = useState('');

  const [isAssetConfigModalOpen, setIsAssetConfigModalOpen] = useState(false);
  const [targetMeterForAsset, setTargetMeterForAsset] = useState(null);

  // Form States
  const [gatewayForm, setGatewayForm] = useState({
    Gateway_name: '',
    serial_number: '',
    ip_address: '',
    mac_address: '',
    status: 'Active',
    firmware_version: 'v2.4.1'
  });

  const [channelForm, setChannelForm] = useState({
    Gateway_id: '',
    Channel_name: '',
    protocol: 'Modbus RTU',
    baud_rate: '9600',
    port: 'COM1',
    status: 'Active'
  });

  const [meterForm, setMeterForm] = useState({
    Channel_id: '',
    Meter_name: '',
    meter_serial_number: '',
    slave_id: '1',
    meter_model: 'Schneider EM6400NG',
    status: 'Active'
  });

  const [assetConfigForm, setAssetConfigForm] = useState({
    mode: 'new',
    Asset_id: '',
    Asset_name: '',
    asset_type: 'Solar Panel',
    capacity: '500 kW',
    location: 'Building Zone 1',
    description: 'Directly linked energy meter device',
    multiplication_factor: '40',
    effective_from: new Date().toISOString().substring(0, 10),
    effective_to: '2027-12-31'
  });

  // Active Selected Gateway
  const currentGateway = gateways.find(g => g.Gateway_id === selectedGatewayId) || gateways[0];
  const currentChannels = currentGateway ? channels.filter(c => c.Gateway_id === currentGateway.Gateway_id) : [];

  // --- GATEWAY MODAL HANDLERS ---
  const handleOpenAddGateway = () => {
    setEditingGateway(null);
    setGatewayForm({
      Gateway_name: '',
      serial_number: `SAB-GW-2026-${Math.floor(100 + Math.random() * 900)}`,
      ip_address: '192.168.1.100',
      mac_address: '00:1B:44:AA:BB:CC',
      status: 'Active',
      firmware_version: 'v2.4.1'
    });
    setIsGatewayModalOpen(true);
  };

  const handleOpenEditGateway = (gw) => {
    setEditingGateway(gw);
    setGatewayForm({
      Gateway_name: gw.Gateway_name,
      serial_number: gw.serial_number,
      ip_address: gw.ip_address,
      mac_address: gw.mac_address,
      status: gw.status,
      firmware_version: gw.firmware_version
    });
    setIsGatewayModalOpen(true);
  };

  const handleGatewaySubmit = (e) => {
    e.preventDefault();
    if (editingGateway) {
      updateGateway(editingGateway.Gateway_id, gatewayForm);
    } else {
      addGateway(gatewayForm);
    }
    setIsGatewayModalOpen(false);
  };

  // --- CHANNEL MODAL HANDLERS ---
  const handleOpenAddChannel = (gwId) => {
    setEditingChannel(null);
    setTargetGatewayId(gwId);
    setChannelForm({
      Gateway_id: gwId,
      Channel_name: '',
      protocol: 'Modbus RTU',
      baud_rate: '9600',
      port: 'COM1',
      status: 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const handleOpenEditChannel = (ch) => {
    setEditingChannel(ch);
    setTargetGatewayId(ch.Gateway_id);
    setChannelForm({
      Gateway_id: ch.Gateway_id,
      Channel_name: ch.Channel_name,
      protocol: ch.protocol,
      baud_rate: ch.baud_rate,
      port: ch.port,
      status: ch.status
    });
    setIsChannelModalOpen(true);
  };

  const handleChannelSubmit = (e) => {
    e.preventDefault();
    if (editingChannel) {
      updateChannel(editingChannel.Channel_id, channelForm);
    } else {
      addChannel({ ...channelForm, Gateway_id: targetGatewayId });
    }
    setIsChannelModalOpen(false);
  };

  // --- METER MODAL HANDLERS ---
  const handleOpenAddMeter = (chId) => {
    setEditingMeter(null);
    setTargetChannelId(chId);
    setMeterForm({
      Channel_id: chId,
      Meter_name: '',
      meter_serial_number: `SCH-MTR-${Math.floor(1000 + Math.random() * 9000)}`,
      slave_id: `${meters.length + 1}`,
      meter_model: 'Schneider EM6400NG',
      status: 'Active'
    });
    setIsMeterModalOpen(true);
  };

  const handleOpenEditMeter = (mtr) => {
    setEditingMeter(mtr);
    setTargetChannelId(mtr.Channel_id);
    setMeterForm({
      Channel_id: mtr.Channel_id,
      Meter_name: mtr.Meter_name,
      meter_serial_number: mtr.meter_serial_number,
      slave_id: mtr.slave_id,
      meter_model: mtr.meter_model,
      status: mtr.status
    });
    setIsMeterModalOpen(true);
  };

  const handleMeterSubmit = (e) => {
    e.preventDefault();
    if (editingMeter) {
      updateMeter(editingMeter.Meter_id, meterForm);
    } else {
      addMeter({ ...meterForm, Channel_id: targetChannelId });
    }
    setIsMeterModalOpen(false);
  };

  // --- ASSET CONFIG MODAL HANDLERS ---
  const handleOpenAssetConfig = (mtr) => {
    setTargetMeterForAsset(mtr);
    const existingMap = mappings.find(m => m.Meter_id === mtr.Meter_id);
    const linkedAsset = existingMap ? assets.find(a => a.Asset_id === existingMap.Asset_id) : null;

    if (linkedAsset && existingMap) {
      setAssetConfigForm({
        mode: 'existing',
        Asset_id: linkedAsset.Asset_id,
        Asset_name: linkedAsset.Asset_name,
        asset_type: linkedAsset.asset_type,
        capacity: linkedAsset.capacity,
        location: linkedAsset.location,
        description: linkedAsset.description,
        multiplication_factor: existingMap.multiplication_factor || '40',
        effective_from: existingMap.effective_from || new Date().toISOString().substring(0, 10),
        effective_to: existingMap.effective_to || '2027-12-31'
      });
    } else {
      setAssetConfigForm({
        mode: 'new',
        Asset_id: '',
        Asset_name: `${mtr.Meter_name} Asset`,
        asset_type: 'Solar Panel',
        capacity: '500 kW',
        location: 'Plant Zone 1',
        description: `Directly linked from meter ${mtr.Meter_id}`,
        multiplication_factor: '40',
        effective_from: new Date().toISOString().substring(0, 10),
        effective_to: '2027-12-31'
      });
    }
    setIsAssetConfigModalOpen(true);
  };

  const handleAssetConfigSubmit = (e) => {
    e.preventDefault();
    if (!targetMeterForAsset) return;

    let assetData;
    if (assetConfigForm.mode === 'existing') {
      const selected = assets.find(a => a.Asset_id === assetConfigForm.Asset_id);
      assetData = selected || { Asset_id: assetConfigForm.Asset_id };
    } else {
      assetData = {
        Asset_name: assetConfigForm.Asset_name,
        asset_type: assetConfigForm.asset_type,
        capacity: assetConfigForm.capacity,
        location: assetConfigForm.location,
        description: assetConfigForm.description,
        status: 'Active'
      };
    }

    configureMeterAsAsset({
      meterId: targetMeterForAsset.Meter_id,
      assetData,
      multiplicationFactor: assetConfigForm.multiplication_factor,
      effectiveFrom: assetConfigForm.effective_from,
      effectiveTo: assetConfigForm.effective_to
    });

    setIsAssetConfigModalOpen(false);
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'Solar Panel': return <Sun size={14} color="#d97706" />;
      case 'Wind Turbine': return <Wind size={14} color="#0284c7" />;
      case 'Generator': return <Flame size={14} color="#e11d48" />;
      default: return <Zap size={14} color="#059669" />;
    }
  };

  const filteredGateways = gateways.filter(gw =>
    gw.Gateway_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gw.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gw.ip_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Bar with Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Gateways
          </h2>
        </div>

        <button
          onClick={handleOpenAddGateway}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
        >
          <Plus size={16} />
          <span>New Gateway</span>
        </button>
      </div>

      {/* 2. Sleek Gateway Selector Pills / Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px'
        }}
      >
        {filteredGateways.map((gw) => {
          const isSelected = (currentGateway?.Gateway_id === gw.Gateway_id);
          const gwChannels = channels.filter(c => c.Gateway_id === gw.Gateway_id);
          const gwChannelIds = gwChannels.map(c => c.Channel_id);
          const gwMeters = meters.filter(m => gwChannelIds.includes(m.Channel_id));
          const gwMappedCount = mappings.filter(m => gwMeters.some(mtr => mtr.Meter_id === m.Meter_id) && m.is_active).length;

          return (
            <div
              key={gw.Gateway_id}
              onClick={() => setSelectedGatewayId(gw.Gateway_id)}
              style={{
                backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.1)' : 'none',
                transition: 'all 0.15s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#f0f9ff' : '#f1f5f9',
                    color: isSelected ? '#0284c7' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Radio size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {gw.Gateway_name}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {gw.Gateway_id}
                    </span>
                  </div>
                </div>
                <Badge status={gw.status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <span>IP: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{gw.ip_address}</strong></span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {gwChannels.length} Ch • {gwMeters.length} Mtr • {gwMappedCount} Assets
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Topology Workspace for the Selected Gateway */}
      {currentGateway && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            overflow: 'hidden'
          }}
        >
          {/* Active Gateway Detail Banner */}
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <Radio size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {currentGateway.Gateway_name}
                  </h3>
                  <Badge status={currentGateway.status} />
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  <span>IP: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{currentGateway.ip_address}</strong></span>
                  <span>MAC: <span style={{ fontFamily: 'monospace' }}>{currentGateway.mac_address}</span></span>
                  <span>Serial: <span style={{ fontFamily: 'monospace' }}>{currentGateway.serial_number}</span></span>
                  <span>Firmware: <strong>{currentGateway.firmware_version}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleOpenAddChannel(currentGateway.Gateway_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                Add Channel
              </button>
              <button
                onClick={() => handleOpenEditGateway(currentGateway)}
                style={iconBtnStyle}
                title="Edit Gateway"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete gateway "${currentGateway.Gateway_name}"?`)) {
                    deleteGateway(currentGateway.Gateway_id);
                  }
                }}
                style={iconBtnDangerStyle}
                title="Delete Gateway"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Channels & Devices Content Area */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Channels & Connected Devices ({currentChannels.length})
                </h4>
              </div>

              <button
                onClick={() => handleOpenAddChannel(currentGateway.Gateway_id)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0284c7',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                New Channel
              </button>
            </div>

            {currentChannels.length === 0 ? (
              <div style={{ padding: '40px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center' }}>
                <Network size={28} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>No Channels Added Yet</h5>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 14px' }}>
                  Add your first communication channel (Modbus RTU RS485 loop, TCP link, or MQTT broker).
                </p>
                <button
                  onClick={() => handleOpenAddChannel(currentGateway.Gateway_id)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Add Communication Channel
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '22px' }}>
                {currentChannels.map((ch, chIdx) => {
                  const chMeters = meters.filter(m => m.Channel_id === ch.Channel_id);
                  const chNum = String(chIdx + 1).padStart(2, '0');
                  
                  // Professional Blue identification theme for channels
                  const channelThemes = [
                    {
                      labelBg: '#0284c7',
                      labelColor: '#ffffff',
                      topBorder: '4px solid #0284c7',
                      cardBorder: '1.5px solid #bae6fd',
                      cardBg: '#f0f9ff',
                      headerBg: '#e0f2fe',
                      headerBorder: '#bae6fd',
                      iconBg: '#ffffff',
                      iconColor: '#0284c7',
                      protoBg: '#ffffff',
                    },
                    {
                      labelBg: '#0369a1',
                      labelColor: '#ffffff',
                      topBorder: '4px solid #0284c7',
                      cardBorder: '1.5px solid #bae6fd',
                      cardBg: '#f0f9ff',
                      headerBg: '#e0f2fe',
                      headerBorder: '#bae6fd',
                      iconBg: '#ffffff',
                      iconColor: '#0284c7',
                      protoBg: '#ffffff',
                    },
                  ];

                  const theme = channelThemes[chIdx % channelThemes.length];

                  return (
                    <div
                      key={ch.Channel_id}
                      style={{
                        backgroundColor: theme.cardBg,
                        border: theme.cardBorder,
                        borderTop: theme.topBorder,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Channel Card Header with Prominent Identification */}
                      <div
                        style={{
                          padding: '14px 18px',
                          backgroundColor: theme.headerBg,
                          borderBottom: `1px solid ${theme.headerBorder}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Channel ID Badge */}
                          <div
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: theme.labelBg,
                              color: theme.labelColor,
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              fontFamily: 'monospace',
                              letterSpacing: '0.04em',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
                            }}
                          >
                            CH {chNum}
                          </div>

                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: theme.iconBg, color: theme.iconColor, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <Network size={16} />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                                {ch.Channel_name}
                              </span>
                              <Badge status={ch.status} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#475569', marginTop: '3px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: theme.labelBg, backgroundColor: theme.protoBg, padding: '1px 6px', borderRadius: '4px', border: `1px solid ${theme.headerBorder}` }}>
                                {ch.protocol}
                              </span>
                              <span>Port: <strong style={{ color: '#0f172a' }}>{ch.port}</strong></span>
                              <span>Baud: <strong style={{ color: '#0f172a' }}>{ch.baud_rate}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenAddMeter(ch.Channel_id)}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#059669',
                              borderRadius: '6px',
                              padding: '5px 11px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            }}
                          >
                            <Plus size={13} />
                            Add Meter
                          </button>
                          <button onClick={() => handleOpenEditChannel(ch)} style={miniIconBtnStyle} title="Edit Channel">
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete channel "${ch.Channel_name}"?`)) {
                                deleteChannel(ch.Channel_id);
                              }
                            }}
                            style={miniIconBtnDangerStyle}
                            title="Delete Channel"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Meters List under this Channel */}
                      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Connected Meters ({chMeters.length})
                          </span>
                        </div>

                        {chMeters.length === 0 ? (
                          <div style={{ padding: '24px 16px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                            No meters on this channel loop yet. Click <strong>"+ Add Meter"</strong> above.
                          </div>
                        ) : (
                          chMeters.map((mtr) => {
                            const mapping = mappings.find(m => m.Meter_id === mtr.Meter_id);
                            const linkedAsset = mapping ? assets.find(a => a.Asset_id === mapping.Asset_id) : null;

                            return (
                              <div
                                key={mtr.Meter_id}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '10px',
                                  border: '1px solid #e2e8f0',
                                  backgroundColor: '#ffffff',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                {/* Top: Meter Info */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ padding: '5px', borderRadius: '6px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                                      <Cpu size={14} />
                                    </div>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                          {mtr.Meter_name}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                          ID #{mtr.slave_id}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        {mtr.meter_model} • S/N: {mtr.meter_serial_number}
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => handleOpenEditMeter(mtr)} style={miniIconBtnStyle} title="Edit Meter">
                                      <Edit2 size={11} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Delete meter "${mtr.Meter_name}"?`)) {
                                          deleteMeter(mtr.Meter_id);
                                        }
                                      }}
                                      style={miniIconBtnDangerStyle}
                                      title="Delete Meter"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                {/* Bottom: Configured Asset Ribbon */}
                                <div
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: linkedAsset ? '#f0fdf4' : '#fffbeb',
                                    border: linkedAsset ? '1px solid #bbf7d0' : '1px dashed #fde68a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px'
                                  }}
                                >
                                  {linkedAsset ? (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {getAssetIcon(linkedAsset.asset_type)}
                                        <div>
                                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                                            {linkedAsset.Asset_name}
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                                            {linkedAsset.asset_type} • Cap: {linkedAsset.capacity}
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          fontFamily: 'monospace',
                                          backgroundColor: '#e0f2fe',
                                          color: '#0284c7',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          border: '1px solid #bae6fd'
                                        }}>
                                          {mapping.multiplication_factor}x CT/PT
                                        </span>
                                        <button
                                          onClick={() => handleOpenAssetConfig(mtr)}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            color: '#334155',
                                            padding: '2px 7px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#b45309' }}>
                                        <Sliders size={13} />
                                        <span>Not configured as Asset</span>
                                      </div>
                                      <button
                                        onClick={() => handleOpenAssetConfig(mtr)}
                                        style={{
                                          background: '#d97706',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: '#ffffff',
                                          padding: '3px 9px',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        + Set Asset (CT/PT)
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Add / Edit Gateway Modal */}
      <Modal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        title={editingGateway ? `Edit Gateway: ${editingGateway.Gateway_id}` : 'Register New Gateway'}
      >
        <form onSubmit={handleGatewaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Gateway Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Substation Alpha Gateway"
              value={gatewayForm.Gateway_name}
              onChange={(e) => setGatewayForm({ ...gatewayForm, Gateway_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Serial Number</label>
              <input
                type="text"
                required
                value={gatewayForm.serial_number}
                onChange={(e) => setGatewayForm({ ...gatewayForm, serial_number: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>IP Address</label>
              <input
                type="text"
                required
                placeholder="192.168.1.xxx"
                value={gatewayForm.ip_address}
                onChange={(e) => setGatewayForm({ ...gatewayForm, ip_address: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>MAC Address</label>
              <input
                type="text"
                required
                placeholder="00:1B:44:..."
                value={gatewayForm.mac_address}
                onChange={(e) => setGatewayForm({ ...gatewayForm, mac_address: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Firmware Version</label>
              <input
                type="text"
                required
                value={gatewayForm.firmware_version}
                onChange={(e) => setGatewayForm({ ...gatewayForm, firmware_version: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Status</label>
            <select
              value={gatewayForm.status}
              onChange={(e) => setGatewayForm({ ...gatewayForm, status: e.target.value })}
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsGatewayModalOpen(false)} style={btnCancelStyle}>
              Cancel
            </button>
            <button type="submit" style={btnSubmitStyle}>
              {editingGateway ? 'Save Changes' : 'Create Gateway'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Add / Edit Channel Modal */}
      <Modal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        title={editingChannel ? `Edit Channel: ${editingChannel.Channel_id}` : `Add Channel to Gateway`}
      >
        <form onSubmit={handleChannelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Channel Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Incomer Feeder RS485 Loop"
              value={channelForm.Channel_name}
              onChange={(e) => setChannelForm({ ...channelForm, Channel_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Protocol</label>
              <select
                value={channelForm.protocol}
                onChange={(e) => setChannelForm({ ...channelForm, protocol: e.target.value })}
                style={inputStyle}
              >
                <option value="Modbus RTU">Modbus RTU</option>
                <option value="TCP">TCP / Modbus TCP</option>
                <option value="MQTT">MQTT</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Baud Rate</label>
              <select
                value={channelForm.baud_rate}
                onChange={(e) => setChannelForm({ ...channelForm, baud_rate: e.target.value })}
                style={inputStyle}
              >
                <option value="9600">9600 bps</option>
                <option value="19200">19200 bps</option>
                <option value="38400">38400 bps</option>
                <option value="57600">57600 bps</option>
                <option value="115200">115200 bps</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Port</label>
              <input
                type="text"
                required
                placeholder="e.g. COM1 or 502"
                value={channelForm.port}
                onChange={(e) => setChannelForm({ ...channelForm, port: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Status</label>
              <select
                value={channelForm.status}
                onChange={(e) => setChannelForm({ ...channelForm, status: e.target.value })}
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsChannelModalOpen(false)} style={btnCancelStyle}>
              Cancel
            </button>
            <button type="submit" style={btnSubmitStyle}>
              {editingChannel ? 'Save Channel' : 'Create Channel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Add / Edit Meter Modal */}
      <Modal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
        title={editingMeter ? `Edit Meter: ${editingMeter.Meter_id}` : `Connect Meter Device`}
      >
        <form onSubmit={handleMeterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Meter Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Main Incomer Multi-Function Meter"
              value={meterForm.Meter_name}
              onChange={(e) => setMeterForm({ ...meterForm, Meter_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Serial Number</label>
              <input
                type="text"
                required
                value={meterForm.meter_serial_number}
                onChange={(e) => setMeterForm({ ...meterForm, meter_serial_number: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Slave ID / Device Address</label>
              <input
                type="text"
                required
                placeholder="1 to 247"
                value={meterForm.slave_id}
                onChange={(e) => setMeterForm({ ...meterForm, slave_id: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Meter Model</label>
              <input
                type="text"
                required
                placeholder="e.g. Schneider EM6400, Selec MFM384"
                value={meterForm.meter_model}
                onChange={(e) => setMeterForm({ ...meterForm, meter_model: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Status</label>
              <select
                value={meterForm.status}
                onChange={(e) => setMeterForm({ ...meterForm, status: e.target.value })}
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsMeterModalOpen(false)} style={btnCancelStyle}>
              Cancel
            </button>
            <button type="submit" style={btnSubmitStyle}>
              {editingMeter ? 'Save Meter' : 'Connect Meter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Configure Meter as Asset Modal */}
      <Modal
        isOpen={isAssetConfigModalOpen}
        onClose={() => setIsAssetConfigModalOpen(false)}
        title={`Configure Asset for Meter: ${targetMeterForAsset?.Meter_name || ''}`}
      >
        <form onSubmit={handleAssetConfigSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="radio"
                name="asset_mode"
                checked={assetConfigForm.mode === 'new'}
                onChange={() => setAssetConfigForm({ ...assetConfigForm, mode: 'new' })}
                style={{ accentColor: '#0284c7' }}
              />
              Create New Asset for this Meter
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="radio"
                name="asset_mode"
                checked={assetConfigForm.mode === 'existing'}
                onChange={() => setAssetConfigForm({ ...assetConfigForm, mode: 'existing' })}
                style={{ accentColor: '#0284c7' }}
              />
              Map to Existing Asset
            </label>
          </div>

          {assetConfigForm.mode === 'existing' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Select Existing Asset
              </label>
              <select
                value={assetConfigForm.Asset_id}
                onChange={(e) => setAssetConfigForm({ ...assetConfigForm, Asset_id: e.target.value })}
                style={inputStyle}
                required
              >
                <option value="">-- Choose Asset --</option>
                {assets.map(a => (
                  <option key={a.Asset_id} value={a.Asset_id}>
                    {a.Asset_name} ({a.asset_type} • {a.capacity})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                  Asset Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Substation Alpha Incomer Feeder"
                  value={assetConfigForm.Asset_name}
                  onChange={(e) => setAssetConfigForm({ ...assetConfigForm, Asset_name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                    Asset Type
                  </label>
                  <select
                    value={assetConfigForm.asset_type}
                    onChange={(e) => setAssetConfigForm({ ...assetConfigForm, asset_type: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Solar Panel">Solar Panel</option>
                    <option value="Generator">Generator</option>
                    <option value="Wind Turbine">Wind Turbine</option>
                    <option value="Feeder">Feeder / Substation</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                    Capacity
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 kW or 750 kVA"
                    value={assetConfigForm.capacity}
                    onChange={(e) => setAssetConfigForm({ ...assetConfigForm, capacity: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Building 1 Roof"
                    value={assetConfigForm.location}
                    onChange={(e) => setAssetConfigForm({ ...assetConfigForm, location: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={assetConfigForm.description}
                    onChange={(e) => setAssetConfigForm({ ...assetConfigForm, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}

          {/* CT/PT Multiplier */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0369a1', fontWeight: 700, marginBottom: '6px' }}>
              <Calculator size={15} />
              Multiplication Factor (CT/PT Ratio Multiplier)
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 40 (for 200:5A CT) or 1 (direct)"
              value={assetConfigForm.multiplication_factor}
              onChange={(e) => setAssetConfigForm({ ...assetConfigForm, multiplication_factor: e.target.value })}
              style={{ ...inputStyle, backgroundColor: '#ffffff', borderColor: '#0284c7' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: '4px', display: 'block' }}>
              Calculates actual energy: Real Power (kW) = Meter Telemetry × CT/PT Multiplier
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Effective From</label>
              <input
                type="date"
                required
                value={assetConfigForm.effective_from}
                onChange={(e) => setAssetConfigForm({ ...assetConfigForm, effective_from: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Effective To</label>
              <input
                type="date"
                required
                value={assetConfigForm.effective_to}
                onChange={(e) => setAssetConfigForm({ ...assetConfigForm, effective_to: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsAssetConfigModalOpen(false)} style={btnCancelStyle}>
              Cancel
            </button>
            <button type="submit" style={btnSubmitStyle}>
              Save Asset Configuration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const iconBtnStyle = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  color: '#475569',
  padding: '6px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const iconBtnDangerStyle = {
  ...iconBtnStyle,
  color: '#e11d48',
  borderColor: '#fecdd3',
  backgroundColor: '#fff1f2'
};

const miniIconBtnStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  color: '#64748b',
  padding: '3px 6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const miniIconBtnDangerStyle = {
  ...miniIconBtnStyle,
  color: '#e11d48',
  borderColor: '#fee2e2',
  backgroundColor: '#fef2f2'
};

const btnCancelStyle = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#64748b',
  cursor: 'pointer'
};

const btnSubmitStyle = {
  padding: '8px 18px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#0284c7',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  color: '#0f172a',
  fontSize: '0.85rem',
  outline: 'none'
};
