import React, { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  Radio,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Cpu
} from 'lucide-react';
import { useEnergyData } from '../../../context/EnergyDataContext';
import { Select2 } from '../../../components/common/Select2';
import { commConfigApi } from '../api/commConfigApi';
import { enerlinkApi, DEFAULT_DEVICE_ID } from '../api/enerlinkApi';
import '../styles/commConfiguration.css';

export const CommConfigurationPage = () => {
  const { config, updateConfig, gateways } = useEnergyData();

  // ── 0. Device ID State ──
  const initialDeviceId =
    (config as any)?.device_id ||
    (config as any)?.deviceId ||
    DEFAULT_DEVICE_ID;

  const [deviceId, setDeviceId] = useState<string>(initialDeviceId);
  const [isSendingDeviceId, setIsSendingDeviceId] = useState(false);

  // ── 1. MQTT Publish State ──
  const initialMqttUnit = (config as any)?.mqtt_publish_unit || 'minutes';
  const initialMqttValue =
    (config as any)?.mqtt_publish_value !== undefined
      ? (config as any).mqtt_publish_value
      : (config as any)?.mqtt_publish_seconds !== undefined
      ? initialMqttUnit === 'minutes'
        ? Math.max(1, Math.round(((config as any).mqtt_publish_seconds || 300) / 60))
        : (config as any).mqtt_publish_seconds
      : 5;

  const [mqttPublishValue, setMqttPublishValue] = useState<number | string>(initialMqttValue);
  const [mqttPublishUnit, setMqttPublishUnit] = useState<'seconds' | 'minutes'>(initialMqttUnit);

  // ── 2. Device Polling Time State (Min: 30 seconds) ──
  const initialPollUnit = config.polling_interval_unit || 'seconds';
  const rawPollVal = config.polling_interval_value ?? (config.polling_interval_seconds ? (initialPollUnit === 'minutes' ? Math.round(config.polling_interval_seconds / 60) : config.polling_interval_seconds) : 30);
  const initialPollValue = Math.max(initialPollUnit === 'seconds' ? 30 : 1, Number(rawPollVal) || 30);

  const [pollingValue, setPollingValue] = useState<number | string>(initialPollValue);
  const [pollingUnit, setPollingUnit] = useState<'seconds' | 'minutes'>(initialPollUnit);

  // ── Loading & Feedback States ──
  const [isSendingMqtt, setIsSendingMqtt] = useState(false);
  const [isSendingPolling, setIsSendingPolling] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Helper to apply server config values ──
  const applyConfigValues = useCallback((cfg: any) => {
    if (!cfg || typeof cfg !== 'object') return;

    // Device ID extraction
    if (cfg.device_id || cfg.deviceId) {
      setDeviceId(String(cfg.device_id || cfg.deviceId).toUpperCase());
    }

    // Device Polling Interval extraction
    let pollSec: number | null = null;
    if (cfg.polling_interval_seconds !== undefined && cfg.polling_interval_seconds !== null) {
      pollSec = Number(cfg.polling_interval_seconds);
    } else if (cfg.polling_time !== undefined && cfg.polling_time !== null) {
      pollSec = Number(cfg.polling_time);
    } else if (cfg.pollingTime !== undefined && cfg.pollingTime !== null) {
      pollSec = Number(cfg.pollingTime);
    } else if (cfg.polling_interval !== undefined && cfg.polling_interval !== null) {
      pollSec = Number(cfg.polling_interval);
    } else if (cfg.pollingInterval !== undefined && cfg.pollingInterval !== null) {
      pollSec = Number(cfg.pollingInterval);
    } else if (cfg.polling_seconds !== undefined && cfg.polling_seconds !== null) {
      pollSec = Number(cfg.polling_seconds);
    }

    // MQTT Publish Interval extraction
    let mqttSec: number | null = null;
    if (cfg.mqtt_publish_seconds !== undefined && cfg.mqtt_publish_seconds !== null) {
      mqttSec = Number(cfg.mqtt_publish_seconds);
    } else if (cfg.MQTT_publish !== undefined && cfg.MQTT_publish !== null) {
      mqttSec = Number(cfg.MQTT_publish);
    } else if (cfg.mqtt_publish !== undefined && cfg.mqtt_publish !== null) {
      mqttSec = Number(cfg.mqtt_publish);
    } else if (cfg.mqttPublish !== undefined && cfg.mqttPublish !== null) {
      mqttSec = Number(cfg.mqttPublish);
    } else if (cfg.publish_interval !== undefined && cfg.publish_interval !== null) {
      mqttSec = Number(cfg.publish_interval);
    } else if (cfg.publishInterval !== undefined && cfg.publishInterval !== null) {
      mqttSec = Number(cfg.publishInterval);
    } else if (cfg.publish_seconds !== undefined && cfg.publish_seconds !== null) {
      mqttSec = Number(cfg.publish_seconds);
    }

    // Determine units and values
    const nextPollUnit: 'seconds' | 'minutes' =
      cfg.polling_interval_unit === 'minutes' || (pollSec !== null && pollSec >= 60 && pollSec % 60 === 0 && !cfg.polling_interval_unit)
        ? 'minutes'
        : 'seconds';

    const rawNextPollVal = cfg.polling_interval_value ?? (pollSec !== null ? (nextPollUnit === 'minutes' ? Math.round(pollSec / 60) : pollSec) : null);
    const nextPollVal = rawNextPollVal !== null ? Math.max(nextPollUnit === 'seconds' ? 30 : 1, Number(rawNextPollVal)) : 30;

    const nextMqttUnit: 'seconds' | 'minutes' =
      cfg.mqtt_publish_unit === 'seconds'
        ? 'seconds'
        : 'minutes';

    const rawNextMqttVal = cfg.mqtt_publish_value ?? (mqttSec !== null ? (nextMqttUnit === 'minutes' ? Math.round(mqttSec / 60) : mqttSec) : null);
    const nextMqttVal = rawNextMqttVal !== null ? Math.max(1, Number(rawNextMqttVal)) : 5;

    setPollingUnit(nextPollUnit);
    setPollingValue(nextPollVal);
    setMqttPublishUnit(nextMqttUnit);
    setMqttPublishValue(nextMqttVal);

    updateConfig({
      ...config,
      ...cfg,
      device_id: cfg.device_id || cfg.deviceId || deviceId,
      deviceId: cfg.device_id || cfg.deviceId || deviceId,
      polling_interval_value: nextPollVal,
      polling_interval_unit: nextPollUnit,
      polling_interval_seconds: pollSec ?? (nextPollUnit === 'minutes' ? nextPollVal * 60 : nextPollVal),
      mqtt_publish_value: nextMqttVal,
      mqtt_publish_unit: nextMqttUnit,
      mqtt_publish_seconds: mqttSec ?? (nextMqttUnit === 'minutes' ? nextMqttVal * 60 : nextMqttVal),
    });
  }, [config, updateConfig, deviceId]);

  // ── Fetch configuration on mount from http://localhost:5114/api/Enerlink/configuration ──
  useEffect(() => {
    let isMounted = true;
    const fetchCurrentConfig = async () => {
      try {
        const cleanId = (deviceId || '').trim().toUpperCase() || DEFAULT_DEVICE_ID;
        const res = await commConfigApi.getConfig(cleanId);
        const data = res?.data || res?.configuration || res?.config || res;
        if (data && isMounted) {
          applyConfigValues(data);
        }
      } catch (err) {
        console.warn('Could not fetch configuration on mount:', err);
      }
    };
    fetchCurrentConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Calculated Seconds ──
  const mqttPublishSeconds = mqttPublishUnit === 'minutes' ? Number(mqttPublishValue) * 60 : Number(mqttPublishValue);
  const pollingSeconds = pollingUnit === 'minutes' ? Number(pollingValue) * 60 : Number(pollingValue);

  // ── Validation Helpers ──
  const isDeviceIdValid = Boolean(deviceId && deviceId.trim().length >= 3);
  // Rule 1: Polling interval must be at least 30 seconds
  const isPollingValid = pollingSeconds >= 30;
  // Rule 2: MQTT Publish interval must be equal to or higher than Device Polling interval
  const isMqttPublishValid = Number(mqttPublishValue) > 0 && mqttPublishSeconds >= pollingSeconds;
  // Combined Validity for overall configuration submission
  const isConfigValid = isDeviceIdValid && isPollingValid && isMqttPublishValid;

  // Minimum allowed value for MQTT Publish input based on Device Polling interval
  const minMqttPublishValue = mqttPublishUnit === 'minutes'
    ? Math.max(1, Math.ceil(pollingSeconds / 60))
    : Math.max(1, pollingSeconds);

  // ── Handlers ──

  // 0. Send Device ID Config Separately
  const handleSendDeviceIdConfig = async () => {
    setErrorMsg('');
    const cleanId = (deviceId || '').trim().toUpperCase();
    if (!cleanId || cleanId.length < 3) {
      setErrorMsg('Please specify a valid Device ID (minimum 3 characters).');
      return;
    }

    setIsSendingDeviceId(true);

    try {
      const payload = {
        device_id: cleanId,
        polling_time: Number(pollingValue),
        polling_time_unit: pollingUnit,
        mqtt_publish: Number(mqttPublishValue),
        mqtt_publish_unit: mqttPublishUnit,
      };

      const res = await enerlinkApi.saveConfiguration(payload);

      updateConfig({
        ...config,
        ...payload,
        device_id: cleanId,
        deviceId: cleanId,
      });

      setSuccessMsg(res?.message || `✓ Device ID (${cleanId}) saved to Enerlink.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Failed to send Device ID configuration: ${err?.message || 'Server error'}`);
    } finally {
      setIsSendingDeviceId(false);
    }
  };

  // 1. Send MQTT Publish Config Separately
  const handleSendMqttConfig = async () => {
    setErrorMsg('');
    const cleanId = (deviceId || '').trim().toUpperCase() || DEFAULT_DEVICE_ID;
    const val = Number(mqttPublishValue);
    if (!val || val <= 0) {
      setErrorMsg('MQTT Publish interval must be greater than 0.');
      return;
    }

    const sec = mqttPublishUnit === 'minutes' ? val * 60 : val;
    if (sec < pollingSeconds) {
      setErrorMsg(`MQTT Publish interval (${sec}s) must be equal to or higher than Device Polling interval (${pollingSeconds}s).`);
      return;
    }

    setIsSendingMqtt(true);

    try {
      const payload = {
        device_id: cleanId,
        mqtt_publish: val,
        mqtt_publish_unit: mqttPublishUnit,
      };

      const res = await enerlinkApi.saveConfiguration(payload);

      updateConfig({
        ...config,
        mqtt_publish_value: val,
        mqtt_publish_unit: mqttPublishUnit,
        mqtt_publish_seconds: sec,
      });

      setSuccessMsg(res?.message || `✓ MQTT Publish configuration saved to Enerlink (${val} ${mqttPublishUnit}).`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Failed to send MQTT configuration: ${err?.message || 'Server error'}`);
    } finally {
      setIsSendingMqtt(false);
    }
  };

  // 2. Send Device Polling Time Config Separately
  const handleSendPollingConfig = async () => {
    setErrorMsg('');
    const cleanId = (deviceId || '').trim().toUpperCase() || DEFAULT_DEVICE_ID;
    const val = Number(pollingValue);
    if (!val || val <= 0) {
      setErrorMsg('Device polling interval must be greater than 0.');
      return;
    }

    const sec = pollingUnit === 'minutes' ? val * 60 : val;
    if (sec < 30) {
      setErrorMsg('Polling interval must be at least 30 seconds.');
      return;
    }

    if (sec > mqttPublishSeconds) {
      setErrorMsg(`Device Polling interval (${sec}s) cannot exceed MQTT Publish interval (${mqttPublishSeconds}s). Please increase MQTT Publish interval first.`);
      return;
    }

    setIsSendingPolling(true);

    try {
      const payload = {
        device_id: cleanId,
        polling_time: val,
        polling_time_unit: pollingUnit,
      };

      const res = await enerlinkApi.saveConfiguration(payload);

      updateConfig({
        ...config,
        polling_interval_value: val,
        polling_interval_unit: pollingUnit,
        polling_interval_seconds: sec,
      });

      setSuccessMsg(res?.message || `✓ Device Polling configuration saved to Enerlink (${val} ${pollingUnit}).`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Failed to send device polling configuration: ${err?.message || 'Server error'}`);
    } finally {
      setIsSendingPolling(false);
    }
  };

  // 3. Send Both Configurations (Unified Send Button)
  const handleSendAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanId = (deviceId || '').trim().toUpperCase();
    if (!cleanId || cleanId.length < 3) {
      setErrorMsg('Please specify a valid Device ID.');
      return;
    }

    const mqttVal = Number(mqttPublishValue);
    const pollVal = Number(pollingValue);

    if (!mqttVal || mqttVal <= 0) {
      setErrorMsg('Please specify a valid MQTT Publish interval.');
      return;
    }

    if (!pollVal || pollVal <= 0) {
      setErrorMsg('Please specify a valid Device Polling interval.');
      return;
    }

    const mqttSec = mqttPublishUnit === 'minutes' ? mqttVal * 60 : mqttVal;
    const pollSec = pollingUnit === 'minutes' ? pollVal * 60 : pollVal;

    if (pollSec < 30) {
      setErrorMsg('Polling interval must be at least 30 seconds.');
      return;
    }

    if (mqttSec < pollSec) {
      setErrorMsg(`MQTT Publish interval (${mqttSec}s) must be equal to or higher than Device Polling interval (${pollSec}s).`);
      return;
    }

    setIsSendingAll(true);

    try {
      const unifiedPayload = {
        device_id: cleanId,
        polling_time: pollVal,
        polling_time_unit: pollingUnit,
        mqtt_publish: mqttVal,
        mqtt_publish_unit: mqttPublishUnit,
      };

      const res = await enerlinkApi.saveConfiguration(unifiedPayload);

      updateConfig({
        ...config,
        device_id: cleanId,
        deviceId: cleanId,
        polling_interval_value: pollVal,
        polling_interval_unit: pollingUnit,
        polling_interval_seconds: pollSec,
        mqtt_publish_value: mqttVal,
        mqtt_publish_unit: mqttPublishUnit,
        mqtt_publish_seconds: mqttSec,
      });

      setSuccessMsg(res?.message || `✓ Enerlink configuration updated successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Failed to send configurations: ${err?.message || 'Server error'}`);
    } finally {
      setIsSendingAll(false);
    }
  };

  // 4. Refresh Configuration from backend / saved settings
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMsg('');
    try {
      const cleanId = (deviceId || '').trim().toUpperCase() || DEFAULT_DEVICE_ID;
      const res = await commConfigApi.getConfig(cleanId);
      const freshConfig = res?.data || res?.configuration || res?.config || res;
      if (freshConfig) {
        applyConfigValues(freshConfig);
        setSuccessMsg('✓ Configuration refreshed from Enerlink server.');
      } else {
        setSuccessMsg('✓ Configuration refreshed.');
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(`Failed to refresh configuration: ${err?.message || 'Server error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Top Action Bar (Single primary heading is in Layout Header) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title="Refresh Configuration"
        >
          <RotateCcw size={14} className={isRefreshing ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
        <button
          type="button"
          onClick={() => handleSendAll()}
          disabled={isSendingAll || !isConfigValid}
          className="btn btn-primary"
          style={{
            gap: '6px',
            opacity: !isConfigValid ? 0.6 : 1,
            cursor: !isConfigValid ? 'not-allowed' : 'pointer',
          }}
        >
          {isSendingAll ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
          <span>{isSendingAll ? 'Sending...' : 'Send Configuration'}</span>
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--status-success-bg, #ecfdf5)',
            border: '1px solid var(--status-success-border, #a7f3d0)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--status-success-text, #065f46)',
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
            backgroundColor: 'var(--status-danger-bg, #fef2f2)',
            border: '1px solid var(--status-danger-border, #fecaca)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--status-danger-text, #991b1b)',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ── CARD 1: Device ID (1st Field) ── */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Cpu size={18} color="var(--brand-primary, #BD621F)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
              Device ID
            </h3>
          </div>

          <div style={{ maxWidth: '440px' }}>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 600 }}>
              Device ID *
            </label>
            <input
              type="text"
              className="form-input mono-num"
              style={{
                width: '100%',
                maxWidth: '320px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderColor: !isDeviceIdValid ? '#ef4444' : undefined,
                boxShadow: !isDeviceIdValid ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined,
              }}
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value.toUpperCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="441BF6D37C80"
              required
            />

            {!isDeviceIdValid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem', color: '#dc2626', fontWeight: 600 }}>
                <AlertCircle size={13} />
                <span>Device ID is required (minimum 3 characters).</span>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 2: Device Polling ── */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Timer size={18} color="var(--brand-primary, #BD621F)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
                Device Polling
              </h3>
            </div>

            <button
              type="button"
              onClick={handleSendPollingConfig}
              disabled={isSendingPolling || !isPollingValid || pollingSeconds > mqttPublishSeconds}
              className="btn btn-rust-light"
              style={{
                height: '32px',
                padding: '0 14px',
                fontSize: '0.76rem',
                fontWeight: 650,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                opacity: (!isPollingValid || pollingSeconds > mqttPublishSeconds) ? 0.6 : 1,
                cursor: (!isPollingValid || pollingSeconds > mqttPublishSeconds) ? 'not-allowed' : 'pointer',
              }}
              title="Send Device Polling configuration"
            >
              {isSendingPolling ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
              <span>{isSendingPolling ? 'Sending...' : 'Send Config'}</span>
            </button>
          </div>

          <div style={{ maxWidth: '440px' }}>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 600 }}>
              Polling Interval *
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input mono-num"
                style={{
                  width: '130px',
                  fontWeight: 700,
                  borderColor: !isPollingValid ? '#ef4444' : undefined,
                  boxShadow: !isPollingValid ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined,
                }}
                value={pollingValue}
                onChange={(e) => setPollingValue(e.target.value)}
                min={pollingUnit === 'seconds' ? 30 : 1}
                max={pollingUnit === 'minutes' ? 1440 : 86400}
                required
              />
              <div style={{ width: '160px' }}>
                <Select2
                  value={pollingUnit}
                  onChange={(val) => setPollingUnit(val as 'seconds' | 'minutes')}
                  searchable={false}
                  options={[
                    { value: 'seconds', label: 'Seconds (s)' },
                    { value: 'minutes', label: 'Minutes (m)' },
                  ]}
                />
              </div>
            </div>

            {/* Error shown ONLY when invalid */}
            {!isPollingValid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem', color: '#dc2626', fontWeight: 600 }}>
                <AlertCircle size={13} />
                <span>Minimum 30 seconds required (currently {pollingSeconds}s).</span>
              </div>
            )}

            {/* Warning when polling exceeds MQTT publish */}
            {isPollingValid && pollingSeconds > mqttPublishSeconds && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem', color: '#dc2626', fontWeight: 600 }}>
                <AlertCircle size={13} />
                <span>
                  Polling interval ({pollingSeconds}s) cannot exceed MQTT Publish interval ({mqttPublishSeconds}s).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 3: MQTT Publish ── */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Radio size={18} color="var(--brand-primary, #BD621F)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
                MQTT Publish
              </h3>
            </div>

            <button
              type="button"
              onClick={handleSendMqttConfig}
              disabled={isSendingMqtt || !isMqttPublishValid}
              className="btn btn-rust-light"
              style={{
                height: '32px',
                padding: '0 14px',
                fontSize: '0.76rem',
                fontWeight: 650,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                opacity: !isMqttPublishValid ? 0.6 : 1,
                cursor: !isMqttPublishValid ? 'not-allowed' : 'pointer',
              }}
              title="Send MQTT Publish configuration"
            >
              {isSendingMqtt ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
              <span>{isSendingMqtt ? 'Sending...' : 'Send Config'}</span>
            </button>
          </div>

          <div style={{ maxWidth: '440px' }}>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 600 }}>
              Publish Interval *
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input mono-num"
                style={{
                  width: '130px',
                  fontWeight: 700,
                  borderColor: !isMqttPublishValid ? '#ef4444' : undefined,
                  boxShadow: !isMqttPublishValid ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined,
                }}
                value={mqttPublishValue}
                onChange={(e) => setMqttPublishValue(e.target.value)}
                min={minMqttPublishValue}
                max={mqttPublishUnit === 'minutes' ? 1440 : 86400}
                required
              />
              <div style={{ width: '160px' }}>
                <Select2
                  value={mqttPublishUnit}
                  onChange={(val) => setMqttPublishUnit(val as 'seconds' | 'minutes')}
                  searchable={false}
                  options={[
                    { value: 'seconds', label: 'Seconds (s)' },
                    { value: 'minutes', label: 'Minutes (m)' },
                  ]}
                />
              </div>
            </div>

            {/* Error shown ONLY when invalid */}
            {!isMqttPublishValid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem', color: '#dc2626', fontWeight: 600 }}>
                <AlertCircle size={13} />
                <span>
                  MQTT Publish interval must be equal to or higher than Device Polling interval (≥ {pollingSeconds}s).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommunicationConfigView = CommConfigurationPage;
export default CommConfigurationPage;
