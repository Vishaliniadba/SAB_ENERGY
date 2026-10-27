import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Server, Wifi, WifiOff, Clock, CheckCircle2,
  AlertCircle, ArrowLeft, Save, X, Cpu, Fingerprint, Network,
  RefreshCw, Zap, Copy, Check, ArrowUpRight
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Modal } from '../../components/common/Modal';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/common/DataTable';
import { FormField, InputField, SelectField } from '../../components/common/FormField';
import {
  TotalGatewaysIcon,
  OnlineActiveIcon,
  OfflineAlertIcon,
  ConnectedMetersIcon
} from '../../components/common/CardIcons';

// ── Helper: Derive gateway status from gateway status and telemetry ping ──
const getDeviceStatus = (gw) => {
  if (gw.status === 'Offline' || gw.status === 'Inactive') return 'Offline';
  if (!gw.last_communicate_time) {
    return gw.status === 'Active' ? 'Online' : 'Offline';
  }
  const lastMs = new Date(gw.last_communicate_time).getTime();
  const keepAliveMs = (Number(gw.keep_alive_seconds) || 30) * 1000;
  const diffMs = Date.now() - lastMs;
  if (diffMs <= keepAliveMs * 4) return 'Online';
  if (diffMs <= keepAliveMs * 12) return 'Intermittent';
  return 'Offline';
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
  channel_count: 2,
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
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'INTERMITTENT' | 'OFFLINE'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedKey, setCopiedKey] = useState(null);

  // Meter modal state
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [targetChannel, setTargetChannel] = useState(null);
  const [meterForm, setMeterForm] = useState(EMPTY_METER_FORM);
  const [meterModalError, setMeterModalError] = useState('');

  // Channel modal state
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [channelForm, setChannelForm] = useState({
    Channel_name: '',
    port: 'COM1',
    baud_rate: '9600',
    protocol: 'Modbus RTU',
    parity_bit: 'None',
    stop_bit: '1',
    data_bit: '8',
    status: 'Active'
  });

  // Diagnostic Test Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingMeter, setTestingMeter] = useState(null);
  const [testingChannel, setTestingChannel] = useState(null);
  const [testMode, setTestMode] = useState('auto'); // 'auto' | 'pass' | 'fail'
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failure'
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);
  const [testSummary, setTestSummary] = useState(null);

  // Selected Gateway resolution
  const selectedGateway = useMemo(() => {
    return gateways.find(g => g.Gateway_id === selectedGatewayId) || null;
  }, [gateways, selectedGatewayId]);

  const selectedChannels = useMemo(() => {
    if (!selectedGateway) return [];
    return channels.filter(c => c.Gateway_id === selectedGateway.Gateway_id);
  }, [selectedGateway, channels]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fleet Statistics
  const stats = useMemo(() => {
    let online = 0;
    let intermittent = 0;
    let offline = 0;
    gateways.forEach(gw => {
      const st = getDeviceStatus(gw);
      if (st === 'Online') online++;
      else if (st === 'Intermittent') intermittent++;
      else offline++;
    });
    return {
      totalGw: gateways.length,
      online,
      intermittent,
      offline,
      totalChannels: channels.length,
      totalMeters: meters.length,
      activeMeters: meters.filter(m => m.status === 'Active').length
    };
  }, [gateways, channels, meters]);

  // Filtered Gateways
  const filteredGateways = useMemo(() => {
    return gateways.filter(gw => {
      const st = getDeviceStatus(gw);
      if (statusFilter === 'ONLINE' && st !== 'Online') return false;
      if (statusFilter === 'INTERMITTENT' && st !== 'Intermittent') return false;
      if (statusFilter === 'OFFLINE' && st !== 'Offline') return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (gw.Gateway_name || '').toLowerCase().includes(term) ||
        (gw.Gateway_id || '').toLowerCase().includes(term) ||
        (gw.serial_number || '').toLowerCase().includes(term) ||
        (gw.ip_address || '').toLowerCase().includes(term) ||
        (gw.mac_address || '').toLowerCase().includes(term) ||
        (gw.gw_make_name || '').toLowerCase().includes(term) ||
        (gw.gw_model_name || '').toLowerCase().includes(term)
      );
    });
  }, [gateways, statusFilter, searchTerm]);

  // ── Communication Test Runner ──
  const openTestMeter = (meter, channel) => {
    setTestingMeter(meter);
    setTestingChannel(channel);
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

    setTimeout(() => {
      setTestProgress(40);
      setTestLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `Link established via Channel ${testingChannel?.Channel_name || 'Port'} (Baud: ${testingMeter.baud_rate || '9600'}, Parity: ${testingMeter.parity_bit || 'None'}).`, type: 'info' }
      ]);
    }, 450);

    setTimeout(() => {
      setTestProgress(70);
      const slaveHex = Number(testingMeter.slave_id || 1).toString(16).padStart(2, '0');
      setTestLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `TX Frame [0x${slaveHex} 03 9C 41 00 02 CRC]: Reading register 40101 (Active Power kW)...`, type: 'info' }
      ]);
    }, 900);

    setTimeout(() => {
      const shouldFail = activeMode === 'fail' ||
        (activeMode === 'auto' && (testingMeter.status === 'Inactive' || testingMeter.status === 'Offline' || testingChannel?.status === 'Inactive'));

      if (shouldFail) {
        setTestStatus('failure');
        setTestProgress(100);
        setTestLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `RX Timeout Error: No response received from Slave #${testingMeter.slave_id}. Connection timed out after 1500ms.`, type: 'error' },
          { time: new Date().toLocaleTimeString(), text: `[SYSTEM ACTION]: Meter marked as OFFLINE in system registry.`, type: 'warning' }
        ]);
        setTestSummary({
          success: false,
          latencyMs: 1500,
          packetsSent: 3,
          packetsReceived: 0,
          packetLoss: '100%',
          errorReason: 'No response from device. Check RS-485 termination resistor and Slave ID.'
        });
        updateMeter(testingMeter.Meter_id, { status: 'Offline' });
        setTestingMeter(p => p ? { ...p, status: 'Offline' } : null);
        setSuccessMsg(`Diagnostic Alert: Meter ${testingMeter.Meter_name} failed telemetry handshake and was set to Offline.`);
      } else {
        setTestStatus('success');
        setTestProgress(100);
        const simLatency = Math.floor(18 + Math.random() * 22);
        const slaveHex = Number(testingMeter.slave_id || 1).toString(16).padStart(2, '0');
        setTestLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `RX Frame [0x${slaveHex} 03 04 43 4C 00 00 CRC OK]: Valid response packet received in ${simLatency}ms.`, type: 'success' },
          { time: new Date().toLocaleTimeString(), text: `[SYSTEM ACTION]: Telemetry link verified. Meter marked as ACTIVE.`, type: 'success' }
        ]);
        setTestSummary({
          success: true,
          latencyMs: simLatency,
          packetsSent: 1,
          packetsReceived: 1,
          packetLoss: '0%',
          voltage: '230.4 V',
          sampleValue: '412.8 kW'
        });
        updateMeter(testingMeter.Meter_id, { status: 'Active' });
        setTestingMeter(p => p ? { ...p, status: 'Active' } : null);
        setSuccessMsg(`Diagnostic Success: Meter ${testingMeter.Meter_name} telemetry verified successfully.`);
      }
    }, 1500);
  };

  // ── Gateway Form Management ──
  const handleGatewayMakeChange = (makeId) => {
    const make = gatewayMakes.find(m => m.gw_make_id === makeId);
    const firstModel = gatewayModels.find(m => m.gw_make_id === makeId);
    const count = Number(firstModel?.channel_count) || 2;
    const names = firstModel?.channel_names?.length
      ? [...firstModel.channel_names]
      : Array.from({ length: count }, (_, i) => `Channel ${i + 1}`);

    setForm(prev => ({
      ...prev,
      gw_make_id: makeId,
      gw_make_name: make?.gw_make_name || '',
      gw_model_id: firstModel?.gw_model_id || '',
      gw_model_name: firstModel?.gw_model_name || '',
      firmware_version: firstModel?.firmware_version || '',
      channel_count: count,
      channel_names: names
    }));
  };

  const handleGatewayModelChange = (modelId) => {
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
    const count = Number(gw.channel_count || gwModel?.channel_count) || 2;
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
      return custom || `Channel ${i + 1}`;
    });

    if (editingId) {
      updateGateway(editingId, { ...form, channel_count: count, channel_names: cleanNames });
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
            port: `COM${i + 1}`,
            baud_rate: '9600',
            protocol: 'Modbus RTU',
            status: 'Active'
          });
        }
      }
      setSuccessMsg(`✓ Gateway "${form.Gateway_name}" updated successfully.`);
    } else {
      const generatedGwId = `GW-${Math.floor(100 + Math.random() * 900)}`;
      addGateway({
        ...form,
        Gateway_id: generatedGwId,
        channel_count: count,
        channel_names: cleanNames,
        last_communicate_time: new Date().toISOString()
      });
      for (let i = 0; i < count; i++) {
        addChannel({
          Gateway_id: generatedGwId,
          Channel_name: cleanNames[i],
          port: `COM${i + 1}`,
          baud_rate: '9600',
          protocol: 'Modbus RTU',
          status: 'Active'
        });
      }
      setSuccessMsg(`✓ Registered new gateway "${form.Gateway_name}" with ${count} channels.`);
    }

    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (gw) => {
    if (!window.confirm(`Are you sure you want to delete gateway "${gw.Gateway_name}" (${gw.Gateway_id}) and all of its configured channels and meters?`)) return;
    deleteGateway(gw.Gateway_id);
    if (selectedGatewayId === gw.Gateway_id) setSelectedGatewayId(null);
    setSuccessMsg(`✓ Deleted gateway "${gw.Gateway_name}".`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // ── Meter Management ──
  const openAddMeter = (channel) => {
    setTargetChannel(channel);
    setEditingMeter(null);
    const defMake = makes[0];
    const defModel = models.find(m => m.make_id === defMake?.make_id) || models[0];
    const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
    const nextIndex = channelMeters.length + 1;
    const defProfile = meterProfiles.find(p => p.make_id === defMake?.make_id) || meterProfiles[0];

    setMeterForm({
      s_no: `${nextIndex}`,
      Meter_name: '',
      meter_serial_number: `MTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      slave_id: `${nextIndex}`,
      make_id: defMake?.make_id || '',
      make_name: defMake?.make_name || '',
      model_id: defModel?.model_id || '',
      meter_model: defModel?.model_name || '',
      device_profile: defProfile?.profile_name || '',
      baud_rate: channel.baud_rate || '9600',
      parity_bit: channel.parity_bit || 'None',
      stop_bit: channel.stop_bit || '1',
      data_bit: channel.data_bit || '8',
      status: 'Active'
    });
    setMeterModalError('');
    setIsMeterModalOpen(true);
  };

  const openEditMeter = (meter, channel) => {
    setTargetChannel(channel);
    setEditingMeter(meter);
    setMeterForm({
      s_no: meter.s_no || '1',
      Meter_name: meter.Meter_name || '',
      meter_serial_number: meter.meter_serial_number || '',
      slave_id: meter.slave_id || '1',
      make_id: meter.make_id || '',
      make_name: meter.make_name || '',
      model_id: meter.model_id || '',
      meter_model: meter.meter_model || '',
      device_profile: meter.device_profile || '',
      baud_rate: meter.baud_rate || '9600',
      parity_bit: meter.parity_bit || 'None',
      stop_bit: meter.stop_bit || '1',
      data_bit: meter.data_bit || '8',
      status: meter.status || 'Active'
    });
    setMeterModalError('');
    setIsMeterModalOpen(true);
  };

  const handleMeterSubmit = (e) => {
    if (e) e.preventDefault();
    setMeterModalError('');

    if (!meterForm.meter_serial_number.trim()) {
      return setMeterModalError('Serial Number is required.');
    }
    if (!meterForm.slave_id.trim()) {
      return setMeterModalError('Modbus Slave ID is required.');
    }

    const meterName = meterForm.Meter_name.trim() || `${meterForm.meter_model || 'Meter'} (${meterForm.meter_serial_number})`;

    if (editingMeter) {
      updateMeter(editingMeter.Meter_id, {
        ...meterForm,
        Meter_name: meterName
      });
      setSuccessMsg(`✓ Updated meter "${meterName}".`);
    } else {
      addMeter({
        ...meterForm,
        Meter_name: meterName,
        Channel_id: targetChannel.Channel_id
      });
      setSuccessMsg(`✓ Added meter "${meterName}" to ${targetChannel.Channel_name}.`);
    }

    setIsMeterModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDeleteMeter = (meter) => {
    if (!window.confirm(`Delete meter "${meter.Meter_name}"?`)) return;
    deleteMeter(meter.Meter_id);
    setSuccessMsg(`✓ Deleted meter "${meter.Meter_name}".`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Channel Management ──
  const openAddChannelSlot = (slotNumber) => {
    setEditingChannelId(null);
    setChannelForm({
      Channel_name: `Channel ${slotNumber}`,
      port: `COM${slotNumber}`,
      baud_rate: '9600',
      protocol: 'Modbus RTU',
      parity_bit: 'None',
      stop_bit: '1',
      data_bit: '8',
      status: 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const openEditChannel = (channel) => {
    setEditingChannelId(channel.Channel_id);
    setChannelForm({
      Channel_name: channel.Channel_name || '',
      port: channel.port || 'COM1',
      baud_rate: channel.baud_rate || '9600',
      protocol: channel.protocol || 'Modbus RTU',
      parity_bit: channel.parity_bit || 'None',
      stop_bit: channel.stop_bit || '1',
      data_bit: channel.data_bit || '8',
      status: channel.status || 'Active'
    });
    setIsChannelModalOpen(true);
  };

  const handleChannelSubmit = (e) => {
    if (e) e.preventDefault();
    if (!channelForm.Channel_name.trim()) return;

    if (editingChannelId) {
      updateChannel(editingChannelId, channelForm);
      setSuccessMsg(`✓ Channel "${channelForm.Channel_name}" updated.`);
    } else {
      addChannel({
        ...channelForm,
        Gateway_id: selectedGateway.Gateway_id
      });
      setSuccessMsg(`✓ Channel "${channelForm.Channel_name}" added to gateway.`);
    }
    setIsChannelModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteChannel = (channel) => {
    const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
    const msg = channelMeters.length > 0
      ? `Channel "${channel.Channel_name}" contains ${channelMeters.length} meter(s). Deleting this channel will remove those meters. Proceed?`
      : `Delete channel "${channel.Channel_name}"?`;
    if (!window.confirm(msg)) return;
    deleteChannel(channel.Channel_id);
    setSuccessMsg(`✓ Deleted channel "${channel.Channel_name}".`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Dynamic Channel Card Rendering ──
  const renderChannelCard = (channel, slotNum) => {
    if (!channel) {
      return (
        <div
          key={`unassigned-slot-${slotNum}`}
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '14px',
            minHeight: '280px',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <Network size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Slot #{slotNum}
            </span>
            <h4 style={{ margin: '4px 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Unassigned Channel
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
              This RS-485 / Modbus communication channel slot is unconfigured on {selectedGateway?.Gateway_name}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddChannelSlot(slotNum)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 18px', marginTop: '6px' }}
          >
            <Plus size={15} /> Configure Slot #{slotNum}
          </button>
        </div>
      );
    }

    const channelMeters = meters.filter(m => m.Channel_id === channel.Channel_id);
    const isOnline = channel.status === 'Active';

    return (
      <div
        key={channel.Channel_id}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Channel Card Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: isOnline ? 'var(--status-success-bg)' : 'var(--bg-card)',
              color: isOnline ? 'var(--status-success-text)' : 'var(--text-muted)',
              border: `1px solid ${isOnline ? 'var(--status-success-border)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Network size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--brand-primary)',
                  backgroundColor: 'var(--brand-surface)',
                  border: '1px solid var(--brand-border)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  Slot #{slotNum}
                </span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {channel.Channel_name}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>{channel.port || 'COM1'}</span>
                <span>•</span>
                <span>{channel.baud_rate || '9600'} bps ({channel.data_bit || 8}-{channel.parity_bit?.[0] || 'N'}-{channel.stop_bit || 1})</span>
                <span>•</span>
                <span>{channel.protocol || 'Modbus RTU'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => openAddMeter(channel)}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              title="Add a Modbus meter to this channel"
            >
              <Plus size={14} /> Add Meter
            </button>
            <button
              type="button"
              onClick={() => openEditChannel(channel)}
              className="btn-icon"
              style={{ color: 'var(--text-secondary)' }}
              title="Edit Channel Settings"
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteChannel(channel)}
              className="btn-icon"
              style={{ color: 'var(--accent-rose)' }}
              title="Delete Channel"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Meters Container */}
        <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Connected Meters ({channelMeters.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Max capacity: 32 drop nodes
            </span>
          </div>

          {channelMeters.length === 0 ? (
            <div style={{
              flex: 1,
              padding: '32px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <Cpu size={24} color="var(--text-dim)" />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                No meters attached to this channel
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Add your electrical or energy meters (Modbus Slave devices) to begin polling telemetry.
              </p>
              <button
                type="button"
                onClick={() => openAddMeter(channel)}
                className="btn btn-secondary"
                style={{ fontSize: '0.76rem', padding: '6px 14px', marginTop: '6px' }}
              >
                <Plus size={13} /> Add First Meter
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-table-header, var(--border-subtle))', color: '#FFFFFF', fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '8px 12px' }}>Slave ID</th>
                    <th style={{ padding: '8px 12px' }}>Meter Name & Model</th>
                    <th style={{ padding: '8px 12px' }}>Profile</th>
                    <th style={{ padding: '8px 12px' }}>Serial Number</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channelMeters.map(meter => {
                    const isMeterOnline = meter.status === 'Active';
                    return (
                      <tr
                        key={meter.Meter_id}
                        style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.12s ease' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-card-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--brand-primary)'
                          }}>
                            #{meter.slave_id}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {meter.Meter_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {meter.make_name ? `${meter.make_name} • ` : ''}{meter.meter_model || 'Standard Meter'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-card-secondary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {meter.device_profile || 'Default Profile'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {meter.meter_serial_number || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: isMeterOnline ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                            color: isMeterOnline ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                            border: `1px solid ${isMeterOnline ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                            {isMeterOnline ? 'Active' : 'Offline'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openTestMeter(meter, channel)}
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                              title="Run live Modbus telemetry test"
                            >
                              <Zap size={11} color="var(--brand-primary)" /> Test
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditMeter(meter, channel)}
                              className="btn-icon"
                              style={{ color: 'var(--text-secondary)', padding: '4px' }}
                              title="Edit Meter"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMeter(meter)}
                              className="btn-icon"
                              style={{ color: 'var(--accent-rose)', padding: '4px' }}
                              title="Delete Meter"
                            >
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
          )}
        </div>
      </div>
    );
  };

  // ── Communication Test Modal Component ──
  const renderTestModal = () => {
    if (!testingMeter || !isTestModalOpen) return null;
    const isTesting = testStatus === 'testing';
    const isFailure = testStatus === 'failure';

    return (
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Hardware Telemetry Diagnostic Terminal"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Info Bar */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            fontSize: '0.78rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Target Meter</span>
              <strong style={{ color: 'var(--text-primary)' }}>{testingMeter.Meter_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Slave ID</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>#{testingMeter.slave_id}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Baud / Parity</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{testingMeter.baud_rate || '9600'}-8-{testingMeter.parity_bit?.[0] || 'N'}-1</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Channel Port</span>
              <span style={{ color: 'var(--text-secondary)' }}>{testingChannel?.Channel_name || 'RS485 Port'}</span>
            </div>
          </div>

          {/* Test Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Diagnostic Mode:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setTestMode('auto')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: testMode === 'auto' ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: testMode === 'auto' ? 'var(--brand-surface)' : 'var(--bg-card)',
                  color: testMode === 'auto' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => setTestMode('pass')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: testMode === 'pass' ? '1px solid var(--status-success-border)' : '1px solid var(--border-subtle)',
                  backgroundColor: testMode === 'pass' ? 'var(--status-success-bg)' : 'var(--bg-card)',
                  color: testMode === 'pass' ? 'var(--status-success-text)' : 'var(--text-secondary)'
                }}
              >
                Simulate Success
              </button>
              <button
                type="button"
                onClick={() => setTestMode('fail')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: testMode === 'fail' ? '1px solid var(--status-danger-border)' : '1px solid var(--border-subtle)',
                  backgroundColor: testMode === 'fail' ? 'var(--status-danger-bg)' : 'var(--bg-card)',
                  color: testMode === 'fail' ? 'var(--status-danger-text)' : 'var(--text-secondary)'
                }}
              >
                Simulate Timeout
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {testProgress > 0 && (
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
              <div style={{
                width: `${testProgress}%`,
                height: '100%',
                backgroundColor: isFailure ? 'var(--accent-rose)' : 'var(--brand-primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}

          {/* Terminal Console Logs */}
          <div style={{
            backgroundColor: '#090E1A',
            color: '#E2E8F0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #1E293B',
            minHeight: '130px',
            maxHeight: '180px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {testLogs.length === 0 ? (
              <div style={{ color: '#64748B', fontStyle: 'italic', padding: '10px 0' }}>
                &gt; Ready. Click "Start Telemetry Test" to send Modbus query frame...
              </div>
            ) : (
              testLogs.map((log, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '8px',
                  color: log.type === 'error' ? '#F87171' : log.type === 'warning' ? '#FBBF24' : log.type === 'success' ? '#34D399' : '#94A3B8'
                }}>
                  <span style={{ color: '#475569' }}>[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Test Summary Pill */}
          {testSummary && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: testSummary.success ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              border: `1px solid ${testSummary.success ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: testSummary.success ? 'var(--status-success-text)' : 'var(--status-danger-text)' }}>
                {testSummary.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {testSummary.success ? `Modbus Telemetry Verified (${testSummary.latencyMs}ms roundtrip)` : 'Modbus Communication Failed'}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <span>Loss: {testSummary.packetLoss}</span>
                {testSummary.sampleValue && <span>Sample: {testSummary.sampleValue} ({testSummary.voltage})</span>}
                {testSummary.errorReason && <span style={{ color: 'var(--accent-rose)' }}>{testSummary.errorReason}</span>}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setIsTestModalOpen(false)}
              className="btn btn-secondary"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => runCommunicationTest()}
              disabled={isTesting}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              {isTesting ? (
                <>
                  <RefreshCw size={14} className="spin-animate" /> Sending Frame...
                </>
              ) : (
                <>
                  <Zap size={14} /> Start Telemetry Test
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // ─── VIEW 1: GATEWAY FORM (ADD / EDIT) ──────────────────────────────────────
  if (viewMode === 'form') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {/* Form Header */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setViewMode('list')} className="btn-icon" title="Back to Devices">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {editingId ? `Edit Gateway — ${form.Gateway_name}` : 'Register New Gateway Device'}
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setViewMode('list')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary" style={{ gap: '6px' }}>
              <Save size={15} /> Save Gateway
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger-text)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Section 1: Network & Hardware Identity */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Fingerprint size={18} color="var(--brand-primary)" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Hardware Identity & Network IP
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <InputField
              label="Gateway Name"
              required
              value={form.Gateway_name}
              onChange={e => setForm(p => ({ ...p, Gateway_name: e.target.value }))}
              placeholder="e.g. Substation Alpha Gateway"
            />
            <InputField
              label="Hardware Serial Number"
              required
              value={form.serial_number}
              onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))}
              placeholder="e.g. SAB-GW-2026-001"
            />
            <InputField
              label="IP Address"
              required
              value={form.ip_address}
              onChange={e => setForm(p => ({ ...p, ip_address: e.target.value }))}
              placeholder="e.g. 192.168.1.150"
            />
            <InputField
              label="MAC Address"
              required
              value={form.mac_address}
              onChange={e => setForm(p => ({ ...p, mac_address: e.target.value }))}
              placeholder="e.g. 00:1B:44:11:3A:B7"
            />
          </div>
        </div>

        {/* Section 2: Make, Model & Channel Specifications */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Cpu size={18} color="var(--brand-primary)" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Manufacturer & Channel Capacity
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <SelectField
              label="Manufacturer Make"
              required
              value={form.gw_make_id}
              onChange={e => handleGatewayMakeChange(e.target.value)}
            >
              <option value="">Select Gateway Manufacturer</option>
              {gatewayMakes.map(m => (
                <option key={m.gw_make_id} value={m.gw_make_id}>{m.gw_make_name}</option>
              ))}
            </SelectField>

            <SelectField
              label="Gateway Hardware Model"
              required
              value={form.gw_model_id}
              onChange={e => handleGatewayModelChange(e.target.value)}
            >
              <option value="">Select Gateway Model</option>
              {gatewayModels
                .filter(m => !form.gw_make_id || m.gw_make_id === form.gw_make_id)
                .map(m => (
                  <option key={m.gw_model_id} value={m.gw_model_id}>
                    {m.gw_model_name} ({m.channel_count} channels)
                  </option>
                ))}
            </SelectField>

            <InputField
              label="Channel Slot Count"
              type="number"
              min="1"
              max="16"
              value={form.channel_count}
              onChange={e => {
                const newCount = Math.max(1, parseInt(e.target.value, 10) || 1);
                setForm(p => {
                  const existingNames = p.channel_names || [];
                  const updatedNames = Array.from({ length: newCount }, (_, i) => existingNames[i] || `Channel ${i + 1}`);
                  return { ...p, channel_count: newCount, channel_names: updatedNames };
                });
              }}
            />

            <InputField
              label="Keep Alive Polling (Seconds)"
              type="number"
              min="5"
              max="300"
              value={form.keep_alive_seconds}
              onChange={e => setForm(p => ({ ...p, keep_alive_seconds: Number(e.target.value) }))}
            />
          </div>

          {/* Channel Name Customization */}
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Channel Port Names
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' }}>
              {Array.from({ length: Math.max(1, parseInt(form.channel_count, 10) || 1) }, (_, idx) => (
                <InputField
                  key={idx}
                  label={`Slot #${idx + 1} Name`}
                  value={form.channel_names?.[idx] || ''}
                  placeholder={`Channel ${idx + 1}`}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(p => {
                      const next = [...(p.channel_names || [])];
                      next[idx] = val;
                      return { ...p, channel_names: next };
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW 2: SELECTED GATEWAY HIERARCHY (CHANNELS & METERS) ────────────────
  if (selectedGateway) {
    const totalSlots = Math.max(1, Number(selectedGateway.channel_count) || 2);
    const displayChannels = Array.from({ length: totalSlots }, (_, idx) => selectedChannels[idx] || null);
    const status = getDeviceStatus(selectedGateway);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {/* Navigation & Gateway Executive Banner */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Top Row: Back button, Gateway Selector, and Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSelectedGatewayId(null)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
                title="Return to Device Fleet Table"
              >
                <ArrowLeft size={14} /> Back to Fleet
              </button>
              <span style={{ color: 'var(--text-dim)' }}>/</span>
              {/* Quick Gateway Switcher Dropdown */}
              <select
                className="select"
                style={{ padding: '5px 12px', fontSize: '0.82rem', fontWeight: 600, width: 'auto' }}
                value={selectedGateway.Gateway_id}
                onChange={e => setSelectedGatewayId(e.target.value)}
              >
                {gateways.map(g => (
                  <option key={g.Gateway_id} value={g.Gateway_id}>
                    {g.Gateway_name} ({g.Gateway_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => openEdit(selectedGateway)}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', gap: '6px' }}
              >
                <Edit3 size={14} /> Edit Gateway
              </button>
              <button
                type="button"
                onClick={() => openAddChannelSlot(selectedChannels.length + 1)}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', gap: '6px' }}
              >
                <Plus size={14} /> Add Channel Slot
              </button>
            </div>
          </div>

          {/* Gateway Summary Card Details */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: 'var(--bg-card-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-surface)',
                color: 'var(--brand-primary)',
                border: '1px solid var(--brand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Server size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedGateway.Gateway_name}
                  </h2>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: status === 'Online' ? 'var(--status-success-bg)' : status === 'Intermittent' ? 'var(--status-warning-bg)' : 'var(--status-danger-bg)',
                    color: status === 'Online' ? 'var(--status-success-text)' : status === 'Intermittent' ? 'var(--status-warning-text)' : 'var(--status-danger-text)',
                    border: `1px solid ${status === 'Online' ? 'var(--status-success-border)' : status === 'Intermittent' ? 'var(--status-warning-border)' : 'var(--status-danger-border)'}`
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                    {status}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{selectedGateway.Gateway_id}</span> •
                  Make: <strong style={{ color: 'var(--text-secondary)' }}>{selectedGateway.gw_make_name || 'SaB Systems'}</strong> •
                  Model: <strong style={{ color: 'var(--text-secondary)' }}>{selectedGateway.gw_model_name || 'Gateway'}</strong> •
                  Firmware: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedGateway.firmware_version || 'v1.0.0'}</span>
                </div>
              </div>
            </div>

            {/* Quick Specs & Network Copy Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IP Address</span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedGateway.ip_address, 'ip')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                  title="Click to copy IP Address"
                >
                  {selectedGateway.ip_address || '—'}
                  {copiedKey === 'ip' ? <Check size={12} color="var(--brand-primary)" /> : <Copy size={12} color="var(--text-muted)" />}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MAC Address</span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedGateway.mac_address, 'mac')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                  title="Click to copy MAC Address"
                >
                  {selectedGateway.mac_address || '—'}
                  {copiedKey === 'mac' ? <Check size={12} color="var(--brand-primary)" /> : <Copy size={12} color="var(--text-muted)" />}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Channels / Meters</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--brand-surface)',
                  color: 'var(--brand-primary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  border: '1px solid var(--brand-border)'
                }}>
                  {selectedChannels.length} of {totalSlots} Channels ({meters.filter(m => selectedChannels.some(c => c.Channel_id === m.Channel_id)).length} Meters)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Channel Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: totalSlots <= 2 ? 'repeat(auto-fit, minmax(460px, 1fr))' : 'repeat(auto-fill, minmax(420px, 1fr))',
          gap: '20px',
          alignItems: 'stretch'
        }}>
          {displayChannels.map((channel, slotIndex) => renderChannelCard(channel, slotIndex + 1))}
        </div>

        {/* Channel Add/Edit Modal */}
        <Modal
          isOpen={isChannelModalOpen}
          onClose={() => setIsChannelModalOpen(false)}
          title={editingChannelId ? 'Edit Channel Configuration' : `Configure Communication Channel for ${selectedGateway.Gateway_name}`}
        >
          <form onSubmit={handleChannelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputField
              label="Channel Display Name"
              required
              value={channelForm.Channel_name}
              onChange={e => setChannelForm(p => ({ ...p, Channel_name: e.target.value }))}
              placeholder="e.g. RS-485 Main Feeder Bus"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <InputField
                label="Hardware Port"
                value={channelForm.port}
                onChange={e => setChannelForm(p => ({ ...p, port: e.target.value }))}
                placeholder="e.g. COM1 or /dev/ttyS0"
              />
              <SelectField
                label="Protocol"
                value={channelForm.protocol}
                onChange={e => setChannelForm(p => ({ ...p, protocol: e.target.value }))}
              >
                <option value="Modbus RTU">Modbus RTU (Serial RS-485)</option>
                <option value="Modbus TCP">Modbus TCP (Ethernet / IP)</option>
                <option value="MQTT">MQTT Industrial Edge</option>
              </SelectField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <SelectField
                label="Baud Rate"
                value={channelForm.baud_rate}
                onChange={e => setChannelForm(p => ({ ...p, baud_rate: e.target.value }))}
              >
                <option value="2400">2400</option>
                <option value="4800">4800</option>
                <option value="9600">9600</option>
                <option value="19200">19200</option>
                <option value="38400">38400</option>
                <option value="115200">115200</option>
              </SelectField>
              <SelectField
                label="Parity"
                value={channelForm.parity_bit}
                onChange={e => setChannelForm(p => ({ ...p, parity_bit: e.target.value }))}
              >
                <option value="None">None</option>
                <option value="Even">Even</option>
                <option value="Odd">Odd</option>
              </SelectField>
              <SelectField
                label="Stop Bits"
                value={channelForm.stop_bit}
                onChange={e => setChannelForm(p => ({ ...p, stop_bit: e.target.value }))}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </SelectField>
              <SelectField
                label="Data Bits"
                value={channelForm.data_bit}
                onChange={e => setChannelForm(p => ({ ...p, data_bit: e.target.value }))}
              >
                <option value="8">8</option>
                <option value="7">7</option>
              </SelectField>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsChannelModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingChannelId ? 'Save Channel Changes' : 'Confirm Channel'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Meter Add/Edit Modal */}
        <Modal
          isOpen={isMeterModalOpen}
          onClose={() => setIsMeterModalOpen(false)}
          title={editingMeter ? `Edit Meter (${editingMeter.Meter_name})` : `Add Modbus Meter to ${targetChannel?.Channel_name}`}
        >
          <form onSubmit={handleMeterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {meterModalError && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                {meterModalError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <InputField
                label="Meter Display Name"
                value={meterForm.Meter_name}
                onChange={e => setMeterForm(p => ({ ...p, Meter_name: e.target.value }))}
                placeholder="e.g. Incomer Feeder EM6400"
              />
              <InputField
                label="Modbus Slave ID"
                required
                type="number"
                min="1"
                max="247"
                value={meterForm.slave_id}
                onChange={e => setMeterForm(p => ({ ...p, slave_id: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SelectField
                label="Meter Manufacturer"
                value={meterForm.make_id}
                onChange={e => {
                  const makeId = e.target.value;
                  const mk = makes.find(m => m.make_id === makeId);
                  const firstMod = models.find(m => m.make_id === makeId);
                  setMeterForm(p => ({
                    ...p,
                    make_id: makeId,
                    make_name: mk?.make_name || '',
                    model_id: firstMod?.model_id || '',
                    meter_model: firstMod?.model_name || ''
                  }));
                }}
              >
                <option value="">Select Make</option>
                {makes.map(m => (
                  <option key={m.make_id} value={m.make_id}>{m.make_name}</option>
                ))}
              </SelectField>

              <SelectField
                label="Meter Hardware Model"
                value={meterForm.model_id}
                onChange={e => {
                  const modId = e.target.value;
                  const mod = models.find(m => m.model_id === modId);
                  setMeterForm(p => ({
                    ...p,
                    model_id: modId,
                    meter_model: mod?.model_name || ''
                  }));
                }}
              >
                <option value="">Select Model</option>
                {models
                  .filter(m => !meterForm.make_id || m.make_id === meterForm.make_id)
                  .map(m => (
                    <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
                  ))}
              </SelectField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SelectField
                label="Modbus Register Profile"
                value={meterForm.device_profile}
                onChange={e => setMeterForm(p => ({ ...p, device_profile: e.target.value }))}
              >
                <option value="">Select Register Profile</option>
                {meterProfiles.map(p => (
                  <option key={p.profile_id} value={p.profile_name}>{p.profile_name}</option>
                ))}
              </SelectField>

              <InputField
                label="Serial Number"
                required
                value={meterForm.meter_serial_number}
                onChange={e => setMeterForm(p => ({ ...p, meter_serial_number: e.target.value }))}
                placeholder="e.g. SCH-EM-2026-001"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsMeterModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingMeter ? 'Save Meter' : 'Register Meter'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Diagnostic Modal */}
        {renderTestModal()}
      </div>
    );
  }

  // ─── VIEW 3: MAIN FLEET TABLE (DEFAULT OVERVIEW) ───────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── KPI Quick Strip (Fleet Overview) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {/* KPI 1: Total Gateways */}
        <div
          onClick={() => setStatusFilter('ALL')}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${statusFilter === 'ALL' ? 'var(--status-info-border)' : 'var(--border-subtle)'}`,
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Gateways
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.totalGw}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-info-text)' }}>
            <TotalGatewaysIcon size={20} />
          </div>
        </div>

        {/* KPI 2: Online Gateways */}
        <div
          onClick={() => setStatusFilter('ONLINE')}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${statusFilter === 'ONLINE' ? 'var(--status-success-border)' : 'var(--border-subtle)'}`,
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Online / Active
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.online}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success-text)' }}>
            <OnlineActiveIcon size={20} />
          </div>
        </div>

        {/* KPI 3: Offline / Intermittent */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${statusFilter === 'OFFLINE' ? 'var(--status-danger-border)' : 'var(--border-subtle)'}`,
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Offline / Alert
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.offline + stats.intermittent}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-danger-text)' }}>
            <OfflineAlertIcon size={20} />
          </div>
        </div>

        {/* KPI 4: Connected Modbus Meters */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connected Meters
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.totalMeters}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-warning-text)' }}>
            <ConnectedMetersIcon size={20} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'var(--status-success-bg)',
          border: '1px solid var(--status-success-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--status-success-text)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* ── Toolbar: Search, Filters, and New Gateway Button ── */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Search Input Component */}
        <SearchInput
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, serial, IP, MAC, model…"
          width="320px"
        />

        {/* Filter Pills and CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-card-secondary)',
            padding: '3px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            gap: '3px'
          }}>
            {[
              { id: 'ALL', label: `All (${gateways.length})` },
              { id: 'ONLINE', label: `Online (${stats.online})` },
              { id: 'OFFLINE', label: `Offline (${stats.offline + stats.intermittent})` }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: statusFilter === pill.id ? 'var(--bg-card)' : 'transparent',
                  color: statusFilter === pill.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: statusFilter === pill.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Plus size={15} /> Register Gateway
          </button>
        </div>
      </div>

      {/* ── Main Fleet Table ── */}
      <DataTable
        columns={[
          {
            header: 'S.No',
            width: '48px',
            render: (_, idx) => (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{idx + 1}</span>
            ),
          },
          {
            header: 'Gateway Name & ID',
            render: (gw) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--status-info-bg)',
                    border: '1px solid var(--status-info-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-info-text)',
                    flexShrink: 0,
                  }}
                >
                  <TotalGatewaysIcon size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                    {gw.Gateway_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {gw.Gateway_id}
                  </div>
                </div>
              </div>
            ),
          },
          {
            header: 'Serial Number',
            render: (gw) => (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {gw.serial_number || '—'}
              </span>
            ),
          },
          {
            header: 'Network IP / MAC',
            render: (gw) => (
              <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-card-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {gw.ip_address || '—'}
                  </span>
                  {gw.ip_address && (
                    <button
                      type="button"
                      onClick={() => handleCopy(gw.ip_address, `ip-${gw.Gateway_id}`)}
                      className="btn-icon"
                      style={{ padding: '2px', color: 'var(--text-muted)' }}
                      title="Copy IP address"
                    >
                      {copiedKey === `ip-${gw.Gateway_id}` ? (
                        <Check size={11} color="var(--brand-primary)" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {gw.mac_address || '—'}
                </span>
              </div>
            ),
          },
          {
            header: 'Manufacturer / Model',
            render: (gw) => (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                  {gw.gw_make_name || 'SaB Systems'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {gw.gw_model_name || 'Gateway'} • {gw.firmware_version || 'v1.0.0'}
                </div>
              </div>
            ),
          },
          {
            header: 'Channel Slots',
            align: 'center',
            render: (gw) => {
              const gwChannels = channels.filter((c) => c.Gateway_id === gw.Gateway_id);
              const gwMeters = meters.filter((m) => gwChannels.some((c) => c.Channel_id === m.Channel_id));
              const cap = Number(gw.channel_count) || 2;
              return (
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--brand-surface)',
                      border: '1px solid var(--brand-border)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--brand-primary)',
                    }}
                  >
                    <Network size={12} />
                    {cap} Slots ({gwChannels.length} configured)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {gwMeters.length} meter{gwMeters.length === 1 ? '' : 's'} linked
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Live Status',
            align: 'center',
            render: (gw) => {
              const status = getDeviceStatus(gw);
              const isOnline = status === 'Online';
              const isIntermittent = status === 'Intermittent';
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: isOnline
                      ? 'var(--status-success-bg)'
                      : isIntermittent
                      ? 'var(--status-warning-bg)'
                      : 'var(--status-danger-bg)',
                    color: isOnline
                      ? 'var(--status-success-text)'
                      : isIntermittent
                      ? 'var(--status-warning-text)'
                      : 'var(--status-danger-text)',
                    border: `1px solid ${
                      isOnline
                        ? 'var(--status-success-border)'
                        : isIntermittent
                        ? 'var(--status-warning-border)'
                        : 'var(--status-danger-border)'
                    }`,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'currentColor',
                      boxShadow: isOnline ? '0 0 6px var(--status-success-text)' : 'none',
                    }}
                  />
                  {status}
                </span>
              );
            },
          },
          {
            header: 'Last Poll',
            align: 'center',
            render: (gw) => {
              const timeObj = formatTime(gw.last_communicate_time);
              return (
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Clock size={11} color="var(--text-dim)" />
                    {timeObj.elapsed}
                  </span>
                  <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {timeObj.exact}
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Actions',
            align: 'center',
            render: (gw) => (
              <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedGatewayId(gw.Gateway_id)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem', gap: '4px' }}
                  title="Explore Channels & Meters"
                >
                  Explore <ArrowUpRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(gw)}
                  className="btn-icon"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Edit Gateway Configuration"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(gw)}
                  className="btn-icon"
                  style={{ color: 'var(--accent-rose)' }}
                  title="Delete Gateway"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredGateways}
        rowKey="Gateway_id"
        onRowClick={(gw) => setSelectedGatewayId(gw.Gateway_id)}
        emptyIcon={Server}
        emptyMessage="No matching gateways found. Try adjusting your search criteria or register a new edge device."
        emptyAction={
          <button
            type="button"
            onClick={openAdd}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px', marginTop: '6px' }}
          >
            <Plus size={14} /> Register Gateway
          </button>
        }
      />
    </div>
  );
};
