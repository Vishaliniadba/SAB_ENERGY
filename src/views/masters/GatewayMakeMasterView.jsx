import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Search, Building2, ArrowLeft, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const GatewayMakeMasterView = () => {
  const { gatewayMakes, addGatewayMake, updateGatewayMake, deleteGatewayMake, gatewayModels } = useEnergyData();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [makeName, setMakeName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = gatewayMakes.filter((m) =>
    !searchTerm || (m.gw_make_name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const openAdd = () => {
    setEditingId(null);
    setMakeName('');
    setErrorMsg('');
    setViewMode('form');
  };

  const openEdit = (m) => {
    setEditingId(m.gw_make_id);
    setMakeName(m.gw_make_name || '');
    setErrorMsg('');
    setViewMode('form');
  };

  const handleSave = () => {
    setErrorMsg('');
    const trimmed = makeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a Make Name.');
      return;
    }

    if (editingId) {
      updateGatewayMake(editingId, { gw_make_name: trimmed });
      setSuccessMsg(`✓ Make "${trimmed}" updated.`);
    } else {
      const exists = gatewayMakes.some((m) => m.gw_make_name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        setErrorMsg(`Gateway Make "${trimmed}" already exists.`);
        return;
      }
      addGatewayMake({ gw_make_name: trimmed });
      setSuccessMsg(`✓ Make "${trimmed}" added.`);
    }

    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (m) => {
    const linked = gatewayModels.filter((mod) => mod.gw_make_id === m.gw_make_id).length;
    const msg = linked > 0
      ? `"${m.gw_make_name}" has ${linked} models associated with it. Delete this make?`
      : `Delete make "${m.gw_make_name}"?`;

    if (window.confirm(msg)) {
      deleteGatewayMake(m.gw_make_id);
      setSuccessMsg(`✓ Make "${m.gw_make_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // ─── FORM VIEW (ONLY MAKE NAME) ─────────────────────────────────────────────
  if (viewMode === 'form') {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {editingId ? 'Edit Gateway Make' : 'Add Gateway Make'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  {editingId ? 'Update manufacturer name' : 'Enter the manufacturer name for gateways'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={errBox}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Form Body - Only Make Name */}
        <div style={card}>
          <div>
            <label style={lbl}>Make Name *</label>
            <input
              style={inp}
              value={makeName}
              onChange={(e) => setMakeName(e.target.value)}
              placeholder="e.g. Advantech, SaB Systems, Siemens"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', ...card }}>
          <button onClick={() => setViewMode('list')} style={cancelBtn}>
            <X size={14} /> Cancel
          </button>
          <button onClick={handleSave} style={saveBtn}>
            <Save size={14} /> {editingId ? 'Update Make' : 'Add Make'}
          </button>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.2)',
            }}
          >
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Gateway Make Master
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              Manufacturers of IoT edge gateway devices
            </p>
          </div>
        </div>
        <button onClick={openAdd} style={saveBtn}>
          <Plus size={14} /> Add Make
        </button>
      </div>

      {successMsg && (
        <div style={succBox}>
          <CheckCircle2 size={14} color="#059669" /> {successMsg}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
          Total Makes: <strong style={{ color: '#0284c7' }}>{gatewayMakes.length}</strong>
        </span>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            style={{ ...inp, paddingLeft: '28px', width: '220px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search makes..."
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '12px 16px', width: '60px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Make Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', width: '160px' }}>Linked Models</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No gateway makes found. Click <strong>"Add Make"</strong> to create one.
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => {
                const linkedCount = gatewayModels.filter((mod) => mod.gw_make_id === m.gw_make_id).length;
                return (
                  <tr
                    key={m.gw_make_id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={15} color="#0284c7" />
                        <span>{m.gw_make_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 9px',
                          borderRadius: '12px',
                          backgroundColor: linkedCount > 0 ? '#f0f9ff' : '#f8fafc',
                          color: linkedCount > 0 ? '#0284c7' : '#94a3b8',
                          border: `1px solid ${linkedCount > 0 ? '#bae6fd' : '#e2e8f0'}`,
                          fontWeight: 600,
                        }}
                      >
                        {linkedCount} {linkedCount === 1 ? 'model' : 'models'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(m)} style={editBtnSt} title="Edit Make">
                          <Edit3 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDelete(m)} style={delBtnSt} title="Delete Make">
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
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '18px 22px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
};
const lbl = {
  display: 'block',
  fontSize: '0.82rem',
  color: '#334155',
  fontWeight: 700,
  marginBottom: '6px',
};
const inp = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '0.86rem',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};
const saveBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#0284c7',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
};
const cancelBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  backgroundColor: '#fff',
  border: '1px solid #cbd5e1',
  color: '#334155',
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
  border: '1px solid #cbd5e1',
  backgroundColor: '#fff',
  cursor: 'pointer',
};
const editBtnSt = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 9px',
  borderRadius: '6px',
  border: '1px solid #bae6fd',
  backgroundColor: '#f0f9ff',
  color: '#0284c7',
  cursor: 'pointer',
  fontSize: '0.74rem',
  fontWeight: 600,
};
const delBtnSt = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 7px',
  borderRadius: '6px',
  border: '1px solid #fecdd3',
  backgroundColor: '#fff1f2',
  color: '#e11d48',
  cursor: 'pointer',
};
const succBox = {
  padding: '10px 14px',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  color: '#065f46',
  fontSize: '0.82rem',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
};
const errBox = {
  padding: '10px 14px',
  backgroundColor: '#fff1f2',
  border: '1px solid #fecdd3',
  borderRadius: '8px',
  color: '#9f1239',
  fontSize: '0.82rem',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
};
