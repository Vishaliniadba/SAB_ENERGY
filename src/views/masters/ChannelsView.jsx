import React, { useState } from 'react';
import { Plus, Search, Network, Edit2, Trash2 } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const ChannelsView = () => {
  const { channels, gateways, addChannel, updateChannel, deleteChannel } = useEnergyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);

  const [formData, setFormData] = useState({
    Gateway_id: gateways[0]?.Gateway_id || '',
    Channel_name: '',
    protocol: 'Modbus RTU',
    baud_rate: '9600',
    port: 'COM1',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setFormData({
      Gateway_id: gateways[0]?.Gateway_id || '',
      Channel_name: '',
      protocol: 'Modbus RTU',
      baud_rate: '9600',
      port: 'COM1',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ch) => {
    setEditingChannel(ch);
    setFormData({
      Gateway_id: ch.Gateway_id,
      Channel_name: ch.Channel_name,
      protocol: ch.protocol,
      baud_rate: ch.baud_rate,
      port: ch.port,
      status: ch.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingChannel) {
      updateChannel(editingChannel.Channel_id, formData);
    } else {
      addChannel(formData);
    }
    setIsModalOpen(false);
  };

  const filteredChannels = channels.filter(ch =>
    ch.Channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ch.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ch.port.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search channels by name, protocol, or port..."
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
          <span>Add Channel</span>
        </button>
      </div>

      {/* Channels Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '14px 18px' }}>Channel ID & Name</th>
                <th style={{ padding: '14px 18px' }}>Parent Gateway</th>
                <th style={{ padding: '14px 18px' }}>Protocol</th>
                <th style={{ padding: '14px 18px' }}>Baud Rate</th>
                <th style={{ padding: '14px 18px' }}>Port</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No channels found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredChannels.map((ch) => {
                  const parentGateway = gateways.find(g => g.Gateway_id === ch.Gateway_id);
                  return (
                    <tr
                      key={ch.Channel_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '7px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                            <Network size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{ch.Channel_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ch.Channel_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {parentGateway ? (
                          <div>
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>{parentGateway.Gateway_name}</span>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{parentGateway.Gateway_id}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>{ch.Gateway_id}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                          border: '1px solid #e2e8f0'
                        }}>
                          {ch.protocol}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#d97706', fontWeight: 600, fontFamily: 'monospace' }}>
                        {ch.baud_rate} bps
                      </td>
                      <td style={{ padding: '14px 18px', color: '#334155', fontFamily: 'monospace' }}>
                        {ch.port}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <Badge status={ch.status} />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEdit(ch)}
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
                            title="Edit Channel"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete channel "${ch.Channel_name}"?`)) {
                                deleteChannel(ch.Channel_id);
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
                            title="Delete Channel"
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

      {/* Add / Edit Channel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChannel ? `Edit Channel: ${editingChannel.Channel_id}` : 'Create Communication Channel'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Channel Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Main Incomer RS485 Loop"
              value={formData.Channel_name}
              onChange={(e) => setFormData({ ...formData, Channel_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Parent Gateway</label>
            <select
              value={formData.Gateway_id}
              onChange={(e) => setFormData({ ...formData, Gateway_id: e.target.value })}
              style={inputStyle}
            >
              {gateways.map(gw => (
                <option key={gw.Gateway_id} value={gw.Gateway_id}>
                  {gw.Gateway_name} ({gw.Gateway_id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Protocol</label>
              <select
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                style={inputStyle}
              >
                <option value="Modbus RTU">Modbus RTU</option>
                <option value="TCP">TCP / Modbus TCP</option>
                <option value="MQTT">MQTT</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Baud Rate</label>
              <select
                value={formData.baud_rate}
                onChange={(e) => setFormData({ ...formData, baud_rate: e.target.value })}
                style={inputStyle}
              >
                <option value="9600">9600 bps</option>
                <option value="19200">19200 bps</option>
                <option value="38400">38400 bps</option>
                <option value="57600">57600 bps</option>
                <option value="115200">115200 bps</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>Port / Device Path</label>
              <input
                type="text"
                required
                placeholder="e.g. COM1 or 502"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
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
              {editingChannel ? 'Save Changes' : 'Create Channel'}
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
