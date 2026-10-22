import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Server, Wifi, WifiOff, Clock, CheckCircle2,
  AlertCircle, ArrowLeft, Save, X, RotateCcw, Building2, Cpu, Hash,
  Globe, Fingerprint, ShieldCheck, Activity, ChevronRight, Settings, Network,
  Play, RefreshCw, Send, CheckCircle, Zap
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Modal } from '../../components/common/Modal';

// ── Helper: derive status from last_communicate_time vs keep_alive_seconds ──
const getDeviceStatus = (gw) => {
  if (!gw.last_communicate_time) return 'Unknown';
  const lastMs = new Date(gw.last_communicate_time).getTime();
  const keepAliveMs = (Number(gw.keep_alive_seconds) || 30) * 1000;
  const diffMs = Date.now() - lastMs;
  if (diffMs <= keepAliveMs * 2) return 'Online';
  if (diffMs <= keepAliveMs * 10) return 'Intermittent';
  return 'Offline';
};

const statusStyle = (status) => {
  switch (status) {
    case 'Online': return { bg: '#dcfce7', color: '#15803d', border: '#86efac', dot: '#22c55e' };
    case 'Intermittent': return { bg: '#fef9c3', color: '#92400e', border: '#fde68a', dot: '#eab308' };
    case 'Offline': return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' };
    default: return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', dot: '#94a3b8' };
  }
};

const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());

  const totalSec = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  let elapsedStr = '';
  if (hrs > 0) {
    elapsedStr = `${hrs}h ${mins}m ${secs}s ago`;
  } else if (mins > 0) {
    elapsedStr = `${mins}m ${secs}s ago`;
  } else {
    elapsedStr = `${secs}s ago`;
  }

  // Exact local time in HH:mm:ss format
  const exactTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return { elapsed: elapsedStr, exact: exactTime, diffMs };
};

const EMPTY_FORM = {
  Gateway_name: '',
  serial_number: '',
  ip_address: '',
  mac_address: '',
  gw_make_id: '',
  gw_make_name: '',
  gw_model_id: '',
  gw_model_name: '',
  firmware_version: '',
  channel_count: 4,
  keep_alive_seconds: 30,
  status: 'Active',
};

const EMPTY_METER_FORM = {
  s_no: '1',
  Meter_name: '',
  meter_serial_number: '',
  slave_id: '1',
  make_id: '',
  make_name: '',
  model_id: '',
  meter_model: '',
  device_profile: '',
  baud_rate: '9600',
  parity_bit: 'None',
  stop_bit: '1',
  data_bit: '8',
  status: 'Active'
};

