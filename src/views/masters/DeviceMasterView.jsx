import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Server, Wifi, WifiOff, Clock, CheckCircle2,
  AlertCircle, ArrowLeft, Save, X, RotateCcw, Building2, Cpu, Hash,
  Globe, Fingerprint, ShieldCheck, Activity, ChevronRight, Settings
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

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
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString();
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
  keep_alive_seconds: 30,
  status: 'Active',
};

export const DeviceMasterView = () => {
  const {
    gateways, gatewayMakes, gatewayModels,
    addGateway, updateGateway, deleteGateway
  } = useEnergyData();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  // Filtered models by selected make
  const availableModels = useMemo(() =>
    gatewayModels.filter(m => !form.gw_make_id || m.gw_make_id === form.gw_make_id),
    [gatewayModels, form.gw_make_id]
  );

  // Filtered gateway list
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return gateways;
    return gateways.filter(g =>
      (g.Gateway_name || '').toLowerCase().includes(q) ||
      (g.serial_number || '').toLowerCase().includes(q) ||
      (g.ip_address || '').toLowerCase().includes(q) ||
      (g.mac_address || '').toLowerCase().includes(q) ||
      (g.gw_make_name || '').toLowerCase().includes(q) ||
      (g.gw_model_name || '').toLowerCase().includes(q)
    );
  }, [gateways, searchTerm]);

  const handleMakeChange = (makeId) => {
    const mk = gatewayMakes.find(m => m.gw_make_id === makeId);
    const firstModel = gatewayModels.find(m => m.gw_make_id === makeId);
    setForm(prev => ({
      ...prev,
      gw_make_id: makeId,
      gw_make_name: mk?.gw_make_name || '',
      gw_model_id: firstModel?.gw_model_id || '',
      gw_model_name: firstModel?.gw_model_name || '',
      firmware_version: prev.firmware_version || firstModel?.firmware_version || ''
    }));
  };

  const handleModelChange = (modelId) => {
    const mod = gatewayModels.find(m => m.gw_model_id === modelId);
    setForm(prev => ({
      ...prev,
      gw_model_id: modelId,
      gw_model_name: mod?.gw_model_name || '',
      firmware_version: prev.firmware_version || mod?.firmware_version || ''
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
      serial_number: `SAB-GW-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    });
    setErrorMsg('');
    setViewMode('form');
  };

  const openEdit = (gw) => {
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

    if (editingId) {
      updateGateway(editingId, form);
      setSuccessMsg(`✓ Device "${form.Gateway_name}" updated successfully.`);
    } else {
      addGateway(form);
      setSuccessMsg(`✓ Device "${form.Gateway_name}" created successfully.`);
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
                  {editingId ? `Editing: ${form.Gateway_name}` : 'Add a new gateway/edge device to the network'}
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

        {/* Make & Model Section */}
        <div style={cardStyle}>
          <SectionTitle icon={<Cpu size={16} />} title="Make & Model" />
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
              Register and manage IoT edge gateway devices. Status is derived from MQTT keep-alive heartbeat.
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

      {/* Stats + Search */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Stat label="Total" value={gateways.length} color="#0284c7" />
          <Stat label="Online" value={gateways.filter(g => getDeviceStatus(g) === 'Online').length} color="#15803d" />
          <Stat label="Offline" value={gateways.filter(g => getDeviceStatus(g) === 'Offline').length} color="#dc2626" />
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
              <th style={th}>#</th>
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
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ss.dot, boxShadow: status === 'Online' ? `0 0 6px ${ss.dot}` : 'none' }} />
                      {status}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.76rem', color: '#64748b' }}>
                      <Clock size={12} />
                      <span>{formatTime(gw.last_communicate_time)}</span>
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => openEdit(gw)} style={editBtnStyle} title="Edit">
                        <Edit3 size={13} /> Edit
                      </button>
                      <button onClick={() => handleDelete(gw)} style={deleteBtnStyle} title="Delete">
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
