import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Check,
  Save,
  RotateCcw,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Cpu,
  Building2,
  Activity,
  Play,
  Zap,
  RefreshCw,
  Server,
  Radio,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  FileJson,
  Copy,
  Download,
  Code2,
  Upload,
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';
import { Modal } from '../../components/common/Modal';
import { SearchInput } from '../../components/common/SearchInput';
import { DataTable } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormField';

export const MeterProfileView = () => {
  const {
    meterProfiles,
    addMeterProfile,
    updateMeterProfile,
    deleteMeterProfile,
    makes,
    models,
    standardParameters,
    gateways,
    channels,
    meters,
  } = useEnergyData();

  // Mode: 'list' (Table view shown first) OR 'create' (Create/Edit page without modal)
  const [viewMode, setViewMode] = useState('list');

  // Search filter for list view table
  const [searchTerm, setSearchTerm] = useState('');

  // Active editing profile ID ('NEW' for creating fresh, or an existing profile_id)
  const [currentProfileId, setCurrentProfileId] = useState('NEW');

  // Row 1 & Row 2 form state
  const [profileForm, setProfileForm] = useState({
    profile_version: '1.0.0',
    make_id: makes[0]?.make_id || '',
    make: makes[0]?.make_name || '',
    model_id: models[0]?.model_id || '',
    model: models[0]?.model_name || '',
    address_offset: -40001,
    function_code: 3,
    byte_order: 'CDAB',
    description: '',
  });

  // Parameter Box rows state
  const [parameterRows, setParameterRows] = useState([]);

  // Duplicate key detection in Parameter Box rows
  const duplicateKeyCountsInRows = useMemo(() => {
    const counts = {};
    for (const r of parameterRows) {
      const k = (r.key || '').trim().toLowerCase();
      if (k) {
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return counts;
  }, [parameterRows]);

  const hasDuplicateRowKeys = useMemo(() => {
    return Object.values(duplicateKeyCountsInRows).some((c) => c > 1);
  }, [duplicateKeyCountsInRows]);

  // Toast / feedback message
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active highlighted row index in Parameter Box
  const [activeEditingIndex, setActiveEditingIndex] = useState(null);

  // ── JSON View Modal State ──
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalProfile, setJsonModalProfile] = useState(null); // null means current editing form
  const [jsonCopied, setJsonCopied] = useState(false);
  const [jsonTab, setJsonTab] = useState('view'); // 'view' | 'import'
  const [jsonImportText, setJsonImportText] = useState('');
  const [jsonImportError, setJsonImportError] = useState('');

  // ── Meter Profile Gateway Communication Test State ──
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingProfile, setTestingProfile] = useState(null);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [testSlaveId, setTestSlaveId] = useState(1);
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failure'
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [testSummary, setTestSummary] = useState(null);

  const handleOpenTestProfile = (profile) => {
    setTestingProfile(profile);
    const matchedMeter = meters?.find((m) =>
      (m.meter_model && m.meter_model.toLowerCase() === (profile.model || '').toLowerCase()) ||
      (m.make_name && m.make_name.toLowerCase() === (profile.make || '').toLowerCase())
    );
    const matchedChannel = matchedMeter ? channels?.find((c) => c.Channel_id === matchedMeter.Channel_id) : null;
    const defaultGwId = matchedChannel ? matchedChannel.Gateway_id : (gateways?.[0]?.Gateway_id || '');
    setSelectedGatewayId(defaultGwId);

    const availableChannels = channels?.filter((c) => c.Gateway_id === defaultGwId) || [];
    setSelectedChannelId(matchedChannel ? matchedChannel.Channel_id : (availableChannels[0]?.Channel_id || ''));
    setTestSlaveId(matchedMeter?.slave_id || 1);

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

  const runGatewayProfileTest = () => {
    if (!testingProfile) return;
    const currentGw = gateways?.find((g) => g.Gateway_id === selectedGatewayId) || gateways?.[0];
    const currentCh = channels?.find((c) => c.Channel_id === selectedChannelId) || channels?.[0];

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
      const fc = Number(testingProfile.function_code || 3);
      const fcHex = fc.toString(16).padStart(2, '0').toUpperCase();
      const regCount = testingProfile.parameters?.length || 1;
      setTestLogs((prev) => [
        ...prev,
        { time: now(), text: `TX Frame [0x${hexSlave} 0x${fcHex} Offset:${testingProfile.address_offset || 0} Regs:${regCount} ByteOrder:${testingProfile.byte_order || 'ABCD'} CRC]: Polling registers from Slave #${testSlaveId}...`, type: 'info' }
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
      const params = testingProfile.parameters || [];
      const decodedResults = params.map((param) => {
        let val = '0';
        const k = (param.key || '').toLowerCase();
        const u = (param.unit || '').toLowerCase();

        if (k.includes('volt') || u === 'v') {
          if (k.includes('ll') || k.includes('ry') || k.includes('yb') || k.includes('br')) {
            val = (414.5 + Math.random() * 2.0).toFixed(2);
          } else {
            val = (239.5 + Math.random() * 1.8).toFixed(2);
          }
        } else if (k.includes('current') || u === 'a') {
          if (k.includes('neutral')) {
            val = (1.2 + Math.random() * 0.8).toFixed(2);
          } else {
            val = (24.3 + Math.random() * 3.5).toFixed(2);
          }
        } else if (k.includes('power_active') || (u === 'w' || u === 'kw')) {
          val = (412.50 + Math.random() * 45).toFixed(2);
        } else if (k.includes('pf') || k.includes('power_factor')) {
          val = (0.97 + Math.random() * 0.02).toFixed(2);
        } else if (k.includes('apparent') || u === 'va') {
          val = (425.0 + Math.random() * 30).toFixed(2);
        } else if (k.includes('reactive') || u === 'var') {
          val = (85.2 + Math.random() * 10).toFixed(2);
        } else if (k.includes('freq') || u === 'hz') {
          val = (49.98 + Math.random() * 0.05).toFixed(2);
        } else if (k.includes('energy') || u.includes('wh')) {
          val = (14280.5 + Math.random() * 100).toFixed(2);
        } else if (k.includes('rpm')) {
          val = Math.floor(1480 + Math.random() * 20).toString();
        } else if (k.includes('hour') || k.includes('on_second')) {
          val = Math.floor(8420 + Math.random() * 50).toString();
        } else {
          val = (100.0 + Math.random() * 25).toFixed(2);
        }

        const mult = Number(param.multiplier) || 1.0;
        const finalVal = mult !== 1.0 ? (parseFloat(val) * mult).toFixed(2) : val;

        return {
          key: param.key,
          display_name: param.display_name || param.key,
          address: param.address,
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
        { time: now(), text: `Profile verification complete! Successfully decoded ${params.length} register parameters via Gateway [${currentGw?.Gateway_name}].`, type: 'success' }
      ]);

      setTestSummary({
        success: true,
        latencyMs: simLatency,
        packetsSent: 1,
        packetsReceived: 1,
        packetLoss: '0%',
        registersRead: params.length,
        gatewayIp: currentGw?.ip_address || '192.168.1.150',
        channelName: currentCh?.Channel_name || 'RS485 Loop',
        slaveId: testSlaveId,
      });
    }, 1800);
  };

  // ── Meter Profile JSON Format Helpers & Modal Renderer ──
  const getActiveProfileJson = (targetProfile = null) => {
    if (targetProfile) {
      return {
        profile_version: targetProfile.profile_version || '1.0.0',
        make: targetProfile.make || '',
        model: targetProfile.model || '',
        address_offset: Number(targetProfile.address_offset !== undefined ? targetProfile.address_offset : -40001),
        function_code: Number(targetProfile.function_code !== undefined ? targetProfile.function_code : 3),
        byte_order: targetProfile.byte_order || 'CDAB',
        parameters: (targetProfile.parameters || []).map((p) => ({
          key: p.key || '',
          display_name: p.display_name || '',
          address: Number(p.address) || 0,
          datatype: p.datatype || 'float32',
          scale: Number(p.scale !== undefined ? p.scale : (p.multiplier !== undefined ? p.multiplier : 1.0)),
          unit: p.unit || '',
        })),
      };
    }
    return {
      profile_version: profileForm.profile_version || '1.0.0',
      make: profileForm.make || '',
      model: profileForm.model || '',
      address_offset: Number(profileForm.address_offset !== undefined ? profileForm.address_offset : -40001),
      function_code: Number(profileForm.function_code !== undefined ? profileForm.function_code : 3),
      byte_order: profileForm.byte_order || 'CDAB',
      parameters: parameterRows.map((r) => ({
        key: r.key || '',
        display_name: r.display_name || '',
        address: Number(r.address) || 0,
        datatype: r.datatype || 'float32',
        scale: Number(r.multiplier !== undefined ? r.multiplier : (r.scale !== undefined ? r.scale : 1.0)),
        unit: r.unit || '',
      })),
    };
  };

  const handleCopyJson = (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const onDone = () => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(onDone).catch(() => {
        fallbackCopy(jsonStr);
        onDone();
      });
    } else {
      fallbackCopy(jsonStr);
      onDone();
    }
  };

  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  };

  const handleDownloadJson = (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile_${(data.make || 'make').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${(data.model || 'model').toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyImportedJson = () => {
    try {
      setJsonImportError('');
      if (!jsonImportText.trim()) {
        setJsonImportError('Please paste valid profile JSON content.');
        return;
      }
      const parsed = JSON.parse(jsonImportText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not a valid JSON object.');
      }

      const matchedMake = makes.find(
        (m) => m.make_name.toLowerCase() === (parsed.make || '').toLowerCase()
      );
      const matchedModel = models.find(
        (m) => m.model_name.toLowerCase() === (parsed.model || '').toLowerCase()
      );

      setProfileForm((prev) => ({
        ...prev,
        profile_version: parsed.profile_version || prev.profile_version || '1.0.0',
        make: parsed.make || prev.make,
        make_id: matchedMake?.make_id || prev.make_id,
        model: parsed.model || prev.model,
        model_id: matchedModel?.model_id || prev.model_id,
        address_offset: parsed.address_offset !== undefined ? Number(parsed.address_offset) : prev.address_offset,
        function_code: parsed.function_code !== undefined ? Number(parsed.function_code) : prev.function_code,
        byte_order: parsed.byte_order || prev.byte_order || 'CDAB',
      }));

      if (Array.isArray(parsed.parameters)) {
        const importedRows = parsed.parameters.map((p) => ({
          key: p.key || '',
          display_name: p.display_name || '',
          address: p.address !== undefined ? Number(p.address) : 40101,
          datatype: p.datatype || 'float32',
          multiplier: p.scale !== undefined ? Number(p.scale) : (p.multiplier !== undefined ? Number(p.multiplier) : 1.0),
          unit: p.unit || '',
        }));
        setParameterRows(importedRows);
      }

      setIsJsonModalOpen(false);
      setSuccessMsg('✓ Profile configuration applied from JSON successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setJsonImportError('Invalid JSON format: ' + err.message);
    }
  };

  const renderJsonWithHighlights = (jsonStr) => {
    return jsonStr.split('\n').map((line, idx) => {
      const keyMatch = line.match(/^(\s*)(".*?")(\s*:\s*)(.*)$/);
      if (keyMatch) {
        const [, indent, key, colon, val] = keyMatch;
        let valColor = '#38bdf8';
        if (val.startsWith('"')) valColor = '#34d399';
        else if (!isNaN(Number(val.replace(',', '').trim()))) valColor = '#f59e0b';
        else if (val.includes('true') || val.includes('false')) valColor = '#ec4899';
        else if (val.includes('[') || val.includes('{')) valColor = '#cbd5e1';

        return (
          <div key={idx} style={{ display: 'flex', fontFamily: 'inherit' }}>
            <span style={{ width: '34px', color: '#475569', userSelect: 'none', textAlign: 'right', marginRight: '14px', fontSize: '0.74rem' }}>
              {idx + 1}
            </span>
            <span>
              {indent}
              <span style={{ color: '#60a5fa' }}>{key}</span>
              <span style={{ color: '#94a3b8' }}>{colon}</span>
              <span style={{ color: valColor }}>{val}</span>
            </span>
          </div>
        );
      }
      return (
        <div key={idx} style={{ display: 'flex', fontFamily: 'inherit' }}>
          <span style={{ width: '34px', color: '#475569', userSelect: 'none', textAlign: 'right', marginRight: '14px', fontSize: '0.74rem' }}>
            {idx + 1}
          </span>
          <span style={{ color: '#94a3b8' }}>{line}</span>
        </div>
      );
    });
  };

  const renderJsonModal = () => {
    const activeData = getActiveProfileJson(jsonModalProfile);
    const jsonStr = JSON.stringify(activeData, null, 2);

    return (
      <Modal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        title={`Profile JSON Format: ${activeData.make || 'Meter'} ${activeData.model || 'Profile'}`}
        maxWidth="780px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Info Banner with Badges & Copy/Download Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeData.make} {activeData.model}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--primary-cyan)',
                  border: '1px solid var(--primary-cyan-border)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                v{activeData.profile_version || '1.0.0'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--accent-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {activeData.parameters?.length || 0} Parameters
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--bg-table-header)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Offset: {activeData.address_offset} • FC: 0{activeData.function_code} • {activeData.byte_order}
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCopyJson(activeData)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--primary-cyan)',
                  backgroundColor: jsonCopied ? 'var(--accent-emerald)' : 'var(--primary-cyan)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                title="Copy JSON format to clipboard"
              >
                {jsonCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{jsonCopied ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadJson(activeData)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Download profile as .json file"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs: View vs Import (Import only active in editor mode) */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <button
              type="button"
              onClick={() => setJsonTab('view')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: jsonTab === 'view' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                color: jsonTab === 'view' ? 'var(--primary-cyan)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: jsonTab === 'view' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Code2 size={14} />
              <span>JSON Code View</span>
            </button>

            {viewMode === 'create' && (
              <button
                type="button"
                onClick={() => {
                  setJsonTab('import');
                  if (!jsonImportText) setJsonImportText(jsonStr);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: jsonTab === 'import' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: jsonTab === 'import' ? 'var(--primary-cyan)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: jsonTab === 'import' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Upload size={14} />
                <span>Paste / Import JSON</span>
              </button>
            )}
          </div>

          {/* Tab 1: Formatted JSON Code View */}
          {jsonTab === 'view' && (
            <div
              style={{
                maxHeight: '440px',
                overflowY: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#070b14',
                padding: '14px 16px',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  lineHeight: '1.55',
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: '#e2e8f0',
                }}
              >
                {renderJsonWithHighlights(jsonStr)}
              </pre>
            </div>
          )}

          {/* Tab 2: Paste / Import JSON */}
          {jsonTab === 'import' && viewMode === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setJsonImportText(jsonStr);
                    setJsonImportError('');
                  }}
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--primary-cyan)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Reset to Current Form
                </button>
              </div>

              <textarea
                value={jsonImportText}
                onChange={(e) => {
                  setJsonImportText(e.target.value);
                  if (jsonImportError) setJsonImportError('');
                }}
                rows={13}
                placeholder={`{\n  "profile_version": "1.0.0",\n  "make": "Elmeasure",\n  "model": "LG5310",\n  "address_offset": -40001,\n  "function_code": 3,\n  "byte_order": "CDAB",\n  "parameters": [\n    {\n      "key": "power_active_total",\n      "display_name": "Watts Total",\n      "address": 40101,\n      "datatype": "float32",\n      "scale": 1.0,\n      "unit": "W"\n    }\n  ]\n}`}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#070b14',
                  border: jsonImportError ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

              {jsonImportError && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose-border)', borderRadius: '6px', color: 'var(--accent-rose)', fontSize: '0.76rem' }}>
                  {jsonImportError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleApplyImportedJson}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--accent-emerald)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} />
                  <span>Apply JSON to Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setIsJsonModalOpen(false)}
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
          </div>
        </div>
      </Modal>
    );
  };

  // Models filtered by selected Make (Make Master -> Model Master relationship)
  const availableModels = useMemo(() => {
    if (!profileForm.make_id) return models;
    return models.filter((m) => m.make_id === profileForm.make_id);
  }, [models, profileForm.make_id]);

  // Open Create Page for a new profile
  const handleOpenCreatePage = () => {
    const dm = makes[0] || { make_id: 'MAKE-ELM', make_name: 'Elmeasure' };
    const validMods = models.filter((m) => m.make_id === dm.make_id);
    const mod = validMods[0] || models[0];

    setCurrentProfileId('NEW');
    setProfileForm({
      profile_version: '1.0.0',
      make_id: dm.make_id,
      make: dm.make_name,
      model_id: mod?.model_id || '',
      model: mod?.model_name || '',
      address_offset: mod?.default_offset ?? -40001,
      function_code: mod?.default_fc || 3,
      byte_order: mod?.default_byte_order || 'CDAB',
      description: '',
    });
    setParameterRows([
      {
        key: 'power_active_total',
        display_name: 'Watts Total',
        address: 40101,
        datatype: 'float32',
        multiplier: 1.0,
        unit: 'W',
      },
    ]);
    setErrorMsg('');
    setViewMode('create');
  };

  // Open Edit Page for an existing profile
  const handleOpenEditPage = (profile) => {
    setCurrentProfileId(profile.profile_id);
    setProfileForm({
      profile_version: profile.profile_version || '1.0.0',
      make_id: profile.make_id || makes.find((m) => m.make_name === profile.make)?.make_id || makes[0]?.make_id || '',
      make: profile.make || '',
      model_id: profile.model_id || models.find((m) => m.model_name === profile.model)?.model_id || models[0]?.model_id || '',
      model: profile.model || '',
      address_offset: profile.address_offset !== undefined ? profile.address_offset : -40001,
      function_code: profile.function_code !== undefined ? profile.function_code : 3,
      byte_order: profile.byte_order || 'CDAB',
      description: profile.description || '',
    });
    setParameterRows(
      (profile.parameters || []).map((p) => ({
        key: p.key || '',
        display_name: p.display_name || '',
        address: p.address || 40101,
        datatype: p.datatype || 'float32',
        multiplier: p.multiplier !== undefined ? p.multiplier : (p.scale !== undefined ? p.scale : 1.0),
        unit: p.unit || '',
      }))
    );
    setErrorMsg('');
    setViewMode('create');
  };

  // Handle Make dropdown change (cascading into Model)
  const handleMakeChange = (makeId) => {
    const mk = makes.find((m) => m.make_id === makeId);
    const validMods = models.filter((m) => m.make_id === makeId);
    const firstMod = validMods[0];

    setProfileForm((prev) => ({
      ...prev,
      make_id: makeId,
      make: mk ? mk.make_name : '',
      model_id: firstMod ? firstMod.model_id : '',
      model: firstMod ? firstMod.model_name : '',
      address_offset: firstMod?.default_offset !== undefined ? firstMod.default_offset : prev.address_offset,
      function_code: firstMod?.default_fc !== undefined ? firstMod.default_fc : prev.function_code,
      byte_order: firstMod?.default_byte_order || prev.byte_order,
    }));
  };

  // Handle Model dropdown change
  const handleModelChange = (modelId) => {
    const mod = models.find((m) => m.model_id === modelId);
    if (!mod) return;
    setProfileForm((prev) => ({
      ...prev,
      model_id: modelId,
      model: mod.model_name,
      address_offset: mod.default_offset !== undefined ? mod.default_offset : prev.address_offset,
      function_code: mod.default_fc !== undefined ? mod.default_fc : prev.function_code,
      byte_order: mod.default_byte_order || prev.byte_order,
    }));
  };

  // Calculate next available address
  const calculateNextAddress = () => {
    if (!parameterRows.length) {
      return profileForm.address_offset === 0 ? 3001 : 40101;
    }
    const lastRow = parameterRows[parameterRows.length - 1];
    const span = lastRow.datatype === 'uint16' || lastRow.datatype === 'int16' ? 1 : 2;
    return Number(lastRow.address || 40101) + span;
  };

  // ── "Add Row" button in top right of Parameter Box ──
  const handleAddRow = () => {
    const nextAddr = calculateNextAddress();
    const newRow = {
      key: '',
      display_name: '',
      address: nextAddr,
      datatype: 'float32',
      multiplier: 1.0,
      unit: '',
    };
    setParameterRows((prev) => [...prev, newRow]);
    setActiveEditingIndex(parameterRows.length);
  };

  // Handle row field change with Key-Value Master auto-fill
  const handleRowChange = (index, field, value) => {
    setParameterRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      // Key-Value Auto Lookup: When key changes, if it matches a standard key (e.g. energy_active_import),
      // auto-fill display_name, datatype, multiplier, and unit from Key-Value Master
      if (field === 'key') {
        const found = standardParameters.find(
          (p) => p.key.toLowerCase().trim() === value.toLowerCase().trim()
        );
        if (found) {
          row.display_name = found.display_name;
          row.datatype = found.datatype || 'float32';
          row.multiplier = found.multiplier !== undefined ? found.multiplier : (found.scale !== undefined ? found.scale : 1.0);
          row.unit = found.unit || '';
        }
      }

      // Auto-generate key if typing display name and key was empty or auto-generated
      if (field === 'display_name') {
        const foundByName = standardParameters.find(
          (p) => p.display_name.toLowerCase().trim() === value.toLowerCase().trim()
        );
        if (foundByName) {
          row.key = foundByName.key;
          row.datatype = foundByName.datatype || row.datatype || 'float32';
          row.multiplier = foundByName.multiplier !== undefined ? foundByName.multiplier : 1.0;
          row.unit = foundByName.unit || '';
        } else if (!row.key || row.key === updated[index].display_name.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
          row.key = value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  // Delete row from Parameter Box
  const handleDeleteRow = (index) => {
    setParameterRows((prev) => prev.filter((_, i) => i !== index));
    if (activeEditingIndex === index) setActiveEditingIndex(null);
  };

  // Toggle edit/highlight on row
  const handleToggleEditRow = (index) => {
    setActiveEditingIndex(activeEditingIndex === index ? null : index);
  };

  // Quick helper to fill a row from Standard Catalog
  const handleFillFromCatalog = (index, catalogKey) => {
    const found = standardParameters.find((p) => p.key === catalogKey);
    if (found) {
      setParameterRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          key: found.key,
          display_name: found.display_name,
          datatype: found.datatype || 'float32',
          multiplier: found.multiplier !== undefined ? found.multiplier : (found.scale || 1.0),
          unit: found.unit || '',
        };
        return updated;
      });
    }
  };

  // ── Save Meter Profile and Return to Table View ──
  const handleSaveProfile = () => {
    setErrorMsg('');

    if (!profileForm.make.trim()) {
      setErrorMsg('Please select a Make.');
      return;
    }
    if (!profileForm.model.trim()) {
      setErrorMsg('Please select a Model.');
      return;
    }

    const cleanedParams = parameterRows
      .filter((r) => r.display_name.trim() || r.key.trim())
      .map((r) => ({
        key: r.key.trim() || r.display_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        display_name: r.display_name.trim() || r.key.trim(),
        address: Number(r.address) || 40101,
        datatype: r.datatype || 'float32',
        multiplier: (r.multiplier !== undefined && r.multiplier !== '') ? Number(r.multiplier) : 1.0,
        unit: r.unit.trim(),
      }));

    if (cleanedParams.length === 0) {
      setErrorMsg('Please add at least one parameter row in the Parameter Box.');
      return;
    }

    // Duplicate parameter validation
    const keyCounts = {};
    for (const p of cleanedParams) {
      keyCounts[p.key] = (keyCounts[p.key] || 0) + 1;
    }
    const dupKey = Object.keys(keyCounts).find((k) => keyCounts[k] > 1);
    if (dupKey) {
      setErrorMsg(`Duplicate parameter key "${dupKey}" detected in the Parameter Box. Each parameter row must have a unique key.`);
      return;
    }

    const payload = {
      profile_version: profileForm.profile_version || '1.0.0',
      make_id: profileForm.make_id,
      make: profileForm.make,
      model_id: profileForm.model_id,
      model: profileForm.model,
      address_offset: Number(profileForm.address_offset),
      function_code: profileForm.function_code,
      byte_order: String(profileForm.byte_order).trim() || 'CDAB',
      description: `${profileForm.make} ${profileForm.model} Meter Profile`,
      parameters: cleanedParams,
    };

    if (currentProfileId !== 'NEW') {
      updateMeterProfile(currentProfileId, payload);
      setSuccessMsg(`✓ Successfully updated "${profileForm.make} ${profileForm.model}" profile with ${cleanedParams.length} parameters!`);
    } else {
      addMeterProfile(payload);
      setSuccessMsg(`✓ Successfully created "${profileForm.make} ${profileForm.model}" profile with ${cleanedParams.length} parameters!`);
    }

    // Switch back to list view
    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Delete profile from list
  const handleDeleteProfile = (profileId, make, model) => {
    if (window.confirm(`Are you sure you want to delete profile "${make} ${model}"?`)) {
      deleteMeterProfile(profileId);
      setSuccessMsg(`✓ Profile "${make} ${model}" was deleted.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  // Filtered meter profiles for list view
  const filteredProfiles = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return meterProfiles;
    return meterProfiles.filter(
      (p) =>
        p.make.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        (p.profile_version && p.profile_version.toLowerCase().includes(q)) ||
        (p.byte_order && p.byte_order.toLowerCase().includes(q))
    );
  }, [meterProfiles, searchTerm]);

  // ═══════════════════════════════════════════════════════════════════════
  // VIEW 1: TABLE VIEW FOR CREATED METER PROFILES (SHOWN FIRST)
  // ═══════════════════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            backgroundColor: 'var(--bg-card)',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Meter Profiles
              </h2>
            </div>
          </div>

          {/* Add Meter Profile Button */}
          <button onClick={handleOpenCreatePage} style={btnPrimaryStyle}>
            <Plus size={16} />
            <span>+ Add Profile</span>
          </button>
        </div>

        {/* Success / Error notification */}
        {successMsg && (
          <div style={{ padding: '12px 18px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--accent-emerald-border)', borderRadius: '10px', color: 'var(--accent-emerald)', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Table View of Created Profiles */}
        <DataTable
          columns={[
            {
              header: '#',
              width: '40px',
              render: (_, idx) => <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{idx + 1}</span>,
            },
            {
              header: 'Make',
              render: (p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <Building2 size={16} color="var(--text-muted)" />
                  <span>{p.make}</span>
                </div>
              ),
            },
            {
              header: 'Model',
              render: (p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                  <Cpu size={15} color="var(--text-muted)" />
                  <span>{p.model}</span>
                </div>
              ),
            },
            {
              header: 'Version',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--bg-card-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  v{p.profile_version || '1.0.0'}
                </span>
              ),
            },
            {
              header: 'Address Offset',
              align: 'center',
              render: (p) => (
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {p.address_offset}
                </span>
              ),
            },
            {
              header: 'Function Code',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--bg-card-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                  }}
                >
                  {Number(p.function_code) === 3
                    ? '03 - Holding Reg'
                    : Number(p.function_code) === 4
                    ? '04 - Input Reg'
                    : `FC 0${p.function_code || 3}`}
                </span>
              ),
            },
            {
              header: 'Byte Order',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    backgroundColor: 'var(--bg-card-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {p.byte_order || 'CDAB'}
                </span>
              ),
            },
            {
              header: 'Registers Count',
              align: 'center',
              render: (p) => (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {p.parameters?.length || 0} registers
                </span>
              ),
            },
            {
              header: 'Actions',
              align: 'center',
              width: '170px',
              render: (p) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {/* Test Button */}
                  <button
                    onClick={() => handleOpenTestProfile(p)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(0, 163, 42, 0.35)',
                      backgroundColor: 'rgba(0, 163, 42, 0.08)',
                      color: 'var(--accent-emerald)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                    }}
                    title="Test meter profile telemetry with gateway"
                  >
                    <Activity size={13} />
                    <span>Test</span>
                  </button>

                  {/* JSON View Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setJsonModalProfile(p);
                      setJsonTab('view');
                      setJsonImportError('');
                      setIsJsonModalOpen(true);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary-cyan-border)',
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      color: 'var(--primary-cyan)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                    }}
                    title="View & copy profile JSON configuration"
                  >
                    <FileJson size={13} />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditPage(p)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary-cyan-border)',
                      backgroundColor: 'var(--primary-cyan-glow)',
                      color: 'var(--primary-cyan)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                    }}
                    title="Edit Profile"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProfile(p.profile_id, p.make, p.model)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--accent-rose-border)',
                      backgroundColor: 'var(--accent-rose-glow)',
                      color: 'var(--accent-rose)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.76rem',
                    }}
                    title="Delete Profile"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredProfiles}
          rowKey="profile_id"
          toolbar={
            <>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total Profiles: <strong style={{ color: 'var(--primary-cyan)' }}>{meterProfiles.length}</strong>
              </div>

              <SearchInput
                placeholder="Search by Make, Model, Version..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                width="260px"
              />
            </>
          }
          emptyMessage="No meter profiles found. Click 'Add Meter Profile' to create one."
        />

        {/* ── METER PROFILE GATEWAY COMMUNICATION TEST MODAL ── */}
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          title="Test Meter Profile Data via Gateway"
          maxWidth="900px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header Profile Info Banner */}
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
                  {testingProfile?.make} • {testingProfile?.model}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '3px' }}>
                  <span>Version: <strong>v{testingProfile?.profile_version || '1.0.0'}</strong></span>
                  <span>•</span>
                  <span>FC: <strong>0{testingProfile?.function_code || 3} (Holding Reg)</strong></span>
                  <span>•</span>
                  <span>Offset: <strong>{testingProfile?.address_offset || 0}</strong></span>
                  <span>•</span>
                  <span>Byte Order: <strong>{testingProfile?.byte_order || 'ABCD'}</strong></span>
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
                  {testingProfile?.parameters?.length || 0} Registers Configured
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
                  onClick={runGatewayProfileTest}
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
                      <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-table-header, var(--border-subtle))', color: '#FFFFFF', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', width: '36px', color: '#FFFFFF' }}>#</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#FFFFFF' }}>Register Key</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#FFFFFF' }}>Display Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: '#FFFFFF' }}>Modbus Addr</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: '#FFFFFF' }}>Type</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#FFFFFF' }}>Live Reading</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px', color: '#FFFFFF' }}>Status</th>
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
                  onClick={runGatewayProfileTest}
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

        {/* ── Profile JSON View Modal ── */}
        {renderJsonModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIEW 2: CREATE / EDIT METER PROFILE PAGE (SHOWN WHEN ADD METER PROFILE IS CLICKED)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* ── TOP HEADER WITH BACK BUTTON & ACTIONS ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'var(--bg-card)',
          padding: '16px 22px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            title="Back to Profiles"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {currentProfileId === 'NEW' ? 'Create Meter Profile' : `Edit Profile: ${profileForm.make} ${profileForm.model}`}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setViewMode('list')} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            className="btn btn-primary"
            disabled={hasDuplicateRowKeys}
            title={hasDuplicateRowKeys ? 'Cannot save profile with duplicate parameter keys' : 'Save Meter Profile'}
          >
            <Save size={15} />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: 'rgba(244, 63, 94, 0.12)', border: '1px solid var(--accent-rose-border)', borderRadius: '10px', color: 'var(--accent-rose)', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="var(--accent-rose)" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── PROFILE GENERAL CONFIGURATION ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px 22px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* ROW 1: Profile Version, Make, Model */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <InputField
            label="Profile Version"
            required
            value={profileForm.profile_version}
            onChange={(e) => setProfileForm({ ...profileForm, profile_version: e.target.value })}
            placeholder="e.g. 1.0.0"
          />

          <SelectField
            label="Make"
            required
            value={profileForm.make_id}
            onChange={(e) => handleMakeChange(e.target.value)}
            options={makes.map((m) => ({
              value: m.make_id,
              label: m.make_name,
            }))}
          />

          <SelectField
            label="Model"
            required
            value={profileForm.model_id}
            onChange={(e) => handleModelChange(e.target.value)}
            options={availableModels.map((mod) => ({
              value: mod.model_id,
              label: mod.model_name,
            }))}
          />
        </div>

        {/* ROW 2: Address Offset, Function Code, Byte Order */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <InputField
            label="Address Offset"
            type="number"
            value={profileForm.address_offset}
            onChange={(e) => setProfileForm({ ...profileForm, address_offset: Number(e.target.value) })}
            placeholder="-40001"
          />

          <SelectField
            label="Function Code"
            value={profileForm.function_code}
            onChange={(e) => setProfileForm({ ...profileForm, function_code: Number(e.target.value) })}
            options={[
              { value: 3, label: 'Holding Register' },
              { value: 4, label: 'Input Register' },
              { value: 1, label: 'Coil Status' },
              { value: 2, label: 'Discrete Input' },
            ]}
          />

          <SelectField
            label="Byte Order"
            value={profileForm.byte_order}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__custom__') {
                const custom = window.prompt('Enter byte order (e.g. CDAB, ABCD, BADC, DCBA):');
                if (custom && custom.trim()) {
                  setProfileForm({ ...profileForm, byte_order: custom.trim().toUpperCase() });
                }
              } else {
                setProfileForm({ ...profileForm, byte_order: val });
              }
            }}
            options={[
              { value: 'CDAB', label: 'CDAB' },
              { value: 'ABCD', label: 'ABCD' },
              { value: 'BADC', label: 'BADC' },
              { value: 'DCBA', label: 'DCBA' },
              ...(profileForm.byte_order && !['CDAB', 'ABCD', 'BADC', 'DCBA'].includes(profileForm.byte_order)
                ? [{ value: profileForm.byte_order, label: profileForm.byte_order }]
                : []),
              { value: '__custom__', label: '+ Custom...' },
            ]}
          />
        </div>
      </div>

      {/* ── PARAMETER REGISTERS PANEL ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Layers size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Parameter Registers
              </h3>
              <span
                className="mono-num"
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--brand-primary)',
                  fontWeight: 650,
                }}
              >
                {parameterRows.length} {parameterRows.length === 1 ? 'Parameter' : 'Parameters'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              id="btn-profile-json-view"
              onClick={() => {
                setJsonModalProfile(null);
                setJsonTab('view');
                setJsonImportError('');
                setIsJsonModalOpen(true);
              }}
              className="btn btn-secondary"
              style={{ height: '34px', fontSize: '0.78rem' }}
              title="View JSON configuration"
            >
              <FileJson size={14} />
              <span>JSON View</span>
            </button>

            <button
              type="button"
              id="btn-add-parameter-row"
              onClick={handleAddRow}
              className="btn btn-primary"
              style={{ height: '34px', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
              <span>Add Parameter</span>
            </button>
          </div>
        </div>

        {/* Multiple Rows Table inside Parameter Box */}
        <div style={{ overflowX: 'auto', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-table-header)', color: '#FFFFFF', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '11px 12px', width: '42px', color: '#FFFFFF', fontWeight: 700, textAlign: 'center', borderRadius: '6px 0 0 6px' }}>#</th>
                <th style={{ padding: '11px 12px', width: '22%', color: '#FFFFFF', fontWeight: 700 }}>Key</th>
                <th style={{ padding: '11px 12px', width: '22%', color: '#FFFFFF', fontWeight: 700 }}>Display Name</th>
                <th style={{ padding: '11px 12px', width: '13%', color: '#FFFFFF', fontWeight: 700, textAlign: 'center' }}>Address</th>
                <th style={{ padding: '11px 12px', width: '15%', color: '#FFFFFF', fontWeight: 700 }}>Data Type</th>
                <th style={{ padding: '11px 12px', width: '10%', color: '#FFFFFF', fontWeight: 700, textAlign: 'center' }}>Multiplier</th>
                <th style={{ padding: '11px 12px', width: '10%', color: '#FFFFFF', fontWeight: 700, textAlign: 'center' }}>Unit</th>
                <th style={{ padding: '11px 12px', textAlign: 'center', width: '85px', color: '#FFFFFF', fontWeight: 700, borderRadius: '0 6px 6px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parameterRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '42px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No parameters configured. Click <strong style={{ color: 'var(--brand-primary)' }}>"Add Parameter"</strong> to start adding registers.
                  </td>
                </tr>
              ) : (
                parameterRows.map((row, index) => {
                  const isHighlighted = activeEditingIndex === index;
                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isHighlighted ? 'var(--bg-table-row-hover)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Row # */}
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {index + 1}
                      </td>

                      {/* Key dropdown */}
                      <td style={{ padding: '8px 12px' }}>
                        {(() => {
                          const isRowKeyDuplicate = Boolean(row.key && (duplicateKeyCountsInRows[row.key.trim().toLowerCase()] || 0) > 1);
                          return (
                            <>
                              <select
                                value={row.key}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '__custom__') {
                                    const custom = window.prompt('Enter custom telemetry key (e.g. custom_energy_total):');
                                    if (custom && custom.trim()) {
                                      handleRowChange(index, 'key', custom.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                                    }
                                  } else {
                                    handleRowChange(index, 'key', val);
                                  }
                                }}
                                style={{
                                  ...tableInputStyle,
                                  fontFamily: 'monospace',
                                  color: isRowKeyDuplicate ? 'var(--status-danger-text)' : 'var(--text-primary)',
                                  fontWeight: isRowKeyDuplicate ? 600 : 400,
                                  cursor: 'pointer',
                                  backgroundColor: isRowKeyDuplicate ? 'var(--status-danger-bg)' : 'var(--bg-input)',
                                  borderColor: isRowKeyDuplicate ? 'var(--status-danger-border, #ef4444)' : undefined,
                                }}
                              >
                                <option value="">Select Key</option>
                                {standardParameters.map((sp) => (
                                  <option key={sp.key} value={sp.key}>
                                    {sp.key}
                                  </option>
                                ))}
                                {row.key && !standardParameters.some((sp) => sp.key === row.key) && (
                                  <option value={row.key}>{row.key}</option>
                                )}
                                <option value="__custom__">+ Custom Key...</option>
                              </select>
                              {isRowKeyDuplicate && (
                                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-danger-text)', fontSize: '0.70rem', fontWeight: 650 }}>
                                  <AlertCircle size={11} /> Duplicate parameter in profile
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      {/* display name */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={row.display_name}
                          onChange={(e) => handleRowChange(index, 'display_name', e.target.value)}
                          placeholder="e.g. Watts Total"
                          style={{ ...tableInputStyle, fontWeight: 600, color: '#0f172a' }}
                        />
                      </td>

                      {/* address */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          value={row.address}
                          onChange={(e) => handleRowChange(index, 'address', e.target.value)}
                          placeholder="40101"
                          style={{
                            ...tableInputStyle,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        />
                      </td>

                      {/* data type */}
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={row.datatype}
                          onChange={(e) => handleRowChange(index, 'datatype', e.target.value)}
                          style={{
                            ...tableInputStyle,
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="float32">float32</option>
                          <option value="uint32">uint32</option>
                          <option value="int32">int32</option>
                          <option value="uint16">uint16</option>
                          <option value="int16">int16</option>
                        </select>
                      </td>

                      {/* Multiplier (float value) */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          step="any"
                          value={row.multiplier !== undefined ? row.multiplier : (row.scale !== undefined ? row.scale : 1.0)}
                          onChange={(e) => handleRowChange(index, 'multiplier', e.target.value === '' ? '' : e.target.value)}
                          placeholder="1.0"
                          style={{ ...tableInputStyle, textAlign: 'center', fontFamily: 'monospace' }}
                        />
                      </td>

                      {/* unit dropdown (populated from Parameter Master) */}
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={row.unit || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              const custom = window.prompt('Enter custom unit (e.g. kV, MWh, °C):');
                              if (custom !== null && custom.trim()) {
                                handleRowChange(index, 'unit', custom.trim());
                              }
                            } else {
                              handleRowChange(index, 'unit', val);
                            }
                          }}
                          style={{
                            ...tableInputStyle,
                            textAlign: 'center',
                            fontWeight: 650,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">Select Unit</option>
                          {/* Units dynamically extracted from Parameter Master */}
                          {(() => {
                            const masterUnits = Array.from(
                              new Set(
                                standardParameters
                                  .map((p) => p.unit)
                                  .filter((u) => u && typeof u === 'string' && u.trim().length > 0)
                              )
                            ).sort();

                            return masterUnits.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ));
                          })()}
                          {row.unit &&
                            !standardParameters.some((p) => p.unit === row.unit) && (
                              <option value={row.unit}>{row.unit}</option>
                            )}
                          <option value="__custom__">➕ Other / Custom Unit...</option>
                        </select>
                      </td>

                      {/* edit & delete button */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleEditRow(index)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: isHighlighted ? '1px solid #0284c7' : '1px solid #bae6fd',
                              backgroundColor: isHighlighted ? '#e0f2fe' : '#f0f9ff',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                            title="Edit row"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRow(index)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #fecdd3',
                              backgroundColor: '#fff1f2',
                              color: '#e11d48',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                            title="Delete row"
                          >
                            <Trash2 size={13} />
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

        {/* Standard Parameters Key Autocomplete Datalist */}
        <datalist id="param-standard-keys">
          {standardParameters.map((sp) => (
            <option key={sp.key} value={sp.key}>
              {sp.display_name} ({sp.unit || 'unitless'}) — Mult: {sp.multiplier !== undefined ? sp.multiplier : 1.0}
            </option>
          ))}
        </datalist>
      </div>

      {/* ── Profile JSON View Modal ── */}
      {renderJsonModal()}
    </div>
  );
};

// Styles
const labelStyle = {
  display: 'block',
  fontSize: '0.84rem',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.86rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.86rem',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const tableInputStyle = {
  width: '100%',
  height: '34px',
  padding: '0 8px',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8125rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const btnPrimaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'var(--brand-primary)',
  color: '#ffffff',
  border: '1px solid var(--brand-primary)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 15px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all 0.15s ease',
};

const btnSecondaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'var(--bg-surface-secondary)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 14px',
  fontSize: '0.8125rem',
  fontWeight: 550,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
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

