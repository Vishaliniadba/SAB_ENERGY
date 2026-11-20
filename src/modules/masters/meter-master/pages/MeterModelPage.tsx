import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Edit3, Trash2, Cpu, Building2, Save,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { SearchInput } from '../../../../components/common/SearchInput';
import { DataTable } from '../../../../components/common/DataTable';
import { InputField, SelectField, Select2, PLACEHOLDERS } from '../../../../components/common/FormField';
import { meterModelApi as apiModels } from '../api/meterModelApi';
import { meterMakeApi as apiMakes } from '../api/meterMakeApi';
import { toIntegerId, resolveIntegerId } from '../../../../services/idHelper';
import '../styles/meterMaster.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normaliseArray = (data) =>
  Array.isArray(data) ? data : data?.data ?? data?.items ?? [];

const normaliseModel = (m) => {
  if (!m) return null;
  const id = m.id ?? m.model_id;
  const name = m.meterModelName ?? m.model_name ?? '';
  const makeId = m.meterMakeId ?? m.make_id ?? '';
  const makeName = m.meterMakeName ?? m.make_name ?? '';
  return {
    ...m,
    id,
    model_id: id !== '' && id !== null && id !== undefined ? String(id) : '',
    model_name: name,
    meterModelName: name,
    make_id: makeId !== '' && makeId !== null && makeId !== undefined ? String(makeId) : '',
    meterMakeId: makeId,
    make_name: makeName,
    meterMakeName: makeName,
    isActive: m.isActive ?? true,
  };
};

