import React, { useState } from 'react';
import { Plus, Search, Boxes, Edit2, Trash2, Sun, Wind, Flame, Zap } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AssetsView = () => {
  const { assets, addAsset, updateAsset, deleteAsset } = useEnergyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const [formData, setFormData] = useState({
    Asset_name: '',
    asset_type: 'Solar Panel',
    description: '',
    location: '',
    capacity: '500 kW',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormData({
      Asset_name: '',
      asset_type: 'Solar Panel',
      description: '',
      location: '',
      capacity: '500 kW',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ast) => {
    setEditingAsset(ast);
    setFormData({
      Asset_name: ast.Asset_name,
      asset_type: ast.asset_type,
      description: ast.description,
      location: ast.location,
      capacity: ast.capacity,
      status: ast.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAsset) {
      updateAsset(editingAsset.Asset_id, formData);
    } else {
      addAsset(formData);
    }
    setIsModalOpen(false);
  };

  const filteredAssets = assets.filter(a =>
    a.Asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssetIcon = (type) => {
    switch (type) {
      case 'Solar Panel':
        return <Sun size={16} color="#d97706" />;
      case 'Wind Turbine':
        return <Wind size={16} color="#0284c7" />;
      case 'Generator':
        return <Flame size={16} color="#e11d48" />;
      default:
        return <Zap size={16} color="#059669" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search assets by name, type, location..."
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
          <span>Add Asset</span>
        </button>
      </div>

      {/* Assets Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 18px' }}>Asset ID & Name</th>
                <th style={{ padding: '14px 18px' }}>Type</th>
                <th style={{ padding: '14px 18px' }}>Location</th>
                <th style={{ padding: '14px 18px' }}>Capacity</th>
                <th style={{ padding: '14px 18px' }}>Description</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((ast) => (
                  <tr
                    key={ast.Asset_id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '7px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--border-subtle)' }}>
                          {getAssetIcon(ast.asset_type)}
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)' }}>{ast.Asset_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ast.Asset_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {ast.asset_type}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                      {ast.location}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {ast.capacity}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '240px' }}>
                      {ast.description}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <Badge status={ast.status} />
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(ast)}
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
                          title="Edit Asset"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete asset "${ast.Asset_name}"?`)) {
                              deleteAsset(ast.Asset_id);
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
                          title="Delete Asset"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAsset ? `Edit Asset: ${editingAsset.Asset_id}` : 'Create Energy Asset'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Asset Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rooftop Solar Array 1"
              value={formData.Asset_name}
              onChange={(e) => setFormData({ ...formData, Asset_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Asset Type</label>
              <select
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                style={inputStyle}
              >
                <option value="Solar Panel">Solar Panel</option>
                <option value="Generator">Generator</option>
                <option value="Wind Turbine">Wind Turbine</option>
                <option value="Feeder">Feeder / Substation</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Capacity</label>
              <input
                type="text"
                required
                placeholder="e.g. 500 kW or 750 kVA"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Roof Zone A, Building 3"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Standby">Standby</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Description</label>
            <textarea
              rows="3"
              placeholder="Technical details, manufacturer, inverter specs..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
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
              {editingAsset ? 'Save Changes' : 'Create Asset'}
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
