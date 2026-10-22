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
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px 26px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              color: '#ffffff',
            }}
          >
            <Radio size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Communication Config
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>
              Set data acquisition polling intervals, communication frequency (seconds / minutes), and telemetry timeouts
            </p>
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
        {/* ── CARD 1: PRIMARY DATA ACQUISITION INTERVAL ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <Timer size={20} color="#0284c7" />
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Data Acquisition Time Interval
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0' }}>
                Determine how frequently the system requests telemetry registers from meters and gateways
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'center' }}>
            {/* Value + Unit Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>
                Sampling Frequency Interval *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max={intervalUnit === 'minutes' ? 1440 : 86400}
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(Math.max(1, Number(e.target.value)))}
                  style={{
                    ...inputStyle,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    fontFamily: 'monospace',
                    width: '140px',
                  }}
                  required
                />
                <select
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value)}
                  style={{
                    ...selectStyle,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    minWidth: '150px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <option value="seconds">Seconds (sec)</option>
                  <option value="minutes">Minutes (mins)</option>
                </select>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Effective runtime frequency: <strong>{calculatedSeconds} seconds</strong> per cycle
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
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                        color: isSelected ? '#0284c7' : '#334155',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.78rem',
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
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <Server size={20} color="#059669" />
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Modbus RTU/TCP & Gateway Timing
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0' }}>
                Tune response timeouts and retry attempts for serial RS485 loops and TCP ports
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Socket keep-alive heartbeat frequency
              </span>
            </div>
          </div>
        </div>



        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '10px 18px',
              borderRadius: '8px',
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
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
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
  color: '#334155',
  fontWeight: 700,
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
};
