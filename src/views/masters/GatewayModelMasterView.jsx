import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search, Cpu, Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';

const EMPTY = { gw_make_id: '', gw_model_name: '', channel_count: 4, firmware_version: 'v1.0.0' };

export const GatewayModelMasterView = () => {
  const { gatewayMakes, gatewayModels, addGatewayModel, updateGatewayModel, deleteGatewayModel } = useEnergyData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMakeId, setFilterMakeId] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = useMemo(() => {
    return gatewayModels.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || (m.gw_model_name || '').toLowerCase().includes(q) || (m.gw_model_id || '').toLowerCase().includes(q);
      const matchMake = filterMakeId === 'all' || m.gw_make_id === filterMakeId;
      return matchSearch && matchMake;
    });
  }, [gatewayModels, searchTerm, filterMakeId]);

  const openAdd = () => {
    const def = filterMakeId !== 'all' ? filterMakeId : (gatewayMakes[0]?.gw_make_id || '');
    setEditingId(null);
    setForm({ gw_make_id: def, gw_model_name: '', channel_count: 4, firmware_version: 'v1.0.0' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.gw_model_id);
    setForm({
      gw_make_id: m.gw_make_id,
      gw_model_name: m.gw_model_name || '',
      channel_count: m.channel_count || 4,
      firmware_version: m.firmware_version || 'v1.0.0',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY);
    setErrorMsg('');
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const trimmedModel = form.gw_model_name.trim();

    if (!form.gw_make_id) {
      setErrorMsg('Please select a Make.');
      return;
    }
    if (!trimmedModel) {
      setErrorMsg('Model Name is required.');
      return;
    }

    if (editingId) {
      updateGatewayModel(editingId, {
        gw_make_id: form.gw_make_id,
        gw_model_name: trimmedModel,
        channel_count: Number(form.channel_count) || 4,
        firmware_version: form.firmware_version.trim() || 'v1.0.0',
      });
      setSuccessMsg(`✓ Model "${trimmedModel}" updated successfully.`);
    } else {
      const exists = gatewayModels.some(
        (m) => m.gw_make_id === form.gw_make_id && m.gw_model_name.toLowerCase() === trimmedModel.toLowerCase()
      );
      if (exists) {
        setErrorMsg(`Model "${trimmedModel}" already exists under the selected Make.`);
        return;
      }
      addGatewayModel({
        gw_make_id: form.gw_make_id,
        gw_model_name: trimmedModel,
        channel_count: Number(form.channel_count) || 4,
        firmware_version: form.firmware_version.trim() || 'v1.0.0',
      });
      setSuccessMsg(`✓ Model "${trimmedModel}" added successfully.`);
    }

    handleClose();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (m) => {
    if (window.confirm(`Delete Gateway Model "${m.gw_model_name}"?`)) {
      deleteGatewayModel(m.gw_model_id);
      setSuccessMsg(`✓ Model "${m.gw_model_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Gateway Model Master"
        subtitle="Configure physical hardware models, channel capacities (RS-485 / Ethernet slots), and firmware specifications."
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
              <th>Model Identifier</th>
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
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No gateway models found matching the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((m, index) => {
                const mk = gatewayMakes.find((make) => make.gw_make_id === m.gw_make_id);
                return (
                  <tr key={m.gw_model_id}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td className="mono-num" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {m.gw_model_id}
                    </td>
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingId ? 'Edit Gateway Model' : 'Add Gateway Model'}
        subtitle="Configure model specifications, manufacturer association, and RS-485 port capacity."
        maxWidth="540px"
        footer={
          <>
            <button onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save size={14} />
              <span>{editingId ? 'Update Model' : 'Save Model'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

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
              placeholder="e.g. SAB-GW-G1, EKI-1521, SIMATIC-IOT2050"
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Channel Count (Slots) *</label>
              <select
                className="form-select"
                value={form.channel_count}
                onChange={(e) => setForm({ ...form, channel_count: Number(e.target.value) })}
              >
                <option value={1}>1 Channel</option>
                <option value={2}>2 Channels</option>
                <option value={4}>4 Channels</option>
                <option value={8}>8 Channels</option>
                <option value={16}>16 Channels</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Firmware Version</label>
              <input
                className="form-input"
                value={form.firmware_version}
                onChange={(e) => setForm({ ...form, firmware_version: e.target.value })}
                placeholder="v1.0.0"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
