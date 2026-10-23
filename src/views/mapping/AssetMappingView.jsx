import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowRight, Calculator } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AssetMappingView = () => {
  const { mappings, assets, meters, addMapping, updateMapping, deleteMapping, toggleMappingActive } = useEnergyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);

  const [formData, setFormData] = useState({
    Asset_id: assets[0]?.Asset_id || '',
    Meter_id: meters[0]?.Meter_id || '',
    multiplication_factor: '40',
    effective_from: '2026-01-01',
    effective_to: '2027-01-01',
    is_active: true
  });

  const handleOpenAdd = () => {
    setEditingMapping(null);
    setFormData({
      Asset_id: assets[0]?.Asset_id || '',
      Meter_id: meters[0]?.Meter_id || '',
      multiplication_factor: '40',
      effective_from: new Date().toISOString().substring(0, 10),
      effective_to: '2027-12-31',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (map) => {
    setEditingMapping(map);
    setFormData({
      Asset_id: map.Asset_id,
      Meter_id: map.Meter_id,
      multiplication_factor: map.multiplication_factor,
      effective_from: map.effective_from,
      effective_to: map.effective_to,
      is_active: map.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMapping) {
      updateMapping(editingMapping.Mapping_id, formData);
    } else {
      addMapping(formData);
    }
    setIsModalOpen(false);
  };

  const filteredMappings = mappings.filter(m => {
    const asset = assets.find(a => a.Asset_id === m.Asset_id);
    const meter = meters.find(mtr => mtr.Meter_id === m.Meter_id);
    const query = searchTerm.toLowerCase();

    return (
      m.Mapping_id.toLowerCase().includes(query) ||
      (asset && asset.Asset_name.toLowerCase().includes(query)) ||
      (meter && meter.Meter_name.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Informative Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          borderLeft: '4px solid #0284c7',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd'
        }}
      >
        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
          <Calculator size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Asset ↔ Meter Relationship & CT/PT Multiplier Factor
          </h4>
        </div>
      </div>

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search mappings by asset or meter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-cyan-deep)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <Plus size={16} />
          <span>New Asset Mapping</span>
        </button>
      </div>

      {/* Mappings Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 18px' }}>Mapping ID</th>
                <th style={{ padding: '14px 18px' }}>Asset Entity</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Link</th>
                <th style={{ padding: '14px 18px' }}>Assigned Meter</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Multiplication Factor (CT/PT)</th>
                <th style={{ padding: '14px 18px' }}>Effective Validity</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Active Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No asset mappings found.
                  </td>
                </tr>
              ) : (
                filteredMappings.map((map) => {
                  const asset = assets.find(a => a.Asset_id === map.Asset_id);
                  const meter = meters.find(m => m.Meter_id === map.Meter_id);

                  return (
                    <tr
                      key={map.Mapping_id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {map.Mapping_id}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {asset ? (
                          <div>
                            <div style={{ color: 'var(--text-primary)' }}>{asset.Asset_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.Asset_id} • {asset.asset_type}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--accent-rose)' }}>{map.Asset_id} (Missing)</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <ArrowRight size={16} />
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {meter ? (
                          <div>
                            <div style={{ color: 'var(--text-primary)' }}>{meter.Meter_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meter.Meter_id} • Slave ID: {meter.slave_id}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--accent-rose)' }}>{map.Meter_id} (Missing)</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            color: 'var(--primary-cyan)',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.9rem',
                            border: '1px solid var(--primary-cyan-border)'
                          }}
                        >
                          {map.multiplication_factor}x
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        <div>From: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{map.effective_from}</span></div>
                        <div>To: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{map.effective_to}</span></div>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleMappingActive(map.Mapping_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Click to toggle Active status"
                        >
                          <Badge status={map.is_active ? 'Active' : 'Inactive'} text={map.is_active ? 'Active' : 'Disabled'} />
                        </button>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEdit(map)}
                            style={{
                              background: 'var(--bg-card-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              color: 'var(--text-secondary)',
                              padding: '6px 8px',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary-cyan)';
                              e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                            title="Edit Mapping"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete mapping "${map.Mapping_id}"?`)) {
                                deleteMapping(map.Mapping_id);
                              }
                            }}
                            style={{
                              background: 'var(--bg-card-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              color: 'var(--text-secondary)',
                              padding: '6px 8px',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--accent-rose)';
                              e.currentTarget.style.borderColor = 'var(--accent-rose)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                            title="Delete Mapping"
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
      </div>

      {/* Add / Edit Mapping Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMapping ? `Edit Mapping: ${editingMapping.Mapping_id}` : 'Create Asset-to-Meter Mapping'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Select Asset</label>
            <select
              value={formData.Asset_id}
              onChange={(e) => setFormData({ ...formData, Asset_id: e.target.value })}
              style={inputStyle}
            >
              {assets.map(ast => (
                <option key={ast.Asset_id} value={ast.Asset_id}>
                  {ast.Asset_name} ({ast.Asset_id} - {ast.asset_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Select Meter</label>
            <select
              value={formData.Meter_id}
              onChange={(e) => setFormData({ ...formData, Meter_id: e.target.value })}
              style={inputStyle}
            >
              {meters.map(mtr => (
                <option key={mtr.Meter_id} value={mtr.Meter_id}>
                  {mtr.Meter_name} ({mtr.Meter_id} - Slave ID #{mtr.slave_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
              Multiplication Factor (CT/PT Ratio Multiplier)
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 40 (for 200:5A CT) or 1 (direct)"
              value={formData.multiplication_factor}
              onChange={(e) => setFormData({ ...formData, multiplication_factor: e.target.value })}
              style={inputStyle}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Common Ratios: 100/5A = 20 | 200/5A = 40 | 400/5A = 80 | 1000/5A = 200
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Effective From</label>
              <input
                type="date"
                required
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Effective To</label>
              <input
                type="date"
                required
                value={formData.effective_to}
                onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="is_active_checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <label htmlFor="is_active_checkbox" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
              Active (Apply this CT/PT multiplication in live calculations)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card-secondary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary-cyan-deep)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              {editingMapping ? 'Save Mapping' : 'Create Mapping'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none'
};
