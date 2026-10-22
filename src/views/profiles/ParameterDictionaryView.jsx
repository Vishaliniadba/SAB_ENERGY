import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search, Sliders, ArrowLeft, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const ParameterDictionaryView = () => {
  const { standardParameters, addStandardParameter, updateStandardParameter, deleteStandardParameter } = useEnergyData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formKey, setFormKey] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredParams = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return standardParameters;
    return standardParameters.filter(
      (p) => (p.key || '').toLowerCase().includes(q) || (p.display_name || '').toLowerCase().includes(q) || (p.unit || '').toLowerCase().includes(q)
    );
  }, [standardParameters, searchTerm]);

  const handleOpenAdd = () => {
    setEditingKey(null);
    setFormKey('');
    setFormDisplayName('');
    setFormUnit('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (param) => {
    setEditingKey(param.key);
    setFormKey(param.key);
    setFormDisplayName(param.display_name || '');
    setFormUnit(param.unit || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKey(null);
    setFormKey('');
    setFormDisplayName('');
    setFormUnit('');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedKey = formKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const trimmedDisplayName = formDisplayName.trim();
    const trimmedUnit = formUnit.trim();

    if (!trimmedKey) {
      setErrorMsg('Please enter a Key.');
      return;
    }
    if (!trimmedDisplayName) {
      setErrorMsg('Please enter a Display Name.');
      return;
    }

    if (editingKey) {
      if (updateStandardParameter) {
        updateStandardParameter(editingKey, {
          key: trimmedKey,
          display_name: trimmedDisplayName,
          unit: trimmedUnit,
        });
      }
      setSuccessMsg(`✓ Parameter "${trimmedDisplayName}" updated.`);
    } else {
      const exists = standardParameters.some((p) => p.key.toLowerCase() === trimmedKey.toLowerCase());
      if (exists) {
        setErrorMsg(`Parameter Key "${trimmedKey}" already exists.`);
        return;
      }

      addStandardParameter({
        key: trimmedKey,
        display_name: trimmedDisplayName,
        unit: trimmedUnit,
      });
      setSuccessMsg(`✓ Added Parameter "${trimmedDisplayName}"`);
    }

    handleCloseModal();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (param) => {
    if (window.confirm(`Delete Parameter "${param.display_name}" (${param.key})?`)) {
      deleteStandardParameter(param.key);
      setSuccessMsg(`✓ Deleted Parameter "${param.display_name}"`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Page Header */}
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
              background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Sliders size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Parameter Master
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              Define standard telemetry keys and display names for meter register mapping
            </p>
          </div>
        </div>
        <button onClick={handleOpenAdd} style={saveBtn}>
          <Plus size={15} /> Add Parameter
        </button>
      </div>

      {successMsg && (
        <div style={succBox}>
          <CheckCircle2 size={15} color="#059669" /> {successMsg}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
          Total Parameters: <strong style={{ color: '#0284c7' }}>{standardParameters.length}</strong>
        </span>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            style={{ ...inp, paddingLeft: '30px', width: '240px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search key or name..."
          />
        </div>
      </div>

      {/* Table of Parameters */}
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
              <th style={{ padding: '12px 18px', width: '50px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '12px 18px', textAlign: 'left' }}>Key</th>
              <th style={{ padding: '12px 18px', textAlign: 'left' }}>Display Name</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', width: '100px' }}>Unit</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParams.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No parameters found. Click <strong>"Add Parameter"</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredParams.map((param, idx) => (
                <tr
                  key={param.key}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '11px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '11px 18px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>
                    {param.key}
                  </td>
                  <td style={{ padding: '11px 18px', fontWeight: 700, color: '#0f172a' }}>
                    {param.display_name}
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'center' }}>
                    {param.unit ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.74rem'
                      }}>
                        {param.unit}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenEdit(param)} style={editBtnSt} title="Edit Parameter">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(param)} style={delBtnSt} title="Delete Parameter">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add / Edit Parameter */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {editingKey ? 'Edit Parameter' : 'Add Parameter'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div style={errBox}>
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              <div>
                <label style={lbl}>Key *</label>
                <input
                  style={{ ...inp, fontFamily: 'monospace' }}
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="e.g. power_active_total, voltage_ll_avg"
                  disabled={!!editingKey}
                  autoFocus
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Unique telemetry key (lowercase, underscores)
                </span>
              </div>

              <div>
                <label style={lbl}>Display Name *</label>
                <input
                  style={inp}
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="e.g. Watts Total, VLL average"
                />
              </div>

              <div>
                <label style={lbl}>Unit</label>
                <input
                  style={inp}
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="e.g. W, kW, V, A, VAR, VA, Hz, kWh"
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Measurement unit (will auto-populate in Meter Profiles)
                </span>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={handleCloseModal} style={cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={saveBtn}>
                  <Save size={14} /> {editingKey ? 'Update Parameter' : 'Add Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
