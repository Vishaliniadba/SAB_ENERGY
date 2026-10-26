import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Building2, Search, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';

export const MakeMasterView = () => {
  const { makes, addMake, updateMake, deleteMake, models } = useEnergyData();

  const [searchTerm, setSearchTerm] = useState('');
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
    if (e) e.preventDefault();
    setErrorMsg('');

    const trimmed = makeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a Make Name.');
      return;
    }

    if (editingMakeId) {
      updateMake(editingMakeId, { make_name: trimmed });
      setSuccessMsg(`✓ Updated Make to "${trimmed}" successfully.`);
    } else {
      const exists = makes.some((m) => m.make_name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        setErrorMsg(`Make "${trimmed}" already exists.`);
        return;
      }
      const newMakeId = `MAKE-${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'NEW'}`;
      addMake({ make_id: newMakeId, make_name: trimmed });
      setSuccessMsg(`✓ Added Make "${trimmed}" successfully.`);
    }

    handleCloseModal();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (makeId, name) => {
    const associatedModels = models.filter((m) => m.make_id === makeId);
    const msg =
      associatedModels.length > 0
        ? `"${name}" has ${associatedModels.length} models linked to it. Are you sure you want to delete it?`
        : `Delete Make "${name}"?`;

    if (window.confirm(msg)) {
      deleteMake(makeId);
      setSuccessMsg(`✓ Deleted Make "${name}".`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredMakes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return makes;
    return makes.filter((m) => m.make_name.toLowerCase().includes(q) || m.make_id.toLowerCase().includes(q));
  }, [makes, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <PageHeader
        title="Meter Make Master"
        subtitle="Catalog of power meter manufacturers (Schneider, Secure Meters, Selec, Rishabh, Socomec, etc.)."
        icon={Building2}
        actions={
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={15} />
            <span>Add Meter Make</span>
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
          <div className="search-input-wrapper">
            <Search size={14} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search meter makes by name or ID..."
            />
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
            Total Makes: <strong style={{ color: 'var(--brand-primary)' }}>{makes.length}</strong>
          </div>
        </div>

        <table className="enterprise-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Make Code</th>
              <th>Manufacturer Name</th>
              <th style={{ textAlign: 'center', width: '160px' }}>Linked Models</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMakes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No meter makes found. Click <strong>"Add Meter Make"</strong> to register a new vendor.
                </td>
              </tr>
            ) : (
              filteredMakes.map((make, index) => {
                const associatedModels = models.filter((m) => m.make_id === make.make_id);
                return (
                  <tr key={make.make_id}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td className="mono-num" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {make.make_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={14} color="var(--brand-primary)" />
                        <span>{make.make_name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-surface-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-default)',
                          fontWeight: 550,
                        }}
                      >
                        {associatedModels.length} {associatedModels.length === 1 ? 'model' : 'models'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(make)}
                          className="btn-icon"
                          title="Edit Make"
                          aria-label="Edit Make"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(make.make_id, make.make_name)}
                          className="btn-icon"
                          style={{ color: 'var(--status-danger-text)' }}
                          title="Delete Make"
                          aria-label="Delete Make"
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
        onClose={handleCloseModal}
        title={editingMakeId ? 'Edit Meter Make' : 'Add Meter Make'}
        subtitle="Enter the official meter manufacturer brand or vendor name."
        maxWidth="500px"
        footer={
          <>
            <button onClick={handleCloseModal} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              <Save size={14} />
              <span>{editingMakeId ? 'Update Make' : 'Save Make'}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            <label className="form-label">Make Name *</label>
            <input
              className="form-input"
              value={makeName}
              onChange={(e) => setMakeName(e.target.value)}
              placeholder="e.g. Schneider Electric, Secure Meters, Selec"
              autoFocus
            />
            <span className="form-helper">
              Unique vendor name used across meter profiles and asset mapping.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};
