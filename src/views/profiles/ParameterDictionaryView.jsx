import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, BookOpen, Building2, Cpu, Filter } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Modal } from '../../components/common/Modal';

const CATEGORIES = [
  'Power',
  'Voltage',
  'Current',
  'Power Factor',
  'Apparent Power',
  'Reactive Power',
  'Frequency',
  'Energy',
  'Speed/Runtime',
  'Diagnostics',
];

const categoryColors = {
  Power: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  Voltage: { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  Current: { bg: '#dcfce7', color: '#14532d', border: '#86efac' },
  'Power Factor': { bg: '#f0f9ff', color: '#075985', border: '#bae6fd' },
  'Apparent Power': { bg: '#fff7ed', color: '#7c2d12', border: '#fed7aa' },
  'Reactive Power': { bg: '#fdf2f8', color: '#701a75', border: '#e879f9' },
  Frequency: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Energy: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  'Speed/Runtime': { bg: '#f9fafb', color: '#374151', border: '#d1d5db' },
  Diagnostics: { bg: '#fdf4ff', color: '#86198f', border: '#f0abfc' },
};

export const ParameterDictionaryView = () => {
  const {
    standardParameters,
    addStandardParameter,
    deleteStandardParameter,
    makes,
    models,
    meterProfiles,
  } = useEnergyData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Make & Model dropdown filters
  const [selectedMakeId, setSelectedMakeId] = useState('all');
  const [selectedModelId, setSelectedModelId] = useState('all');

  // Form for adding new parameter to dictionary
  const [paramForm, setParamForm] = useState({
    key: '',
    display_name: '',
    category: 'Power',
    datatype: 'float32',
    scale: 1.0,
    unit: '',
    description: '',
    make_id: 'all',
    model_id: 'all',
  });

  const availableModelsForFilter = useMemo(() => {
    if (selectedMakeId === 'all') return models;
    return models.filter((m) => m.make_id === selectedMakeId);
  }, [models, selectedMakeId]);

  const availableModelsForModal = useMemo(() => {
    if (paramForm.make_id === 'all') return models;
    return models.filter((m) => m.make_id === paramForm.make_id);
  }, [models, paramForm.make_id]);

  const handleOpenAdd = () => {
    setParamForm({
      key: '',
      display_name: '',
      category: 'Power',
      datatype: 'float32',
      scale: 1.0,
      unit: '',
      description: '',
      make_id: selectedMakeId !== 'all' ? selectedMakeId : 'all',
      model_id: selectedModelId !== 'all' ? selectedModelId : 'all',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addStandardParameter({
      ...paramForm,
      scale: Number(paramForm.scale),
    });
    setIsModalOpen(false);
  };

  // Filter parameters by search, category, and optionally make/model
  const filteredParams = useMemo(() => {
    return standardParameters.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.display_name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        (p.unit || '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;

      // Make & Model association filter
      let matchMake = true;
      if (selectedMakeId !== 'all') {
        if (p.make_id && p.make_id !== 'all') {
          matchMake = p.make_id === selectedMakeId;
        }
      }

      let matchModel = true;
      if (selectedModelId !== 'all') {
        if (p.model_id && p.model_id !== 'all') {
          matchModel = p.model_id === selectedModelId;
        }
      }

      return matchSearch && matchCat && matchMake && matchModel;
    });
  }, [standardParameters, searchTerm, categoryFilter, selectedMakeId, selectedModelId]);

  // Group by category for display
  const grouped = useMemo(() => {
    const res = {};
    filteredParams.forEach((p) => {
      if (!res[p.category]) res[p.category] = [];
      res[p.category].push(p);
    });
    return res;
  }, [filteredParams]);

  const allCategories = [...new Set(standardParameters.map((p) => p.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Parameter Master Dictionary
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
            Telemetry catalog linked to Make & Model Masters. Used to auto-fill register configurations across meter profiles.
          </p>
        </div>
        <button onClick={handleOpenAdd} style={btnPrimaryStyle}>
          <Plus size={16} />
          <span>Add Parameter</span>
        </button>
      </div>

      {/* ── MAKE & MODEL DROPDOWN FILTER BAR ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
          <Filter size={15} color="#0284c7" />
          <span>Filters:</span>
        </div>

        {/* Make Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={15} color="#64748b" />
          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Make:</span>
          <select
            value={selectedMakeId}
            onChange={(e) => {
              setSelectedMakeId(e.target.value);
              setSelectedModelId('all');
            }}
            style={dropdownStyle}
          >
            <option value="all">All Makes (Global Catalog)</option>
            {makes.map((m) => (
              <option key={m.make_id} value={m.make_id}>
                {m.make_name} ({m.make_id})
              </option>
            ))}
          </select>
        </div>

        {/* Model Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={15} color="#64748b" />
          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Model:</span>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            disabled={selectedMakeId === 'all'}
            style={{
              ...dropdownStyle,
              opacity: selectedMakeId === 'all' ? 0.6 : 1,
              cursor: selectedMakeId === 'all' ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="all">All Models</option>
            {availableModelsForFilter.map((mod) => (
              <option key={mod.model_id} value={mod.model_id}>
                {mod.model_name} ({mod.model_id})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search parameters or keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 10px 6px 30px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', width: '220px' }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setCategoryFilter('all')}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: categoryFilter === 'all' ? '1px solid #0284c7' : '1px solid #e2e8f0',
            backgroundColor: categoryFilter === 'all' ? '#f0f9ff' : '#fff',
            color: categoryFilter === 'all' ? '#0284c7' : '#475569',
          }}
        >
          All ({standardParameters.length})
        </button>
        {allCategories.map((cat) => {
          const style = categoryColors[cat] || categoryColors['Diagnostics'];
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? `1px solid ${style.color}` : '1px solid #e2e8f0',
                backgroundColor: isActive ? style.bg : '#fff',
                color: isActive ? style.color : '#475569',
              }}
            >
              {cat} ({standardParameters.filter((p) => p.category === cat).length})
            </button>
          );
        })}
      </div>

      {/* Grouped Parameter Table */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
          No parameters match your search and filter criteria.
        </div>
      ) : (
        Object.entries(grouped).map(([category, params]) => {
          const catStyle = categoryColors[category] || categoryColors['Diagnostics'];
          return (
            <div key={category} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Category Header */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: catStyle.bg,
                  borderBottom: `1px solid ${catStyle.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={15} color={catStyle.color} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: catStyle.color }}>{category}</span>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: catStyle.color, backgroundColor: `${catStyle.color}15`, padding: '2px 8px', borderRadius: '10px' }}>
                  {params.length} parameters
                </span>
              </div>

              {/* Parameters Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '9px 16px' }}>Display Name</th>
                    <th style={{ padding: '9px 16px' }}>Telemetry Key</th>
                    <th style={{ padding: '9px 16px', textAlign: 'center' }}>Recommended DataType</th>
                    <th style={{ padding: '9px 16px', textAlign: 'center' }}>Scale</th>
                    <th style={{ padding: '9px 16px', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '9px 16px' }}>Description</th>
                    <th style={{ padding: '9px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((param) => (
                    <tr
                      key={param.key}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{param.display_name}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#0284c7', fontSize: '0.8rem' }}>{param.key}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            color: param.datatype === 'float32' ? '#1d4ed8' : '#15803d',
                            backgroundColor: param.datatype === 'float32' ? '#eff6ff' : '#f0fdf4',
                            border: `1px solid ${param.datatype === 'float32' ? '#bfdbfe' : '#bbf7d0'}`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {param.datatype}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>{param.scale}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: param.unit ? '#0f172a' : '#94a3b8' }}>
                        {param.unit || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.78rem', maxWidth: '240px' }}>{param.description || '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${param.display_name}" from dictionary?`)) deleteStandardParameter(param.key);
                          }}
                          style={iconSmBtnStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#e11d48')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          title="Remove from dictionary"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}

      {/* Add Parameter Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Standard Parameter to Dictionary">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Make and Model Selection in Modal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Target Make</label>
              <select
                value={paramForm.make_id}
                onChange={(e) => setParamForm({ ...paramForm, make_id: e.target.value, model_id: 'all' })}
                style={inputStyle}
              >
                <option value="all">All Makes (Global)</option>
                {makes.map((m) => (
                  <option key={m.make_id} value={m.make_id}>
                    {m.make_name} ({m.make_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Model</label>
              <select
                value={paramForm.model_id}
                onChange={(e) => setParamForm({ ...paramForm, model_id: e.target.value })}
                disabled={paramForm.make_id === 'all'}
                style={{ ...inputStyle, opacity: paramForm.make_id === 'all' ? 0.6 : 1 }}
              >
                <option value="all">All Models</option>
                {availableModelsForModal.map((mod) => (
                  <option key={mod.model_id} value={mod.model_id}>
                    {mod.model_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              required
              value={paramForm.display_name}
              onChange={(e) => {
                const n = e.target.value;
                const k = n.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
                setParamForm((prev) => ({ ...prev, display_name: n, key: prev.key || k }));
              }}
              style={inputStyle}
              placeholder="e.g. Battery Voltage, Frequency Deviation"
            />
          </div>
          <div>
            <label style={labelStyle}>Telemetry Key</label>
            <input
              type="text"
              required
              value={paramForm.key}
              onChange={(e) => setParamForm({ ...paramForm, key: e.target.value })}
              style={{ ...inputStyle, fontFamily: 'monospace' }}
              placeholder="e.g. battery_voltage, freq_deviation"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={paramForm.category} onChange={(e) => setParamForm({ ...paramForm, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Default DataType</label>
              <select value={paramForm.datatype} onChange={(e) => setParamForm({ ...paramForm, datatype: e.target.value })} style={inputStyle}>
                <option value="float32">float32</option>
                <option value="uint32">uint32</option>
                <option value="int32">int32</option>
                <option value="uint16">uint16</option>
                <option value="int16">int16</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Default Scale</label>
              <input type="number" step="any" value={paramForm.scale} onChange={(e) => setParamForm({ ...paramForm, scale: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Default Unit</label>
              <input type="text" value={paramForm.unit} onChange={(e) => setParamForm({ ...paramForm, unit: e.target.value })} style={inputStyle} placeholder="e.g. W, V, A, Hz, %, rpm" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input type="text" value={paramForm.description} onChange={(e) => setParamForm({ ...paramForm, description: e.target.value })} style={inputStyle} placeholder="Short description for this telemetry parameter" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={btnCancelStyle}>
              Cancel
            </button>
            <button type="submit" style={btnSubmitStyle}>
              Add to Catalog
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const dropdownStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#0f172a',
  outline: 'none',
  cursor: 'pointer',
};

const iconSmBtnStyle = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' };
const labelStyle = { display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '7px 10px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' };
const btnPrimaryStyle = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' };
const btnCancelStyle = { padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem' };
const btnSubmitStyle = { padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' };
