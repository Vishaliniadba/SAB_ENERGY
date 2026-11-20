import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Cpu,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { SearchInput } from '../../../../components/common/SearchInput';
import { DataTable } from '../../../../components/common/DataTable';
import { InputField, SelectField, Select2, PLACEHOLDERS } from '../../../../components/common/FormField';
import { gatewayModelApi as apiModels } from '../api/gatewayModelApi';
import { gatewayMakeApi as apiMakes } from '../api/gatewayMakeApi';
import { toIntegerId, resolveIntegerId } from '../../../../services/idHelper';
import { NormalisedMake } from './GatewayMakePage';
import '../styles/gatewayMaster.css';

// ─── Interfaces & Helpers ───────────────────────────────────────────────────────

export interface NormalisedModel {
  id: string | number;
  gw_model_id: string;
  gw_model_name: string;
  gatewayModelName: string;
  gw_make_id: string;
  gatewayMakeId: number | string;
  gw_make_name: string;
  gatewayMakeName: string;
  channel_count: number;
  channel_names: string[];
  firmware_version: string;
  isActive: boolean;
  [key: string]: any;
}

const normaliseArray = (data: any): any[] =>
  Array.isArray(data) ? data : (data as any)?.data ?? (data as any)?.items ?? [];

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

const normaliseModel = (m: any, idx: number = 0, makesList: NormalisedMake[] = []): NormalisedModel | null => {
  if (!m) return null;
  const id = m.id ?? m.Id ?? m.gw_model_id ?? m.gatewayModelId ?? m.GatewayModelId ?? m.modelId ?? m.ModelId ?? (idx + 1);
  const name =
    m.gatewayModelName ??
    m.GatewayModelName ??
    m.gw_model_name ??
    m.gateway_model_name ??
    m.modelName ??
    m.ModelName ??
    m.model_name ??
    m.name ??
    m.Name ??
    `Model #${id}`;

  const makeId =
    m.gatewayMakeId ??
    m.GatewayMakeId ??
    m.gw_make_id ??
    m.gateway_make_id ??
    m.makeId ??
    m.MakeId ??
    m.make_id ??
    '';

  // Find manufacturer name from model object or cross-reference from makesList
  let makeName =
    m.gatewayMakeName ??
    m.GatewayMakeName ??
    m.gw_make_name ??
    m.gateway_make_name ??
    m.makeName ??
    m.MakeName ??
    m.make_name ??
    '';

  if (!makeName && makeId && Array.isArray(makesList)) {
    const matched = makesList.find((mk) => String(mk.gw_make_id || mk.id) === String(makeId));
    if (matched) {
      makeName = matched.gw_make_name || matched.gatewayMakeName || '';
    }
  }

  const channelCount = Number(m.channel_count ?? m.ChannelCount ?? m.channelCapacity ?? m.ChannelCapacity ?? 2);
  const rawNames = m.channel_names || m.ChannelNames;
  const channelNames = Array.isArray(rawNames) && rawNames.length > 0
    ? rawNames
    : Array.from({ length: channelCount }, (_, i) => `Channel ${i + 1}`);

  return {
    ...m,
    id,
    gw_model_id: String(id),
    gw_model_name: name,
    gatewayModelName: name,
    gw_make_id: String(makeId),
    gatewayMakeId: makeId,
    gw_make_name: makeName,
    gatewayMakeName: makeName,
    channel_count: channelCount,
    firmware_version: m.firmware_version ?? m.FirmwareVersion ?? m.firmwareVersion ?? 'v1.0.0',
    channel_names: channelNames,
    isActive: m.isActive ?? m.IsActive ?? true,
  };
};

const EMPTY_FORM = {
  gw_make_id: '',
  gw_model_name: '',
  channel_count: 2,
  firmware_version: 'v1.0.0',
  channel_names: ['', ''],
};

