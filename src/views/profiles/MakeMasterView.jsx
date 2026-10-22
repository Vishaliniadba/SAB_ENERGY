import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Building2, Search, Save, X } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const MakeMasterView = () => {
  const { makes, addMake, updateMake, deleteMake, models } = useEnergyData();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMakeId, setEditingMakeId] = useState(null);
  const [makeName, setMakeName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingMakeId(null);
    setMakeName('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (make) => {
    setEditingMakeId(make.make_id);
    setMakeName(make.make_name);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMakeId(null);
    setMakeName('');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = makeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a Make Name.');
      return;
    }

    if (editingMakeId) {
      updateMake(editingMakeId, { make_name: trimmed });
      setSuccessMsg(`✓ Updated Make to "${trimmed}"`);
    } else {
      // Check duplicate
      const exists = makes.some((m) => m.make_name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        setErrorMsg(`Make "${trimmed}" already exists.`);
        return;
      }
      const newMakeId = `MAKE-${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'NEW'}`;
      addMake({ make_id: newMakeId, make_name: trimmed });
      setSuccessMsg(`✓ Added Make "${trimmed}"`);
    }

    handleCloseModal();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (makeId, name) => {
    const associatedModels = models.filter((m) => m.make_id === makeId);
    if (associatedModels.length > 0) {
      if (!window.confirm(`"${name}" has ${associatedModels.length} models linked to it. Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Delete Make "${name}"?`)) return;
    }

    deleteMake(makeId);
    setSuccessMsg(`✓ Deleted Make "${name}"`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredMakes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return makes;
    return makes.filter((m) => m.make_name.toLowerCase().includes(q));
  }, [makes, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Building2 size={20} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Make Master
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
            Total Makes: <strong style={{ color: '#0284c7' }}>{makes.length}</strong>
          </div>
          <button onClick={handleOpenAdd} style={btnPrimaryStyle}>
            <Plus size={16} />
            <span>Add Make</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '0.84rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Showing <strong>{filteredMakes.length}</strong> makes
        </span>

        <div style={{ position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search make name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 12px 6px 30px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.82rem',
              outline: 'none',
              width: '220px',
            }}
          />
        </div>
      </div>

      {/* Table of Makes (Shown First) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 18px', width: '50px' }}>#</th>
              <th style={{ padding: '12px 18px' }}>Make Name</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', width: '180px' }}>Linked Models</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMakes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  No makes found. Click <strong>"Add Make"</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredMakes.map((m, idx) => {
                const linkedModelsCount = models.filter((mod) => mod.make_id === m.make_id).length;

                return (
                  <tr
                    key={m.make_id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                      {idx + 1}
                    </td>

                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="#0284c7" />
                        <span>{m.make_name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          backgroundColor: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          padding: '3px 10px',
                          borderRadius: '12px',
                        }}
                      >
                        {linkedModelsCount} models
                      </span>
                    </td>

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
                          title="Edit Make"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(m.make_id, m.make_name)}
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
                          title="Delete Make"
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

      {/* ── MODAL: ADD / EDIT MAKE ── */}
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
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '460px',
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
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#0284c7" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {editingMakeId ? 'Edit Make' : 'Add Make'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
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
            <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
              {errorMsg && (
                <div style={{ padding: '8px 14px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', color: '#e11d48', fontSize: '0.8rem', marginBottom: '14px' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Make Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={makeName}
                  onChange={(e) => setMakeName(e.target.value)}
                  placeholder="e.g. Elmeasure, Schneider Electric, Selec"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button type="button" onClick={handleCloseModal} style={btnSecondaryStyle}>
                  Cancel
                </button>
                <button type="submit" style={btnPrimaryStyle}>
                  <Save size={15} />
                  <span>{editingMakeId ? 'Update Make' : 'Save Make'}</span>
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
  backgroundColor: '#0284c7',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
  whiteSpace: 'nowrap',
};

const btnSecondaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  color: '#334155',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
