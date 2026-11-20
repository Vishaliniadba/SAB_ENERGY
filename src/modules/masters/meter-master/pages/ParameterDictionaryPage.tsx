import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  RotateCcw,
  Filter,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { SearchInput } from '../../../../components/common/SearchInput';
import { DataTable } from '../../../../components/common/DataTable';
import { Select2 } from '../../../../components/common/Select2';
import { PLACEHOLDERS } from '../../../../constants/placeholders';
import { parameterMasterApi as api } from '../api/parameterMasterApi';
import { toIntegerId, resolveIntegerId } from '../../../../services/idHelper';
import '../styles/meterMaster.css';

export const CATEGORY_MAP = {
  'Power': 1,
  'Voltage': 2,
  'Current': 3,
  'Apparent Power': 4,
  'Reactive Power': 5,
  'Energy': 6,
  'Power Factor': 7,
  'Frequency': 8,
  'Speed/Runtime': 9,
  'General': 10,
};

export const ID_TO_CATEGORY_MAP = {
  1: 'Power',
  2: 'Voltage',
  3: 'Current',
  4: 'Apparent Power',
  5: 'Reactive Power',
  6: 'Energy',
  7: 'Power Factor',
  8: 'Frequency',
  9: 'Speed/Runtime',
  10: 'General',
};

// Helper to determine parameter category
export const getParamCategory = (p) => {
  if (p.category) return p.category;
  if (p.categoryId && ID_TO_CATEGORY_MAP[p.categoryId]) return ID_TO_CATEGORY_MAP[p.categoryId];
  const k = (p.key || '').toLowerCase();
  const u = (p.unit || '').toLowerCase();
  const n = (p.display_name || p.displayName || '').toLowerCase();
  if (k.startsWith('volt') || u === 'v' || n.includes('volt')) return 'Voltage';
  if (k.startsWith('curr') || u === 'a' || n.includes('current')) return 'Current';
  if (k.includes('apparent') || u === 'va') return 'Apparent Power';
  if (k.includes('reactive') || u === 'var') return 'Reactive Power';
  if (k.startsWith('power_active') || k.includes('watt') || u === 'w' || u === 'kw') return 'Power';
  if (k.startsWith('pf_') || n.includes('power factor') || n.includes('pf ')) return 'Power Factor';
  if (k.startsWith('energy') || u === 'wh' || u === 'kwh' || u === 'vah') return 'Energy';
  if (k.includes('freq') || u === 'hz' || n.includes('freq')) return 'Frequency';
  if (k.includes('rpm') || k.includes('speed') || k.includes('hours') || u === 'rpm' || u === 's' || u === 'hrs') return 'Speed/Runtime';
  return 'General';
};

// Category badge styling
export const getCategoryBadgeStyle = (category) => {
  switch (category) {
    case 'Voltage':
      return {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        color: '#818cf8',
        border: '1px solid rgba(99, 102, 241, 0.28)',
      };
    case 'Current':
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        color: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.28)',
      };
    case 'Power':
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.28)',
      };
    case 'Apparent Power':
      return {
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
        color: '#2dd4bf',
        border: '1px solid rgba(20, 184, 166, 0.28)',
      };
    case 'Reactive Power':
      return {
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        color: '#22d3ee',
        border: '1px solid rgba(6, 182, 212, 0.28)',
      };
    case 'Energy':
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        color: '#60a5fa',
        border: '1px solid rgba(59, 130, 246, 0.28)',
      };
    case 'Power Factor':
      return {
        backgroundColor: 'rgba(244, 63, 94, 0.12)',
        color: '#fb7185',
        border: '1px solid rgba(244, 63, 94, 0.28)',
      };
    case 'Frequency':
      return {
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        color: '#c084fc',
        border: '1px solid rgba(168, 85, 247, 0.28)',
      };
    case 'Speed/Runtime':
      return {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        color: '#94a3b8',
        border: '1px solid rgba(148, 163, 184, 0.28)',
      };
    default:
      return {
        backgroundColor: 'var(--bg-surface-secondary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-default)',
      };
  }
};

