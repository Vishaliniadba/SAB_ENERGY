import React, { useState } from 'react';
import {
  Timer,
  Clock,
  Radio,
  Server,
  Zap,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Shield,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { PageHeader } from '../../components/common/PageHeader';

export const CommunicationConfigView = () => {
  const { config, updateConfig } = useEnergyData();

  const initialUnit = config.polling_interval_unit || 'seconds';
  const initialValue =
    config.polling_interval_value !== undefined
      ? config.polling_interval_value
      : initialUnit === 'minutes'
      ? Math.max(1, Math.round((config.polling_interval_seconds || 5) / 60))
      : config.polling_interval_seconds || 5;

  const [intervalValue, setIntervalValue] = useState(initialValue);
  const [intervalUnit, setIntervalUnit] = useState(initialUnit); // 'seconds' | 'minutes'

  const [fastCycleSeconds, setFastCycleSeconds] = useState(config.fast_cycle_seconds || 2);
  const [backgroundLogMinutes, setBackgroundLogMinutes] = useState(config.background_log_minutes || 15);

  const [modbusTimeoutMs, setModbusTimeoutMs] = useState(config.modbus_timeout_ms || 1000);
  const [retryAttempts, setRetryAttempts] = useState(config.retry_attempts || 3);
  const [keepAliveSeconds, setKeepAliveSeconds] = useState(config.keep_alive_seconds || 30);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState(config.mqtt_broker_url || 'mqtt://broker.sabenergy.internal:1883');
  const [apiEndpoint, setApiEndpoint] = useState(config.api_endpoint || 'https://api.sabenergy.internal/v1');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const calculatedSeconds = intervalUnit === 'minutes' ? Number(intervalValue) * 60 : Number(intervalValue);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const val = Number(intervalValue);
    if (!val || val <= 0) {
      setErrorMsg('Please specify a positive time interval value.');
      return;
    }

    const sec = intervalUnit === 'minutes' ? val * 60 : val;

    updateConfig({
      ...config,
      polling_interval_value: val,
      polling_interval_unit: intervalUnit,
      polling_interval_seconds: sec,
      fast_cycle_seconds: Number(fastCycleSeconds),
      background_log_minutes: Number(backgroundLogMinutes),
      modbus_timeout_ms: Number(modbusTimeoutMs),
      retry_attempts: Number(retryAttempts),
      keep_alive_seconds: Number(keepAliveSeconds),
      mqtt_broker_url: mqttBrokerUrl.trim(),
      api_endpoint: apiEndpoint.trim(),
    });

    setSuccessMsg(`✓ Communication configuration updated! Active interval set to ${val} ${intervalUnit} (${sec}s).`);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset communication settings to recommended enterprise defaults?')) {
      setIntervalValue(5);
      setIntervalUnit('seconds');
      setFastCycleSeconds(2);
      setBackgroundLogMinutes(15);
      setModbusTimeoutMs(1000);
      setRetryAttempts(3);
      setKeepAliveSeconds(30);
      setMqttBrokerUrl('mqtt://broker.sabenergy.internal:1883');
      setApiEndpoint('https://api.sabenergy.internal/v1');

      updateConfig({
        ...config,
        polling_interval_value: 5,
        polling_interval_unit: 'seconds',
        polling_interval_seconds: 5,
        fast_cycle_seconds: 2,
        background_log_minutes: 15,
        modbus_timeout_ms: 1000,
        retry_attempts: 3,
        keep_alive_seconds: 30,
        mqtt_broker_url: 'mqtt://broker.sabenergy.internal:1883',
        api_endpoint: 'https://api.sabenergy.internal/v1',
      });
      setSuccessMsg('✓ Communication intervals restored to defaults.');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Communication Configuration"
        icon={Radio}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleResetDefaults} className="btn btn-secondary">
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save size={14} />
              <span>Save Configuration</span>
            </button>
          </div>
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

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger-text)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Polling Intervals */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Timer size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
              1. Polling Intervals
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label className="form-label">Polling Interval *</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="number"
                  className="form-input mono-num"
                  style={{ width: '130px', fontWeight: 700 }}
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  min="1"
                  max={intervalUnit === 'minutes' ? 1440 : 86400}
                  required
                />
                <select
                  className="form-select"
                  style={{ width: '140px', fontWeight: 600 }}
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value)}
                >
                  <option value="seconds">Seconds (s)</option>
                  <option value="minutes">Minutes (m)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Fast Cycle Telemetry</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="number"
                  className="form-input mono-num"
                  style={{ width: '120px' }}
                  value={fastCycleSeconds}
                  onChange={(e) => setFastCycleSeconds(e.target.value)}
                  min="1"
                  max="60"
                />
                <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Seconds</span>
              </div>
            </div>

            <div>
              <label className="form-label">Database Logging Interval</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="number"
                  className="form-input mono-num"
                  style={{ width: '120px' }}
                  value={backgroundLogMinutes}
                  onChange={(e) => setBackgroundLogMinutes(e.target.value)}
                  min="1"
                  max="1440"
                />
                <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Connection Timeouts & Retries */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
              2. Protocol Timeouts & Retries
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Modbus Response Timeout</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input mono-num"
                  value={modbusTimeoutMs}
                  onChange={(e) => setModbusTimeoutMs(e.target.value)}
                  min="100"
                  max="10000"
                  step="50"
                />
                <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', minWidth: '35px' }}>ms</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Retry Attempts</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input mono-num"
                  value={retryAttempts}
                  onChange={(e) => setRetryAttempts(e.target.value)}
                  min="0"
                  max="10"
                />
                <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', minWidth: '45px' }}>retries</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Keep-Alive Interval</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input mono-num"
                  value={keepAliveSeconds}
                  onChange={(e) => setKeepAliveSeconds(e.target.value)}
                  min="5"
                  max="600"
                />
                <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', minWidth: '35px' }}>sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Upstream Endpoints */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Server size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
              3. Upstream Endpoints
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">MQTT Telemetry Broker URI</label>
              <input
                className="form-input mono-num"
                value={mqttBrokerUrl}
                onChange={(e) => setMqttBrokerUrl(e.target.value)}
                placeholder="mqtt://broker.sabenergy.internal:1883"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">REST API Endpoint</label>
              <input
                className="form-input mono-num"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.sabenergy.internal/v1"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '8px',
          }}
        >
          <button type="button" onClick={handleResetDefaults} className="btn btn-secondary">
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={15} />
            <span>Apply Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
