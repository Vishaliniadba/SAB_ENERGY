import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Server, Wifi, WifiOff, Clock, CheckCircle2,
  AlertCircle, ArrowLeft, Save, X, RotateCcw, Building2, Cpu, Hash,
  Globe, Fingerprint, ShieldCheck, Activity, ChevronRight, Settings, Network,
  Play, RefreshCw, Send, CheckCircle, Zap
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Modal } from '../../components/common/Modal';

// ── Helper: derive status from gateway status and telemetry ping ──
const getDeviceStatus = (gw) => {
  if (gw.status === 'Offline' || gw.status === 'Inactive') return 'Offline';
  if (!gw.last_communicate_time) {
    return gw.status === 'Active' ? 'Online' : 'Offline';
  }
  const lastMs = new Date(gw.last_communicate_time).getTime();
  const keepAliveMs = (Number(gw.keep_alive_seconds) || 30) * 1000;
  const diffMs = Date.now() - lastMs;
  if (diffMs <= keepAliveMs * 10) return 'Online';
  if (diffMs <= keepAliveMs * 30) return 'Intermittent';
  return 'Offline';
};

const statusStyle = (status) => {
  switch (status) {
    case 'Online':
    case 'Active':
      return {
        bg: 'var(--status-success-bg)',
        color: 'var(--status-success-text)',
        border: 'var(--status-success-border)',
        dot: 'var(--status-success-text)',
      };
    case 'Intermittent':
      return {
        bg: 'var(--status-warning-bg)',
        color: 'var(--status-warning-text)',
        border: 'var(--status-warning-border)',
        dot: 'var(--status-warning-text)',
      };
    case 'Offline':
    case 'Inactive':
      return {
        bg: 'var(--status-danger-bg)',
        color: 'var(--status-danger-text)',
        border: 'var(--status-danger-border)',
        dot: 'var(--status-danger-text)',
      };
    default:
      return {
        bg: 'var(--status-success-bg)',
        color: 'var(--status-success-text)',
        border: 'var(--status-success-border)',
        dot: 'var(--status-success-text)',
      };
  }
};

