import React, { useState } from 'react';
import { Save, RotateCcw, CheckCircle2, Server, Shield, Database } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const ConfigView = () => {
  const { config, updateConfig, resetToFactoryDefaults } = useEnergyData();
  const [formData, setFormData] = useState({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all system settings and reload default seed tables?')) {
      resetToFactoryDefaults();
      setFormData(config);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            System & Protocol Configuration
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
            Configure SCADA polling frequencies, Modbus timing, MQTT Edge connection, and .NET ASP API endpoints.
          </p>
        </div>

        {saveSuccess && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={16} />
            Settings saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Telemetry & SCADA Polling */}
        <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Server size={18} color="#0284c7" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Telemetry & Polling Parameters
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Polling Frequency (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.polling_interval_seconds}
                onChange={(e) => setFormData({ ...formData, polling_interval_seconds: Number(e.target.value) })}
                style={inputStyle}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Interval between serial and TCP requests to meters
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Modbus Response Timeout (ms)
              </label>
              <input
                type="number"
                min="100"
                step="50"
                value={formData.modbus_timeout_ms}
                onChange={(e) => setFormData({ ...formData, modbus_timeout_ms: Number(e.target.value) })}
                style={inputStyle}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Timeout before marking slave meter unresponsive
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Communication & Edge Broker */}
        <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Shield size={18} color="#059669" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Edge MQTT & Communication Broker
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                MQTT Broker URL
              </label>
              <input
                type="text"
                value={formData.mqtt_broker_url}
                onChange={(e) => setFormData({ ...formData, mqtt_broker_url: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Client ID
              </label>
              <input
                type="text"
                value={formData.mqtt_client_id}
                onChange={(e) => setFormData({ ...formData, mqtt_client_id: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="auto_reconnect_checkbox"
              checked={formData.auto_reconnect}
              onChange={(e) => setFormData({ ...formData, auto_reconnect: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <label htmlFor="auto_reconnect_checkbox" style={{ fontSize: '0.82rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
              Auto-reconnect gateway sockets on transmission drops
            </label>
          </div>
        </div>

        {/* Section 3: ASP.NET Core MVC Backend & Database Options */}
        <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Database size={18} color="#d97706" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              .NET ASP Backend & Database Integration
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Backend Framework & DB Type
              </label>
              <input
                type="text"
                value={formData.database_type}
                onChange={(e) => setFormData({ ...formData, database_type: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                REST / SignalR API Base Endpoint
              </label>
              <input
                type="text"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Alert Notification Email
              </label>
              <input
                type="email"
                value={formData.alert_email}
                onChange={(e) => setFormData({ ...formData, alert_email: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 500, marginBottom: '6px' }}>
                Data History Retention (Days)
              </label>
              <input
                type="number"
                value={formData.data_retention_days}
                onChange={(e) => setFormData({ ...formData, data_retention_days: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #fecdd3',
              backgroundColor: '#fff1f2',
              color: '#e11d48',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>Reset to Factory Defaults</span>
          </button>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
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
