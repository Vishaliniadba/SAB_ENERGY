import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  RotateCcw,
  Filter,
  X,
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';

// Helper to determine parameter category
export const getParamCategory = (p) => {
  if (p.category) return p.category;
  const k = (p.key || '').toLowerCase();
  const u = (p.unit || '').toLowerCase();
  const n = (p.display_name || '').toLowerCase();
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

export const ParameterDictionaryView = () => {
  const { standardParameters, addStandardParameter, updateStandardParameter, deleteStandardParameter } = useEnergyData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formKey, setFormKey] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formCategory, setFormCategory] = useState('Power');
  const [formUnit, setFormUnit] = useState('');

  // Search & Filter selectors
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterParamKey, setFilterParamKey] = useState('all');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time normalized key
  const normalizedKey = useMemo(() => {
    return formKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }, [formKey]);

  // Real-time duplicate key detection against existing catalog
  const duplicateKeyParam = useMemo(() => {
    if (!normalizedKey) return null;
    return (
      standardParameters.find(
        (p) => p.key.toLowerCase() === normalizedKey && p.key !== editingKey
      ) || null
    );
  }, [normalizedKey, standardParameters, editingKey]);

  // Real-time duplicate display name detection
  const duplicateNameParam = useMemo(() => {
    const trimmed = formDisplayName.trim().toLowerCase();
    if (!trimmed) return null;
    return (
      standardParameters.find(
        (p) => (p.display_name || '').trim().toLowerCase() === trimmed && p.key !== editingKey
      ) || null
    );
  }, [formDisplayName, standardParameters, editingKey]);

  // Catalog-wide duplicate key tracker
  const keyOccurrences = useMemo(() => {
    const counts = {};
    for (const p of standardParameters) {
      const k = (p.key || '').trim().toLowerCase();
      if (k) {
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return counts;
  }, [standardParameters]);

  const totalDuplicatesInCatalog = useMemo(() => {
    return Object.values(keyOccurrences).filter((c) => c > 1).length;
  }, [keyOccurrences]);

  // Category list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    for (const p of standardParameters) {
      const cat = getParamCategory(p);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [standardParameters]);

  // Engineering units list with counts
  const unitsWithCounts = useMemo(() => {
    const counts = {};
    for (const p of standardParameters) {
      const u = (p.unit || '').trim();
      const label = u || '__none__';
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [standardParameters]);

  // Filtered parameters applying all active selectors
  const filteredParams = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return standardParameters.filter((p) => {
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
  }, [standardParameters, searchTerm, filterCategory, filterUnit, filterParamKey]);

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
    setEditingKey(null);
    setFormKey('');
    setFormDisplayName('');
    setFormCategory('Power');
    setFormUnit('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (param) => {
    setEditingKey(param.key);
    setFormKey(param.key);
    setFormDisplayName(param.display_name || '');
    setFormCategory(param.category || getParamCategory(param));
    setFormUnit(param.unit || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKey(null);
    setFormKey('');
    setFormDisplayName('');
    setFormCategory('Power');
    setFormUnit('');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
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

    if (editingKey) {
      updateStandardParameter(editingKey, {
        display_name: trimmedDisplayName,
        unit: trimmedUnit,
        category: formCategory,
      });
      setSuccessMsg(`✓ Updated parameter "${trimmedDisplayName}" successfully.`);
    } else {
      if (duplicateKeyParam) {
        setErrorMsg(`Duplicate key error: Parameter Key "${trimmedKey}" already exists in the dictionary.`);
        return;
      }
      const exists = standardParameters.some((p) => p.key === trimmedKey);
      if (exists) {
        setErrorMsg(`Parameter Key "${trimmedKey}" already exists.`);
        return;
      }
      addStandardParameter({
        key: trimmedKey,
        display_name: trimmedDisplayName,
        unit: trimmedUnit,
        category: formCategory,
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

      {/* Table Container with Search Selectors Toolbar */}
      <div className="table-container">
        <div className="table-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Row 1: Search and Selectors */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', width: '100%' }}>
            {/* Search Input with quick clear */}
            <div className="search-input-wrapper" style={{ flex: '1 1 220px', minWidth: '200px', position: 'relative' }}>
              <Search size={14} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search key, name, unit, category..."
                style={{ paddingRight: searchTerm ? '28px' : '12px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Search Selector: Jump / Select Parameter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '200px', flex: '1 1 200px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Parameter:
              </label>
              <select
                className="form-select"
                value={filterParamKey}
                onChange={(e) => setFilterParamKey(e.target.value)}
                style={{ height: '34px', fontSize: '0.78rem' }}
              >
                <option value="all">All Parameters ({standardParameters.length})</option>
                {standardParameters.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.display_name} ({p.key}){p.unit ? ` [${p.unit}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '160px', flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Category:
              </label>
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ height: '34px', fontSize: '0.78rem' }}
              >
                <option value="all">All Categories ({standardParameters.length})</option>
                {categoriesWithCounts.map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Engineering Unit Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '130px', flex: '0 1 140px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Unit:
              </label>
              <select
                className="form-select mono-num"
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                style={{ height: '34px', fontSize: '0.78rem' }}
              >
                <option value="all">All Units ({standardParameters.length})</option>
                {unitsWithCounts.map(([unit, count]) => (
                  <option key={unit} value={unit}>
                    {unit === '__none__' ? 'No Unit' : unit} ({count})
                  </option>
                ))}
              </select>
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
                <strong>{standardParameters.length}</strong> Parameters
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
                Catalog Total: <strong style={{ color: 'var(--brand-primary)' }}>{standardParameters.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <table className="enterprise-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>System Key</th>
              <th>Display Label</th>
              <th style={{ width: '150px' }}>Category</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Engineering Unit</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParams.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={28} style={{ opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No parameters match the selected criteria.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="btn btn-secondary"
                        style={{ marginTop: '6px', fontSize: '0.75rem', height: '30px' }}
                      >
                        <RotateCcw size={12} /> Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredParams.map((param, index) => {
                const isDuplicateInCatalog = (keyOccurrences[param.key.toLowerCase()] || 0) > 1;
                const category = getParamCategory(param);
                const badgeStyle = getCategoryBadgeStyle(category);

                return (
                  <tr key={param.key}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
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
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {param.display_name}
                    </td>
                    <td>
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
        subtitle="Define global telemetry parameter key, category, and engineering display unit."
        maxWidth="520px"
        footer={
          <>
            <button onClick={handleCloseModal} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={Boolean(duplicateKeyParam)}
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
              <Save size={14} />
              <span>
                {duplicateKeyParam
                  ? 'Duplicate Key Detected'
                  : editingKey
                  ? 'Update Parameter'
                  : 'Save Parameter'}
              </span>
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
              ) : normalizedKey && !editingKey ? (
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
              placeholder="e.g. active_power_r, voltage_ry, frequency"
              disabled={!!editingKey}
              autoFocus={!editingKey}
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
              placeholder="e.g. Voltage R-Y, Active Power Phase R"
              autoFocus={!!editingKey}
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
            <select
              className="form-select"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
            >
              <option value="Power">Power (Active Power - W, kW)</option>
              <option value="Voltage">Voltage (V)</option>
              <option value="Current">Current (A)</option>
              <option value="Apparent Power">Apparent Power (VA, kVA)</option>
              <option value="Reactive Power">Reactive Power (VAR, kVAR)</option>
              <option value="Energy">Energy (Wh, kWh, VAh)</option>
              <option value="Power Factor">Power Factor (PF)</option>
              <option value="Frequency">Frequency (Hz)</option>
              <option value="Speed/Runtime">Speed / Runtime (RPM, hrs, s)</option>
              <option value="General">General / Custom</option>
            </select>
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