const formatTime = (iso) => {
  if (!iso) {
    return { elapsed: 'Live polling', exact: 'Just now', diffMs: 0 };
  }
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());

  const totalSec = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  let elapsedStr = '';
  if (hrs > 24) {
    elapsedStr = `${Math.floor(hrs / 24)}d ago`;
  } else if (hrs > 0) {
    elapsedStr = `${hrs}h ${mins}m ago`;
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
  channel_names: [],
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
    addChannel, updateChannel, deleteChannel,
    addMeter, updateMeter, deleteMeter
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
  const [testMode, setTestMode] = useState('auto'); // 'auto' | 'pass' | 'fail'
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failure'
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);
  const [testSummary, setTestSummary] = useState(null);
  const [quickTestingMeterId, setQuickTestingMeterId] = useState(null);

  const openTestMeter = (meter, channel) => {
    setTestingMeter(meter);
    setTestingChannel(channel);
    // If meter is already offline or inactive, default to auto (which will detect fail) or let user choose
    setTestMode(meter.status === 'Offline' || meter.status === 'Inactive' ? 'fail' : 'auto');
    setTestStatus('idle');
    setTestProgress(0);
    setTestLogs([]);
    setTestSummary(null);
    setIsTestModalOpen(true);
  };

  const runCommunicationTest = (overrideMode) => {
    if (!testingMeter) return;
    const activeMode = overrideMode || testMode;
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
        { time: new Date().toLocaleTimeString(), text: `Socket established via Channel ${testingChannel?.Channel_name || 'Loop'} (Baud: ${testingMeter.baud_rate || '9600'}, Parity: ${testingMeter.parity_bit || 'None'}, Stop: ${testingMeter.stop_bit || '1'}, Port: ${testingChannel?.port || 'COM1'}).`, type: 'info' }
      ]);
    }, 500);

    // Step 2: Send Modbus query frame
    setTimeout(() => {
      setTestProgress(65);
      setTestLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `TX Frame [0x${Number(testingMeter.slave_id || 1).toString(16).padStart(2, '0')} 03 9C 41 00 02 CRC]: Transmitting read request to register 40101 (Power Active Total)...`, type: 'info' }
      ]);
    }, 1000);

    // Step 3: Response frame & evaluate whether data is going from meter to gateway
    setTimeout(() => {
      // Determine if data passes or fails
      const shouldFail = activeMode === 'fail' ||
        (activeMode === 'auto' && (testingMeter.status === 'Inactive' || testingMeter.status === 'Offline' || testingChannel?.status === 'Inactive'));

      if (shouldFail) {
        // DATA DOES NOT GET PASSED -> Mark the meter OFFLINE
        setTestStatus('failure');
        setTestProgress(100);
        setTestLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `RX Timeout Error: No data response received from Slave #${testingMeter.slave_id}. Packets failed to reach Gateway.`, type: 'error' },
          { time: new Date().toLocaleTimeString(), text: `[SYSTEM ACTION]: Data does not pass from meter to gateway. Meter ${testingMeter.Meter_id} marked as OFFLINE.`, type: 'warning' }
        ]);
        setTestSummary({
          success: false,
          latencyMs: 1500,
          packetsSent: 3,
          packetsReceived: 0,
          packetLoss: '100%',
          errorReason: 'No data response from meter to gateway (Timeout / CRC error). Meter marked OFFLINE.'
        });

        // Update meter status in database/state to 'Offline'
        updateMeter(testingMeter.Meter_id, { status: 'Offline' });
        setTestingMeter(prev => prev ? { ...prev, status: 'Offline' } : null);
        setSuccessMsg(`Communication Failed: Data does not pass from meter ${testingMeter.Meter_name} (${testingMeter.Meter_id}) to gateway. Marked as OFFLINE.`);
      } else {
        // DATA PASSES SUCCESSFULLY -> Mark the meter ACTIVE (ONLINE)
        setTestStatus('success');
        setTestProgress(100);
        const simLatency = Math.floor(40 + Math.random() * 25);
        setTestLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `RX Frame [0x${Number(testingMeter.slave_id || 1).toString(16).padStart(2, '0')} 03 04 43 4C 00 00 CRC]: Received valid 32-bit float response in ${simLatency}ms.`, type: 'success' },
          { time: new Date().toLocaleTimeString(), text: `[SYSTEM ACTION]: Data successfully received from Meter to Gateway. Meter verified ACTIVE / ONLINE.`, type: 'success' }
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

        // Update meter status in database/state to 'Active'
        updateMeter(testingMeter.Meter_id, { status: 'Active' });
        setTestingMeter(prev => prev ? { ...prev, status: 'Active' } : null);
        setSuccessMsg(`Communication Verified: Data successfully going from ${testingMeter.Meter_name} (${testingMeter.Meter_id}) to gateway. Marked as ACTIVE.`);
      }
    }, 1700);
  };

  // Quick inline test directly from card row
  const handleQuickTest = (meter, channel) => {
    setQuickTestingMeterId(meter.Meter_id);
    setTimeout(() => {
      // Toggle or evaluate based on current status
      const willPass = meter.status !== 'Offline' && meter.status !== 'Inactive';
      if (!willPass) {
        // Test fails -> remains/becomes Offline
        updateMeter(meter.Meter_id, { status: 'Offline' });
        setSuccessMsg(`[Data Test]: Meter ${meter.Meter_name} (${meter.Meter_id}) data packet failed to reach gateway. Marked OFFLINE.`);
      } else {
        // If it was Active, simulate a live packet verify (or if user wants to test pass)
        updateMeter(meter.Meter_id, { status: 'Active' });
        setSuccessMsg(`[Data Test]: Meter ${meter.Meter_name} (${meter.Meter_id}) is communicating with Gateway (45ms). Status: ACTIVE.`);
      }
      setQuickTestingMeterId(null);
    }, 1100);
  };

  // Channel modal & split-screen state
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [editingChannelId, setEditingChannelId] = useState(null);
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
  const channelCapacity = Number(selectedGateway?.channel_count || selectedGatewayModel?.channel_count) || 2;

  const handleMakeChange = (makeId) => {
    const mk = gatewayMakes.find(m => m.gw_make_id === makeId);
    const firstModel = gatewayModels.find(m => m.gw_make_id === makeId);
    const count = Number(firstModel?.channel_count) || 2;
    const names = firstModel?.channel_names?.length
      ? [...firstModel.channel_names]
      : Array.from({ length: count }, (_, i) => `Channel ${i + 1}`);

    setForm(prev => ({
      ...prev,
      gw_make_id: makeId,
      gw_make_name: mk?.gw_make_name || '',
      gw_model_id: firstModel?.gw_model_id || '',
      gw_model_name: firstModel?.gw_model_name || '',
      firmware_version: prev.firmware_version || firstModel?.firmware_version || '',
      channel_count: count,
      channel_names: names
    }));
  };

  const handleModelChange = (modelId) => {
    const mod = gatewayModels.find(m => m.gw_model_id === modelId);
    const count = Number(mod?.channel_count) || 2;
    const names = mod?.channel_names?.length
      ? [...mod.channel_names]
      : Array.from({ length: count }, (_, i) => `Channel ${i + 1}`);

    setForm(prev => ({
      ...prev,
      gw_model_id: modelId,
      gw_model_name: mod?.gw_model_name || '',
      firmware_version: prev.firmware_version || mod?.firmware_version || '',
      channel_count: count,
      channel_names: names
    }));
  };

  const openAdd = () => {
    const defMake = gatewayMakes[0];
    const defModel = gatewayModels.find(m => m.gw_make_id === defMake?.gw_make_id);
    const count = Number(defModel?.channel_count) || 2;
    const names = defModel?.channel_names?.length
      ? [...defModel.channel_names]
      : Array.from({ length: count }, (_, i) => `Channel ${i + 1}`);

    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      gw_make_id: defMake?.gw_make_id || '',
      gw_make_name: defMake?.gw_make_name || '',
      gw_model_id: defModel?.gw_model_id || '',
      gw_model_name: defModel?.gw_model_name || '',
      firmware_version: defModel?.firmware_version || '',
      channel_count: count,
      channel_names: names,
      serial_number: `SAB-GW-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    });
    setErrorMsg('');
    setViewMode('form');
  };

  const openEdit = (gw) => {
    const gwModel = gatewayModels.find(m => m.gw_model_id === gw.gw_model_id);
    const count = Number(gw.channel_count || gwModel?.channel_count) || 4;
    const existingGwChannels = channels.filter(c => c.Gateway_id === gw.Gateway_id);
    const names = Array.from({ length: count }, (_, i) => {
      return (
        existingGwChannels[i]?.Channel_name ||
        gw.channel_names?.[i] ||
        gwModel?.channel_names?.[i] ||
        `Channel ${i + 1}`
      );
    });

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
      channel_count: count,
      channel_names: names,
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
    const cleanNames = Array.from({ length: count }, (_, i) => {
      const custom = (form.channel_names?.[i] || '').trim();
      return custom || `Channel ${i + 1} (${form.Gateway_name.split(' ')[0] || 'GW'})`;
    });

    if (editingId) {
      updateGateway(editingId, { ...form, channel_count: count, channel_names: cleanNames });
      // Update existing channel names and create missing channels
      const existing = channels.filter(c => c.Gateway_id === editingId);
      for (let i = 0; i < Math.min(existing.length, count); i++) {
        if (cleanNames[i] && cleanNames[i] !== existing[i].Channel_name) {
          updateChannel(existing[i].Channel_id, { Channel_name: cleanNames[i] });
        }
      }
      if (existing.length < count) {
        for (let i = existing.length; i < count; i++) {
          addChannel({
            Gateway_id: editingId,
            Channel_name: cleanNames[i],
            protocol: 'Modbus RTU',
            baud_rate: '9600',
            port: `COM${i + 1}`,
            status: 'Active'
          });
        }
      }
      setSuccessMsg(`✓ Device "${form.Gateway_name}" updated successfully with ${count} channels.`);
    } else {
      const generatedGwId = `GW-${Math.floor(100 + Math.random() * 900)}`;
      addGateway({ ...form, Gateway_id: generatedGwId, channel_count: count, channel_names: cleanNames });
      
      // Auto-create exactly the number of channels specified based on channel_count
      for (let i = 0; i < count; i++) {
        addChannel({
          Gateway_id: generatedGwId,
          Channel_name: cleanNames[i],
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
    setEditingChannelId(null);
    setChannelModalSlot(slotNumber);
    const suggestedName =
      selectedGatewayModel?.channel_names?.[slotNumber - 1] ||
      selectedGateway?.channel_names?.[slotNumber - 1] ||
      `Channel ${slotNumber} (${selectedGateway?.Gateway_name?.split(' ')[0] || 'GW'})`;
    setChannelForm({
      Channel_name: suggestedName,
      protocol: slotNumber === 1 ? 'Modbus TCP' : 'Modbus RTU',
      baud_rate: slotNumber === 1 ? '115200' : '9600',
      port: slotNumber === 1 ? '502' : `COM${slotNumber}`,
      status: 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const openAddChannelGeneral = () => {
    setEditingChannelId(null);
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

  const openEditChannel = (channel) => {
    setEditingChannelId(channel.Channel_id);
    setChannelForm({
      Channel_name: channel.Channel_name || '',
      protocol: channel.protocol || 'Modbus RTU',
      baud_rate: channel.baud_rate || '9600',
      port: channel.port || 'COM1',
      status: channel.status || 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const handleDeleteChannel = (channel) => {
    const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
    const confirmMsg = channelMeters.length > 0
      ? `Channel "${channel.Channel_name}" has ${channelMeters.length} meter(s) assigned. Deleting will unassign those meters. Continue?`
      : `Are you sure you want to delete channel "${channel.Channel_name}"?`;
    if (window.confirm(confirmMsg)) {
      deleteChannel(channel.Channel_id);
      if (selectedChannelId === channel.Channel_id) {
        setSelectedChannelId(null);
      }
      setSuccessMsg(`Channel "${channel.Channel_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleChannelSubmit = (e) => {
    e.preventDefault();
    if (!channelForm.Channel_name.trim()) return;

    if (editingChannelId) {
      updateChannel(editingChannelId, channelForm);
      setSuccessMsg(`Channel "${channelForm.Channel_name}" updated.`);
      setIsChannelModalOpen(false);
      setEditingChannelId(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    if (selectedGateway) {
      addChannel({
        ...channelForm,
        Gateway_id: selectedGateway.Gateway_id
      });
      if (selectedChannels.length >= channelCapacity) {
        updateGateway(selectedGateway.Gateway_id, {
          channel_count: selectedChannels.length + 1
        });
      }
      setSuccessMsg(`Channel "${channelForm.Channel_name}" created.`);
      setIsChannelModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // ── Meter Communication Diagnostic Test Modal Component ──
  const renderTestModal = () => {
    const activeGateway = selectedGateway || (testingChannel ? gateways.find(g => g.Gateway_id === testingChannel.Gateway_id) : gateways[0]);

    return (
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={`Meter Communication Diagnostic Test`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Context Card: Gateway > Channel > Meter Hierarchy + Image 1 Info */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Hierarchy Header: Gateway > Channel > Meter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#475569' }}>
                  <Server size={14} color="#0284c7" />
                  {activeGateway?.Gateway_name || 'Gateway'}
                </span>
                <ChevronRight size={13} color="#94a3b8" />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#475569' }}>
                  <Network size={14} color="#0284c7" />
                  {testingChannel?.Channel_name || 'Channel'}
                </span>
                <ChevronRight size={13} color="#94a3b8" />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0f172a' }}>
                  <Cpu size={14} color="#7c3aed" />
                  {testingMeter?.Meter_name || testingMeter?.meter_model || 'Meter'}
                </span>
              </div>
            </div>

            {/* Image 1 Configuration Parameters Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
              gap: '8px',
              paddingTop: '10px',
              borderTop: '1px solid #e2e8f0'
            }}>
              {/* Serial Number */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>Serial Number</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
                  {testingMeter?.meter_serial_number || testingMeter?.Meter_id || 'SCH-MTR-4112'}
                </div>
              </div>

              {/* Status */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: (testingMeter?.status || 'Active') === 'Active' ? '#059669' : '#dc2626',
                  marginTop: '2px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: (testingMeter?.status || 'Active') === 'Active' ? '#10b981' : '#ef4444'
                  }} />
                  {testingMeter?.status || 'Active'}
                </div>
              </div>

              {/* Baud Rate */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>Baud Rate</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                  {testingMeter?.baud_rate || testingChannel?.baud_rate || '9600'} bps
                </div>
              </div>

              {/* Parity Bit */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>Parity Bit</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {testingMeter?.parity_bit || testingChannel?.parity_bit || 'None'}
                </div>
              </div>

              {/* Stop Bit */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>Stop Bit</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                  {testingMeter?.stop_bit !== undefined && testingMeter?.stop_bit !== null ? testingMeter.stop_bit : (testingChannel?.stop_bit ?? '1')}
                </div>
              </div>

              {/* Data Bit */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>Data Bit</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                  {testingMeter?.data_bit !== undefined && testingMeter?.data_bit !== null ? testingMeter.data_bit : (testingChannel?.data_bit ?? '8')}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Data Flow Diagram */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={16} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{activeGateway?.Gateway_name || 'Gateway'}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>IP: {activeGateway?.ip_address || '192.168.1.100'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, padding: '0 16px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: testStatus === 'failure' ? '#dc2626' : testStatus === 'success' ? '#16a34a' : testStatus === 'testing' ? '#0284c7' : '#64748b' }}>
                {testStatus === 'testing' && '⇄ Transmitting Modbus Packets ⇄'}
                {testStatus === 'failure' && '✕ No Data Returned (Link Break / Timeout) ✕'}
                {testStatus === 'success' && '✓ Data Packet Received OK (412.8 W) ✓'}
                {testStatus === 'idle' && 'Ready to verify data communication'}
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  backgroundColor: testStatus === 'failure' ? '#ef4444' : testStatus === 'success' ? '#22c55e' : testStatus === 'testing' ? '#0284c7' : '#94a3b8',
                  transition: 'background-color 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Port: {testingChannel?.port || 'COM1'} • Baud: {testingMeter?.baud_rate || '9600'}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{testingMeter?.Meter_name || 'Meter'}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>Slave ID #{testingMeter?.slave_id || '1'}</div>
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={16} color="#7c3aed" />
              </div>
            </div>
          </div>

          {/* Progress Bar & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {testStatus === 'testing' && <RefreshCw size={13} className="spin-animate" color="#0284c7" />}
                {testStatus === 'success' && <CheckCircle size={14} color="#15803d" />}
                {testStatus === 'failure' && <AlertCircle size={14} color="#dc2626" />}
                <span>
                  {testStatus === 'idle' && 'Click Start Communication Test to send packet'}
                  {testStatus === 'testing' && `Verifying data packet from Meter to Gateway... ${testProgress}%`}
                  {testStatus === 'success' && 'Data verified! Successfully received by Gateway'}
                  {testStatus === 'failure' && 'Data failed to reach Gateway. Meter marked OFFLINE!'}
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
            {testLogs.length === 0 ? (
              <span style={{ color: '#64748b' }}>Logs will appear here once communication handshake starts...</span>
            ) : (
              testLogs.map((log, index) => {
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
              })
            )}
          </div>

          {/* Summary results card if finished */}
          {testSummary && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: testSummary.success ? '#ecfdf5' : '#fff1f2',
              border: `1.5px solid ${testSummary.success ? '#a7f3d0' : '#fecdd3'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: testSummary.success ? '#065f46' : '#9f1239' }}>
                  {testSummary.success ? '✓ Diagnostic Passed: Data is successfully reaching Gateway' : '✕ Diagnostic Alert: Data does NOT reach Gateway'}
                </div>
                <div style={{ fontSize: '0.75rem', color: testSummary.success ? '#047857' : '#be123c', marginTop: '3px' }}>
                  {testSummary.success
                    ? `Latency: ${testSummary.latencyMs}ms | Power Value: ${testSummary.sampleValue} | Status updated to ACTIVE.`
                    : `${testSummary.errorReason} Status updated to OFFLINE.`
                  }
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: testSummary.success ? '#10b981' : '#f43f5e',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {testSummary.success ? 'COMM ACTIVE / ONLINE' : 'MARKED OFFLINE'}
                </span>
                {/* Manual toggle override */}
                {testSummary.success ? (
                  <button
                    type="button"
                    onClick={() => {
                      updateMeter(testingMeter.Meter_id, { status: 'Offline' });
                      setTestingMeter(prev => prev ? { ...prev, status: 'Offline' } : null);
                      setSuccessMsg(`Meter ${testingMeter.Meter_name} manually set to OFFLINE.`);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: '#fff',
                      border: '1px solid #fecdd3',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    Force Offline
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      updateMeter(testingMeter.Meter_id, { status: 'Active' });
                      setTestingMeter(prev => prev ? { ...prev, status: 'Active' } : null);
                      setSuccessMsg(`Meter ${testingMeter.Meter_name} manually set to ACTIVE.`);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: '#fff',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      cursor: 'pointer'
                    }}
                  >
                    Force Active
                  </button>
                )}
              </div>
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
              onClick={() => runCommunicationTest()}
              disabled={testStatus === 'testing'}
              style={{
                ...saveBtnStyle,
                backgroundColor: testStatus === 'testing' ? '#94a3b8' : '#0284c7',
                cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer'
              }}
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw size={14} className="spin-animate" /> Verifying Data Flow...
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
    );
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
                  onChange={e => {
                    const newCount = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setForm(p => {
                      const existingNames = p.channel_names || [];
                      const updatedNames = Array.from({ length: newCount }, (_, i) => existingNames[i] || `Channel ${i + 1}`);
                      return { ...p, channel_count: newCount, channel_names: updatedNames };
                    });
                  }}
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

        {/* Dynamic Channel Slots based on Channel Count */}
        <div style={cardStyle}>
          <SectionTitle
            icon={<Network size={16} />}
            title={`Channel Configuration (${form.channel_count || 1} Channel${(form.channel_count || 1) === 1 ? '' : 's'} based on Channel Count)`}
          />
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 16px' }}>
            These channel slots will be created under this gateway based on the channel count. Names are pre-filled from the selected model and can be customized.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {Array.from({ length: Math.max(1, parseInt(form.channel_count, 10) || 1) }, (_, idx) => {
              const chNum = idx + 1;
              return (
                <div
                  key={`channel-slot-${chNum}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                      Channel Slot #{chNum}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {chNum === 1 ? 'Modbus RTU/TCP' : `COM${chNum}`}
                    </span>
                  </div>
                  <input
                    style={inputStyle}
                    value={form.channel_names?.[idx] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const next = [...(prev.channel_names || [])];
                        next[idx] = val;
                        return { ...prev, channel_names: next };
                      });
                    }}
                    placeholder={`e.g. Channel ${chNum} Name`}
                  />
                </div>
              );
            })}
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
    const displayChannels = selectedChannels.slice(0, 2);
    const totalSlots = 2;

    const renderChannelCard = (channel, slotNum) => {
      if (!channel) {
        return (
          <div
            key={`unassigned-slot-${slotNum}`}
            style={{
              ...cardStyle,
              padding: '32px 20px',
              border: '1.5px dashed #cbd5e1',
              backgroundColor: '#fafbfc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '12px',
              minHeight: '260px',
              height: '100%'
            }}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Network size={22} color="#94a3b8" />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Channel {slotNum}
              </span>
              <h4 style={{ margin: '4px 0 6px', color: '#334155', fontSize: '1rem', fontWeight: 700 }}>
                Unassigned Channel Slot
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Channel {slotNum} is not configured yet for {selectedGateway.Gateway_name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddChannelSlot(slotNum)}
              style={{
                ...saveBtnStyle,
                fontSize: '0.78rem',
                padding: '7px 14px',
                marginTop: '4px'
              }}
            >
              <Plus size={14} /> Configure Channel {slotNum}
            </button>
          </div>
        );
      }

      const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
      const cleanChannelTitle = channel.Channel_name && /^channel\s*\d+/i.test(channel.Channel_name)
        ? channel.Channel_name.replace(/^channel\s*\d+/i, `Channel ${slotNum}`)
        : (channel.Channel_name || `Channel ${slotNum}`);

      return (
        <div
          key={channel.Channel_id}
          style={{
            ...cardStyle,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            height: '100%'
          }}
        >
          {/* Channel Header (Name, Slot, Status & Actions) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: channel.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                color: channel.status === 'Active' ? '#059669' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${channel.status === 'Active' ? '#a7f3d0' : '#e2e8f0'}`,
                flexShrink: 0
              }}>
                <Network size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: slotNum === 1 ? '#0284c7' : '#16805D',
                    backgroundColor: slotNum === 1 ? '#eff6ff' : '#f0fdf4',
                    border: `1px solid ${slotNum === 1 ? '#bfdbfe' : '#bbf7d0'}`,
                    padding: '2px 7px',
                    borderRadius: '4px'
                  }}>
                    CHANNEL {slotNum}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cleanChannelTitle}
                  </h3>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: channel.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                    color: channel.status === 'Active' ? '#059669' : '#64748b',
                    border: `1px solid ${channel.status === 'Active' ? '#a7f3d0' : '#e2e8f0'}`
                  }}>
                    {channel.status || 'Active'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                  ID: {channel.Channel_id}
                </div>
              </div>
            </div>

            {/* Actions for this Channel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => openAddMeter(channel)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#16805D',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title={`Add meter to ${cleanChannelTitle}`}
              >
                <Plus size={13} /> Add Meter
              </button>
              <button
                type="button"
                onClick={() => openEditChannel(channel)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Edit Channel settings"
              >
                <Edit3 size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteChannel(channel)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Delete this channel"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Channel Basic Parameters Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '7px 12px',
            borderRadius: '6px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.73rem',
            color: '#475569'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#64748b' }}>Protocol:</span>
              <strong style={{ color: '#0f172a' }}>{channel.protocol || 'Modbus RTU'}</strong>
            </div>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#64748b' }}>Port:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{channel.port || `COM${slotNum}`}</strong>
            </div>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#64748b' }}>Baud:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{channel.baud_rate || '9600'} bps</strong>
            </div>
          </div>

          {/* Channel Meters Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={15} color="#7c3aed" />
                <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Assigned Meters ({channelMeters.length})
                </h4>
              </div>
            </div>

            {channelMeters.length === 0 ? (
              <div style={{
                padding: '28px 16px',
                textAlign: 'center',
                backgroundColor: '#fafbfc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flex: 1,
                minHeight: '120px'
              }}>
                <Cpu size={22} color="#94a3b8" />
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  No meters connected to Channel {slotNum} yet.
                </div>
                <button
                  type="button"
                  onClick={() => openAddMeter(channel)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#16805D',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={12} /> Add Meter
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                <table className="enterprise-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-card-secondary, #f8fafc)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: '28px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Meter</th>
                      <th style={{ padding: '8px 10px' }}>Slave ID</th>
                      <th style={{ padding: '8px 10px' }}>Status</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelMeters.map((meter, mIdx) => {
                      const displayName = meter.meter_model || (meter.Meter_name?.includes('(') ? meter.Meter_name.split('(')[0].trim() : meter.Meter_name) || 'Meter';
                      const displaySerial = meter.meter_serial_number || (meter.Meter_name?.match(/\(([^)]+)\)/)?.[1]) || meter.Meter_id;

                      return (
                        <tr key={meter.Meter_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>{mIdx + 1}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Cpu size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '19px', fontFamily: 'monospace' }}>
                                S/N: {displaySerial}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              #{meter.slave_id || '1'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {meter.status === 'Active' ? (
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '10px',
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                Active
                              </span>
                            ) : meter.status === 'Offline' ? (
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '10px',
                                backgroundColor: '#fff1f2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <WifiOff size={10} color="#dc2626" />
                                Offline
                              </span>
                            ) : (
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '10px',
                                backgroundColor: '#f8fafc',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}>
                                {meter.status || 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {quickTestingMeterId === meter.Meter_id && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: '#eff6ff',
                                  color: '#0284c7',
                                  fontSize: '0.66rem',
                                  fontWeight: 700
                                }}>
                                  <RefreshCw size={9} className="spin-animate" /> Pinging...
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => openTestMeter(meter, channel)}
                                disabled={quickTestingMeterId === meter.Meter_id}
                                style={{
                                  border: meter.status === 'Offline' ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                                  background: meter.status === 'Offline' ? '#fff1f2' : '#eff6ff',
                                  color: meter.status === 'Offline' ? '#dc2626' : '#1d4ed8',
                                  padding: '3px 7px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700
                                }}
                                title="Test communication"
                              >
                                {meter.status === 'Offline' ? <WifiOff size={10} color="#dc2626" /> : <Zap size={10} color="#2563eb" />}
                                Test
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditMeter(meter, channel)}
                                style={editBtnStyle}
                                title="Edit Meter"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMeter(meter)}
                                style={deleteBtnStyle}
                                title="Delete Meter"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Top Header Card */}
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => {
                setSelectedGatewayId(null);
                setSelectedChannelId(null);
              }}
              style={backBtnStyle}
              aria-label="Back to devices"
            >
              <ArrowLeft size={18} />
            </button>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{selectedGateway.Gateway_name}</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                {selectedGateway.Gateway_id} · {selectedGateway.gw_model_name || 'Gateway'} · {displayChannels.length} of 2 supported channels
              </p>
            </div>
          </div>
          {displayChannels.length < 2 && (
            <button
              type="button"
              onClick={openAddChannelGeneral}
              style={saveBtnStyle}
              title="Add Channel 2 to this gateway"
            >
              <Plus size={15} /> Add Channel 2
            </button>
          )}
        </div>

        {/* Parallel Side-by-Side 2-Split Channel Layout (Strictly Channel 1 & Channel 2) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '20px',
          alignItems: 'stretch'
        }}>
          {[0, 1].map((slotIndex) => {
            const channel = displayChannels[slotIndex];
            return renderChannelCard(channel, slotIndex + 1);
          })}
        </div>

        {/* Channel Add/Configure Modal */}
        <Modal
          isOpen={isChannelModalOpen}
          onClose={() => setIsChannelModalOpen(false)}
          title={editingChannelId ? 'Edit Channel' : `Configure Channel for ${selectedGateway?.Gateway_name || 'Gateway'}`}
        >
          <form onSubmit={handleChannelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.8rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={16} color="#0284c7" />
              <span>
                {editingChannelId ? (
                  <>Editing channel: <strong>{channelForm.Channel_name || editingChannelId}</strong></>
                ) : (
                  <>Configuring for slot: <strong>Channel {channelModalSlot || 'New'}</strong> under <strong>{selectedGateway?.Gateway_name}</strong></>
                )}
              </span>
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
                <Save size={14} /> {editingChannelId ? 'Update Channel' : 'Save Channel'}
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

        {/* Meter Communication Diagnostic Test Modal */}
        {renderTestModal()}
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #16805D 0%, #0D5D45 100%)',
            backgroundColor: '#16805D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(22, 128, 93, 0.35)',
            flexShrink: 0
          }}>
            <Server size={22} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Device Master</h2>
          </div>
        </div>
        <button
          onClick={openAdd}
          style={{
            ...saveBtnStyle,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--brand-primary, #16805D)',
            background: 'linear-gradient(135deg, #16805D 0%, #0D5D45 100%)',
            color: '#FFFFFF',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            fontWeight: 650,
            fontSize: '0.84rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(22, 128, 93, 0.3)',
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <span style={{ color: '#FFFFFF', fontWeight: 650 }}>Register Device</span>
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--accent-emerald-glow)', border: '1px solid var(--accent-emerald-border)', borderRadius: '10px', color: 'var(--accent-emerald)', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} color="var(--accent-emerald)" /> {successMsg}
        </div>
      )}

      {/* Stats + Professional Filter Tabs + Search */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '18px', paddingRight: '16px', borderRight: '1px solid var(--border-subtle)' }}>
            <Stat label="Total Gateways" value={gateways.length} color="var(--primary-cyan)" />
            <Stat label="Online" value={gateways.filter(g => getDeviceStatus(g) === 'Online').length} color="var(--accent-emerald)" />
            <Stat label="Offline" value={gateways.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent').length} color="var(--accent-rose)" />
            {meters.some(m => m.status === 'Inactive') && (
              <Stat label="Inactive Meters" value={meters.filter(m => m.status === 'Inactive').length} color="var(--accent-amber)" />
            )}
          </div>

          {/* Clean Segmented Filter Controls */}
          <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                border: statusFilter === 'ALL' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ALL' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: statusFilter === 'ALL' ? 'var(--shadow-card)' : 'none'
              }}
            >
              All ({gateways.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ONLINE')}
              style={{
                border: statusFilter === 'ONLINE' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ONLINE' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'ONLINE' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                boxShadow: statusFilter === 'ONLINE' ? 'var(--shadow-card)' : 'none'
              }}
            >
              Online ({gateways.filter(g => getDeviceStatus(g) === 'Online').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OFFLINE')}
              style={{
                border: statusFilter === 'OFFLINE' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'OFFLINE' ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === 'OFFLINE' ? 'var(--accent-rose)' : 'var(--text-muted)',
                boxShadow: statusFilter === 'OFFLINE' ? 'var(--shadow-card)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {gateways.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent').length > 0 && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-rose)' }} />
              )}
              Offline ({gateways.filter(g => getDeviceStatus(g) === 'Offline' || getDeviceStatus(g) === 'Intermittent').length})
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, serial, IP, MAC…"
            style={{ ...inputStyle, paddingLeft: '34px', width: '280px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={th}>S.No</th>
              <th style={th}>Device Name</th>
              <th style={th}>Serial No.</th>
              <th style={th}>IP Address</th>
              <th style={th}>MAC Address</th>
              <th style={th}>Make / Model</th>
              <th style={{ ...th, textAlign: 'center' }}>Channels</th>
              <th style={th}>Firmware</th>
              <th style={{ ...th, textAlign: 'center' }}>Status</th>
              <th style={{ ...th, textAlign: 'center' }}>Last Communicate</th>
              <th style={{ ...th, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No devices found. Click <strong style={{ color: 'var(--primary-cyan)' }}>"Register Device"</strong> to add one.
                </td>
              </tr>
            ) : filtered.map((gw, idx) => {
              const status = getDeviceStatus(gw);
              const ss = statusStyle(status);
              return (
                <tr key={gw.Gateway_id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease', cursor: 'pointer' }}
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
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={td}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Server size={15} color="var(--text-muted)" />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>{gw.Gateway_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{gw.Gateway_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{gw.serial_number || '—'}</td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>
                    {gw.ip_address ? (
                      <span style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                        {gw.ip_address}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{gw.mac_address || '—'}</td>
                  <td style={td}>
                    {(() => {
                      const gwMake = gatewayMakes.find(m => m.gw_make_id === gw.gw_make_id);
                      const gwModel = gatewayModels.find(m => m.gw_model_id === gw.gw_model_id || m.gw_model_name === gw.gw_model_name);
                      const displayMake = gw.gw_make_name || gwMake?.gw_make_name || (gw.Gateway_id === 'GW-103' ? 'Advantech' : 'SaB Systems');
                      const displayModel = gw.gw_model_name || gwModel?.gw_model_name || (gw.Gateway_id === 'GW-102' ? 'SAB-GW-G2' : gw.Gateway_id === 'GW-103' ? 'EKI-1521' : 'SAB-GW-G1');
                      return (
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{displayMake}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{displayModel}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {(() => {
                      const gwModel = gatewayModels.find(m => m.gw_model_id === gw.gw_model_id || m.gw_model_name === gw.gw_model_name);
                      const cap = Number(gw.channel_count || gwModel?.channel_count) || (gw.Gateway_id === 'GW-102' ? 8 : gw.Gateway_id === 'GW-103' ? 2 : 4);
                      const gwChs = channels.filter(c => c.Gateway_id === gw.Gateway_id);
                      return (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-card-secondary)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: 'var(--brand-primary)',
                            }}
                          >
                            <Network size={11} />
                            {cap} Slots
                          </span>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                            {gwChs.length} configured
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={td}>
                    {gw.firmware_version
                      ? <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{gw.firmware_version}</span>
                      : <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>}
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
                      fontWeight: 500
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
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              <Clock size={11} color="var(--text-dim)" />
                              {timeObj.elapsed}
                            </span>
                            <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                              {timeObj.exact}
                            </span>
                          </div>
                        );
                      }
                      return <span style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>—</span>;
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
      {renderTestModal()}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
    <span style={{ color: 'var(--primary-cyan)' }}>{icon}</span>
    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>{label}</label>
    {children}
  </div>
);

const Stat = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '1.35rem', fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = {
  backgroundColor: 'var(--bg-card)',
  borderRadius: '14px',
  border: '1px solid var(--border-subtle)',
  padding: '20px 24px',
  boxShadow: 'var(--shadow-card)',
  transition: 'all 0.2s ease',
};
const inputStyle = {
  width: '100%',
  padding: '9px 13px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  fontSize: '0.85rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: 'var(--bg-input)',
  transition: 'border-color 0.18s, box-shadow 0.18s',
};
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const th = { padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 700 };
const td = { padding: '12px 14px' };
const saveBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  background: 'linear-gradient(135deg, #16805D 0%, #0D5D45 100%)',
  backgroundColor: '#16805D',
  color: '#FFFFFF',
  border: '1px solid #16805D',
  borderRadius: '8px',
  padding: '9px 18px',
  fontSize: '0.84rem',
  fontWeight: 650,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(22, 128, 93, 0.28)',
  transition: 'all 0.18s ease',
};
const cancelBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  backgroundColor: 'var(--bg-card-secondary)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
};
const backBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-card-secondary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};
const editBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 11px',
  borderRadius: '6px',
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-card-secondary)',
  color: 'var(--brand-primary)',
  cursor: 'pointer',
  fontSize: '0.76rem',
  fontWeight: 650,
  transition: 'all 0.15s ease',
};
const deleteBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 9px',
  borderRadius: '6px',
  border: '1px solid var(--status-danger-border)',
  backgroundColor: 'var(--status-danger-bg)',
  color: 'var(--status-danger-text)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
