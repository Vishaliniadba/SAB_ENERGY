import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Cpu, Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormField';

export const ModelMasterView = () => {
  const { models, addModel, updateModel, deleteModel, makes } = useEnergyData();

  const [filterMakeId, setFilterMakeId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    if (e) e.preventDefault();
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
      setSuccessMsg(`✓ Updated Model to "${trimmedModel}" successfully.`);
    } else {
      const exists = models.some(
        (m) => m.make_id === formMakeId && m.model_name.toLowerCase() === trimmedModel.toLowerCase()
      );
      if (exists) {
        setErrorMsg(`Model "${trimmedModel}" already exists for this Make.`);
        return;
      }
      const newModelId = `MOD-${trimmedModel.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'NEW'}`;
      addModel({
        model_id: newModelId,
        make_id: formMakeId,
        model_name: trimmedModel,
      });
      setSuccessMsg(`✓ Added Model "${trimmedModel}" successfully.`);
    }

    handleCloseModal();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDelete = (modelId, name) => {
    if (window.confirm(`Delete Model "${name}"?`)) {
      deleteModel(modelId);
      setSuccessMsg(`✓ Deleted Model "${name}".`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || m.model_name.toLowerCase().includes(q) || m.model_id.toLowerCase().includes(q);
      const matchesMake = filterMakeId === 'all' || m.make_id === filterMakeId;
      return matchesSearch && matchesMake;
    });
  }, [models, searchTerm, filterMakeId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <PageHeader
        title="Meter Model Master"
        icon={Cpu}
        actions={
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={15} />
            <span>Add Model</span>
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
            header: 'Model Name',
            render: (model) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Cpu size={14} color="var(--brand-primary)" />
                <span>{model.model_name}</span>
              </div>
            ),
          },
          {
            header: 'Manufacturer (Make)',
            render: (model) => {
              const parentMake = makes.find((m) => m.make_id === model.make_id);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} color="var(--text-muted)" />
                  <span>{parentMake ? parentMake.make_name : model.make_id}</span>
                </div>
              );
            },
          },
          {
            header: 'Actions',
            width: '130px',
            align: 'center',
            render: (model) => (
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleOpenEdit(model)}
                  className="btn-icon"
                  title="Edit Model"
                  aria-label="Edit Model"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(model.model_id, model.model_name)}
                  className="btn-icon"
                  style={{ color: 'var(--status-danger-text)' }}
                  title="Delete Model"
                  aria-label="Delete Model"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredModels}
        rowKey="model_id"
        toolbar={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search meter models by name or ID..."
              />

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
                  <option value="all">All Manufacturers ({makes.length})</option>
                  {makes.map((m) => (
                    <option key={m.make_id} value={m.make_id}>
                      {m.make_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
              Showing: <strong style={{ color: 'var(--brand-primary)' }}>{filteredModels.length}</strong> of {models.length} Models
            </div>
          </>
        }
        emptyMessage="No meter models found for this filter."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingModelId ? 'Edit Model' : 'Add Model'}
        maxWidth="520px"
        footer={
          <>
            <button onClick={handleCloseModal} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              <Save size={14} />
              <span>{editingModelId ? 'Update Model' : 'Save Model'}</span>
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

          <SelectField
            label="Manufacturer (Make)"
            required
            value={formMakeId}
            onChange={(e) => setFormMakeId(e.target.value)}
            options={makes.map((m) => ({
              value: m.make_id,
              label: m.make_name,
            }))}
          />

          <InputField
            label="Model Name"
            required
            value={formModelName}
            onChange={(e) => setFormModelName(e.target.value)}
            placeholder="e.g. EM6400NG, Elite 440, MFM384, PM5300"
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};
