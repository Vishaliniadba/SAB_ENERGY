import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, ArrowRight, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';

export const AssetMappingView = () => {
  const { mappings, assets, meters, addMapping, updateMapping, deleteMapping, toggleMappingActive } = useEnergyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    Asset_id: assets[0]?.Asset_id || '',
    Meter_id: meters[0]?.Meter_id || '',
    multiplication_factor: '40',
    effective_from: '2026-01-01',
    effective_to: '2027-12-31',
    is_active: true,
  });

  const handleOpenAdd = () => {
    setEditingMapping(null);
    setFormData({
      Asset_id: assets[0]?.Asset_id || '',
      Meter_id: meters[0]?.Meter_id || '',
      multiplication_factor: '40',
      effective_from: new Date().toISOString().substring(0, 10),
      effective_to: '2027-12-31',
      is_active: true,
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
      is_active: map.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (editingMapping) {
      updateMapping(editingMapping.Mapping_id, formData);
      setSuccessMsg(`✓ Updated mapping "${editingMapping.Mapping_id}" successfully.`);
    } else {
      addMapping(formData);
      setSuccessMsg('✓ New asset-to-meter mapping created successfully.');
    }
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const filteredMappings = mappings.filter((m) => {
    const asset = assets.find((a) => a.Asset_id === m.Asset_id);
    const meter = meters.find((mtr) => mtr.Meter_id === m.Meter_id);
    const query = searchTerm.toLowerCase();

    return (
      m.Mapping_id.toLowerCase().includes(query) ||
      (asset && asset.Asset_name.toLowerCase().includes(query)) ||
      (meter && meter.Meter_name.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <PageHeader
        title="Asset-to-Meter Mapping"
        subtitle="Associate plant physical equipment with slave meters, configure external CT/PT multiplication ratios, and manage effective dates."
        icon={Calculator}
        actions={
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={15} />
            <span>New Asset Mapping</span>
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

      {/* Informative Scaling Banner */}
      <div
        className="panel-card"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Calculator size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Formula Rule:</strong> Active Telemetry Power (kW) = Meter Modbus Register Reading × External CT Ratio / PT Ratio (Multiplication Factor).
        </div>
      </div>

      {/* Table Container with Integrated Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search mappings by asset or meter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
            Active Mappings: <strong style={{ color: 'var(--brand-primary)' }}>{mappings.filter((m) => m.is_active).length}</strong> of {mappings.length}
          </div>
        </div>

        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Mapping ID</th>
              <th>Asset Entity</th>
              <th style={{ textAlign: 'center', width: '50px' }}>Link</th>
              <th>Assigned Meter</th>
              <th style={{ textAlign: 'center' }}>CT/PT Multiplier</th>
              <th>Effective Validity</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMappings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No asset mappings found. Click <strong>"New Asset Mapping"</strong> to link equipment to a meter.
                </td>
              </tr>
            ) : (
              filteredMappings.map((map) => {
                const asset = assets.find((a) => a.Asset_id === map.Asset_id);
                const meter = meters.find((m) => m.Meter_id === map.Meter_id);

                return (
                  <tr key={map.Mapping_id}>
                    <td className="mono-num" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {map.Mapping_id}
                    </td>

                    <td>
                      {asset ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.Asset_name}</div>
                          <div className="mono-num" style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                            {asset.Asset_id} • {asset.asset_type}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--status-danger-text)' }}>{map.Asset_id} (Missing)</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                      <ArrowRight size={14} />
                    </td>

                    <td>
                      {meter ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meter.Meter_name}</div>
                          <div className="mono-num" style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                            {meter.Meter_id} • Slave ID: {meter.slave_id}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--status-danger-text)' }}>{map.Meter_id} (Missing)</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="mono-num"
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--brand-surface)',
                          color: 'var(--brand-primary)',
                          fontWeight: 700,
                          fontSize: '0.80rem',
                          border: '1px solid var(--brand-border)',
                        }}
                      >
                        {map.multiplication_factor}x
                      </span>
                    </td>

                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>From: <span className="mono-num" style={{ color: 'var(--text-secondary)', fontWeight: 550 }}>{map.effective_from}</span></div>
                      <div>To: <span className="mono-num" style={{ color: 'var(--text-secondary)', fontWeight: 550 }}>{map.effective_to}</span></div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => toggleMappingActive(map.Mapping_id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                        }}
                        title="Click to toggle Active status"
                      >
                        <Badge status={map.is_active ? 'Active' : 'Inactive'} text={map.is_active ? 'Active' : 'Disabled'} />
                      </button>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(map)}
                          className="btn-icon"
                          title="Edit Mapping"
                          aria-label="Edit Mapping"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete mapping "${map.Mapping_id}"?`)) {
                              deleteMapping(map.Mapping_id);
                            }
                          }}
                          className="btn-icon"
                          style={{ color: 'var(--status-danger-text)' }}
                          title="Delete Mapping"
                          aria-label="Delete Mapping"
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

      {/* Add / Edit Mapping Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMapping ? 'Edit Asset-to-Meter Mapping' : 'New Asset-to-Meter Mapping'}
        subtitle="Connect plant equipment to an active field meter and specify electrical CT/PT multiplier."
        maxWidth="540px"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingMapping ? 'Update Mapping' : 'Create Mapping'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Plant Asset *</label>
            <select
              className="form-select"
              value={formData.Asset_id}
              onChange={(e) => setFormData({ ...formData, Asset_id: e.target.value })}
            >
              {assets.map((a) => (
                <option key={a.Asset_id} value={a.Asset_id}>
                  {a.Asset_name} ({a.Asset_id}) — {a.asset_type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Modbus Meter *</label>
            <select
              className="form-select"
              value={formData.Meter_id}
              onChange={(e) => setFormData({ ...formData, Meter_id: e.target.value })}
            >
              {meters.map((m) => (
                <option key={m.Meter_id} value={m.Meter_id}>
                  {m.Meter_name} (Slave ID: {m.slave_id}) — {m.Meter_id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Multiplication Factor (CT / PT Ratio) *</label>
            <input
              type="number"
              className="form-input mono-num"
              value={formData.multiplication_factor}
              onChange={(e) => setFormData({ ...formData, multiplication_factor: e.target.value })}
              min="0.01"
              step="any"
              placeholder="e.g. 40"
              required
            />
            <span className="form-helper">
              Multiplier applied to raw meter registers to compute true primary power (e.g. 200/5A CT = 40x).
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Effective From Date</label>
              <input
                type="date"
                className="form-input mono-num"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Effective To Date</label>
              <input
                type="date"
                className="form-input mono-num"
                value={formData.effective_to}
                onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="is_active_map"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
            />
            <label htmlFor="is_active_map" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 550 }}>
              Enable this mapping for live active telemetry calculations
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
