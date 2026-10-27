import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ArrowRight, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormField';

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
          backgroundColor: 'var(--brand-surface)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-lg)',
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
      <DataTable
        columns={[
          {
            header: 'Mapping ID',
            key: 'Mapping_id',
            className: 'mono-num',
            style: { fontWeight: 600, color: 'var(--text-secondary)' },
          },
          {
            header: 'Asset Entity',
            render: (map) => {
              const asset = assets.find((a) => a.Asset_id === map.Asset_id);
              return asset ? (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.Asset_name}</div>
                  <div className="mono-num" style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    {asset.Asset_id} • {asset.asset_type}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--status-danger-text)' }}>{map.Asset_id} (Missing)</span>
              );
            },
          },
          {
            header: 'Link',
            align: 'center',
            width: '50px',
            render: () => (
              <span style={{ color: 'var(--text-dim)' }}>
                <ArrowRight size={14} />
              </span>
            ),
          },
          {
            header: 'Assigned Meter',
            render: (map) => {
              const meter = meters.find((m) => m.Meter_id === map.Meter_id);
              return meter ? (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meter.Meter_name}</div>
                  <div className="mono-num" style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    {meter.Meter_id} • Slave ID: {meter.slave_id}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--status-danger-text)' }}>{map.Meter_id} (Missing)</span>
              );
            },
          },
          {
            header: 'CT/PT Multiplier',
            align: 'center',
            render: (map) => (
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
            ),
          },
          {
            header: 'Effective Validity',
            render: (map) => (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>
                  From: <span className="mono-num" style={{ color: 'var(--text-secondary)', fontWeight: 550 }}>{map.effective_from}</span>
                </div>
                <div>
                  To: <span className="mono-num" style={{ color: 'var(--text-secondary)', fontWeight: 550 }}>{map.effective_to}</span>
                </div>
              </div>
            ),
          },
          {
            header: 'Status',
            align: 'center',
            render: (map) => (
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
            ),
          },
          {
            header: 'Actions',
            width: '110px',
            align: 'center',
            render: (map) => (
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
            ),
          },
        ]}
        data={filteredMappings}
        rowKey="Mapping_id"
        toolbar={
          <>
            <SearchInput
              placeholder="Search mappings by asset or meter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
              Active Mappings: <strong style={{ color: 'var(--brand-primary)' }}>{mappings.filter((m) => m.is_active).length}</strong> of {mappings.length}
            </div>
          </>
        }
        emptyMessage={
          <span>
            No asset mappings found. Click <strong>"New Asset Mapping"</strong> to link equipment to a meter.
          </span>
        }
      />

      {/* Add / Edit Mapping Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMapping ? 'Edit Mapping' : 'New Mapping'}
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
          <SelectField
            label="Plant Asset"
            required
            value={formData.Asset_id}
            onChange={(e) => setFormData({ ...formData, Asset_id: e.target.value })}
            options={assets.map((a) => ({
              value: a.Asset_id,
              label: `${a.Asset_name} (${a.Asset_id}) — ${a.asset_type}`,
            }))}
          />

          <SelectField
            label="Assigned Modbus Meter"
            required
            value={formData.Meter_id}
            onChange={(e) => setFormData({ ...formData, Meter_id: e.target.value })}
            options={meters.map((m) => ({
              value: m.Meter_id,
              label: `${m.Meter_name} (Slave ID: ${m.slave_id}) — ${m.Meter_id}`,
            }))}
          />

          <InputField
            label="Multiplication Factor (CT / PT Ratio)"
            required
            type="number"
            className="mono-num"
            value={formData.multiplication_factor}
            onChange={(e) => setFormData({ ...formData, multiplication_factor: e.target.value })}
            min="0.01"
            step="any"
            placeholder="e.g. 40"
            hint="Multiplier applied to raw meter registers to compute true primary power (e.g. 200/5A CT = 40x)."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <InputField
              label="Effective From Date"
              type="date"
              className="mono-num"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              required
            />

            <InputField
              label="Effective To Date"
              type="date"
              className="mono-num"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              required
            />
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
