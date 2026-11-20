import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { SearchInput } from '../../../../components/common/SearchInput';
import { DataTable } from '../../../../components/common/DataTable';
import { InputField, PLACEHOLDERS } from '../../../../components/common/FormField';
import { gatewayMakeApi as api } from '../api/gatewayMakeApi';
import { toIntegerId, resolveIntegerId } from '../../../../services/idHelper';
import '../styles/gatewayMaster.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
export interface NormalisedMake {
  id: string | number;
  gw_make_id: string;
  gw_make_name: string;
  gatewayMakeName: string;
  isActive: boolean;
  [key: string]: any;
}

const normaliseMake = (m: any, idx: number = 0): NormalisedMake | null => {
  if (!m) return null;
  const id = m.id ?? m.Id ?? m.gw_make_id ?? m.gatewayMakeId ?? m.GatewayMakeId ?? m.makeId ?? m.MakeId ?? (idx + 1);
  const name =
    m.gatewayMakeName ??
    m.GatewayMakeName ??
    m.gateway_make_name ??
    m.gw_make_name ??
    m.makeName ??
    m.MakeName ??
    m.make_name ??
    m.name ??
    m.Name ??
    `Make #${id}`;

  return {
    ...m,
    id,
    gw_make_id: id !== '' && id !== null && id !== undefined ? String(id) : String(idx + 1),
    gw_make_name: name,
    gatewayMakeName: name,
    isActive: m.isActive ?? m.IsActive ?? true,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export const GatewayMakePage: React.FC = () => {
  const [makes, setMakes] = useState<NormalisedMake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [makeName, setMakeName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const hasInitiallyLoaded = useRef(false);

  // ── Fetch all makes (Smooth, zero-glitch) ───────────────────────────────────
  const fetchMakes = useCallback(async () => {
    if (!hasInitiallyLoaded.current) {
      setLoading(true);
    }
    setFetchError('');
    try {
      const data = await api.getAll();
      const list = Array.isArray(data) ? data : (data as any)?.data ?? (data as any)?.items ?? [];
      const normalised = list.map((m: any, idx: number) => normaliseMake(m, idx)).filter(Boolean) as NormalisedMake[];
      setMakes(normalised);
      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setFetchError(err.message || 'Unable to load gateway makes from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMakes();
  }, [fetchMakes]);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return makes;
    return makes.filter((m) => {
      const name = m.gw_make_name || m.gatewayMakeName || '';
      const id = String(m.gw_make_id || m.id || '');
      return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    });
  }, [makes, searchTerm]);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setMakeName('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (m: NormalisedMake) => {
    const dbId = toIntegerId(m.id) ?? resolveIntegerId(m.gw_make_id, 1);
    setEditingId(dbId);
    setMakeName(m.gw_make_name || m.gatewayMakeName || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setMakeName('');
    setErrorMsg('');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // ── Save (Create / Update) ───────────────────────────────────────────────────
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    setErrorMsg('');
    const trimmed = makeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a Make Name.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.update(editingId, { gatewayMakeName: trimmed, gw_make_name: trimmed });
        showSuccess(`✓ Make "${trimmed}" updated successfully.`);
      } else {
        await api.create({ gatewayMakeName: trimmed, gw_make_name: trimmed });
        showSuccess(`✓ Make "${trimmed}" added successfully.`);
      }
      handleClose();
      await fetchMakes();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (m: NormalisedMake) => {
    const dbId = toIntegerId(m.id) ?? resolveIntegerId(m.gw_make_id, 1);
    const name = m.gw_make_name || m.gatewayMakeName;
    if (!window.confirm(`Delete make "${name}"?`)) return;
    try {
      if (dbId) {
        try {
          await api.delete(dbId);
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (!msg.includes('not found') && !msg.includes('404')) {
            throw err;
          }
        }
        showSuccess(`✓ Make "${name}" deleted.`);
        await fetchMakes();
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to delete gateway make.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
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
          <AlertCircle size={16} />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Data table */}
      <DataTable
        columns={[
          {
            header: '#',
            width: '60px',
            render: (_, index) => (
              <span style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
            ),
          },
          {
            header: 'Manufacturer Name',
            render: (m: NormalisedMake) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Building2 size={15} color="var(--brand-primary)" />
                <span>{m.gw_make_name || m.gatewayMakeName}</span>
              </div>
            ),
          },
          {
            header: 'Actions',
            width: '120px',
            align: 'center',
            render: (m: NormalisedMake) => (
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
                  className="btn-icon btn-icon-danger"
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
        rowKey={(m: NormalisedMake, idx) => m.gw_make_id || m.id || idx}
        isLoading={loading}
        toolbar={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={PLACEHOLDERS.search.gatewayMakes}
                width="280px"
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
                Total Makes:{' '}
                <strong style={{ color: 'var(--brand-primary)' }}>{makes.length}</strong>
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
              <button type="button" onClick={openAdd} className="btn btn-primary">
                <Plus size={15} />
                <span>Add Gateway Make</span>
              </button>
            </div>
          </div>
        }
        emptyMessage="No gateway makes found. Register a new gateway manufacturer to get started."
        emptyAction={
          <button onClick={openAdd} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            <Plus size={14} /> Add First Make
          </button>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingId ? 'Edit Gateway Make' : 'Add Gateway Make'}
        subtitle="Enter the official edge hardware vendor or brand name."
        maxWidth="480px"
        footer={
          <>
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Make
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-danger-text)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
            onChange={(e) => {
              setMakeName(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder={PLACEHOLDERS.gateway.make}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};

export const GatewayMakeMasterView = GatewayMakePage;
export default GatewayMakePage;
