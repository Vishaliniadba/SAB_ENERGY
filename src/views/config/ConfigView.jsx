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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '20px 24px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            System & Protocol Configuration
          </h3>
        </div>

        {saveSuccess && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 163, 42, 0.1)',
              border: '1px solid var(--accent-emerald-border)',
              color: 'var(--accent-emerald)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} />
            Settings saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Section 1: Telemetry & SCADA Polling */}
        <div style={{ padding: '22px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', boxShadow: 'var(--shadow-card)' }}>
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
            </div>
          </div>
        </div>

        {/* Section 2: Communication & Edge Broker */}
        <div style={{ padding: '22px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Shield size={18} color="#059669" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Edge MQTT & Communication Broker
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
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
              style={{ width: '16px', height: '16px', accentColor: '#2271b1', cursor: 'pointer' }}
            />
            <label htmlFor="auto_reconnect_checkbox" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
              Auto-reconnect gateway sockets on transmission drops
            </label>
          </div>
        </div>
        </div>

        {/* Section 3: ASP.NET Core MVC Backend & Database Options */}
        <div style={{ padding: '22px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Database size={18} color="#d97706" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
              borderRadius: '4px',
              border: '1px solid var(--primary-cyan)',
              backgroundColor: 'var(--primary-cyan)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
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
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
};