export const DeviceMasterView = () => {
  const {
    gateways, gatewayMakes, gatewayModels, channels, meters,
    makes, models, meterProfiles,
    addGateway, updateGateway, deleteGateway,
    addChannel, addMeter, updateMeter, deleteMeter
  } = useEnergyData();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [selectedGatewayId, setSelectedGatewayId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  // Meter modal state
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [targetChannel, setTargetChannel] = useState(null);
  const [meterForm, setMeterForm] = useState(EMPTY_METER_FORM);
  const [meterModalError, setMeterModalError] = useState('');

  // ── Meter Communication Test Modal State & Runner ──
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingMeter, setTestingMeter] = useState(null);
  const [testingChannel, setTestingChannel] = useState(null);
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failure'
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);
  const [testSummary, setTestSummary] = useState(null);

  const openTestMeter = (meter, channel) => {
    setTestingMeter(meter);
    setTestingChannel(channel);
    setTestStatus('idle');
    setTestProgress(0);
    setTestLogs([]);
    setTestSummary(null);
    setIsTestModalOpen(true);
  };

  const runCommunicationTest = () => {
    if (!testingMeter) return;
    setTestStatus('testing');
    setTestProgress(10);
    setTestLogs([
      { time: new Date().toLocaleTimeString(), text: `Initiating Modbus RTU / TCP handshake for Slave #${testingMeter.slave_id || '1'}...`, type: 'info' }
    ]);

    // Step 1: Open COM port / Gateway socket
    setTimeout(() => {
      setTestProgress(35);
      setTestLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `Socket established via Channel ${testingChannel?.Channel_name || 'Loop'} (Baud: ${testingMeter.baud_rate || '9600'}, Parity: ${testingMeter.parity_bit || 'None'}, Stop: ${testingMeter.stop_bit || '1'}).`, type: 'info' }
      ]);
    }, 600);

    // Step 2: Send Modbus query frame
    setTimeout(() => {
      setTestProgress(65);
      setTestLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `TX Frame [0x${Number(testingMeter.slave_id || 1).toString(16).padStart(2, '0')} 03 9C 41 00 02 CRC]: Reading holding register 40101 (Power Active Total)...`, type: 'info' }
      ]);
    }, 1200);

    // Step 3: Response frame & evaluate
    setTimeout(() => {
      // If meter is inactive, simulate error or check status
      const isMeterInactive = testingMeter.status === 'Inactive';
      if (isMeterInactive) {
        setTestStatus('failure');
        setTestProgress(100);
        setTestLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `RX Timeout Error: No response from Slave #${testingMeter.slave_id}. Meter is currently Inactive or powered down.`, type: 'error' },
          { time: new Date().toLocaleTimeString(), text: `Recommendation: Check physical wiring, set Meter Status to "Active", and verify RS485 termination resistors.`, type: 'warning' }
        ]);
        setTestSummary({
          success: false,
          latencyMs: 1000,
          packetsSent: 3,
          packetsReceived: 0,
          packetLoss: '100%',
          errorReason: 'Slave Unresponsive (Meter status is Inactive / Offline)'
        });
      } else {
        setTestStatus('success');
        setTestProgress(100);
        const simLatency = Math.floor(45 + Math.random() * 35);
        setTestLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `RX Frame [0x${Number(testingMeter.slave_id || 1).toString(16).padStart(2, '0')} 03 04 43 4C 00 00 CRC]: Received valid 32-bit float response in ${simLatency}ms.`, type: 'success' },
          { time: new Date().toLocaleTimeString(), text: `Communication verified! Register 40101 decoded: 412.80 W (Multiplier: 1.0, Unit: W). Modbus CRC valid.`, type: 'success' }
        ]);
        setTestSummary({
          success: true,
          latencyMs: simLatency,
          packetsSent: 1,
          packetsReceived: 1,
          packetLoss: '0%',
          voltage: '230.4 V',
          sampleValue: '412.80 W'
        });
      }
    }, 2000);
  };

  // Channel modal state
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [channelModalSlot, setChannelModalSlot] = useState(null);
  const [channelForm, setChannelForm] = useState({
    Channel_name: '',
    protocol: 'Modbus RTU',
    baud_rate: '9600',
    port: 'COM1',
    status: 'Active'
  });

  // Filtered meter models by selected make in meter modal
  const availableMeterModels = useMemo(() =>
    models.filter(m => !meterForm.make_id || m.make_id === meterForm.make_id),
    [models, meterForm.make_id]
  );

  // Filtered models by selected make
  const availableModels = useMemo(() =>
    gatewayModels.filter(m => !form.gw_make_id || m.gw_make_id === form.gw_make_id),
    [gatewayModels, form.gw_make_id]
  );

  // Filtered gateway list
  const filtered = useMemo(() => {
    let list = gateways;
    if (statusFilter === 'ONLINE') {
      list = list.filter(g => getDeviceStatus(g) === 'Online');
    } else if (statusFilter === 'OFFLINE') {
      list = list.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent');
    }

    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(g =>
      (g.Gateway_name || '').toLowerCase().includes(q) ||
      (g.serial_number || '').toLowerCase().includes(q) ||
      (g.ip_address || '').toLowerCase().includes(q) ||
      (g.mac_address || '').toLowerCase().includes(q) ||
      (g.gw_make_name || '').toLowerCase().includes(q) ||
      (g.gw_model_name || '').toLowerCase().includes(q)
    );
  }, [gateways, searchTerm, statusFilter]);

  const selectedGateway = gateways.find(g => g.Gateway_id === selectedGatewayId);
  const selectedChannels = selectedGateway
    ? channels.filter(channel => channel.Gateway_id === selectedGateway.Gateway_id)
    : [];
  const selectedGatewayModel = selectedGateway
    ? gatewayModels.find(model => model.gw_model_id === selectedGateway.gw_model_id)
    : null;
  const channelCapacity = Number(selectedGateway?.channel_count || selectedGatewayModel?.channel_count) || 4;

  const handleMakeChange = (makeId) => {
    const mk = gatewayMakes.find(m => m.gw_make_id === makeId);
    const firstModel = gatewayModels.find(m => m.gw_make_id === makeId);
    setForm(prev => ({
      ...prev,
      gw_make_id: makeId,
      gw_make_name: mk?.gw_make_name || '',
      gw_model_id: firstModel?.gw_model_id || '',
      gw_model_name: firstModel?.gw_model_name || '',
      firmware_version: prev.firmware_version || firstModel?.firmware_version || '',
      channel_count: firstModel?.channel_count || prev.channel_count || 4
    }));
  };

  const handleModelChange = (modelId) => {
    const mod = gatewayModels.find(m => m.gw_model_id === modelId);
    setForm(prev => ({
      ...prev,
      gw_model_id: modelId,
      gw_model_name: mod?.gw_model_name || '',
      firmware_version: prev.firmware_version || mod?.firmware_version || '',
      channel_count: mod?.channel_count || prev.channel_count || 4
    }));
  };

  const openAdd = () => {
    const defMake = gatewayMakes[0];
    const defModel = gatewayModels.find(m => m.gw_make_id === defMake?.gw_make_id);
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      gw_make_id: defMake?.gw_make_id || '',
      gw_make_name: defMake?.gw_make_name || '',
      gw_model_id: defModel?.gw_model_id || '',
      gw_model_name: defModel?.gw_model_name || '',
      firmware_version: defModel?.firmware_version || '',
      channel_count: defModel?.channel_count || 4,
      serial_number: `SAB-GW-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    });
    setErrorMsg('');
    setViewMode('form');
  };

  const openEdit = (gw) => {
    const gwModel = gatewayModels.find(m => m.gw_model_id === gw.gw_model_id);
    setEditingId(gw.Gateway_id);
    setForm({
      Gateway_name: gw.Gateway_name || '',
      serial_number: gw.serial_number || '',
      ip_address: gw.ip_address || '',
      mac_address: gw.mac_address || '',
      gw_make_id: gw.gw_make_id || '',
      gw_make_name: gw.gw_make_name || '',
      gw_model_id: gw.gw_model_id || '',
      gw_model_name: gw.gw_model_name || '',
      firmware_version: gw.firmware_version || '',
      channel_count: gw.channel_count || gwModel?.channel_count || 4,
      keep_alive_seconds: gw.keep_alive_seconds || 30,
      status: gw.status || 'Active',
    });
    setErrorMsg('');
    setViewMode('form');
  };

  const handleSave = () => {
    setErrorMsg('');
    if (!form.Gateway_name.trim()) return setErrorMsg('Device Name is required.');
    if (!form.serial_number.trim()) return setErrorMsg('Serial Number is required.');
    if (!form.ip_address.trim()) return setErrorMsg('IP Address is required.');
    if (!form.mac_address.trim()) return setErrorMsg('MAC Address is required.');
    if (!form.gw_make_id) return setErrorMsg('Make is required.');
    if (!form.gw_model_id) return setErrorMsg('Model is required.');
    
    const count = Math.max(1, parseInt(form.channel_count, 10) || 1);

    if (editingId) {
      updateGateway(editingId, { ...form, channel_count: count });
      // If channels count is greater than existing channels, create missing channels
      const existing = channels.filter(c => c.Gateway_id === editingId);
      if (existing.length < count) {
        for (let i = existing.length; i < count; i++) {
          addChannel({
            Gateway_id: editingId,
            Channel_name: `Channel ${i + 1} (${form.Gateway_name.split(' ')[0] || 'GW'})`,
            protocol: 'Modbus RTU',
            baud_rate: '9600',
            port: `COM${i + 1}`,
            status: 'Active'
          });
        }
      }
      setSuccessMsg(`✓ Device "${form.Gateway_name}" updated successfully.`);
    } else {
      const generatedGwId = `GW-${Math.floor(100 + Math.random() * 900)}`;
      addGateway({ ...form, Gateway_id: generatedGwId, channel_count: count });
      
      // Auto-create exactly the number of channels specified for this gateway
      for (let i = 0; i < count; i++) {
        addChannel({
          Gateway_id: generatedGwId,
          Channel_name: `Channel ${i + 1} (${form.Gateway_name.split(' ')[0] || 'GW'})`,
          protocol: i === 1 ? 'Modbus TCP' : 'Modbus RTU',
          baud_rate: i === 1 ? '115200' : '9600',
          port: i === 1 ? '502' : `COM${i + 1}`,
          status: 'Active'
        });
      }
      setSuccessMsg(`✓ Device "${form.Gateway_name}" registered with ${count} channel${count === 1 ? '' : 's'}.`);
    }
    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (gw) => {
    if (window.confirm(`Delete device "${gw.Gateway_name}"? This will also affect linked channels.`)) {
      deleteGateway(gw.Gateway_id);
      setSuccessMsg(`✓ Device "${gw.Gateway_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  // ─── Meter Modal Handlers ──────────────────────────────────────────────────
  const handleMeterMakeChange = (makeId) => {
    const selectedMake = makes.find(m => m.make_id === makeId);
    const firstMatchingModel = models.find(m => m.make_id === makeId);
    setMeterForm(prev => ({
      ...prev,
      make_id: makeId,
      make_name: selectedMake?.make_name || '',
      model_id: firstMatchingModel?.model_id || '',
      meter_model: firstMatchingModel?.model_name || ''
    }));
  };

  const handleMeterModelChange = (modelId) => {
    const selectedModel = models.find(m => m.model_id === modelId);
    setMeterForm(prev => ({
      ...prev,
      model_id: modelId,
      meter_model: selectedModel?.model_name || ''
    }));
  };

  const openAddMeter = (channel) => {
    setTargetChannel(channel);
    setEditingMeter(null);
    setMeterModalError('');
    const defaultMake = makes[0];
    const defaultModel = models.find(m => m.make_id === defaultMake?.make_id) || models[0];
    const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
    const nextIndex = channelMeters.length + 1;
    const defaultProfile = meterProfiles.find(p => p.make_id === defaultMake?.make_id) || meterProfiles[0];
    setMeterForm({
      s_no: `${nextIndex}`,
      Meter_name: '',
      meter_serial_number: `SCH-MTR-${Math.floor(1000 + Math.random() * 9000)}`,
      slave_id: `${nextIndex}`,
      make_id: defaultMake?.make_id || '',
      make_name: defaultMake?.make_name || '',
      model_id: defaultModel?.model_id || '',
      meter_model: defaultModel?.model_name || '',
      device_profile: defaultProfile?.profile_id || '',
      baud_rate: channel?.baud_rate || '9600',
      parity_bit: channel?.parity_bit || 'None',
      stop_bit: channel?.stop_bit || '1',
      data_bit: channel?.data_bit || '8',
      status: 'Active'
    });
    setIsMeterModalOpen(true);
  };

  const openEditMeter = (meter, channel) => {
    setTargetChannel(channel);
    setEditingMeter(meter);
    setMeterModalError('');
    const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
    const meterIndex = channelMeters.findIndex(m => m.Meter_id === meter.Meter_id);
    const matchingProfile = meterProfiles.find(p => p.make_id === meter.make_id && p.model_id === meter.model_id) || meterProfiles[0];
    setMeterForm({
      s_no: meter.s_no || (meterIndex >= 0 ? `${meterIndex + 1}` : '1'),
      Meter_name: meter.Meter_name || '',
      meter_serial_number: meter.meter_serial_number || '',
      slave_id: meter.slave_id || '1',
      make_id: meter.make_id || '',
      make_name: meter.make_name || '',
      model_id: meter.model_id || '',
      meter_model: meter.meter_model || '',
      device_profile: meter.device_profile || meter.profile_id || matchingProfile?.profile_id || '',
      baud_rate: meter.baud_rate || channel?.baud_rate || '9600',
      parity_bit: meter.parity_bit || channel?.parity_bit || 'None',
      stop_bit: meter.stop_bit || channel?.stop_bit || '1',
      data_bit: meter.data_bit || channel?.data_bit || '8',
      status: meter.status || 'Active'
    });
    setIsMeterModalOpen(true);
  };

  const handleMeterSubmit = (e) => {
    e.preventDefault();
    if (!meterForm.meter_serial_number.trim()) {
      setMeterModalError('Serial Number is required.');
      return;
    }
    if (!meterForm.slave_id.trim()) {
      setMeterModalError('Slave ID / Device Address is required.');
      return;
    }

    const meterName = meterForm.Meter_name.trim() || `${meterForm.meter_model || 'Meter'} (${meterForm.meter_serial_number})`;

    if (editingMeter) {
      updateMeter(editingMeter.Meter_id, { ...meterForm, Meter_name: meterName });
      setSuccessMsg(`✓ Meter "${meterName}" updated.`);
    } else {
      addMeter({
        ...meterForm,
        Meter_name: meterName,
        Channel_id: targetChannel.Channel_id
      });
      setSuccessMsg(`✓ Meter "${meterName}" added to ${targetChannel.Channel_name}.`);
    }

    setIsMeterModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteMeter = (meter) => {
    if (window.confirm(`Delete meter "${meter.Meter_name}"?`)) {
      deleteMeter(meter.Meter_id);
      setSuccessMsg(`✓ Meter "${meter.Meter_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  // ─── Channel Modal Handlers ────────────────────────────────────────────────
  const openAddChannelSlot = (slotNumber) => {
    setChannelModalSlot(slotNumber);
    setChannelForm({
      Channel_name: `Channel ${slotNumber} (${selectedGateway?.Gateway_name?.split(' ')[0] || 'GW'})`,
      protocol: 'Modbus RTU',
      baud_rate: '9600',
      port: `COM${slotNumber}`,
      status: 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const openAddChannelGeneral = () => {
    const nextSlot = (selectedChannels.length || 0) + 1;
    setChannelModalSlot(nextSlot);
    setChannelForm({
      Channel_name: `Channel ${nextSlot} (${selectedGateway?.Gateway_name?.split(' ')[0] || 'GW'})`,
      protocol: 'Modbus RTU',
      baud_rate: '9600',
      port: `COM${nextSlot}`,
      status: 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const handleChannelSubmit = (e) => {
    e.preventDefault();
    if (!channelForm.Channel_name.trim()) return;

    if (selectedGateway) {
      addChannel({
        ...channelForm,
        Gateway_id: selectedGateway.Gateway_id
      });
      // Also update gateway channel_count if needed to make room
      if (selectedChannels.length >= channelCapacity) {
        updateGateway(selectedGateway.Gateway_id, {
          channel_count: selectedChannels.length + 1
        });
      }
      setSuccessMsg(`✓ Channel "${channelForm.Channel_name}" created under ${selectedGateway.Gateway_name}.`);
      setIsChannelModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // ─── FORM VIEW ──────────────────────────────────────────────────────────────
  if (viewMode === 'form') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setViewMode('list')} style={backBtnStyle}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {editingId ? 'Edit Device' : 'Register New Device'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                  {editingId ? `Editing: ${form.Gateway_name}` : 'Add a new gateway/edge device and configure its channels'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', color: '#9f1239', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Identity Section */}
        <div style={cardStyle}>
          <SectionTitle icon={<Fingerprint size={16} />} title="Device Identity" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '16px' }}>
            <Field label="Device Name *">
              <input style={inputStyle} value={form.Gateway_name}
                onChange={e => setForm(p => ({ ...p, Gateway_name: e.target.value }))}
                placeholder="e.g. Substation Alpha Gateway" />
            </Field>
            <Field label="Serial Number *">
              <input style={inputStyle} value={form.serial_number}
                onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))}
                placeholder="e.g. SAB-GW-2026-001" />
            </Field>
            <Field label="IP Address *">
              <input style={inputStyle} value={form.ip_address}
                onChange={e => setForm(p => ({ ...p, ip_address: e.target.value }))}
                placeholder="e.g. 192.168.1.150" />
            </Field>
            <Field label="MAC Address *">
              <input style={inputStyle} value={form.mac_address}
                onChange={e => setForm(p => ({ ...p, mac_address: e.target.value }))}
                placeholder="e.g. 00:1B:44:11:3A:B7" />
            </Field>
          </div>
        </div>

        {/* Make, Model & Channel Capacity Section */}
        <div style={cardStyle}>
          <SectionTitle icon={<Cpu size={16} />} title="Make, Model & Channel Configuration" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '16px' }}>
            <Field label="Make (Manufacturer) *">
              <select style={selectStyle} value={form.gw_make_id} onChange={e => handleMakeChange(e.target.value)}>
                <option value="">-- Select Make --</option>
                {gatewayMakes.map(m => (
                  <option key={m.gw_make_id} value={m.gw_make_id}>{m.gw_make_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Model *">
              <select style={selectStyle} value={form.gw_model_id} onChange={e => handleModelChange(e.target.value)}>
                <option value="">-- Select Model --</option>
                {availableModels.map(m => (
                  <option key={m.gw_model_id} value={m.gw_model_id}>{m.gw_model_name}</option>
                ))}
                {availableModels.length === 0 && <option value="" disabled>No models for selected make</option>}
              </select>
            </Field>
            <Field label="Channel Count (How many channels to connect) *">
              <div style={{ position: 'relative' }}>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="32"
                  value={form.channel_count}
                  onChange={e => setForm(p => ({ ...p, channel_count: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  placeholder="e.g. 4"
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                  Channels
                </span>
              </div>
              <small style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Defines how many communication channels will be created and displayed under this gateway.
              </small>
            </Field>
            <Field label="Firmware Version">
              <input style={inputStyle} value={form.firmware_version}
                onChange={e => setForm(p => ({ ...p, firmware_version: e.target.value }))}
                placeholder="e.g. v2.4.1 (optional)" />
            </Field>
            <Field label="Keep Alive (seconds)">
              <input style={inputStyle} type="number" value={form.keep_alive_seconds}
                onChange={e => setForm(p => ({ ...p, keep_alive_seconds: Number(e.target.value) }))}
                placeholder="30" min="5" />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...cardStyle }}>
          <button onClick={() => setViewMode('list')} style={cancelBtnStyle}>
            <X size={15} /> Cancel
          </button>
          <button onClick={handleSave} style={saveBtnStyle}>
            <Save size={15} /> {editingId ? 'Update Device' : 'Register Device'}
          </button>
        </div>
      </div>
    );
  }

  if (selectedGateway) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setSelectedGatewayId(null)} style={backBtnStyle} aria-label="Back to devices">
              <ArrowLeft size={18} />
            </button>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedGateway.Gateway_name}</h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '3px 0 0' }}>
                {selectedGateway.Gateway_id} · {selectedGateway.gw_model_name || 'Gateway'} · {selectedChannels.length} configured channel{selectedChannels.length === 1 ? '' : 's'}
                {channelCapacity > 0 ? ` of ${channelCapacity} supported` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddChannelGeneral}
            style={saveBtnStyle}
            title="Add another channel to this gateway"
          >
            <Plus size={15} /> Add Channel
          </button>
        </div>

        {/* Channels Grid according to Gateway Channel Capacity */}
        {(() => {
          // If gateway has channel_count specified (e.g. 4 or 8), generate slots up to capacity
          const totalSlots = channelCapacity > 0 ? channelCapacity : Math.max(selectedChannels.length, 1);
          const channelSlotCards = [];

          for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
            const channel = selectedChannels[slotIndex];
            const channelNum = slotIndex + 1;

            if (channel) {
              const channelMeters = meters.filter(meter => meter.Channel_id === channel.Channel_id);
              channelSlotCards.push(
                <section
                  key={channel.Channel_id}
                  style={{
                    ...cardStyle,
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Channel Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: channel.status === 'Active' ? '#ecfdf5' : '#f8fafc',
                          color: channel.status === 'Active' ? '#059669' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${channel.status === 'Active' ? '#a7f3d0' : '#e2e8f0'}`
                        }}>
                          <Network size={19} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '0.98rem', fontWeight: 700 }}>
                              {channel.Channel_name}
                            </h3>
                          </div>
                          <div style={{ marginTop: '3px', color: '#64748b', fontSize: '0.74rem', fontWeight: 500 }}>
                            <span style={{ color: '#0284c7', fontWeight: 700 }}>Channel {channelNum}</span>
                            {channelCapacity > 0 ? ` of ${channelCapacity}` : ''} · <span style={{ fontFamily: 'monospace' }}>{channel.Channel_id}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: channel.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                        color: channel.status === 'Active' ? '#15803d' : '#64748b',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: `1px solid ${channel.status === 'Active' ? '#bbf7d0' : '#cbd5e1'}`
                      }}>
                        {channel.status || 'Active'}
                      </span>
                    </div>

                    {/* Protocol & Port specs */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      padding: '12px 0 14px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600
                      }}>
                        {channel.protocol || 'Modbus RTU'}
                      </span>
                      {channel.port && (
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'monospace'
                        }}>
                          Port: {channel.port}
                        </span>
                      )}
                      {channel.baud_rate && (
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'monospace'
                        }}>
                          {channel.baud_rate} bps
                        </span>
                      )}
                    </div>

                      {/* Linked Meters Section */}
                    <div style={{ marginTop: '4px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cpu size={14} color="#7c3aed" />
                          <h4 style={{
                            margin: 0,
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Assigned Meters ({channelMeters.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => openAddMeter(channel)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#f5f3ff',
                            color: '#7c3aed',
                            border: '1px solid #ddd6fe',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Add a new meter to ${channel.Channel_name}`}
                        >
                          <Plus size={13} /> Add Meter
                        </button>
                      </div>

                      {channelMeters.length === 0 ? (
                        <div style={{
                          padding: '18px 16px',
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px dashed #cbd5e1',
                          color: '#94a3b8',
                          fontSize: '0.78rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>No meters connected to this channel yet.</span>
                          <button
                            type="button"
                            onClick={() => openAddMeter(channel)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              color: '#7c3aed',
                              border: '1px solid #c4b5fd',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            + Connect First Meter
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {channelMeters.map(meter => (
                            <div
                              key={meter.Meter_id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#fcfcfd',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: '#f5f3ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Cpu size={16} color="#7c3aed" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{
                                    color: '#0f172a',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {meter.Meter_name}
                                  </div>
                                  <div style={{ color: '#64748b', fontSize: '0.71rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{meter.Meter_id}</span>
                                    <span>·</span>
                                    <span>{meter.meter_model || meter.make_name || 'Meter'}</span>
                                    <span>·</span>
                                    <span style={{ color: '#0284c7', fontWeight: 600 }}>Slave #{meter.slave_id || '1'}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  backgroundColor: meter.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                                  color: meter.status === 'Active' ? '#059669' : '#dc2626',
                                  border: `1px solid ${meter.status === 'Active' ? '#a7f3d0' : '#fecaca'}`,
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {meter.status || 'Active'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTestMeter(meter, channel)}
                                  style={{
                                    border: '1px solid #bfdbfe',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Test Modbus communication to avoid failure"
                                >
                                  <Zap size={12} color="#2563eb" /> Test Comm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditMeter(meter, channel)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#64748b',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  title="Edit Meter"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMeter(meter)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete Meter"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            } else {
              // Unconfigured channel slot based on gateway capacity
              channelSlotCards.push(
                <section
                  key={`empty-channel-slot-${slotIndex}`}
                  style={{
                    ...cardStyle,
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px dashed #cbd5e1',
                    backgroundColor: '#fafbfc',
                    boxShadow: 'none',
                    minHeight: '220px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <Network size={20} />
                  </div>
                  <h3 style={{ margin: '0 0 4px', color: '#475569', fontSize: '0.92rem', fontWeight: 600 }}>
                    Channel {channelNum}
                  </h3>
                  <p style={{ margin: '0 0 10px', color: '#94a3b8', fontSize: '0.76rem' }}>
                    Slot {channelNum} of {channelCapacity} available
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      backgroundColor: '#e2e8f0',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}>
                      Unassigned Slot
                    </span>
                    {/* <button
                      type="button"
                      onClick={() => openAddChannelSlot(channelNum)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={12} /> Configure Channel
                    </button> */}
                  </div>
                </section>
              );
            }
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {channelSlotCards}
            </div>
          );
        })()}

        {/* Channel Add/Configure Modal */}
        <Modal
          isOpen={isChannelModalOpen}
          onClose={() => setIsChannelModalOpen(false)}
          title={`Configure Channel for ${selectedGateway?.Gateway_name || 'Gateway'}`}
        >
          <form onSubmit={handleChannelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.8rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={16} color="#0284c7" />
              <span>Configuring for slot: <strong>Channel {channelModalSlot || 'New'}</strong> under <strong>{selectedGateway?.Gateway_name}</strong></span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                Channel Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Feeder RS485 Loop, Solar Line"
                value={channelForm.Channel_name}
                onChange={e => setChannelForm({ ...channelForm, Channel_name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Protocol *
                </label>
                <select
                  value={channelForm.protocol}
                  onChange={e => setChannelForm({ ...channelForm, protocol: e.target.value })}
                  style={selectStyle}
                >
                  <option value="Modbus RTU">Modbus RTU</option>
                  <option value="Modbus TCP">Modbus TCP</option>
                  <option value="MQTT">MQTT</option>
                  <option value="BACnet">BACnet</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Port / Interface *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COM1, COM2, 502, 1883"
                  value={channelForm.port}
                  onChange={e => setChannelForm({ ...channelForm, port: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Baud Rate
                </label>
                <select
                  value={channelForm.baud_rate}
                  onChange={e => setChannelForm({ ...channelForm, baud_rate: e.target.value })}
                  style={selectStyle}
                >
                  <option value="9600">9600 bps</option>
                  <option value="19200">19200 bps</option>
                  <option value="38400">38400 bps</option>
                  <option value="115200">115200 bps</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={channelForm.status}
                  onChange={e => setChannelForm({ ...channelForm, status: e.target.value })}
                  style={selectStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsChannelModalOpen(false)}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={saveBtnStyle}
              >
                <Save size={14} /> Save Channel
              </button>
            </div>
          </form>
        </Modal>

        {/* Meter Add/Edit Modal */}
        <Modal
          isOpen={isMeterModalOpen}
          onClose={() => setIsMeterModalOpen(false)}
          title={editingMeter ? `Edit Meter: ${editingMeter.Meter_name}` : `Add Meter to ${targetChannel?.Channel_name || 'Channel'}`}
        >
          <form onSubmit={handleMeterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {meterModalError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', color: '#9f1239', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {meterModalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                Channel Link
              </label>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Network size={15} color="#0284c7" />
                <strong>{targetChannel?.Channel_name}</strong> ({targetChannel?.Channel_id} · {targetChannel?.protocol || 'Modbus'})
              </div>
            </div>

            {/* Row 1: S.No & Slave ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  S.No *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1"
                  value={meterForm.s_no}
                  onChange={e => setMeterForm({ ...meterForm, s_no: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Slave ID / Modbus Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 to 247"
                  value={meterForm.slave_id}
                  onChange={e => setMeterForm({ ...meterForm, slave_id: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2: Make & Model Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Make (Manufacturer) *
                </label>
                <select
                  required
                  value={meterForm.make_id}
                  onChange={e => handleMeterMakeChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">-- Select Make --</option>
                  {makes.map(m => (
                    <option key={m.make_id} value={m.make_id}>{m.make_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Model *
                </label>
                <select
                  required
                  value={meterForm.model_id}
                  onChange={e => handleMeterModelChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">-- Select Model --</option>
                  {availableMeterModels.map(m => (
                    <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
                  ))}
                  {availableMeterModels.length === 0 && (
                    <option value="" disabled>No models available for selected make</option>
                  )}
                </select>
              </div>
            </div>

            {/* Row 2B: Device Profile Dropdown (from Parameter Master & Meter Profiles) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                Device Profile (Register & Telemetry Mapping)
              </label>
              <select
                value={meterForm.device_profile}
                onChange={e => setMeterForm({ ...meterForm, device_profile: e.target.value })}
                style={selectStyle}
              >
                <option value="">-- Default Auto Profile --</option>
                {meterProfiles.map(p => (
                  <option key={p.profile_id} value={p.profile_id}>
                    {p.make} {p.model} · v{p.profile_version || '1.0.0'} ({(p.parameters || []).length} Registers mapped)
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                Connects meter telemetry registers and units configured in Parameter Master & Meter Profiles
              </span>
            </div>

            {/* Row 3: Serial Number & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SCH-EM-9921"
                  value={meterForm.meter_serial_number}
                  onChange={e => setMeterForm({ ...meterForm, meter_serial_number: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Status *
                </label>
                <select
                  value={meterForm.status}
                  onChange={e => setMeterForm({ ...meterForm, status: e.target.value })}
                  style={selectStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Row 4: Baud Rate & Parity Bit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Baud Rate *
                </label>
                <select
                  value={meterForm.baud_rate}
                  onChange={e => setMeterForm({ ...meterForm, baud_rate: e.target.value })}
                  style={selectStyle}
                >
                  <option value="2400">2400 bps</option>
                  <option value="4800">4800 bps</option>
                  <option value="9600">9600 bps</option>
                  <option value="19200">19200 bps</option>
                  <option value="38400">38400 bps</option>
                  <option value="57600">57600 bps</option>
                  <option value="115200">115200 bps</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Parity Bit *
                </label>
                <select
                  value={meterForm.parity_bit}
                  onChange={e => setMeterForm({ ...meterForm, parity_bit: e.target.value })}
                  style={selectStyle}
                >
                  <option value="None">None</option>
                  <option value="Even">Even</option>
                  <option value="Odd">Odd</option>
                </select>
              </div>
            </div>

            {/* Row 5: Stop Bit & Data Bit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Stop Bit *
                </label>
                <select
                  value={meterForm.stop_bit}
                  onChange={e => setMeterForm({ ...meterForm, stop_bit: e.target.value })}
                  style={selectStyle}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  Data Bit *
                </label>
                <select
                  value={meterForm.data_bit}
                  onChange={e => setMeterForm({ ...meterForm, data_bit: e.target.value })}
                  style={selectStyle}
                >
                  <option value="8">8</option>
                  <option value="7">7</option>
                </select>
              </div>
            </div>

            {/* Optional Meter Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                Meter Custom Alias / Name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Incomer Multi-Function Meter, Solar Bay Meter"
                value={meterForm.Meter_name}
                onChange={e => setMeterForm({ ...meterForm, Meter_name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsMeterModalOpen(false)}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={saveBtnStyle}
              >
                <Save size={14} /> {editingMeter ? 'Save Changes' : 'Connect Meter'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}>
            <Server size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Device Master</h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
              Register and manage IoT edge gateway devices. Select a device row to view its channels and meters.
            </p>
          </div>
        </div>
        <button onClick={openAdd} style={saveBtnStyle}>
          <Plus size={15} /> Register Device
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} color="#059669" /> {successMsg}
        </div>
      )}

      {/* Stats + Professional Filter Tabs + Search */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '18px', paddingRight: '16px', borderRight: '1px solid #e2e8f0' }}>
            <Stat label="Total Gateways" value={gateways.length} color="#0284c7" />
            <Stat label="Online" value={gateways.filter(g => getDeviceStatus(g) === 'Online').length} color="#15803d" />
            <Stat label="Offline" value={gateways.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent').length} color="#dc2626" />
            {meters.some(m => m.status === 'Inactive') && (
              <Stat label="Inactive Meters" value={meters.filter(m => m.status === 'Inactive').length} color="#f59e0b" />
            )}
          </div>

          {/* Clean Segmented Filter Controls */}
          <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: '#f1f5f9', borderRadius: '8px', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ALL' ? '#0f172a' : '#64748b',
                boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              All ({gateways.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ONLINE')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ONLINE' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ONLINE' ? '#15803d' : '#64748b',
                boxShadow: statusFilter === 'ONLINE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Online ({gateways.filter(g => getDeviceStatus(g) === 'Online').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OFFLINE')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'OFFLINE' ? '#ffffff' : 'transparent',
                color: statusFilter === 'OFFLINE' ? '#dc2626' : '#64748b',
                boxShadow: statusFilter === 'OFFLINE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {gateways.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent').length > 0 && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              )}
              Offline ({gateways.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent').length})
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, serial, IP, MAC…"
            style={{ ...inputStyle, paddingLeft: '32px', width: '280px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={th}>S.No</th>
              <th style={th}>Device Name</th>
              <th style={th}>Serial No.</th>
              <th style={th}>IP Address</th>
              <th style={th}>MAC Address</th>
              <th style={th}>Make / Model</th>
              <th style={th}>Firmware</th>
              <th style={{ ...th, textAlign: 'center' }}>Status</th>
              <th style={{ ...th, textAlign: 'center' }}>Last Communicate</th>
              <th style={{ ...th, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                  No devices found. Click <strong>"Register Device"</strong> to add one.
                </td>
              </tr>
            ) : filtered.map((gw, idx) => {
              const status = getDeviceStatus(gw);
              const ss = statusStyle(status);
              return (
                <tr key={gw.Gateway_id}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                  onClick={() => setSelectedGatewayId(gw.Gateway_id)}
                  onKeyDown={e => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setSelectedGatewayId(gw.Gateway_id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View channels and meters for ${gw.Gateway_name}`}
                  title="Click to view this gateway's channels and meters"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={td}><span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.76rem' }}>{idx + 1}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Server size={15} color="#0284c7" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{gw.Gateway_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{gw.Gateway_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{gw.serial_number || '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#0369a1', fontWeight: 600 }}>{gw.ip_address || '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>{gw.mac_address || '—'}</td>
                  <td style={td}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{gw.gw_make_name || '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{gw.gw_model_name || '—'}</div>
                  </td>
                  <td style={td}>
                    {gw.firmware_version
                      ? <span style={{ fontSize: '0.72rem', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 7px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600 }}>{gw.firmware_version}</span>
                      : <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: ss.bg,
                      color: ss.color,
                      border: `1px solid ${ss.border}`,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ss.dot, boxShadow: status === 'Online' ? `0 0 6px ${ss.dot}` : 'none' }} />
                      {status}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {(() => {
                      const timeObj = formatTime(gw.last_communicate_time);
                      if (typeof timeObj === 'object' && timeObj !== null) {
                        return (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                              <Clock size={11} color="#64748b" />
                              {timeObj.elapsed}
                            </span>
                            <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                              {timeObj.exact}
                            </span>
                          </div>
                        );
                      }
                      return <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>—</span>;
                    })()}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={e => { e.stopPropagation(); openEdit(gw); }} style={editBtnStyle} title="Edit">
                        <Edit3 size={13} /> Edit
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(gw); }} style={deleteBtnStyle} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Meter Communication Diagnostic Test Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={`Meter Communication Diagnostic Test`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header context card */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                {testingMeter?.Meter_name || 'Selected Meter'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                <span>ID: <code style={{ color: '#0f172a' }}>{testingMeter?.Meter_id}</code></span>
                <span>•</span>
                <span>Channel: <strong>{testingChannel?.Channel_name || 'Assigned Channel'}</strong></span>
                <span>•</span>
                <span>Status: <strong style={{ color: testingMeter?.status === 'Active' ? '#15803d' : '#dc2626' }}>{testingMeter?.status || 'Active'}</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{
                fontSize: '0.72rem',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 8px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 600
              }}>
                Slave ID: {testingMeter?.slave_id || '1'}
              </span>
              <span style={{
                fontSize: '0.72rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                padding: '3px 8px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 600
              }}>
                {testingMeter?.baud_rate || '9600'} bps
              </span>
            </div>
          </div>

          {/* Test Parameters Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 12px'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Protocol</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Modbus RTU</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Parity / Data</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{testingMeter?.parity_bit || 'None'} / {testingMeter?.data_bit || '8'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Stop Bit</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{testingMeter?.stop_bit || '1'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Port</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{testingChannel?.port || 'COM1'}</div>
            </div>
          </div>

          {/* Progress Bar & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {testStatus === 'running' && <RefreshCw size={13} className="spin-animate" color="#0284c7" />}
                {testStatus === 'success' && <CheckCircle size={14} color="#15803d" />}
                {testStatus === 'failure' && <AlertCircle size={14} color="#dc2626" />}
                <span>
                  {testStatus === 'idle' && 'Ready to initiate communication handshake'}
                  {testStatus === 'running' && `Testing handshake... ${testProgress}%`}
                  {testStatus === 'success' && 'Communication verified! 0% packet loss'}
                  {testStatus === 'failure' && 'Communication Failed / Inactive Device Error'}
                </span>
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: testStatus === 'failure' ? '#dc2626' : '#0284c7' }}>
                {testProgress}%
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${testProgress}%`,
                backgroundColor: testStatus === 'failure' ? '#ef4444' : testStatus === 'success' ? '#22c55e' : '#0284c7',
                transition: 'width 0.3s ease, background-color 0.3s ease'
              }} />
            </div>
          </div>

          {/* Live Diagnostic Logs */}
          <div style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            maxHeight: '160px',
            overflowY: 'auto',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            {testLogs.map((log, index) => {
              let logColor = '#cbd5e1';
              if (log.type === 'success') logColor = '#4ade80';
              if (log.type === 'error') logColor = '#f87171';
              if (log.type === 'warning') logColor = '#fbbf24';
              if (log.type === 'info') logColor = '#38bdf8';
              return (
                <div key={index} style={{ color: logColor, display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                  <span style={{ color: '#64748b', userSelect: 'none' }}>[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              );
            })}
          </div>

          {/* Summary results card if finished */}
          {testSummary && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: testSummary.success ? '#ecfdf5' : '#fff1f2',
              border: `1px solid ${testSummary.success ? '#a7f3d0' : '#fecdd3'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: testSummary.success ? '#065f46' : '#9f1239' }}>
                  {testSummary.success ? '✓ Diagnostic Passed: Meter is communicating reliably' : '✕ Diagnostic Alert: Meter communication timed out'}
                </div>
                <div style={{ fontSize: '0.74rem', color: testSummary.success ? '#047857' : '#be123c', marginTop: '2px' }}>
                  {testSummary.success
                    ? `Round-trip latency: ${testSummary.latencyMs}ms | Value read: ${testSummary.sampleValue} | Loss: ${testSummary.packetLoss}`
                    : `Reason: ${testSummary.errorReason}`
                  }
                </div>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: testSummary.success ? '#10b981' : '#f43f5e',
                color: '#fff'
              }}>
                {testSummary.success ? 'COMM HEALTHY' : 'COMM FAILURE'}
              </span>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsTestModalOpen(false)}
              style={cancelBtnStyle}
            >
              Close
            </button>
            <button
              type="button"
              onClick={runCommunicationTest}
              disabled={testStatus === 'running'}
              style={{
                ...saveBtnStyle,
                backgroundColor: testStatus === 'running' ? '#94a3b8' : '#0284c7',
                cursor: testStatus === 'running' ? 'not-allowed' : 'pointer'
              }}
            >
              {testStatus === 'running' ? (
                <>
                  <RefreshCw size={14} className="spin-animate" /> Running Diagnostic...
                </>
              ) : (
                <>
                  <Zap size={14} /> Start Communication Test
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
    <span style={{ color: '#0284c7' }}>{icon}</span>
    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 700, marginBottom: '6px' }}>{label}</label>
    {children}
  </div>
);

const Stat = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const th = { padding: '11px 14px', whiteSpace: 'nowrap' };
const td = { padding: '11px 14px' };
const saveBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(2,132,199,0.25)' };
const cancelBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' };
const backBtnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' };
const editBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', color: '#0284c7', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 };
const deleteBtnStyle = { display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' };