const normaliseMake = (m) => {
  if (!m) return null;
  const id = m.id ?? m.make_id;
  const name = m.meterMakeName ?? m.make_name ?? '';
  return {
    ...m,
    id,
    make_id: id !== '' && id !== null && id !== undefined ? String(id) : '',
    make_name: name,
    meterMakeName: name,
    isActive: m.isActive ?? true,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export const MeterModelPage = () => {
  const [models, setModels] = useState([]);
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [filterMakeId, setFilterMakeId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState(null);
  const [formMakeId, setFormMakeId] = useState('');
  const [formModelName, setFormModelName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const hasInitiallyLoaded = useRef(false);

  // ── Fetch all data (Smooth, zero-glitch) ────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!hasInitiallyLoaded.current) {
      setLoading(true);
    }
    setFetchError('');
    try {
      const [modRes, makeRes] = await Promise.allSettled([
        apiModels.getAll(),
        apiMakes.getAll(),
      ]);

      if (makeRes.status === 'fulfilled') {
        const rawMakes = normaliseArray(makeRes.value);
        setMakes(rawMakes.map(normaliseMake).filter(Boolean));
      }

      if (modRes.status === 'fulfilled') {
        const rawModels = normaliseArray(modRes.value);
        setModels(rawModels.map(normaliseModel).filter(Boolean));
      } else {
        const errMsg = modRes.reason?.message || 'Unable to load meter models from server.';
        setFetchError(errMsg);
      }

      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setFetchError(err.message || 'Unable to load meter models from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Open Add / Edit ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    const defMake = filterMakeId !== 'all' ? filterMakeId : (makes[0]?.make_id || '');
    setEditingModelId(null);
    setFormMakeId(defMake ? String(defMake) : '');
    setFormModelName('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (model) => {
    const id = toIntegerId(model.id) ?? resolveIntegerId(model.model_id, 1);
    setEditingModelId(id);
    setFormMakeId(String(resolveIntegerId(model.make_id ?? model.meterMakeId, 1)));
    setFormModelName(model.model_name || model.meterModelName || '');
    setErrorMsg('');
    setIsModalOpen(true);

    try {
      if (id) {
        const fresh = await apiModels.getById(id);
        const data = fresh?.data || fresh;
        if (data) {
          if (data.meterModelName || data.model_name) {
            setFormModelName(data.meterModelName || data.model_name);
          }
          if (data.meterMakeId || data.make_id) {
            setFormMakeId(String(resolveIntegerId(data.meterMakeId ?? data.make_id, 1)));
          }
        }
      }
    } catch (_) {
      // Keep initial row data if GetById fails
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModelId(null);
    setFormModelName('');
    setErrorMsg('');
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // ── Save (Create / Update) ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setErrorMsg('');

    const trimmedModel = formModelName.trim();
    if (!formMakeId) {
      setErrorMsg('Please select a Manufacturer (Make).');
      return;
    }
    if (!trimmedModel) {
      setErrorMsg('Please enter a Model Name.');
      return;
    }

    // Duplicate check
    const exists = models.some(
      (m) =>
        String(m.make_id || m.meterMakeId) === String(formMakeId) &&
        (m.model_name || m.meterModelName || '').toLowerCase() === trimmedModel.toLowerCase() &&
        String(m.id || m.model_id) !== String(editingModelId)
    );
    if (exists) {
      setErrorMsg(`Model "${trimmedModel}" already exists for this Make.`);
      return;
    }

    setIsSaving(true);
    try {
      const makeIdNum = resolveIntegerId(formMakeId, 1)!;
      const payload = {
        meterModelName: trimmedModel,
        meterMakeId: makeIdNum,
        model_name: trimmedModel,
        make_id: String(makeIdNum),
      };

      if (editingModelId) {
        const dbId = resolveIntegerId(editingModelId, 1)!;
        await apiModels.update(dbId, payload);
        showSuccess(`✓ Updated Model to "${trimmedModel}" successfully.`);
      } else {
        await apiModels.create(payload);
        showSuccess(`✓ Added Model "${trimmedModel}" successfully.`);
      }

      handleCloseModal();
      await fetchAll();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (model) => {
    const id = toIntegerId(model.id) ?? resolveIntegerId(model.model_id, 1);
    const name = model.model_name || model.meterModelName || 'Model';
    if (!window.confirm(`Delete Model "${name}"?`)) return;

    try {
      if (id) {
        try {
          await apiModels.delete(id);
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (!msg.includes('not found') && !msg.includes('404')) {
            throw err;
          }
        }
        showSuccess(`✓ Deleted Model "${name}".`);
        await fetchAll();
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to delete meter model.');
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const modelName = m.model_name || m.meterModelName || '';
      const modelId = String(m.id || m.model_id || '');
      const matchesSearch =
        !q ||
        modelName.toLowerCase().includes(q) ||
        modelId.toLowerCase().includes(q);
      const matchesMake =
        filterMakeId === 'all' ||
        String(m.make_id || m.meterMakeId) === String(filterMakeId);
      return matchesSearch && matchesMake;
    });
  }, [models, searchTerm, filterMakeId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Success banner */}
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

      {/* Fetch error banner */}
      {fetchError && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger-text)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} /> {fetchError}
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
                <span>{model.model_name || model.meterModelName}</span>
              </div>
            ),
          },
          {
            header: 'Manufacturer (Make)',
            render: (model) => {
              const parentMake = makes.find(
                (m) => String(m.make_id || m.id) === String(model.make_id || model.meterMakeId)
              );
              const displayName =
                parentMake?.make_name ||
                parentMake?.meterMakeName ||
                model.meterMakeName ||
                model.make_name ||
                model.make_id ||
                '—';
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} color="var(--text-muted)" />
                  <span>{displayName}</span>
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
                  onClick={() => handleDelete(model)}
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
        rowKey={(m) => m.id || m.model_id || m.meterModelName}
        loading={loading}
        toolbar={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={PLACEHOLDERS.search.meterModels}
              />

              {/* Filter by Make */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Manufacturer:
                </span>
                <div style={{ width: '200px' }}>
                  <Select2
                    size="sm"
                    value={filterMakeId}
                    onChange={(val) => setFilterMakeId(val)}
                    searchable={makes.length >= 4}
                    options={[
                      { value: 'all', label: `All Manufacturers (${makes.length})` },
                      ...makes.map((m) => {
                        const id = m.make_id || m.id;
                        const name = m.make_name || m.meterMakeName;
                        return {
                          value: String(id),
                          label: name,
                        };
                      }),
                    ]}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
                Showing: <strong style={{ color: 'var(--brand-primary)' }}>{filteredModels.length}</strong> of{' '}
                {models.length} Models
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={fetchAll}
                className="btn btn-secondary"
                disabled={loading}
                title="Refresh list"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
                <Plus size={15} />
                <span>Add Model</span>
              </button>
            </div>
          </div>
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
            <button onClick={handleCloseModal} className="btn btn-secondary" disabled={isSaving}>
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{editingModelId ? 'Update Model' : 'Save Model'}</span>
                </>
              )}
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
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <SelectField
            label="Manufacturer (Make)"
            required
            value={formMakeId}
            onChange={(e) => setFormMakeId(e.target.value)}
            options={[
              { value: '', label: '-- Select Manufacturer --' },
              ...makes.map((m) => ({
                value: String(m.make_id || m.id),
                label: m.make_name || m.meterMakeName,
              })),
            ]}
          />

          <InputField
            label="Model Name"
            required
            value={formModelName}
            onChange={(e) => setFormModelName(e.target.value)}
            placeholder={PLACEHOLDERS.meter.model}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};

export const ModelMasterView = MeterModelPage;
export default MeterModelPage;

