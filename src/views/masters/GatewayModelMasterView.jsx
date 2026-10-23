import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search, Cpu, ArrowLeft, Save, X, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

const EMPTY = { gw_make_id: '', gw_model_name: '' };

export const GatewayModelMasterView = () => {
  const { gatewayMakes, gatewayModels, addGatewayModel, updateGatewayModel, deleteGatewayModel } = useEnergyData();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMakeId, setFilterMakeId] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = useMemo(() => {
    return gatewayModels.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || (m.gw_model_name || '').toLowerCase().includes(q);
      const matchMake = filterMakeId === 'all' || m.gw_make_id === filterMakeId;
      return matchSearch && matchMake;
    });
  }, [gatewayModels, searchTerm, filterMakeId]);

  const openAdd = () => {
    const def = filterMakeId !== 'all' ? filterMakeId : (gatewayMakes[0]?.gw_make_id || '');
    setEditingId(null);
    setForm({ gw_make_id: def, gw_model_name: '' });
    setErrorMsg('');
    setViewMode('form');
  };

  const openEdit = (m) => {
    setEditingId(m.gw_model_id);
    setForm({
      gw_make_id: m.gw_make_id,
      gw_model_name: m.gw_model_name || '',
    });
    setErrorMsg('');
    setViewMode('form');
  };

  const handleSave = () => {
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
      });
      setSuccessMsg(`✓ Model "${trimmedModel}" updated.`);
    } else {
      const exists = gatewayModels.some(
        (m) => m.gw_make_id === form.gw_make_id && m.gw_model_name.toLowerCase() === trimmedModel.toLowerCase()
      );
      if (exists) {
        setErrorMsg(`Model "${trimmedModel}" already exists under this Make.`);
        return;
      }

      addGatewayModel({
        gw_make_id: form.gw_make_id,
        gw_model_name: trimmedModel,
      });
      setSuccessMsg(`✓ Model "${trimmedModel}" added.`);
    }

    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (m) => {
    const makeName = gatewayMakes.find((mk) => mk.gw_make_id === m.gw_make_id)?.gw_make_name || '';
    if (window.confirm(`Delete model "${m.gw_model_name}" (${makeName})?`)) {
      deleteGatewayModel(m.gw_model_id);
      setSuccessMsg(`✓ Model "${m.gw_model_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // ─── FORM VIEW (ONLY MAKE AND MODEL NAME) ──────────────────────────────────
  if (viewMode === 'form') {
    return (
      <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Header */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setViewMode('list')} style={backBtn} title="Back">
              <ArrowLeft size={17} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {editingId ? 'Edit Gateway Model' : 'Add Gateway Model'}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={errBox}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Form Body - Only Make and Model Name */}
        <div style={card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={lbl}>Make (Manufacturer) *</label>
              <select
                style={inp}
                value={form.gw_make_id}
                onChange={(e) => setForm((p) => ({ ...p, gw_make_id: e.target.value }))}
              >
                <option value="">-- Select Make --</option>
                {gatewayMakes.map((m) => (
                  <option key={m.gw_make_id} value={m.gw_make_id}>
                    {m.gw_make_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>Model Name *</label>
              <input
                style={inp}
                value={form.gw_model_name}
                onChange={(e) => setForm((p) => ({ ...p, gw_model_name: e.target.value }))}
                placeholder="e.g. SAB-GW-G2, EKI-1521, WAGO-750"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', ...card }}>
          <button onClick={() => setViewMode('list')} style={cancelBtn}>
            <X size={14} /> Cancel
          </button>
          <button onClick={handleSave} style={saveBtn}>
            <Save size={14} /> {editingId ? 'Update Model' : 'Add Model'}
          </button>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header Card */}
      <div
        style={{
          ...card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-cyan-glow)',
            }}
          >
            <Cpu size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Gateway Model Master
            </h2>
          </div>
        </div>
        <button onClick={openAdd} style={saveBtn}>
          <Plus size={14} /> Add Model
        </button>
      </div>

      {successMsg && (
        <div style={succBox}>
          <CheckCircle2 size={14} color="var(--accent-emerald)" /> {successMsg}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div
        style={{
          ...card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Models: <strong style={{ color: 'var(--primary-cyan)' }}>{gatewayModels.length}</strong>
          </span>
          <select
            style={{ ...inp, width: '180px', fontSize: '0.8rem' }}
            value={filterMakeId}
            onChange={(e) => setFilterMakeId(e.target.value)}
          >
            <option value="all">All Makes</option>
            {gatewayMakes.map((m) => (
              <option key={m.gw_make_id} value={m.gw_make_id}>
                {m.gw_make_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            style={{ ...inp, paddingLeft: '28px', width: '220px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search models..."
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-table-header)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '12px 16px', width: '60px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Make (Manufacturer)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Model Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No models found. Click <strong style={{ color: 'var(--primary-cyan)' }}>"Add Model"</strong> to create one.
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => {
                const makeName = gatewayMakes.find((mk) => mk.gw_make_id === m.gw_make_id)?.gw_make_name || '—';
                return (
                  <tr
                    key={m.gw_model_id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Building2 size={14} color="var(--text-muted)" />
                        <span>{makeName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Cpu size={14} color="var(--text-muted)" />
                        <span>{m.gw_model_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(m)} style={editBtnSt} title="Edit Model">
                          <Edit3 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDelete(m)} style={delBtnSt} title="Delete Model">
                          <Trash2 size={12} />
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
  );
};

const card = {
  backgroundColor: 'var(--bg-card)',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  padding: '18px 22px',
  boxShadow: 'var(--shadow-card)',
};
const lbl = {
  display: 'block',
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  marginBottom: '6px',
};
const inp = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  fontSize: '0.86rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: 'var(--bg-input)',
};
const saveBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'var(--primary-cyan-deep)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-glow)',
};
const cancelBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  backgroundColor: 'var(--bg-card-secondary)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  borderRadius: '8px',
  padding: '7px 14px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
};
const backBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '34px',
  borderRadius: '8px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
const editBtnSt = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 9px',
  borderRadius: '6px',
  border: '1px solid var(--primary-cyan-border)',
  backgroundColor: 'var(--primary-cyan-glow)',
  color: 'var(--primary-cyan)',
  cursor: 'pointer',
  fontSize: '0.74rem',
  fontWeight: 600,
};
const delBtnSt = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 7px',
  borderRadius: '6px',
  border: '1px solid var(--accent-rose-border)',
  backgroundColor: 'var(--accent-rose-glow)',
  color: 'var(--accent-rose)',
  cursor: 'pointer',
};
const succBox = {
  padding: '10px 14px',
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  border: '1px solid var(--accent-emerald-border)',
  borderRadius: '8px',
  color: 'var(--accent-emerald)',
  fontSize: '0.82rem',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
};
const errBox = {
  padding: '10px 14px',
  backgroundColor: 'rgba(244, 63, 94, 0.12)',
  border: '1px solid var(--accent-rose-border)',
  borderRadius: '8px',
  color: 'var(--accent-rose)',
  fontSize: '0.82rem',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
};
