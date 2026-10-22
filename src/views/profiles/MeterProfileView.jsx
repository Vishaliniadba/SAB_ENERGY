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
} from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const MeterProfileView = () => {
  const {
    meterProfiles,
    addMeterProfile,
    updateMeterProfile,
    deleteMeterProfile,
    makes,
    models,
    standardParameters,
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

  // Toast / feedback message
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active highlighted row index in Parameter Box
  const [activeEditingIndex, setActiveEditingIndex] = useState(null);

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
        scale: 1.0,
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
        scale: p.scale !== undefined ? p.scale : 1.0,
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
      scale: 1.0,
      unit: '',
    };
    setParameterRows((prev) => [...prev, newRow]);
    setActiveEditingIndex(parameterRows.length);
  };

  // Handle row field change
  const handleRowChange = (index, field, value) => {
    setParameterRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      // Auto-generate key if typing display name and key was empty or auto-generated
      if (field === 'display_name' && (!row.key || row.key === updated[index].display_name.toLowerCase().replace(/[^a-z0-9]/g, '_'))) {
        row.key = value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
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
          scale: found.scale || 1.0,
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
        scale: Number(r.scale) !== undefined ? Number(r.scale) : 1.0,
        unit: r.unit.trim(),
      }));

    if (cleanedParams.length === 0) {
      setErrorMsg('Please add at least one parameter row in the Parameter Box.');
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1300px', margin: '0 auto' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            backgroundColor: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
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
                boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Meter Profiles
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>
                Catalog of configured device Modbus register profiles. Click <strong>"Add Meter Profile"</strong> to create a new profile.
              </p>
            </div>
          </div>

          {/* Add Meter Profile Button */}
          <button onClick={handleOpenCreatePage} style={btnPrimaryStyle}>
            <Plus size={16} />
            <span>Add Meter Profile</span>
          </button>
        </div>

        {/* Success / Error notification */}
        {successMsg && (
          <div style={{ padding: '12px 18px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#ffffff',
            padding: '14px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
            Total Profiles: <strong style={{ color: '#0284c7' }}>{meterProfiles.length}</strong>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Make, Model, Version..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px 7px 32px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.82rem',
                outline: 'none',
                width: '260px',
              }}
            />
          </div>
        </div>

        {/* Table View of Created Profiles */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>#</th>
                <th style={{ padding: '12px 16px' }}>Make</th>
                <th style={{ padding: '12px 16px' }}>Model</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Version</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Address Offset</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Function Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Byte Order</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Registers Count</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                    No meter profiles found. Click <strong>"Add Meter Profile"</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p, idx) => (
                  <tr
                    key={p.profile_id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                      {idx + 1}
                    </td>

                    {/* Make */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="#0284c7" />
                        <span>{p.make}</span>
                      </div>
                    </td>

                    {/* Model */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0369a1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={15} color="#64748b" />
                        <span>{p.model}</span>
                      </div>
                    </td>

                    {/* Version */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.74rem', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        v{p.profile_version || '1.0.0'}
                      </span>
                    </td>

                    {/* Offset */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                      {p.address_offset}
                    </td>

                    {/* Function Code */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.74rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                        {String(p.function_code || '3').length === 1 ? `0${p.function_code}` : p.function_code}
                      </span>
                    </td>

                    {/* Byte Order */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '4px' }}>
                        {p.byte_order || 'CDAB'}
                      </span>
                    </td>

                    {/* Registers count */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '3px 10px', borderRadius: '12px' }}>
                        {p.parameters?.length || 0} registers
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEditPage(p)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
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
                            border: '1px solid #fecdd3',
                            backgroundColor: '#fff1f2',
                            color: '#e11d48',
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIEW 2: CREATE / EDIT METER PROFILE PAGE (SHOWN WHEN ADD METER PROFILE IS CLICKED)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* ── TOP HEADER WITH BACK BUTTON ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#ffffff',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
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
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            title="Back to Profiles"
          >
            <ArrowLeft size={18} />
          </button>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {currentProfileId === 'NEW' ? 'Create Meter Profile' : `Edit Profile: ${profileForm.make} ${profileForm.model}`}
          </h2>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', color: '#9f1239', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#e11d48" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── FIRST ROW & SECOND ROW FORM ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* FIRST ROW: Profile version, make (dropdown), model (dropdown) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {/* Profile version */}
          <div>
            <label style={labelStyle}>Profile version</label>
            <input
              type="text"
              value={profileForm.profile_version}
              onChange={(e) => setProfileForm({ ...profileForm, profile_version: e.target.value })}
              placeholder="e.g. 1.0.0"
              style={inputStyle}
            />
          </div>

          {/* make (dropdown) */}
          <div>
            <label style={labelStyle}>Make</label>
            <select
              value={profileForm.make_id}
              onChange={(e) => handleMakeChange(e.target.value)}
              style={selectStyle}
            >
              {makes.map((m) => (
                <option key={m.make_id} value={m.make_id}>
                  {m.make_name}
                </option>
              ))}
            </select>
          </div>

          {/* model (dropdown) */}
          <div>
            <label style={labelStyle}>Model</label>
            <select
              value={profileForm.model_id}
              onChange={(e) => handleModelChange(e.target.value)}
              style={selectStyle}
            >
              {availableModels.map((mod) => (
                <option key={mod.model_id} value={mod.model_id}>
                  {mod.model_name}
                </option>
              ))}
              {availableModels.length === 0 && (
                <option value="">No models registered for {profileForm.make}</option>
              )}
            </select>
          </div>
        </div>

        {/* SECOND ROW: Address Offset, Function code, byte order */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {/* Address Offset */}
          <div>
            <label style={labelStyle}>Address Offset</label>
            <input
              type="number"
              value={profileForm.address_offset}
              onChange={(e) => setProfileForm({ ...profileForm, address_offset: Number(e.target.value) })}
              placeholder="-40001"
              style={inputStyle}
            />
          </div>

          {/* Function code */}
          <div>
            <label style={labelStyle}>Function code</label>
            <input
              type="text"
              value={profileForm.function_code}
              onChange={(e) => setProfileForm({ ...profileForm, function_code: e.target.value })}
              placeholder="e.g. 3 or 03"
              style={inputStyle}
            />
          </div>

          {/* byte order */}
          <div>
            <label style={labelStyle}>Byte order</label>
            <input
              type="text"
              value={profileForm.byte_order}
              onChange={(e) => setProfileForm({ ...profileForm, byte_order: e.target.value })}
              placeholder="e.g. CDAB, ABCD"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ── SEPARATE BOX BELOW THESE FIELDS: "PARAMETER BOX" ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Parameter Box Top Header */}
        <div
          style={{
            padding: '16px 22px',
            backgroundColor: '#f8fafc',
            borderBottom: '1.5px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Parameter Box
            </h3>
            <span
              style={{
                fontSize: '0.74rem',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {parameterRows.length} Rows
            </span>
          </div>

          {/* Add Row Button in top right of the box */}
          <button
            type="button"
            onClick={handleAddRow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
          >
            <Plus size={16} />
            <span>Add Row</span>
          </button>
        </div>

        {/* Multiple Rows Table inside Parameter Box */}
        <div style={{ overflowX: 'auto', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 12px', width: '38px', borderRadius: '6px 0 0 6px' }}>#</th>
                <th style={{ padding: '10px 12px', width: '22%' }}>Key</th>
                <th style={{ padding: '10px 12px', width: '22%' }}>Display Name</th>
                <th style={{ padding: '10px 12px', width: '13%' }}>Address</th>
                <th style={{ padding: '10px 12px', width: '15%' }}>Data Type</th>
                <th style={{ padding: '10px 12px', width: '10%' }}>Scale</th>
                <th style={{ padding: '10px 12px', width: '10%' }}>Unit</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px', borderRadius: '0 6px 6px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parameterRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '42px', textAlign: 'center', color: '#94a3b8' }}>
                    No rows in Parameter Box. Click <strong>"Add Row"</strong> in the top right to start adding registers.
                  </td>
                </tr>
              ) : (
                parameterRows.map((row, index) => {
                  const isHighlighted = activeEditingIndex === index;
                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isHighlighted ? '#f0f9ff' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Row # */}
                      <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '0.76rem' }}>
                        {index + 1}
                      </td>

                      {/* key */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) => handleRowChange(index, 'key', e.target.value)}
                          placeholder="e.g. power_active_total"
                          style={{
                            ...tableInputStyle,
                            fontFamily: 'monospace',
                            color: '#0284c7',
                            fontWeight: 600,
                          }}
                        />
                      </td>

                      {/* display name */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <input
                            type="text"
                            value={row.display_name}
                            onChange={(e) => handleRowChange(index, 'display_name', e.target.value)}
                            placeholder="e.g. Watts Total"
                            style={{ ...tableInputStyle, fontWeight: 600, color: '#0f172a' }}
                          />
                          {/* Quick catalog helper */}
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleFillFromCatalog(index, e.target.value);
                            }}
                            style={{
                              fontSize: '0.68rem',
                              border: 'none',
                              color: '#94a3b8',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              outline: 'none',
                              padding: '0',
                            }}
                          >
                            <option value="" disabled>💡 Pick from Standard Catalog...</option>
                            {standardParameters.map((sp) => (
                              <option key={sp.key} value={sp.key}>
                                {sp.display_name} ({sp.unit || 'unit'})
                              </option>
                            ))}
                          </select>
                        </div>
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
                            color: '#0f172a',
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
                          <option value="float32">float32 (2 Regs)</option>
                          <option value="uint32">uint32 (2 Regs)</option>
                          <option value="int32">int32 (2 Regs)</option>
                          <option value="uint16">uint16 (1 Reg)</option>
                          <option value="int16">int16 (1 Reg)</option>
                        </select>
                      </td>

                      {/* scale */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          step="any"
                          value={row.scale}
                          onChange={(e) => handleRowChange(index, 'scale', e.target.value)}
                          placeholder="1.0"
                          style={{ ...tableInputStyle, textAlign: 'center', fontFamily: 'monospace' }}
                        />
                      </td>

                      {/* unit */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
                          placeholder="W"
                          style={{ ...tableInputStyle, textAlign: 'center', fontWeight: 600 }}
                        />
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


      </div>

      {/* ── BOTTOM ACTIONS BAR ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <button onClick={() => setViewMode('list')} style={btnSecondaryStyle}>
          Cancel & Return to List
        </button>

        <button onClick={handleSaveProfile} style={btnPrimaryStyle}>
          <Save size={15} />
          <span>Save Meter Profile</span>
        </button>
      </div>
    </div>
  );
};

// Styles
const labelStyle = {
  display: 'block',
  fontSize: '0.84rem',
  color: '#334155',
  fontWeight: 700,
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '0.86rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '0.86rem',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const tableInputStyle = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#0284c7',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 18px',
  fontSize: '0.84rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
};

const btnSecondaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  color: '#334155',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
};