// ─── Component ────────────────────────────────────────────────────────────────
export const GatewayModelPage: React.FC = () => {
  // ── Data state ───────────────────────────────────────────────────────────────
  const [models, setModels] = useState<NormalisedModel[]>([]);
  const [makes, setMakes] = useState<NormalisedMake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  // ── Modal / form state ───────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMakeId, setFilterMakeId] = useState<string>('all');

  // ── Feedback ─────────────────────────────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const hasInitiallyLoaded = useRef(false);

  // ── Fetch (Smooth, zero-glitch) ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!hasInitiallyLoaded.current) {
      setLoading(true);
    }
    setFetchError('');
    try {
      const [modData, makeData] = await Promise.all([
        apiModels.getAll(),
        apiMakes.getAll(),
      ]);

      const rawMakes = normaliseArray(makeData);
      const cleanMakes = rawMakes.map((m, idx) => normaliseMake(m, idx)).filter(Boolean) as NormalisedMake[];
      setMakes(cleanMakes);

      const rawModels = normaliseArray(modData);
      const cleanModels = rawModels.map((m, idx) => normaliseModel(m, idx, cleanMakes)).filter(Boolean) as NormalisedModel[];
      setModels(cleanModels);
      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setFetchError(err.message || 'Unable to load gateway models and makes from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return models.filter((m) => {
      const modelName = (m.gw_model_name || m.gatewayModelName || '').toLowerCase();
      const modelId = String(m.gw_model_id || m.id || '').toLowerCase();
      const makeName = (m.gw_make_name || m.gatewayMakeName || '').toLowerCase();

      const matchSearch = !q || modelName.includes(q) || modelId.includes(q) || makeName.includes(q);
      const matchMake =
        filterMakeId === 'all' ||
        String(m.gw_make_id) === String(filterMakeId) ||
        String(m.gatewayMakeId) === String(filterMakeId);

      return matchSearch && matchMake;
    });
  }, [models, searchTerm, filterMakeId]);

  // ── Channel helpers ───────────────────────────────────────────────────────────
  const handleChannelCountChange = (countVal: number) => {
    const count = Number(countVal) === 1 ? 1 : 2;
    const current = form.channel_names || [];
    const nextNames = Array.from(
      { length: count },
      (_, i) => (current[i] !== undefined ? current[i] : `Channel ${i + 1}`)
    );
    setForm((prev) => ({ ...prev, channel_count: count, channel_names: nextNames }));
  };

  const handleChannelNameChange = (idx: number, val: string) => {
    const next = [...(form.channel_names || [])];
    next[idx] = val;
    setForm((prev) => ({ ...prev, channel_names: next }));
  };

  // ── Open modals ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    const defMake = filterMakeId !== 'all' ? filterMakeId : (makes[0]?.gw_make_id ? String(makes[0].gw_make_id) : '');
    setEditingId(null);
    setCurrentStage(1);
    setIsSaving(false);
    setForm({
      gw_make_id: defMake,
      gw_model_name: '',
      channel_count: 2,
      firmware_version: 'v1.0.0',
      channel_names: ['Channel 1', 'Channel 2'],
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (m: NormalisedModel) => {
    const rawCount = Number(m.channel_count) || 2;
    const count = rawCount === 1 ? 1 : 2;
    const names =
      m.channel_names && Array.isArray(m.channel_names) && m.channel_names.length === count
        ? m.channel_names
        : Array.from({ length: count }, (_, i) => m.channel_names?.[i] || `Channel ${i + 1}`);

    const dbId = toIntegerId(m.id) ?? resolveIntegerId(m.gw_model_id, 1);
    setEditingId(dbId);
    setCurrentStage(1);
    setIsSaving(false);
    setForm({
      gw_make_id: m.gw_make_id ? String(m.gw_make_id) : (m.gatewayMakeId !== undefined ? String(m.gatewayMakeId) : ''),
      gw_model_name: m.gw_model_name || m.gatewayModelName || '',
      channel_count: count,
      firmware_version: m.firmware_version || 'v1.0.0',
      channel_names: names,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCurrentStage(1);
    setIsSaving(false);
    setForm(EMPTY_FORM);
    setErrorMsg('');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // ── Stage navigation ──────────────────────────────────────────────────────────
  const handleNextStage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!form.gw_make_id) {
      setErrorMsg('Please select a Manufacturer (Make).');
      return;
    }
    if (!form.gw_model_name.trim()) {
      setErrorMsg('Gateway Model Name is required.');
      return;
    }

    const count = Number(form.channel_count);
    if (count !== 1 && count !== 2) {
      setErrorMsg('Please select either 1 or 2 channels.');
      return;
    }

    const current = form.channel_names || [];
    const normalised = Array.from(
      { length: count },
      (_, i) => (current[i] && current[i].trim() ? current[i] : `Channel ${i + 1}`)
    );
    setForm((prev) => ({ ...prev, channel_names: normalised }));
    setCurrentStage(2);
  };

  const handlePrevStage = () => {
    setErrorMsg('');
    setCurrentStage(1);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setErrorMsg('');

    if (!form.gw_make_id) {
      setCurrentStage(1);
      setErrorMsg('Please select a Manufacturer (Make).');
      return;
    }
    const trimmedModel = form.gw_model_name.trim();
    if (!trimmedModel) {
      setCurrentStage(1);
      setErrorMsg('Gateway Model Name is required.');
      return;
    }

    const channelCount = Number(form.channel_count) || 1;
    const channelNames = Array.from(
      { length: channelCount },
      (_, i) => (form.channel_names?.[i] || '').trim() || `Channel ${i + 1}`
    );

    const seen: Record<string, boolean> = {};
    for (let i = 0; i < channelCount; i++) {
      const key = channelNames[i].toLowerCase();
      if (seen[key]) {
        setErrorMsg(
          `Duplicate channel name "${channelNames[i]}". Each channel must have a unique name.`
        );
        return;
      }
      seen[key] = true;
    }

    setIsSaving(true);
    try {
      const makeIdNum = resolveIntegerId(form.gw_make_id, 1)!;
      const payload = {
        gw_make_id: String(makeIdNum),
        gatewayMakeId: makeIdNum,
        gw_model_name: trimmedModel,
        gatewayModelName: trimmedModel,
        channel_count: channelCount,
        channel_names: channelNames,
        firmware_version: (form.firmware_version || '').trim() || 'v1.0.0',
      };

      if (editingId) {
        const dbId = resolveIntegerId(editingId, 1)!;
        await apiModels.update(dbId, payload);
        showSuccess(`✓ Model "${trimmedModel}" updated successfully.`);
      } else {
        await apiModels.create(payload);
        showSuccess(`✓ Model "${trimmedModel}" added successfully.`);
      }

      handleClose();
      await fetchAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving the gateway model.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (m: NormalisedModel) => {
    const modelId = toIntegerId(m.id) ?? resolveIntegerId(m.gw_model_id, 1);
    const modelName = m.gw_model_name || m.gatewayModelName;
    if (!window.confirm(`Delete Gateway Model "${modelName}"?`)) return;
    try {
      if (modelId) {
        try {
          await apiModels.delete(modelId);
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (!msg.includes('not found') && !msg.includes('404')) {
            throw err;
          }
        }
        showSuccess(`✓ Model "${modelName}" deleted.`);
        await fetchAll();
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to delete gateway model.');
    }
  };

  // ── Derived display values ────────────────────────────────────────────────────
  const selectedMake = makes.find((m) => String(m.gw_make_id || m.id) === String(form.gw_make_id));
  const selectedMakeName = selectedMake?.gw_make_name || selectedMake?.gatewayMakeName || form.gw_make_id || '—';

  // ── Render ────────────────────────────────────────────────────────────────────
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
            header: 'Model Name',
            render: (m: NormalisedModel) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Cpu size={14} color="var(--brand-primary)" />
                <span>{m.gw_model_name || m.gatewayModelName}</span>
              </div>
            ),
          },
          {
            header: 'Manufacturer',
            render: (m: NormalisedModel) => {
              const mk = makes.find((make) => String(make.gw_make_id || make.id) === String(m.gw_make_id || m.gatewayMakeId));
              const displayName = mk?.gw_make_name || mk?.gatewayMakeName || m.gw_make_name || m.gatewayMakeName || '—';
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} color="var(--text-muted)" />
                  <span>{displayName}</span>
                </div>
              );
            },
          },
          {
            header: 'Channel Capacity',
            align: 'center',
            render: (m: NormalisedModel) => (
              <span
                className="mono-num"
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  fontWeight: 600,
                }}
              >
                {m.channel_count || 1} Channel{m.channel_count !== 1 ? 's' : ''}
              </span>
            ),
          },
          {
            header: 'Firmware',
            align: 'center',
            render: (m: NormalisedModel) => (
              <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {m.firmware_version || 'v1.0.0'}
              </span>
            ),
          },
          {
            header: 'Actions',
            width: '120px',
            align: 'center',
            render: (m: NormalisedModel) => (
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  onClick={() => openEdit(m)}
                  className="btn-icon"
                  title="Edit Model"
                  aria-label="Edit Model"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="btn-icon btn-icon-danger"
                  title="Delete Model"
                  aria-label="Delete Model"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
        rowKey={(m: NormalisedModel, idx) => m.gw_model_id || m.id || idx}
        isLoading={loading}
        toolbar={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <SearchInput
                width="280px"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={PLACEHOLDERS.search.gatewayModels}
              />
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
                      ...makes.map((mk, idx) => {
                        const makeId = mk.gw_make_id || mk.id || String(idx + 1);
                        const makeName = mk.gw_make_name || mk.gatewayMakeName || `Make #${makeId}`;
                        return {
                          value: String(makeId),
                          label: makeName,
                        };
                      }),
                    ]}
                  />
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
                Showing:{' '}
                <strong style={{ color: 'var(--brand-primary)' }}>{filtered.length}</strong> of{' '}
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
              <button type="button" onClick={openAdd} className="btn btn-primary">
                <Plus size={15} />
                <span>Add Gateway Model</span>
              </button>
            </div>
          </div>
        }
        emptyMessage="No gateway models found matching the search criteria."
      />

      {/* ── Two-Stage Add / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingId ? 'Edit Gateway Model' : 'Add Gateway Model'}
        maxWidth="680px"
        footer={
          currentStage === 1 ? (
            <>
              <button type="button" onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleNextStage} className="btn btn-primary">
                <span>Next: Channel Config</span>
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handlePrevStage} className="btn btn-secondary">
                <ArrowLeft size={14} />
                <span>Back</span>
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
                    <Save size={14} /> Save Gateway Model
                  </>
                )}
              </button>
            </>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Wizard step indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: currentStage === 1 ? 'var(--brand-primary)' : 'var(--status-success-text)',
                fontWeight: 650,
                fontSize: '0.80rem',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentStage === 1 ? 'var(--brand-surface)' : 'var(--status-success-bg)',
                  border: `1.5px solid ${currentStage === 1 ? 'var(--brand-primary)' : 'var(--status-success-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                }}
              >
                {currentStage > 1 ? <Check size={12} /> : '1'}
              </span>
              <span>1. Gateway Details</span>
            </div>

            <ChevronRight size={14} color="var(--text-muted)" />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: currentStage === 2 ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontWeight: currentStage === 2 ? 650 : 500,
                fontSize: '0.80rem',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentStage === 2 ? 'var(--brand-surface)' : 'var(--bg-input)',
                  border: `1.5px solid ${currentStage === 2 ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                }}
              >
                2
              </span>
              <span>2. Channel Names</span>
            </div>
          </div>

          {/* Error alert inside modal */}
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

          {/* ── STAGE 1: Gateway Details ── */}
          {currentStage === 1 && (
            <form
              onSubmit={handleNextStage}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <SelectField
                label="Manufacturer (Make)"
                required
                value={form.gw_make_id}
                onChange={(e) => {
                  setForm({ ...form, gw_make_id: e.target.value });
                  if (errorMsg) setErrorMsg('');
                }}
                options={[
                  { value: '', label: '-- Select Manufacturer --' },
                  ...makes.map((mk, idx) => {
                    const makeId = String(mk.gw_make_id || mk.id || idx + 1);
                    const makeName = mk.gw_make_name || mk.gatewayMakeName || `Make #${makeId}`;
                    return {
                      value: makeId,
                      label: makeName,
                    };
                  }),
                ]}
              />

              <InputField
                label="Gateway Model Name"
                required
                value={form.gw_model_name}
                onChange={(e) => {
                  setForm({ ...form, gw_model_name: e.target.value });
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={PLACEHOLDERS.gateway.model}
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                {/* Channel Capacity selector */}
                <div className="form-group">
                  <label className="form-label">Channel Capacity *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[1, 2].map((cnt) => {
                      const isSelected = Number(form.channel_count) === cnt;
                      return (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleChannelCountChange(cnt)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: isSelected
                              ? '1.5px solid var(--brand-primary)'
                              : '1px solid var(--border-default)',
                            backgroundColor: isSelected
                              ? 'var(--brand-surface)'
                              : 'var(--bg-surface)',
                            color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 700 : 550,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isSelected
                                ? 'var(--brand-primary)'
                                : 'var(--border-default)',
                              display: 'inline-block',
                            }}
                          />
                          {cnt} Channel{cnt === 1 ? '' : 's'}
                        </button>
                      );
                    })}
                  </div>
                  <span
                    className="form-helper"
                    style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}
                  >
                    1 or 2 channels supported
                  </span>
                </div>

                <InputField
                  label="Default Firmware Version"
                  className="mono-num"
                  value={form.firmware_version}
                  onChange={(e) => setForm({ ...form, firmware_version: e.target.value })}
                  placeholder="v1.0.0"
                />
              </div>
            </form>
          )}

          {/* ── STAGE 2: Channel Names ── */}
          {currentStage === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary card from Stage 1 */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Configured Model Overview
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevStage}
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Manufacturer</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedMakeName}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Model Name</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--brand-primary)', marginTop: '2px' }}>
                      {form.gw_model_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Channel Slots</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {form.channel_count} Slot{form.channel_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Firmware</div>
                    <div style={{ fontSize: '0.80rem', fontWeight: 650, color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {form.firmware_version || 'v1.0.0'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel names configuration */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 650, color: 'var(--text-primary)' }}>
                    Channel Names
                  </h4>
                  <span
                    className="mono-num"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--brand-primary)',
                      backgroundColor: 'var(--brand-surface)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {form.channel_count} Channels
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: form.channel_count === 1 ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                    gap: '12px',
                  }}
                >
                  {(form.channel_names || []).map((name, idx) => (
                    <InputField
                      key={idx}
                      label={`Channel ${idx + 1}`}
                      required
                      value={name || ''}
                      onChange={(e) => handleChannelNameChange(idx, e.target.value)}
                      placeholder={`Channel ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export const GatewayModelMasterView = GatewayModelPage;
export default GatewayModelPage;
