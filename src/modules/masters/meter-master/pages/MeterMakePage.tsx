import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Edit3, Trash2, Building2, Save,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { useEnergyData } from '../../../../context/EnergyDataContext';
import { Modal } from '../../../../components/common/Modal';
import { SearchInput } from '../../../../components/common/SearchInput';
import { DataTable } from '../../../../components/common/DataTable';
import { InputField, PLACEHOLDERS } from '../../../../components/common/FormField';
import { meterMakeApi as api } from '../api/meterMakeApi';
import { toIntegerId, resolveIntegerId } from '../../../../services/idHelper';
import '../styles/meterMaster.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
export const MeterMakePage = () => {
  const { models } = useEnergyData();

  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMakeId, setEditingMakeId] = useState(null);
  const [makeName, setMakeName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const hasInitiallyLoaded = useRef(false);

  // ── Fetch all meter makes (Smooth, zero-glitch) ─────────────────────────────
  const fetchMakes = useCallback(async () => {
    if (!hasInitiallyLoaded.current) {
      setLoading(true);
    }
    setFetchError('');
    try {
      const data: any = await api.getAll();
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      setMakes(list.map(normaliseMake).filter(Boolean));
      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setFetchError(err.message || 'Unable to load meter makes from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMakes();
  }, [fetchMakes]);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredMakes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return makes;
    return makes.filter((m) => {
      const name = m.make_name || m.meterMakeName || '';
      const idStr = String(m.id || m.make_id || '');
      return name.toLowerCase().includes(q) || idStr.toLowerCase().includes(q);
    });
  }, [makes, searchTerm]);

  // ── Modal handlers ───────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingMakeId(null);
    setMakeName('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (make) => {
    const id = toIntegerId(make.id) ?? resolveIntegerId(make.make_id, 1);
    setEditingMakeId(id);
    setMakeName(make.make_name || make.meterMakeName || '');
    setErrorMsg('');
    setIsModalOpen(true);

    // Refresh fresh entity details from GetById if available
    try {
      if (id) {
        const fresh = await api.getById(id);
        const data = fresh?.data || fresh;
        if (data && (data.meterMakeName || data.make_name)) {
          setMakeName(data.meterMakeName || data.make_name);
        }
      }
    } catch (_) {
      // Keep existing row name if GetById call fails
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMakeId(null);
    setMakeName('');
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

    const trimmed = makeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a Make Name.');
      return;
    }

    // Duplicate check
    const exists = makes.some(
      (m) =>
        (m.make_name || m.meterMakeName || '').toLowerCase() === trimmed.toLowerCase() &&
        String(m.id || m.make_id) !== String(editingMakeId)
    );
    if (exists) {
      setErrorMsg(`Make "${trimmed}" already exists.`);
      return;
    }

    setIsSaving(true);
    try {
      if (editingMakeId) {
        const dbId = resolveIntegerId(editingMakeId, 1)!;
        await api.update(dbId, {
          meterMakeName: trimmed,
          make_name: trimmed,
        });
        showSuccess(`✓ Updated Make to "${trimmed}" successfully.`);
      } else {
        await api.create({
          meterMakeName: trimmed,
          make_name: trimmed,
        });
        showSuccess(`✓ Added Make "${trimmed}" successfully.`);
      }

      handleCloseModal();
      await fetchMakes();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (make) => {
    const id = toIntegerId(make.id) ?? resolveIntegerId(make.make_id, 1);
    const name = make.make_name || make.meterMakeName || 'Make';

    const associatedModels =
      models?.filter((m) => {
        const mMakeId = resolveIntegerId(m.make_id ?? m.meterMakeId, null);
        return mMakeId === id || String(m.make_id) === String(make.make_id);
      }) || [];
    const msg =
      associatedModels.length > 0
        ? `"${name}" has ${associatedModels.length} models linked to it. Are you sure you want to delete it?`
        : `Delete Make "${name}"?`;

    if (!window.confirm(msg)) return;

    try {
      if (id) {
        try {
          await api.delete(id);
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (!msg.includes('not found') && !msg.includes('404')) {
            throw err;
          }
        }
        showSuccess(`✓ Deleted Make "${name}".`);
        await fetchMakes();
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to delete meter make.');
    }
  };

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
            header: 'Manufacturer Name',
            render: (make) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Building2 size={14} color="var(--brand-primary)" />
                <span>{make.make_name || make.meterMakeName}</span>
              </div>
            ),
          },
          {
            header: 'Actions',
            width: '130px',
            align: 'center',
            render: (make) => (
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
                  onClick={() => handleDelete(make)}
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
        data={filteredMakes}
        rowKey={(m) => m.id || m.make_id || m.meterMakeName}
        loading={loading}
        toolbar={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={PLACEHOLDERS.search.meterMakes}
              />

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
                Total Makes: <strong style={{ color: 'var(--brand-primary)' }}>{makes.length}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={fetchMakes}
                className="btn btn-secondary"
                disabled={loading}
                title="Refresh list"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
                <Plus size={15} />
                <span>Add Make</span>
              </button>
            </div>
          </div>
        }
        emptyMessage={
          <span>
            No meter makes found. Click <strong>"Add Make"</strong> to register a new vendor.
          </span>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMakeId ? 'Edit Make' : 'Add Make'}
        subtitle="Enter the official meter manufacturer brand or vendor name."
        maxWidth="500px"
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
                  <span>{editingMakeId ? 'Update Make' : 'Save Make'}</span>
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

          <InputField
            label="Make Name"
            required
            value={makeName}
            onChange={(e) => setMakeName(e.target.value)}
            placeholder={PLACEHOLDERS.meter.make}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};

export const MakeMasterView = MeterMakePage;
export default MeterMakePage;

