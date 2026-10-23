import React, { useState } from 'react';
import { Plus, Search, Cpu, Edit2, Trash2, Activity, Play, RefreshCw, Terminal, XCircle } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const MetersView = () => {
  const { meters, channels, gateways, meterProfiles, standardParameters, addMeter, updateMeter, deleteMeter } = useEnergyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);

  // Gateway test state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingMeter, setTestingMeter] = useState(null);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [testSlaveId, setTestSlaveId] = useState(1);
  const [testStatus, setTestStatus] = useState('idle');
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [testSummary, setTestSummary] = useState(null);

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

  const handleOpenTestMeter = (mtr) => {
    setTestingMeter(mtr);
    const parentChannel = channels.find((c) => c.Channel_id === mtr.Channel_id);
    const gwId = parentChannel ? parentChannel.Gateway_id : (gateways?.[0]?.Gateway_id || '');
    setSelectedGatewayId(gwId);
    setSelectedChannelId(mtr.Channel_id || '');
    setTestSlaveId(mtr.slave_id || 1);

    setTestStatus('idle');
    setTestProgress(0);
    setTestLogs([]);
    setTestResults([]);
    setTestSummary(null);
    setIsTestModalOpen(true);
  };

  const handleGatewayChange = (gwId) => {
    setSelectedGatewayId(gwId);
    const available = channels?.filter((c) => c.Gateway_id === gwId) || [];
    setSelectedChannelId(available[0]?.Channel_id || '');
  };

  const runGatewayMeterTest = () => {
    if (!testingMeter) return;
    const currentGw = gateways?.find((g) => g.Gateway_id === selectedGatewayId) || gateways?.[0];
    const currentCh = channels?.find((c) => c.Channel_id === selectedChannelId) || channels?.[0];
    const matchedProfile = meterProfiles?.find((p) =>
      (p.model || '').toLowerCase() === (testingMeter.meter_model || '').toLowerCase()
    );

    setTestStatus('testing');
    setTestProgress(10);
    setTestResults([]);
    setTestSummary(null);

    const now = () => new Date().toLocaleTimeString();

    setTestLogs([
      { time: now(), text: `Initiating gateway handshake with [${currentGw?.Gateway_name || 'Gateway'}] at ${currentGw?.ip_address || '192.168.1.150'}...`, type: 'info' }
    ]);

    setTimeout(() => {
      setTestProgress(35);
      setTestLogs((prev) => [
        ...prev,
        { time: now(), text: `TCP socket established via Channel ${currentCh?.Channel_name || 'RS485 Loop'} (Port: ${currentCh?.port || 'COM1'}, Protocol: ${currentCh?.protocol || 'Modbus RTU'}, Baud: ${currentCh?.baud_rate || '9600'}).`, type: 'info' }
      ]);
    }, 500);

    setTimeout(() => {
      setTestProgress(65);
      const hexSlave = Number(testSlaveId || 1).toString(16).padStart(2, '0').toUpperCase();
      const fc = Number(matchedProfile?.function_code || 3);
      const fcHex = fc.toString(16).padStart(2, '0').toUpperCase();
      const regCount = matchedProfile?.parameters?.length || 8;
      setTestLogs((prev) => [
        ...prev,
        { time: now(), text: `TX Frame [0x${hexSlave} 0x${fcHex} Regs:${regCount} ByteOrder:${matchedProfile?.byte_order || 'CDAB'} CRC]: Polling registers from Slave #${testSlaveId}...`, type: 'info' }
      ]);
    }, 1100);

    setTimeout(() => {
      const isGatewayOffline = currentGw?.status === 'Offline';
      if (isGatewayOffline) {
        setTestStatus('failure');
        setTestProgress(100);
        setTestLogs((prev) => [
          ...prev,
          { time: now(), text: `RX Gateway Timeout: Gateway [${currentGw?.Gateway_name}] is Offline. Socket connection timed out after 1000ms.`, type: 'error' },
          { time: now(), text: `Recommendation: Check gateway power status, network ping to ${currentGw?.ip_address}, and firewall ports.`, type: 'warning' }
        ]);
        setTestSummary({
          success: false,
          latencyMs: 1000,
          packetsSent: 3,
          packetsReceived: 0,
          packetLoss: '100%',
          errorReason: `Gateway ${currentGw?.Gateway_name} is currently Offline`
        });
        return;
      }

      const simLatency = Math.floor(35 + Math.random() * 30);
      const params = (matchedProfile?.parameters && matchedProfile.parameters.length > 0)
        ? matchedProfile.parameters
        : (standardParameters && standardParameters.length > 0)
          ? standardParameters.slice(0, 8)
          : [
            { key: 'voltage_v1_n', display_name: 'Voltage Phase R-N', address: 40101, unit: 'V', datatype: 'float32' },
            { key: 'voltage_v2_n', display_name: 'Voltage Phase Y-N', address: 40103, unit: 'V', datatype: 'float32' },
            { key: 'voltage_v3_n', display_name: 'Voltage Phase B-N', address: 40105, unit: 'V', datatype: 'float32' },
            { key: 'current_i1', display_name: 'Current Phase R', address: 40107, unit: 'A', datatype: 'float32' },
            { key: 'current_i2', display_name: 'Current Phase Y', address: 40109, unit: 'A', datatype: 'float32' },
            { key: 'current_i3', display_name: 'Current Phase B', address: 40111, unit: 'A', datatype: 'float32' },
            { key: 'power_active_total', display_name: 'Total Active Power', address: 40113, unit: 'kW', datatype: 'float32' },
            { key: 'frequency', display_name: 'Frequency', address: 40115, unit: 'Hz', datatype: 'float32' },
          ];

      const decodedResults = params.map((param) => {
        let val = '0';
        const k = (param.key || '').toLowerCase();
        const u = (param.unit || '').toLowerCase();

        if (k.includes('volt') || u === 'v') {
          val = (239.5 + Math.random() * 2.0).toFixed(2);
        } else if (k.includes('current') || u === 'a') {
          val = (24.3 + Math.random() * 3.5).toFixed(2);
        } else if (k.includes('power_active') || u === 'w' || u === 'kw') {
          val = (412.50 + Math.random() * 45).toFixed(2);
        } else if (k.includes('freq') || u === 'hz') {
          val = (50.01 + Math.random() * 0.04).toFixed(2);
        } else {
          val = (100.0 + Math.random() * 25).toFixed(2);
        }

        const mult = Number(param.multiplier) || 1.0;
        const finalVal = mult !== 1.0 ? (parseFloat(val) * mult).toFixed(2) : val;

        return {
          key: param.key,
          display_name: param.display_name || param.key,
          address: param.address || 40101,
          datatype: param.datatype || 'float32',
          multiplier: mult,
          unit: param.unit || '',
          value: finalVal,
          status: 'Valid',
        };
      });

      setTestResults(decodedResults);
      setTestStatus('success');
      setTestProgress(100);

      const hexSlave = Number(testSlaveId || 1).toString(16).padStart(2, '0').toUpperCase();
      setTestLogs((prev) => [
        ...prev,
        { time: now(), text: `RX Frame [0x${hexSlave} 0x03 Bytes:${params.length * 4}]: Received valid telemetry packet in ${simLatency}ms (CRC Check: Valid).`, type: 'success' },
        { time: now(), text: `Meter verification complete! Successfully polled and decoded ${params.length} parameters via Gateway [${currentGw?.Gateway_name}].`, type: 'success' }
      ]);

      setTestSummary({
        success: true,
        latencyMs: simLatency,
        packetsSent: 1,
        packetsReceived: 1,
        packetLoss: '0%',
        registersRead: params.length,
      });
    }, 1800);
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
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search meters by name, model, serial..."
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
          <span>Add Energy Meter</span>
        </button>
      </div>

      {/* Meters Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
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
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-table-row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '7px', borderRadius: '8px', backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-muted)' }}>
                            <Cpu size={16} />
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)' }}>{mtr.Meter_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{mtr.Meter_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {parentChannel ? (
                          <div>
                            <span style={{ color: 'var(--text-primary)' }}>{parentChannel.Channel_name}</span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{parentChannel.protocol} • {parentChannel.port}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{mtr.Channel_id}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {mtr.meter_serial_number}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-card-secondary)',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                          fontFamily: 'var(--font-mono)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          ID #{mtr.slave_id}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {mtr.meter_model}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <Badge status={mtr.status} />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenTestMeter(mtr)}
                            style={{
                              background: 'rgba(0, 163, 42, 0.08)',
                              border: '1px solid rgba(0, 163, 42, 0.35)',
                              borderRadius: '6px',
                              color: 'var(--accent-emerald)',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                            }}
                            title="Test meter telemetry with gateway"
                          >
                            <Activity size={13} />
                            <span>Test</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(mtr)}
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
              {editingMeter ? 'Save Changes' : 'Create Meter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── METER GATEWAY COMMUNICATION TEST MODAL ── */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Test Meter Data via Gateway"
        maxWidth="900px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Meter Info Banner */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {testingMeter?.Meter_name} ({testingMeter?.meter_serial_number})
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '3px' }}>
                <span>Model: <strong>{testingMeter?.meter_model}</strong></span>
                <span>•</span>
                <span>Configured Slave ID: <strong>#{testingMeter?.slave_id}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.76rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(34, 113, 177, 0.1)',
                  color: 'var(--primary-cyan)',
                  border: '1px solid rgba(34, 113, 177, 0.25)',
                  fontWeight: 600,
                }}
              >
                Status: {testingMeter?.status}
              </span>
            </div>
          </div>

          {/* Gateway & Channel Test Configuration Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px 16px',
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Target Gateway *
              </label>
              <select
                value={selectedGatewayId}
                onChange={(e) => handleGatewayChange(e.target.value)}
                style={modalSelectStyle}
              >
                {gateways?.map((gw) => (
                  <option key={gw.Gateway_id} value={gw.Gateway_id}>
                    {gw.Gateway_name} ({gw.ip_address || 'TCP'}) [{gw.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Communication Channel *
              </label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                style={modalSelectStyle}
              >
                {channels
                  ?.filter((c) => c.Gateway_id === selectedGatewayId)
                  .map((ch) => (
                    <option key={ch.Channel_id} value={ch.Channel_id}>
                      {ch.Channel_name} ({ch.protocol}, Port: {ch.port})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ maxWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Slave Address *
              </label>
              <input
                type="number"
                min="1"
                max="247"
                value={testSlaveId}
                onChange={(e) => setTestSlaveId(Math.max(1, Number(e.target.value)))}
                style={modalInputStyle}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={runGatewayMeterTest}
                disabled={testStatus === 'testing'}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: testStatus === 'testing' ? 'var(--text-muted)' : 'var(--primary-cyan)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Polling Data...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Start Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Progress Bar */}
          {testStatus === 'testing' && (
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${testProgress}%`,
                  backgroundColor: 'var(--primary-cyan)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}

          {/* Diagnostic Console Box */}
          {testLogs.length > 0 && (
            <div
              style={{
                backgroundColor: '#1d2327',
                border: '1px solid #3c434a',
                borderRadius: '8px',
                padding: '12px 14px',
                maxHeight: '130px',
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#72aee6', marginBottom: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                <Terminal size={12} /> Modbus Handshake & Diagnostic Terminal
              </div>
              {testLogs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', color: log.type === 'error' ? '#f87171' : log.type === 'success' ? '#4ade80' : log.type === 'warning' ? '#fbbf24' : '#e2e8f0' }}>
                  <span style={{ color: '#94a3b8' }}>[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Decoded Telemetry Results Table */}
          {testResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Decoded Telemetry Registers ({testResults.length})
                </h4>
                {testSummary?.success && (
                  <span style={{ fontSize: '0.72rem', color: '#15803d', backgroundColor: 'rgba(0, 163, 42, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ✓ CRC Checked • Latency: {testSummary.latencyMs}ms
                  </span>
                )}
              </div>

              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', width: '36px' }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Register Key</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Display Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Modbus Addr</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Live Reading</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((res, i) => (
                      <tr key={res.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '7px 12px', color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', color: 'var(--primary-cyan)' }}>
                          {res.key}
                        </td>
                        <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>{res.display_name}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {res.address}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          {res.datatype}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {res.value} {res.unit}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#15803d', backgroundColor: 'rgba(0, 163, 42, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            ✓ Valid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failure Banner */}
          {testStatus === 'failure' && testSummary && (
            <div style={{ padding: '12px 14px', backgroundColor: 'rgba(214, 54, 56, 0.1)', border: '1px solid var(--accent-rose-border)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} />
              <span><strong>Communication Failure:</strong> {testSummary.errorReason}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setIsTestModalOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card-secondary)',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            {testStatus === 'success' && (
              <button
                type="button"
                onClick={runGatewayMeterTest}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: '1px solid var(--primary-cyan)',
                  backgroundColor: 'var(--primary-cyan)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={13} />
                <span>Re-poll Data</span>
              </button>
            )}
          </div>
        </div>
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

const modalSelectStyle = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const modalInputStyle = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box',
};
