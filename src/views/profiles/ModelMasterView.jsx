import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Cpu, Building2, Search, Save, Filter, X } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const ModelMasterView = () => {
  const { models, addModel, updateModel, deleteModel, makes } = useEnergyData();

  // Filter & search
  const [filterMakeId, setFilterMakeId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState(null);
  const [formMakeId, setFormMakeId] = useState(makes[0]?.make_id || '');
  const [formModelName, setFormModelName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingModelId(null);
    setFormMakeId(filterMakeId !== 'all' ? filterMakeId : (makes[0]?.make_id || ''));
    setFormModelName('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (model) => {
    setEditingModelId(model.model_id);
    setFormMakeId(model.make_id);
    setFormModelName(model.model_name);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModelId(null);
    setFormModelName('');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedModel = formModelName.trim();
    if (!formMakeId) {
      setErrorMsg('Please select a Make.');
      return;
    }
    if (!trimmedModel) {
      setErrorMsg('Please enter a Model Name.');
      return;
    }

    if (editingModelId) {
      updateModel(editingModelId, {
        make_id: formMakeId,
        model_name: trimmedModel,
      });
      setSuccessMsg(`✓ Updated Model to "${trimmedModel}"`);
    } else {
      // Check duplicate under the same make
      const exists = models.some(
        (m) => m.make_id === formMakeId && m.model_name.toLowerCase() === trimmedModel.toLowerCase()
      );
      if (exists) {
        setErrorMsg(`Model "${trimmedModel}" already exists under this Make.`);
        return;
      }

      const newModelId = `MOD-${trimmedModel.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'NEW'}`;
      addModel({
        model_id: newModelId,
        make_id: formMakeId,
        model_name: trimmedModel,
        default_offset: -40001,
        default_fc: 3,
        default_byte_order: 'CDAB',
      });
      setSuccessMsg(`✓ Added Model "${trimmedModel}"`);
    }

    handleCloseModal();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (modelId, name) => {
    if (window.confirm(`Delete Model "${name}"?`)) {
      deleteModel(modelId);
      setSuccessMsg(`✓ Deleted Model "${name}"`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchMake = filterMakeId === 'all' || m.make_id === filterMakeId;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.model_name.toLowerCase().includes(q) ||
        (makes.find((mk) => mk.make_id === m.make_id)?.make_name || '').toLowerCase().includes(q);
      return matchMake && matchSearch;
    });
  }, [models, makes, filterMakeId, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '18px 24px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary-cyan-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Cpu size={20} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Model Master
          </h2>
        </div>

        <div>
          <button onClick={handleOpenAdd} style={btnPrimaryStyle}>
            <Plus size={16} />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: 'var(--accent-emerald-glow)', border: '1px solid var(--accent-emerald-border)', borderRadius: '10px', color: 'var(--accent-emerald)', fontSize: '0.84rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Filter by Make & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Filter size={15} color="var(--primary-cyan)" />
            <span>Filter by Make:</span>
          </div>

          <select
            value={filterMakeId}
            onChange={(e) => setFilterMakeId(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-input)',
            }}
          >
            <option value="all">All Makes ({makes.length})</option>
            {makes.map((m) => (
              <option key={m.make_id} value={m.make_id}>
                {m.make_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search model name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 34px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '0.84rem',
              outline: 'none',
              width: '230px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Table of Models against Make (Shown First) */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 18px', width: '50px' }}>#</th>
              <th style={{ padding: '12px 18px' }}>Make Name</th>
              <th style={{ padding: '12px 18px' }}>Model Name</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No models found. Click <strong style={{ color: 'var(--primary-cyan)' }}>"Add Model"</strong> to add one against a Make.
                </td>
              </tr>
            ) : (
              filteredModels.map((m, idx) => {
                const makeObj = makes.find((mk) => mk.make_id === m.make_id);
                const makeNameDisplay = makeObj ? makeObj.make_name : 'Unknown Make';

                return (
                  <tr
                    key={m.model_id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {idx + 1}
                    </td>

                    {/* Make Name */}
                    <td style={{ padding: '12px 18px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={15} color="var(--text-muted)" />
                        <span>{makeNameDisplay}</span>
                      </div>
                    </td>

                    {/* Model Name */}
                    <td style={{ padding: '12px 18px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={15} color="var(--text-muted)" />
                        <span>{m.model_name}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                          }}
                          title="Edit Model"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(m.model_id, m.model_name)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fecdd3',
                            backgroundColor: '#fff1f2',
                            color: '#e11d48',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.76rem',
                          }}
                          title="Delete Model"
                        >
                          <Trash2 size={13} />
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

      {/* ── MODAL: ADD / EDIT MODEL AGAINST MAKE ── */}
      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              width: '100%',
              maxWidth: '480px',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 22px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="var(--primary-cyan)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {editingModelId ? 'Edit Model' : 'Add Model'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div style={{ padding: '8px 14px', backgroundColor: 'rgba(244, 63, 94, 0.12)', border: '1px solid var(--accent-rose-border)', borderRadius: '6px', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
                  {errorMsg}
                </div>
              )}

              {/* Make Name Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Make Name
                </label>
                <select
                  required
                  value={formMakeId}
                  onChange={(e) => setFormMakeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                >
                  {makes.map((m) => (
                    <option key={m.make_id} value={m.make_id}>
                      {m.make_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Name Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Model Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={formModelName}
                  onChange={(e) => setFormModelName(e.target.value)}
                  placeholder="e.g. LG5310, EM6400NG, MFM384"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleCloseModal} style={btnSecondaryStyle}>
                  Cancel
                </button>
                <button type="submit" style={btnPrimaryStyle}>
                  <Save size={15} />
                  <span>{editingModelId ? 'Update Model' : 'Save Model'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const btnPrimaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--primary-cyan-gradient)',
  color: '#ffffff',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
  whiteSpace: 'nowrap',
  transition: 'all 0.18s ease',
};

const btnSecondaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'var(--bg-card-secondary)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
