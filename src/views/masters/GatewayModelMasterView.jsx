import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Cpu,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';

const EMPTY = {
  gw_make_id: '',
  gw_model_name: '',
  channel_count: 2,
  firmware_version: 'v1.0.0',
  channel_names: ['', ''],
};

export const GatewayModelMasterView = () => {
  const { gatewayMakes, gatewayModels, addGatewayModel, updateGatewayModel, deleteGatewayModel } = useEnergyData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentStage, setCurrentStage] = useState(1); // 1 = Gateway Details, 2 = RS-485 Port Configuration
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMakeId, setFilterMakeId] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = useMemo(() => {
    return gatewayModels.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (m.gw_model_name || '').toLowerCase().includes(q) ||
        (m.gw_model_id || '').toLowerCase().includes(q);
      const matchMake = filterMakeId === 'all' || m.gw_make_id === filterMakeId;
      return matchSearch && matchMake;
    });
  }, [gatewayModels, searchTerm, filterMakeId]);

  // Channel count handler (Stage 1) - strictly 1 or 2 channels
  const handleChannelCountChange = (countVal) => {
    const count = Number(countVal) === 1 ? 1 : 2;
    const current = form.channel_names || [];
    const nextNames = Array.from({ length: count }, (_, i) => (current[i] !== undefined ? current[i] : ''));
    setForm((prev) => ({
      ...prev,
      channel_count: count,
      channel_names: nextNames,
    }));
  };

  const handleChannelNameChange = (idx, val) => {
    const nextNames = [...(form.channel_names || [])];
    nextNames[idx] = val;
    setForm((prev) => ({
      ...prev,
      channel_names: nextNames,
    }));
  };

  const openAdd = () => {
    const def = filterMakeId !== 'all' ? filterMakeId : (gatewayMakes[0]?.gw_make_id || '');
    setEditingId(null);
    setCurrentStage(1);
    setIsSaving(false);
    setForm({
      gw_make_id: def,
      gw_model_name: '',
      channel_count: 2,
      firmware_version: 'v1.0.0',
      channel_names: ['', ''],
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (m) => {
    const rawCount = Number(m.channel_count) || 2;
    const count = rawCount === 1 ? 1 : 2;
    const names =
      m.channel_names && Array.isArray(m.channel_names) && m.channel_names.length === count
        ? m.channel_names
        : Array.from({ length: count }, (_, i) => m.channel_names?.[i] || '');

    setEditingId(m.gw_model_id);
    setCurrentStage(1);
    setIsSaving(false);
    setForm({
      gw_make_id: m.gw_make_id,
      gw_model_name: m.gw_model_name || '',
      channel_count: count,
      firmware_version: m.firmware_version || 'v1.0.0',
      channel_names: names,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCurrentStage(1);
    setIsSaving(false);
    setForm(EMPTY);
    setErrorMsg('');
  };

  // Stage 1 -> Stage 2 Navigation with validation
  const handleNextStage = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!form.gw_make_id) {
      setErrorMsg('Please select a Manufacturer (Make).');
      return;
    }
    const trimmedModel = form.gw_model_name.trim();
    if (!trimmedModel) {
      setErrorMsg('Gateway Model Name is required.');
      return;
    }

    // Check duplicate model under the same make
    const duplicate = gatewayModels.some(
      (m) =>
        m.gw_make_id === form.gw_make_id &&
        m.gw_model_name.toLowerCase() === trimmedModel.toLowerCase() &&
        m.gw_model_id !== editingId
    );
    if (duplicate) {
      setErrorMsg(`Model "${trimmedModel}" already exists under the selected Manufacturer.`);
      return;
    }

    // Check channel count (strictly 1 or 2)
    const count = Number(form.channel_count);
    if (count !== 1 && count !== 2) {
      setErrorMsg('Please select either 1 or 2 channels for this gateway model.');
      return;
    }

    // Normalize channel names for Stage 2 (user enters names in Step 2, starting empty)
    const current = form.channel_names || [];
    const normalizedNames = Array.from({ length: count }, (_, i) => (current[i] !== undefined ? current[i] : ''));

    setForm((prev) => ({
      ...prev,
      channel_names: normalizedNames,
    }));

    setCurrentStage(2);
  };

  const handlePrevStage = () => {
    setErrorMsg('');
    setCurrentStage(1);
  };

  // Save complete configuration (Validates Stage 1 + Stage 2)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setErrorMsg('');

    // Re-verify Stage 1
    if (!form.gw_make_id) {
      setCurrentStage(1);
      setErrorMsg('Please select a Manufacturer (Make).');
      return;
    }
    const trimmedModel = form.gw_model_name.trim();
    if (!trimmedModel) {
      setCurrentStage(1);
      setErrorMsg('Gateway Model Name is required.');
      return;
    }

    const channelCount = Number(form.channel_count) || 1;
    const channelNames = Array.from({ length: channelCount }, (_, i) => (form.channel_names?.[i] || '').trim());

    // Verify Stage 2 Channel Names
    for (let i = 0; i < channelCount; i++) {
      if (!channelNames[i]) {
        setErrorMsg(`Please enter a name for Channel ${i + 1}.`);
        return;
      }
    }

    // Check unique channel names
    const channelNameCounts = {};
    for (let i = 0; i < channelCount; i++) {
      const cName = channelNames[i].toLowerCase();
      channelNameCounts[cName] = (channelNameCounts[cName] || 0) + 1;
      if (channelNameCounts[cName] > 1) {
        setErrorMsg(`Duplicate channel name "${channelNames[i]}" found. Each channel slot must have a unique identifier.`);
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        gw_make_id: form.gw_make_id,
        gw_model_name: trimmedModel,
        channel_count: channelCount,
        channel_names: channelNames,
        firmware_version: form.firmware_version.trim() || 'v1.0.0',
      };

      if (editingId) {
        updateGatewayModel(editingId, payload);
        setSuccessMsg(`✓ Model "${trimmedModel}" updated successfully.`);
      } else {
        addGatewayModel(payload);
        setSuccessMsg(`✓ Model "${trimmedModel}" added successfully.`);
      }

      handleClose();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving the gateway model.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (m) => {
    if (window.confirm(`Delete Gateway Model "${m.gw_model_name}"?`)) {
      deleteGatewayModel(m.gw_model_id);
      setSuccessMsg(`✓ Model "${m.gw_model_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const selectedMake = gatewayMakes.find((m) => m.gw_make_id === form.gw_make_id);
  const selectedMakeName = selectedMake?.gw_make_name || form.gw_make_id || '—';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Gateway Model Master"
        icon={Cpu}
        actions={
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={15} />
            <span>Add Gateway Model</span>
          </button>
        }
      />

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
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Table Container with Integrated Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper">
              <Search size={14} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search models by name or ID..."
              />
            </div>

            {/* Filter by Make */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Manufacturer:
              </span>
              <select
                className="form-select"
                style={{ width: '180px', height: '34px' }}
                value={filterMakeId}
                onChange={(e) => setFilterMakeId(e.target.value)}
              >
                <option value="all">All Manufacturers ({gatewayMakes.length})</option>
                {gatewayMakes.map((mk) => (
                  <option key={mk.gw_make_id} value={mk.gw_make_id}>
                    {mk.gw_make_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
            Showing: <strong style={{ color: 'var(--brand-primary)' }}>{filtered.length}</strong> of {gatewayModels.length} Models
          </div>
        </div>

        <table className="enterprise-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Model Name</th>
              <th>Manufacturer</th>
              <th style={{ textAlign: 'center' }}>Channel Capacity</th>
              <th style={{ textAlign: 'center' }}>Firmware</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No gateway models found matching the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((m, index) => {
                const mk = gatewayMakes.find((make) => make.gw_make_id === m.gw_make_id);
                return (
                  <tr key={m.gw_model_id}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={14} color="var(--brand-primary)" />
                        <span>{m.gw_model_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} color="var(--text-muted)" />
                        <span>{mk?.gw_make_name || m.gw_make_id}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="mono-num"
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-surface-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                          fontWeight: 600,
                        }}
                      >
                        {m.channel_count || 4} Channels
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {m.firmware_version || 'v1.0.0'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEdit(m)}
                          className="btn-icon"
                          title="Edit Model"
                          aria-label="Edit Model"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="btn-icon"
                          style={{ color: 'var(--status-danger-text)' }}
                          title="Delete Model"
                          aria-label="Delete Model"
                        >
                          <Trash2 size={14} />
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

      {/* Two-Stage Add / Edit Gateway Model Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingId ? 'Edit Gateway Model' : 'Add Gateway Model'}
        maxWidth="680px"
        footer={
          currentStage === 1 ? (
            <>
              <button type="button" onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleNextStage} className="btn btn-primary">
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrevStage}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{editingId ? 'Update Model' : 'Save Model'}</span>
                  </>
                )}
              </button>
            </>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Enhanced Step Indicator: Two Separate Cards with Between Space */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Box 1: Step 1 Gateway Details */}
            <div
              onClick={() => {
                if (currentStage === 2) handlePrevStage();
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 15px',
                borderRadius: '10px',
                backgroundColor:
                  currentStage === 1
                    ? 'var(--brand-surface)'
                    : 'var(--bg-surface-secondary)',
                border:
                  currentStage === 1
                    ? '1.5px solid var(--brand-primary)'
                    : '1px solid var(--border-default)',
                boxShadow:
                  currentStage === 1
                    ? '0 2px 8px rgba(22, 128, 93, 0.10)'
                    : 'none',
                cursor: currentStage === 2 ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
              title={currentStage === 2 ? 'Return to Step 1' : 'Current Step'}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor:
                    currentStage === 1
                      ? 'var(--brand-primary)'
                      : 'var(--status-success-bg)',
                  color:
                    currentStage === 1
                      ? '#ffffff'
                      : 'var(--status-success-text)',
                  border:
                    currentStage === 1
                      ? '1px solid var(--brand-primary)'
                      : '1px solid var(--status-success-border)',
                  flexShrink: 0,
                }}
              >
                {currentStage > 1 ? <Check size={14} /> : '1'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: currentStage === 1 ? 700 : 600,
                    color:
                      currentStage === 1
                        ? 'var(--brand-primary)'
                        : 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Step 1: Gateway Details
                </div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  Make, Model & Slots
                </div>
              </div>
            </div>

            {/* Space with Connecting Chevron */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              <ChevronRight size={18} />
            </div>

            {/* Box 2: Step 2 Channels & Ports */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 15px',
                borderRadius: '10px',
                backgroundColor:
                  currentStage === 2
                    ? 'var(--brand-surface)'
                    : 'var(--bg-surface-secondary)',
                border:
                  currentStage === 2
                    ? '1.5px solid var(--brand-primary)'
                    : '1px solid var(--border-subtle)',
                boxShadow:
                  currentStage === 2
                    ? '0 2px 8px rgba(22, 128, 93, 0.10)'
                    : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor:
                    currentStage === 2
                      ? 'var(--brand-primary)'
                      : 'var(--bg-surface)',
                  color:
                    currentStage === 2
                      ? '#ffffff'
                      : 'var(--text-muted)',
                  border:
                    currentStage === 2
                      ? '1px solid var(--brand-primary)'
                      : '1px solid var(--border-default)',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: currentStage === 2 ? 700 : 550,
                    color:
                      currentStage === 2
                        ? 'var(--brand-primary)'
                        : 'var(--text-muted)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Step 2: Channel Names
                </div>
              </div>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                padding: '9px 12px',
                backgroundColor: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-danger-text)',
                fontSize: '0.80rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── STAGE 1: GATEWAY MODEL CONFIGURATION ── */}
          {currentStage === 1 && (
            <form onSubmit={handleNextStage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Manufacturer (Make) *</label>
                <select
                  className="form-select"
                  value={form.gw_make_id}
                  onChange={(e) => setForm({ ...form, gw_make_id: e.target.value })}
                >
                  {gatewayMakes.map((mk) => (
                    <option key={mk.gw_make_id} value={mk.gw_make_id}>
                      {mk.gw_make_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gateway Model Name *</label>
                <input
                  className="form-input"
                  value={form.gw_model_name}
                  onChange={(e) => setForm({ ...form, gw_model_name: e.target.value })}
                  placeholder="e.g. SAB-GW-G1, EKI-1521"
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Channel Capacity *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[1, 2].map((cnt) => {
                      const isSelected = Number(form.channel_count) === cnt;
                      return (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleChannelCountChange(cnt)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--brand-surface)' : 'var(--bg-surface)',
                            color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 700 : 550,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--border-default)',
                              display: 'inline-block',
                            }}
                          />
                          {cnt} Channel{cnt === 1 ? '' : 's'}
                        </button>
                      );
                    })}
                  </div>
                  <span className="form-helper" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    1 or 2 channels supported
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Firmware Version</label>
                  <input
                    className="form-input mono-num"
                    value={form.firmware_version}
                    onChange={(e) => setForm({ ...form, firmware_version: e.target.value })}
                    placeholder="v1.0.0"
                  />
                </div>
              </div>
            </form>
          )}

          {/* ── STAGE 2: CHANNEL NAMES ── */}
          {currentStage === 2 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '66vh',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {/* Section A: Compact Read-Only Gateway Summary */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Gateway Summary
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevStage}
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Manufacturer</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedMakeName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Model Name</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--brand-primary)', marginTop: '2px' }}>
                      {form.gw_model_name}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Channel Slots</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {form.channel_count} Slots
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Firmware</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {form.firmware_version || 'v1.0.0'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section B: Dynamic Channel Names Configuration */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 650, color: 'var(--text-primary)' }}>
                    Channel Names
                  </h4>
                  <span
                    className="mono-num"
                    style={{
                      fontSize: '0.70rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--brand-primary)',
                      fontWeight: 650,
                    }}
                  >
                    {form.channel_names?.length || form.channel_count} Channels
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '12px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {(form.channel_names || []).map((name, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Channel {idx + 1} *
                      </span>
                      <input
                        className="form-input"
                        style={{ height: '36px', fontSize: '0.82rem' }}
                        value={name || ''}
                        onChange={(e) => handleChannelNameChange(idx, e.target.value)}
                        placeholder={`e.g. Channel ${idx + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
