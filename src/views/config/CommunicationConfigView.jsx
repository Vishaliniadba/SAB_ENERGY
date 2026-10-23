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
  ArrowRight
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const CommunicationConfigView = () => {
  const { config, updateConfig } = useEnergyData();

  // Primary communication polling interval settings
  // Allows user to pick either seconds or minutes unit
  const initialUnit = (config.polling_interval_unit || 'seconds');
  const initialValue = config.polling_interval_value !== undefined
    ? config.polling_interval_value
    : (initialUnit === 'minutes'
        ? Math.max(1, Math.round((config.polling_interval_seconds || 5) / 60))
        : (config.polling_interval_seconds || 5));

  const [intervalValue, setIntervalValue] = useState(initialValue);
  const [intervalUnit, setIntervalUnit] = useState(initialUnit); // 'seconds' | 'minutes'

  // Fast cycle & background logging interval
  const [fastCycleSeconds, setFastCycleSeconds] = useState(config.fast_cycle_seconds || 2);
  const [backgroundLogMinutes, setBackgroundLogMinutes] = useState(config.background_log_minutes || 15);

  // Modbus and network communication parameters
  const [modbusTimeoutMs, setModbusTimeoutMs] = useState(config.modbus_timeout_ms || 1000);
  const [retryAttempts, setRetryAttempts] = useState(config.retry_attempts || 3);
  const [keepAliveSeconds, setKeepAliveSeconds] = useState(config.keep_alive_seconds || 30);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState(config.mqtt_broker_url || 'mqtt://broker.sabenergy.internal:1883');
  const [apiEndpoint, setApiEndpoint] = useState(config.api_endpoint || 'https://api.sabenergy.internal/v1');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate total seconds for polling
  const calculatedSeconds = intervalUnit === 'minutes' ? Number(intervalValue) * 60 : Number(intervalValue);

  const handleSave = (e) => {
    e.preventDefault();
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
    if (window.confirm('Reset communication interval to recommended defaults (5 seconds)?')) {
      setIntervalValue(5);
      setIntervalUnit('seconds');
      setFastCycleSeconds(2);
      setBackgroundLogMinutes(15);
      setModbusTimeoutMs(1000);
      setRetryAttempts(3);
      setKeepAliveSeconds(30);
      updateConfig({
        ...config,
        polling_interval_value: 5,
        polling_interval_unit: 'seconds',
        polling_interval_seconds: 5,
      });
      setSuccessMsg('✓ Communication intervals restored to defaults.');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: '22px 26px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--primary-cyan-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              color: '#ffffff',
            }}
          >
            <Radio size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Communication Config
            </h2>
          </div>
        </div>

        {/* Live Active Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '7px 16px',
            borderRadius: '24px',
            fontSize: '0.82rem',
            color: '#059669',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              boxShadow: '0 0 8px #059669',
            }}
          />
          <span>Live Polling: {intervalValue} {intervalUnit}</span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#059669',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ── TWO CARD ROW: Card 1 + Card 2 side by side ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            padding: '22px 24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <Timer size={20} color="var(--primary-cyan)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Data Acquisition Time Interval
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'space-between' }}>
            {/* Value + Unit Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>
                Sampling Frequency Interval *
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max={intervalUnit === 'minutes' ? 1440 : 86400}
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(Math.max(1, Number(e.target.value)))}
                  style={{
                    ...inputStyle,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--primary-cyan)',
                    fontFamily: 'monospace',
                    width: '130px',
                  }}
                  required
                />
                <select
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value)}
                  style={{
                    ...selectStyle,
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    width: '180px',
                  }}
                >
                  <option value="seconds">Seconds (sec)</option>
                  <option value="minutes">Minutes (mins)</option>
                </select>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Effective runtime frequency: <strong style={{ color: 'var(--text-primary)' }}>{calculatedSeconds} seconds</strong> per cycle
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label style={labelStyle}>Quick Interval Presets</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: '1 sec', val: 1, unit: 'seconds' },
                  { label: '5 sec', val: 5, unit: 'seconds' },
                  { label: '10 sec', val: 10, unit: 'seconds' },
                  { label: '30 sec', val: 30, unit: 'seconds' },
                  { label: '1 min', val: 1, unit: 'minutes' },
                  { label: '5 mins', val: 5, unit: 'minutes' },
                  { label: '15 mins', val: 15, unit: 'minutes' },
                ].map((p) => {
                  const isSelected = intervalValue === p.val && intervalUnit === p.unit;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setIntervalValue(p.val);
                        setIntervalUnit(p.unit);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: isSelected ? '1px solid var(--primary-cyan)' : '1px solid var(--border-medium)',
                        backgroundColor: isSelected ? 'var(--primary-cyan)' : 'var(--bg-card)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: PROTOCOL TIMEOUTS & COMMUNICATION BUFFER ── */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            padding: '22px 24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <Server size={20} color="var(--accent-emerald)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Modbus RTU/TCP & Gateway Timing
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', flex: 1, alignContent: 'start' }}>
            <div>
              <label style={labelStyle}>Modbus Response Timeout (ms)</label>
              <input
                type="number"
                min="100"
                step="50"
                value={modbusTimeoutMs}
                onChange={(e) => setModbusTimeoutMs(Number(e.target.value))}
                style={inputStyle}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Maximum wait time before framing error
              </span>
            </div>

            <div>
              <label style={labelStyle}>Retry Attempts on Error</label>
              <select
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(Number(e.target.value))}
                style={selectStyle}
              >
                <option value={1}>1 Retry</option>
                <option value={2}>2 Retries</option>
                <option value={3}>3 Retries (Standard)</option>
                <option value={5}>5 Retries</option>
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Number of retry packets before marking slave offline
              </span>
            </div>

            <div>
              <label style={labelStyle}>Keep-Alive Ping (Seconds)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={keepAliveSeconds}
                onChange={(e) => setKeepAliveSeconds(Number(e.target.value))}
                style={inputStyle}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Socket keep-alive heartbeat frequency
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f6f7f7',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              padding: '9px 18px',
              borderRadius: '4px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--primary-cyan)',
              color: '#ffffff',
              border: '1px solid var(--primary-cyan)',
              padding: '9px 22px',
              borderRadius: '4px',
              fontSize: '0.84rem',
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

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-subtle)',
  fontSize: '0.85rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: 'var(--bg-input)',
};

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-subtle)',
  fontSize: '0.85rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: 'var(--bg-input)',
  cursor: 'pointer',
};
