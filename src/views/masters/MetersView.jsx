import React, { useState } from 'react';
import { Plus, Search, Cpu, Edit2, Trash2 } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const MetersView = () => {
  const { meters, channels, addMeter, updateMeter, deleteMeter } = useEnergyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);

  const [formData, setFormData] = useState({
    Channel_id: channels[0]?.Channel_id || '',
    Meter_name: '',
    meter_serial_number: '',
    slave_id: '1',
    meter_model: 'Schneider EM6400NG',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingMeter(null);
    setFormData({
      Channel_id: channels[0]?.Channel_id || '',
      Meter_name: '',
      meter_serial_number: `SCH-MTR-${Math.floor(1000 + Math.random() * 9000)}`,
      slave_id: `${meters.length + 1}`,
      meter_model: 'Schneider EM6400NG',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mtr) => {
    setEditingMeter(mtr);
    setFormData({
      Channel_id: mtr.Channel_id,
      Meter_name: mtr.Meter_name,
      meter_serial_number: mtr.meter_serial_number,
      slave_id: mtr.slave_id,
      meter_model: mtr.meter_model,
      status: mtr.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMeter) {
      updateMeter(editingMeter.Meter_id, formData);
    } else {
      addMeter(formData);
    }
    setIsModalOpen(false);
  };

  const filteredMeters = meters.filter(m =>
    m.Meter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.meter_serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.meter_model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search meters by name, model, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#0f172a',
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
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>Add Energy Meter</span>
        </button>
      </div>

      {/* Meters Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '14px 18px' }}>Meter ID & Name</th>
                <th style={{ padding: '14px 18px' }}>Channel</th>
                <th style={{ padding: '14px 18px' }}>Serial Number</th>
                <th style={{ padding: '14px 18px' }}>Slave ID / Address</th>
                <th style={{ padding: '14px 18px' }}>Model</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeters.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No meters found.
                  </td>
                </tr>
              ) : (
                filteredMeters.map((mtr) => {
                  const parentChannel = channels.find(c => c.Channel_id === mtr.Channel_id);
                  return (
                    <tr
                      key={mtr.Meter_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '7px', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                            <Cpu size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{mtr.Meter_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{mtr.Meter_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {parentChannel ? (
                          <div>
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>{parentChannel.Channel_name}</span>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{parentChannel.protocol} • {parentChannel.port}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>{mtr.Channel_id}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#334155' }}>
                        {mtr.meter_serial_number}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f0f9ff',
                          color: '#0284c7',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          border: '1px solid #bae6fd'
                        }}>
                          ID #{mtr.slave_id}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>
                        {mtr.meter_model}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <Badge status={mtr.status} />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEdit(mtr)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#475569',
                              padding: '6px 8px',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#0284c7';
                              e.currentTarget.style.borderColor = '#0284c7';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#475569';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            title="Edit Meter"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete meter "${mtr.Meter_name}"?`)) {
                                deleteMeter(mtr.Meter_id);
                              }
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#475569',
                              padding: '6px 8px',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#e11d48';
                              e.currentTarget.style.borderColor = '#e11d48';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#475569';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            title="Delete Meter"
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

      {/* Add / Edit Meter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeter ? `Edit Meter: ${editingMeter.Meter_id}` : 'Register Energy Meter'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Meter Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Incomer Multi-Function Meter"
              value={formData.Meter_name}
              onChange={(e) => setFormData({ ...formData, Meter_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Parent Communication Channel</label>
            <select
              value={formData.Channel_id}
              onChange={(e) => setFormData({ ...formData, Channel_id: e.target.value })}
              style={inputStyle}
            >
              {channels.map(ch => (
                <option key={ch.Channel_id} value={ch.Channel_id}>
                  {ch.Channel_name} ({ch.protocol} - {ch.port})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Serial Number</label>
              <input
                type="text"
                required
                value={formData.meter_serial_number}
                onChange={(e) => setFormData({ ...formData, meter_serial_number: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Slave ID / Device Address</label>
              <input
                type="text"
                required
                placeholder="1 to 247"
                value={formData.slave_id}
                onChange={(e) => setFormData({ ...formData, slave_id: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Meter Model</label>
              <input
                type="text"
                required
                placeholder="e.g. Schneider EM6400, Selec MFM384"
                value={formData.meter_model}
                onChange={(e) => setFormData({ ...formData, meter_model: e.target.value })}
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
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
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
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {editingMeter ? 'Save Changes' : 'Create Meter'}
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
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  color: '#0f172a',
  fontSize: '0.85rem',
  outline: 'none'
};