const normaliseParameter = (p, idx = 0) => {
  if (!p) return null;
  const id = toIntegerId(p.id) ?? resolveIntegerId(p.parameter_id, idx + 1)!;
  const key = p.key || p.Key || p.param_key || p.system_key || '';
  const displayName = p.displayName || p.display_name || p.DisplayName || p.name || p.Name || key;
  const unit = p.unit !== undefined ? p.unit : (p.Unit !== undefined ? p.Unit : '');
  const category = p.category || (p.categoryId && ID_TO_CATEGORY_MAP[p.categoryId]) || getParamCategory({ key, unit, display_name: displayName });
  const categoryId = p.categoryId !== undefined ? p.categoryId : (CATEGORY_MAP[category] || 1);
  const isActive = p.isActive !== undefined ? p.isActive : (p.is_active !== undefined ? p.is_active : true);

  return {
    ...p,
    id,
    parameter_id: id,
    key,
    display_name: displayName,
    displayName,
    unit,
    category,
    categoryId,
    isActive,
  };
};

export const ParameterDictionaryPage = () => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [formKey, setFormKey] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formCategory, setFormCategory] = useState('Power');
  const [formUnit, setFormUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Search & Filter selectors
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterParamKey, setFilterParamKey] = useState('all');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const hasInitiallyLoaded = useRef(false);

  // ── Fetch all parameters (Smooth, zero-glitch) ──────────────────────────────
  const fetchParameters = useCallback(async () => {
    if (!hasInitiallyLoaded.current) {
      setLoading(true);
    }
    setFetchError('');
    try {
      const data: any = await api.getAll();
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      if (list.length > 0) {
        setParameters(list.map((p, idx) => normaliseParameter(p, idx)).filter(Boolean));
      } else {
        setParameters([]);
      }
      hasInitiallyLoaded.current = true;
    } catch (err: any) {
      setFetchError(err.message || 'Unable to load parameters from server.');
      setParameters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParameters();
  }, [fetchParameters]);

  // Real-time normalized key
  const normalizedKey = useMemo(() => {
    return formKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }, [formKey]);

  // Real-time duplicate key detection against existing catalog
  const duplicateKeyParam = useMemo(() => {
    if (!normalizedKey) return null;
    return (
      parameters.find(
        (p) => p.key.toLowerCase() === normalizedKey && p.key !== editingKey && p.id !== editingId
      ) || null
    );
  }, [normalizedKey, parameters, editingKey, editingId]);

  // Real-time duplicate display name detection
  const duplicateNameParam = useMemo(() => {
    const trimmed = formDisplayName.trim().toLowerCase();
    if (!trimmed) return null;
    return (
      parameters.find(
        (p) => (p.display_name || '').trim().toLowerCase() === trimmed && p.key !== editingKey && p.id !== editingId
      ) || null
    );
  }, [formDisplayName, parameters, editingKey, editingId]);

  // Catalog-wide duplicate key tracker
  const keyOccurrences = useMemo(() => {
    const counts = {};
    for (const p of parameters) {
      const k = (p.key || '').trim().toLowerCase();
      if (k) {
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return counts;
  }, [parameters]);

  const totalDuplicatesInCatalog = useMemo(() => {
    return Object.values(keyOccurrences).filter((c: any) => Number(c) > 1).length;
  }, [keyOccurrences]);

  // Category list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of parameters) {
      const cat = getParamCategory(p);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).sort((a: any, b: any) => Number(b[1]) - Number(a[1]));
  }, [parameters]);

  // Engineering units list with counts
  const unitsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of parameters) {
      const u = (p.unit || '').trim();
      const label = u || '__none__';
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts).sort((a: any, b: any) => Number(b[1]) - Number(a[1]));
  }, [parameters]);

  // Filtered parameters applying all active selectors
  const filteredParams = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return parameters.filter((p) => {
      // 1. Specific Parameter key match
      if (filterParamKey !== 'all' && p.key !== filterParamKey) {
        return false;
      }
      // 2. Category match
      const pCat = getParamCategory(p);
      if (filterCategory !== 'all' && pCat !== filterCategory) {
        return false;
      }
      // 3. Unit match
      const pUnit = (p.unit || '').trim();
      if (filterUnit !== 'all') {
        if (filterUnit === '__none__' && pUnit !== '') return false;
        if (filterUnit !== '__none__' && pUnit !== filterUnit) return false;
      }
      // 4. Text search match
      if (q) {
        const matchesKey = (p.key || '').toLowerCase().includes(q);
        const matchesName = (p.display_name || '').toLowerCase().includes(q);
        const matchesUnit = (p.unit || '').toLowerCase().includes(q);
        const matchesCat = pCat.toLowerCase().includes(q);
        if (!matchesKey && !matchesName && !matchesUnit && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [parameters, searchTerm, filterCategory, filterUnit, filterParamKey]);

  const hasActiveFilters =
    searchTerm !== '' ||
    filterCategory !== 'all' ||
    filterUnit !== 'all' ||
    filterParamKey !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterUnit('all');
    setFilterParamKey('all');
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setEditingKey(null);
    setFormKey('');
    setFormDisplayName('');
    setFormCategory('Power');
    setFormUnit('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (param) => {
    const id = toIntegerId(param.id) ?? resolveIntegerId(param.parameter_id, 1);
    setEditingId(id !== undefined ? id : null);
    setEditingKey(param.key);
    setFormKey(param.key);
    setFormDisplayName(param.display_name || param.displayName || '');
    setFormCategory(param.category || ID_TO_CATEGORY_MAP[param.categoryId] || 'Power');
    setFormUnit(param.unit || '');
    setErrorMsg('');
    setIsModalOpen(true);

    if (id !== undefined && id !== null) {
      try {
        const fresh = await api.getById(id);
        const data = fresh?.data || fresh;
        if (data) {
          if (data.key) setFormKey(data.key);
          if (data.displayName || data.display_name) {
            setFormDisplayName(data.displayName || data.display_name);
          }
          if (data.categoryId && ID_TO_CATEGORY_MAP[data.categoryId]) {
            setFormCategory(ID_TO_CATEGORY_MAP[data.categoryId]);
          }
          if (data.unit !== undefined) setFormUnit(data.unit || '');
        }
      } catch (_) {
        // Keep row data if GetById call fails
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingKey(null);
    setFormKey('');
    setFormDisplayName('');
    setFormCategory('Power');
    setFormUnit('');
    setErrorMsg('');
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setErrorMsg('');

    const trimmedKey = normalizedKey;
    const trimmedDisplayName = formDisplayName.trim();
    const trimmedUnit = formUnit.trim();

    if (!trimmedKey) {
      setErrorMsg('Please enter a Parameter Key.');
      return;
    }
    if (!trimmedDisplayName) {
      setErrorMsg('Please enter a Display Name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        key: trimmedKey,
        displayName: trimmedDisplayName,
        display_name: trimmedDisplayName,
        categoryId: CATEGORY_MAP[formCategory] || 1,
        category: formCategory,
        unit: trimmedUnit,
      };

      if (editingId !== null && editingId !== undefined) {
        const dbId = resolveIntegerId(editingId, 1)!;
        await api.update(dbId, payload);
        showSuccess(`✓ Updated parameter "${trimmedDisplayName}" successfully.`);
      } else {
        if (duplicateKeyParam) {
          setErrorMsg(`Duplicate key error: Parameter Key "${trimmedKey}" already exists in the dictionary.`);
          setIsSaving(false);
          return;
        }
        await api.create(payload);
        showSuccess(`✓ Added parameter "${trimmedDisplayName}" successfully.`);
      }

      handleCloseModal();
      await fetchParameters();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (param) => {
    const id = toIntegerId(param.id) ?? resolveIntegerId(param.parameter_id, null);
    const key = param.key;
    const name = param.display_name || param.displayName || key;
    if (!window.confirm(`Delete Parameter "${name}" (${key})?`)) return;

    try {
      if (id !== null && id !== undefined) {
        try {
          await api.delete(id);
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (!msg.includes('not found') && !msg.includes('404')) {
            throw err;
          }
        }
      }
      showSuccess(`✓ Deleted parameter "${name}".`);
      await fetchParameters();
    } catch (err: any) {
      setFetchError(err.message || 'Failed to delete parameter.');
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

      {/* Table Container with Search Selectors Toolbar */}
      <DataTable
        columns={[
          {
            header: '#',
            width: '50px',
            render: (_, index) => <span style={{ color: 'var(--text-muted)' }}>{index + 1}</span>,
          },
          {
            header: 'System Key',
            render: (param) => {
              const isDuplicateInCatalog = (keyOccurrences[param.key.toLowerCase()] || 0) > 1;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code
                    className="mono-num"
                    style={{
                      backgroundColor: isDuplicateInCatalog ? 'var(--status-danger-bg)' : 'var(--bg-surface-secondary)',
                      border: isDuplicateInCatalog ? '1px solid var(--status-danger-border)' : '1px solid var(--border-subtle)',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.76rem',
                      color: isDuplicateInCatalog ? 'var(--status-danger-text)' : 'var(--brand-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {param.key}
                  </code>
                  {isDuplicateInCatalog && (
                    <span
                      className="badge badge-danger"
                      title="This parameter key appears multiple times in the catalog"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle size={10} /> Duplicate
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            header: 'Display Label',
            render: (param) => (
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {param.display_name || param.displayName}
              </span>
            ),
          },
          {
            header: 'Category',
            width: '150px',
            render: (param) => {
              const category = getParamCategory(param);
              const badgeStyle = getCategoryBadgeStyle(category);
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    ...badgeStyle,
                  }}
                >
                  {category}
                </span>
              );
            },
          },
          {
            header: 'Engineering Unit',
            align: 'center',
            width: '130px',
            render: (param) =>
              param.unit ? (
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
              ),
          },
          {
            header: 'Actions',
            align: 'center',
            width: '110px',
            render: (param) => (
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
                  onClick={() => handleDelete(param)}
                  className="btn-icon"
                  style={{ color: 'var(--status-danger-text)' }}
                  title="Delete Parameter"
                  aria-label="Delete Parameter"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredParams}
        rowKey={(p) => p.id || p.key}
        loading={loading}
        toolbar={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            {/* Row 1: Search and Selectors */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', width: '100%' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={PLACEHOLDERS.parameter.search}
                style={{ flex: '1 1 220px', minWidth: '200px' }}
              />

              {/* Search Selector: Jump / Select Parameter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '220px', flex: '1 1 220px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Parameter:
                </label>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Select2
                    size="sm"
                    value={filterParamKey}
                    onChange={(val) => setFilterParamKey(val)}
                    searchable={true}
                    options={[
                      { value: 'all', label: `All Parameters (${parameters.length})` },
                      ...parameters.map((p) => ({
                        value: p.key,
                        label: `${p.display_name || p.displayName} (${p.key})${p.unit ? ` [${p.unit}]` : ''}`,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '180px', flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Category:
                </label>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Select2
                    size="sm"
                    value={filterCategory}
                    onChange={(val) => setFilterCategory(val)}
                    searchable={categoriesWithCounts.length >= 6}
                    options={[
                      { value: 'all', label: `All Categories (${parameters.length})` },
                      ...categoriesWithCounts.map(([cat, count]) => ({
                        value: cat,
                        label: `${cat} (${count})`,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Engineering Unit Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '150px', flex: '0 1 160px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Unit:
                </label>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Select2
                    size="sm"
                    value={filterUnit}
                    onChange={(val) => setFilterUnit(val)}
                    searchable={unitsWithCounts.length >= 6}
                    options={[
                      { value: 'all', label: `All Units (${parameters.length})` },
                      ...unitsWithCounts.map(([unit, count]) => ({
                        value: unit,
                        label: `${unit === '__none__' ? 'No Unit' : unit} (${count})`,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary"
                  style={{ height: '34px', fontSize: '0.75rem', padding: '0 10px', gap: '5px' }}
                  title="Reset all search filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={fetchParameters}
                  className="btn btn-secondary"
                  disabled={loading}
                  title="Refresh list"
                  style={{ height: '34px', fontSize: '0.75rem' }}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="btn btn-primary"
                  style={{ height: '34px', fontSize: '0.75rem' }}
                >
                  <Plus size={14} />
                  <span>Add Parameter</span>
                </button>
              </div>
            </div>

            {/* Row 2: Status / Counts bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
                gap: '8px',
                paddingTop: '4px',
                borderTop: '1px dashed var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>
                  Showing: <strong style={{ color: 'var(--brand-primary)', fontWeight: 650 }}>{filteredParams.length}</strong> of{' '}
                  <strong>{parameters.length}</strong> Parameters
                </span>
                {hasActiveFilters && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Filter size={11} /> Filters Active
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {totalDuplicatesInCatalog > 0 && (
                  <span
                    className="badge badge-danger"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 650,
                    }}
                  >
                    <AlertTriangle size={12} /> {totalDuplicatesInCatalog} Duplicate Key{totalDuplicatesInCatalog > 1 ? 's' : ''} in Catalog
                  </span>
                )}
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
                  Catalog Total: <strong style={{ color: 'var(--brand-primary)' }}>{parameters.length}</strong>
                </div>
              </div>
            </div>
          </div>
        }
        emptyIcon={Sliders}
        emptyMessage="No parameters match the selected criteria."
        emptyAction={
          hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ marginTop: '6px', fontSize: '0.75rem', height: '30px' }}
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
          ) : null
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Parameter' : 'Add Parameter'}
        subtitle="Define global telemetry parameter key, category, and engineering display unit."
        maxWidth="520px"
        footer={
          <>
            <button onClick={handleCloseModal} className="btn btn-secondary" disabled={isSaving}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={Boolean(duplicateKeyParam) || isSaving}
              style={
                duplicateKeyParam
                  ? {
                      opacity: 0.55,
                      cursor: 'not-allowed',
                      filter: 'grayscale(0.4)',
                    }
                  : {}
              }
              title={duplicateKeyParam ? 'Cannot save duplicate parameter key' : 'Save Parameter'}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>
                    {duplicateKeyParam
                      ? 'Duplicate Key Detected'
                      : editingId
                      ? 'Update Parameter'
                      : 'Save Parameter'}
                  </span>
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

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                System Key (Unique Snake_Case) *
              </label>
              {duplicateKeyParam ? (
                <span
                  className="badge badge-danger"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger-text)',
                    border: '1px solid var(--status-danger-border)',
                  }}
                >
                  <AlertTriangle size={11} /> DUPLICATE KEY DETECTED
                </span>
              ) : normalizedKey && !editingId ? (
                <span
                  className="badge badge-success"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 600,
                  }}
                >
                  <Check size={11} /> Key Available
                </span>
              ) : null}
            </div>

            <input
              className="form-input mono-num"
              value={formKey}
              onChange={(e) => {
                setFormKey(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder={PLACEHOLDERS.parameter.key}
              disabled={!!editingId}
              autoFocus={!editingId}
              style={
                duplicateKeyParam
                  ? {
                      borderColor: 'var(--status-danger-border, #ef4444)',
                      backgroundColor: 'var(--status-danger-bg, rgba(239, 68, 68, 0.06))',
                      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)',
                    }
                  : {}
              }
            />

            {/* Live Duplicate Warning Box */}
            {duplicateKeyParam ? (
              <div
                style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-danger-text)',
                  fontSize: '0.80rem',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--status-danger-text)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Duplicate Key: "{duplicateKeyParam.key}"</span>
                  </div>
                  <div style={{ marginTop: '3px', fontSize: '0.76rem', opacity: 0.95 }}>
                    This parameter key already exists in Meter Master with label <strong>"{duplicateKeyParam.display_name}"</strong>
                    {duplicateKeyParam.unit ? ` (${duplicateKeyParam.unit})` : ''}.
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                    ⚠️ Please provide a unique key. Duplicate keys cannot be saved.
                  </div>
                </div>
              </div>
            ) : (
              <span className="form-helper">
                Standard telemetry identifier used in Modbus payloads and database columns.
              </span>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Display Name *
              </label>
              {duplicateNameParam && (
                <span
                  className="badge badge-warning"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={11} /> Name in Use
                </span>
              )}
            </div>

            <input
              className="form-input"
              value={formDisplayName}
              onChange={(e) => {
                setFormDisplayName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder={PLACEHOLDERS.parameter.name}
              autoFocus={!!editingId}
              style={
                duplicateNameParam && !duplicateKeyParam
                  ? {
                      borderColor: 'var(--status-warning-border, #f59e0b)',
                      backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.05))',
                    }
                  : {}
              }
            />

            {duplicateNameParam && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '7px 10px',
                  backgroundColor: 'var(--status-warning-bg)',
                  border: '1px solid var(--status-warning-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--status-warning-text)',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>
                  Notice: A parameter with display name <strong>"{duplicateNameParam.display_name}"</strong> already exists under key <code>{duplicateNameParam.key}</code>.
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Measurement Category</label>
            <Select2
              value={formCategory}
              onChange={(val) => setFormCategory(val)}
              searchable={false}
              options={[
                { value: 'Power', label: 'Power (Active Power - W, kW)' },
                { value: 'Voltage', label: 'Voltage (V)' },
                { value: 'Current', label: 'Current (A)' },
                { value: 'Apparent Power', label: 'Apparent Power (VA, kVA)' },
                { value: 'Reactive Power', label: 'Reactive Power (VAR, kVAR)' },
                { value: 'Energy', label: 'Energy (Wh, kWh, VAh)' },
                { value: 'Power Factor', label: 'Power Factor (PF)' },
                { value: 'Frequency', label: 'Frequency (Hz)' },
                { value: 'Speed/Runtime', label: 'Speed / Runtime (RPM, hrs, s)' },
                { value: 'General', label: 'General / Custom' },
              ]}
            />
            <span className="form-helper">
              Categorizes measurement for telemetry organization and dashboard widgets.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Engineering Unit</label>
            <input
              className="form-input mono-num"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              placeholder={PLACEHOLDERS.parameter.unit}
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

export const ParameterDictionaryView = ParameterDictionaryPage;
export default ParameterDictionaryPage;

