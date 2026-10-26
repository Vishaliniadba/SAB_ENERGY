import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search, Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';

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
      (p) =>
        (p.key || '').toLowerCase().includes(q) ||
        (p.display_name || '').toLowerCase().includes(q) ||
        (p.unit || '').toLowerCase().includes(q)
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
    if (e) e.preventDefault();
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
      updateStandardParameter(editingKey, {
        display_name: trimmedDisplayName,
        unit: trimmedUnit,
      });
      setSuccessMsg(`✓ Updated parameter "${trimmedDisplayName}" successfully.`);
    } else {
      const exists = standardParameters.some((p) => p.key === trimmedKey);
      if (exists) {
        setErrorMsg(`Parameter Key "${trimmedKey}" already exists.`);
        return;
      }
      addStandardParameter({
        key: trimmedKey,
        display_name: trimmedDisplayName,
        unit: trimmedUnit,
      });
      setSuccessMsg(`✓ Added parameter "${trimmedDisplayName}" successfully.`);
    }

    handleCloseModal();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (key, name) => {
    if (window.confirm(`Delete Parameter "${name}" (${key})?`)) {
      deleteStandardParameter(key);
      setSuccessMsg(`✓ Deleted parameter "${name}".`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <PageHeader
        title="Parameter Dictionary"
        subtitle="Global standard catalog of electrical measurements and engineering telemetry units (V, A, kW, kWh, PF, THD, Hz)."
        icon={Sliders}
        actions={
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={15} />
            <span>Add Standard Parameter</span>
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
              placeholder="Search parameters by key, name, or unit..."
            />
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
            Catalog Size: <strong style={{ color: 'var(--brand-primary)' }}>{standardParameters.length}</strong> Standard Parameters
          </div>
        </div>

        <table className="enterprise-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>System Key</th>
              <th>Display Label</th>
              <th style={{ textAlign: 'center', width: '140px' }}>Engineering Unit</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParams.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No parameters found matching the query.
                </td>
              </tr>
            ) : (
              filteredParams.map((param, index) => {
                return (
                  <tr key={param.key}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <code
                        className="mono-num"
                        style={{
                          backgroundColor: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)',
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.76rem',
                          color: 'var(--brand-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {param.key}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {param.display_name}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {param.unit ? (
                        <span
                          className="mono-num"
                          style={{
                            fontWeight: 650,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-surface-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {param.unit}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(param)}
                          className="btn-icon"
                          title="Edit Parameter"
                          aria-label="Edit Parameter"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(param.key, param.display_name)}
                          className="btn-icon"
                          style={{ color: 'var(--status-danger-text)' }}
                          title="Delete Parameter"
                          aria-label="Delete Parameter"
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
        title={editingKey ? 'Edit Standard Parameter' : 'Add Standard Parameter'}
        subtitle="Define global telemetry parameter key and default engineering display unit."
        maxWidth="500px"
        footer={
          <>
            <button onClick={handleCloseModal} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              <Save size={14} />
              <span>{editingKey ? 'Update Parameter' : 'Save Parameter'}</span>
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
            <label className="form-label">System Key (Unique Snake_Case) *</label>
            <input
              className="form-input mono-num"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder="e.g. active_power_r, voltage_ry, frequency"
              disabled={!!editingKey}
              autoFocus={!editingKey}
            />
            <span className="form-helper">
              Standard telemetry identifier used in Modbus payloads and database columns.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              className="form-input"
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              placeholder="e.g. Voltage R-Y, Active Power Phase R"
              autoFocus={!!editingKey}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Engineering Unit</label>
            <input
              className="form-input mono-num"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              placeholder="e.g. V, A, kW, kVA, kWh, Hz, PF, %"
            />
            <span className="form-helper">
              Standard unit attached to readings across charts and tables.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};
