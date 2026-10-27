import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/common/DataTable';
import { InputField } from '../../components/common/FormField';

export const GatewayMakeMasterView = () => {
  const { gatewayMakes, addGatewayMake, updateGatewayMake, deleteGatewayMake, gatewayModels } = useEnergyData();

  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.gw_make_id);
    setMakeName(m.gw_make_name || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setMakeName('');
    setErrorMsg('');
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const trimmed = makeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a Make Name.');
      return;
    }

    if (editingId) {
      updateGatewayMake(editingId, { gw_make_name: trimmed });
      setSuccessMsg(`✓ Make "${trimmed}" updated successfully.`);
    } else {
      const exists = gatewayMakes.some((m) => m.gw_make_name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        setErrorMsg(`Gateway Make "${trimmed}" already exists.`);
        return;
      }
      addGatewayMake({ gw_make_name: trimmed });
      setSuccessMsg(`✓ Make "${trimmed}" added successfully.`);
    }

    handleClose();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (m) => {
    const linked = gatewayModels.filter((mod) => mod.gw_make_id === m.gw_make_id).length;
    const msg =
      linked > 0
        ? `"${m.gw_make_name}" has ${linked} models associated with it. Delete this make?`
        : `Delete make "${m.gw_make_name}"?`;

    if (window.confirm(msg)) {
      deleteGatewayMake(m.gw_make_id);
      setSuccessMsg(`✓ Make "${m.gw_make_name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Gateway Make Master"
        icon={Building2}
        actions={
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={15} />
            <span>Add Gateway Make</span>
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
      <DataTable
        columns={[
          {
            header: '#',
            width: '60px',
            render: (_, index) => <span style={{ color: 'var(--text-muted)' }}>{index + 1}</span>,
          },
          {
            header: 'Manufacturer Name',
            render: (m) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Building2 size={14} color="var(--brand-primary)" />
                <span>{m.gw_make_name}</span>
              </div>
            ),
          },
          {
            header: 'Actions',
            width: '130px',
            align: 'center',
            render: (m) => (
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  onClick={() => openEdit(m)}
                  className="btn-icon"
                  title="Edit Make"
                  aria-label="Edit Make"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="btn-icon"
                  style={{ color: 'var(--status-danger-text)' }}
                  title="Delete Make"
                  aria-label="Delete Make"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
        rowKey="gw_make_id"
        toolbar={
          <>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search manufacturers by name..."
            />

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
              Total Makes: <strong style={{ color: 'var(--brand-primary)' }}>{gatewayMakes.length}</strong>
            </div>
          </>
        }
        emptyMessage="No gateway manufacturers found matching your query."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingId ? 'Edit Make' : 'Add Make'}
        maxWidth="500px"
        footer={
          <>
            <button onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save size={14} />
              <span>{editingId ? 'Update Make' : 'Save Make'}</span>
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

          <InputField
            label="Make / Manufacturer Name"
            required
            value={makeName}
            onChange={(e) => setMakeName(e.target.value)}
            placeholder="e.g. Advantech, SaB Systems, Siemens"
            hint="Enter the official brand or vendor name for edge hardware models."
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};
