import React, { useState, useMemo } from 'react';
import {
  Zap,
  Building2,
  MapPin,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useEnergyData } from '../../../../context/EnergyDataContext';
import { DataTable, ColumnDef } from '../../../../components/common/DataTable';
import { Modal } from '../../../../components/common/Modal';
import { Select2 } from '../../../../components/common/Select2';
import { PLACEHOLDERS } from '../../../../constants/placeholders';
import { ServiceNoRecord } from '../api/serviceMasterApi';
import '../styles/serviceMaster.css';

export const ServiceNoMasterPage: React.FC = () => {
  const {
    concerns = [],
    locations = [],
    serviceNos = [],
    meters = [],
    isDbLoading,
    addServiceNo,
    updateServiceNo,
    deleteServiceNo,
    updateMeter,
  } = useEnergyData();

  // ─── Filter States ─────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [concernFilter, setConcernFilter] = useState('All');

  // ─── Modal & Notification State ───────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Service No Form Fields ───────────────────────────────────────────────
  const [svcNo, setSvcNo] = useState('');
  const [subMeterCount, setSubMeterCount] = useState<number>(1);
  const [subMeterNames, setSubMeterNames] = useState<string[]>(['']);
  const [svcConcern, setSvcConcern] = useState('');
  const [svcLocation, setSvcLocation] = useState('');
  const [svcMeterTag, setSvcMeterTag] = useState('');
  const [svcLoadKw, setSvcLoadKw] = useState('250');
  const [svcTariff, setSvcTariff] = useState('HT-1A (Industrial 11kV)');
  const [svcPf, setSvcPf] = useState('0.98');
  const [svcStatus, setSvcStatus] = useState<'Active' | 'Inactive'>('Active');

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // Helper options for dropdowns in form
  const modalLocationOptions = useMemo(() => {
    return locations.filter((l) => l.concern_name === svcConcern);
  }, [locations, svcConcern]);

  // Handle dynamic sub-meter count change
  const handleSubMeterCountChange = (rawCount: number) => {
    const newCount = Math.max(0, Math.min(25, isNaN(rawCount) ? 0 : rawCount));
    setSubMeterCount(newCount);
    setSubMeterNames((prev) => {
      const next = [...prev];
      if (newCount > next.length) {
        while (next.length < newCount) {
          next.push('');
        }
      } else {
        return next.slice(0, newCount);
      }
      return next;
    });
  };

  const handleSubMeterNameChange = (idx: number, val: string) => {
    setSubMeterNames((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // ─── Open Modal for CREATE ────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setErrorMsg('');
    const defaultConcern = concerns[0]?.concern_name || '';
    const matchingLocs = locations.filter((l) => l.concern_name === defaultConcern);
    const defaultLocation = matchingLocs[0]?.location_name || locations[0]?.location_name || '';
    setSvcNo(`SC-03-241-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSubMeterCount(1);
    setSubMeterNames(['']);
    setSvcConcern(defaultConcern);
    setSvcLocation(defaultLocation);
    setSvcMeterTag(meters[0]?.tag || meters[0]?.meter_serial_number || '');
    setSvcLoadKw('250');
    setSvcTariff('HT-1A (Industrial 11kV)');
    setSvcPf('0.98');
    setSvcStatus('Active');
    setIsModalOpen(true);
  };

  // ─── Open Modal for EDIT ──────────────────────────────────────────────────
  const handleOpenEditModal = (row: ServiceNoRecord) => {
    setEditingId(row.id);
    setErrorMsg('');
    setSvcNo(row.service_no || '');
    
    // Resolve sub meters from saved record
    const count = typeof row.sub_meter_count === 'number'
      ? row.sub_meter_count
      : (row.sub_meters && Array.isArray(row.sub_meters))
      ? row.sub_meters.length
      : row.meter_name || row.service_name
      ? 1
      : 0;

    const names = (row.sub_meters && Array.isArray(row.sub_meters) && row.sub_meters.length > 0)
      ? [...row.sub_meters]
      : row.meter_name
      ? [row.meter_name]
      : row.service_name && row.service_name !== row.service_no
      ? [row.service_name]
      : [];

    while (names.length < count) {
      names.push('');
    }

    setSubMeterCount(count);
    setSubMeterNames(names.slice(0, count));
    setSvcConcern(row.concern_name || '');
    setSvcLocation(row.location_name || '');
    setSvcMeterTag(row.meter_tag || '');
    setSvcLoadKw(String(row.sanctioned_load_kw || 250));
    setSvcTariff(row.tariff_category || 'HT-1A (Industrial 11kV)');
    setSvcPf(String(row.power_factor_target || 0.98));
    setSvcStatus(row.status || 'Active');
    setIsModalOpen(true);
  };

  // ─── Submit Add/Edit Form ─────────────────────────────────────────────────
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!svcNo.trim()) {
      notifyError('Please enter an EB Service Connection Number.');
      return;
    }
    if (!svcConcern.trim()) {
      notifyError('Please select a Concern.');
      return;
    }
    if (!svcLocation.trim()) {
      notifyError('Please select a Location.');
      return;
    }

    // Validate each generated sub-meter field when count > 0
    if (subMeterCount > 0) {
      for (let i = 0; i < subMeterCount; i++) {
        if (!subMeterNames[i] || !subMeterNames[i].trim()) {
          notifyError(`Please enter a name for Sub-Meter ${i + 1}.`);
          return;
        }
      }
    }

    const cleanedSubMeters = subMeterNames.map(s => s.trim()).filter(Boolean);
    const primaryMeterName = cleanedSubMeters[0] || '';

    const payload = {
      service_no: svcNo.trim(),
      service_name: primaryMeterName || svcNo.trim(),
      meter_name: primaryMeterName,
      sub_meter_count: subMeterCount,
      sub_meters: cleanedSubMeters,
      concern_name: svcConcern.trim(),
      location_name: svcLocation.trim(),
      meter_tag: primaryMeterName || svcMeterTag.trim(),
      meter_serial_number: primaryMeterName || svcMeterTag.trim(),
      sanctioned_load_kw: Number(svcLoadKw) || 250,
      tariff_category: svcTariff.trim(),
      power_factor_target: Number(svcPf) || 0.98,
      status: svcStatus,
    };

    if (editingId) {
      updateServiceNo(editingId, payload);
      notifySuccess(`Service Connection "${svcNo}" updated successfully.`);
    } else {
      addServiceNo(payload);
      notifySuccess(`Service Connection "${svcNo}" created successfully.`);
    }

    // If sub-meter names match registered meters, link them
    if (cleanedSubMeters.length > 0 && updateMeter) {
      cleanedSubMeters.forEach((subName) => {
        const cleanSub = subName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = meters.find((m) => {
          const cName = (m.customName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const mName = (m.Meter_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const tag = (m.tag || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const serial = (m.meter_serial_number || m.serialNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            (cleanSub && (cName === cleanSub || mName === cleanSub || tag === cleanSub || serial === cleanSub)) ||
            m.customName?.toLowerCase() === subName.toLowerCase() ||
            m.Meter_name?.toLowerCase() === subName.toLowerCase()
          );
        });
        if (target) {
          updateMeter(target.Meter_id, {
            serviceNo: svcNo.trim(),
            concern: svcConcern.trim(),
            placementLocation: svcLocation.trim(),
          });
        }
      });
    }

    setIsModalOpen(false);
  };

  // ─── Delete Handler ───────────────────────────────────────────────────────
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    deleteServiceNo(id);
    notifySuccess(`Service No "${name}" deleted.`);
  };

  // ─── Filtered Data Memo ───────────────────────────────────────────────────
  const filteredServiceNos = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return serviceNos.filter((s) => {
      const subMetersMatch = s.sub_meters?.some((sm) => sm.toLowerCase().includes(q));
      const meterNameMatch = (s.meter_name || '').toLowerCase().includes(q);
      const matchesSearch =
        !q ||
        (s.service_no || '').toLowerCase().includes(q) ||
        (s.service_name || '').toLowerCase().includes(q) ||
        meterNameMatch ||
        subMetersMatch ||
        (s.tariff_category || '').toLowerCase().includes(q) ||
        (s.meter_tag || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesConcern = concernFilter === 'All' || s.concern_name === concernFilter;
      return matchesSearch && matchesStatus && matchesConcern;
    });
  }, [serviceNos, searchTerm, statusFilter, concernFilter]);

  // ─── Table Columns ────────────────────────────────────────────────────────
  const serviceNoColumns: ColumnDef<ServiceNoRecord>[] = [
    {
      header: 'EB Service Connection',
      width: '280px',
      render: (row) => {
        const meterName = row.meter_name || row.sub_meters?.[0] || row.service_name || '';
        const displayText = meterName && meterName !== row.service_no
          ? `${row.service_no} (${meterName})`
          : row.service_no;
        return (
          <span className="service-no-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} style={{ color: '#2563EB', flexShrink: 0 }} />
            <strong style={{ fontWeight: 650 }}>{displayText}</strong>
          </span>
        );
      },
    },
    {
      header: 'Connected Sub-Meters',
      render: (row) => {
        const count = Number(row.sub_meter_count ?? row.sub_meters?.length ?? (row.meter_name || row.service_name ? 1 : 0));
        const list = row.sub_meters && Array.isArray(row.sub_meters) && row.sub_meters.length > 0
          ? row.sub_meters
          : row.meter_name
          ? [row.meter_name]
          : row.service_name && row.service_name !== row.service_no
          ? [row.service_name]
          : [];

        if (list.length === 0) {
          return <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>0 Sub-Meters</span>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {list.map((sm, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: i === 0 ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card-secondary, #F1F5F9)',
                    color: i === 0 ? '#1D4ED8' : 'var(--text-primary)',
                    border: i === 0 ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid var(--border-color, #E2E8F0)',
                  }}
                  title={i === 0 ? 'Primary Meter' : `Sub-Meter ${i + 1}`}
                >
                  {i === 0 ? `★ ${sm}` : sm}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {count || list.length} Sub-Meter{(count || list.length) === 1 ? '' : 's'} Configured
            </div>
          </div>
        );
      },
    },
    {
      header: 'Concern & Location',
      render: (row) => (
        <div>
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.concern_name}
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
            {row.location_name}
          </div>
        </div>
      ),
    },
    {
      header: 'Sanctioned Load',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
          {row.sanctioned_load_kw} kW
        </span>
      ),
    },
    {
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (row) => (
        <span className={`status-pill ${row.status.toLowerCase()}`}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.status === 'Active' ? '#16A34A' : '#94A3B8' }} />
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      width: '90px',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button
            className="master-action-btn edit"
            title="Edit Service Connection"
            onClick={() => handleOpenEditModal(row)}
          >
            <Edit3 size={13} />
          </button>
          <button
            className="master-action-btn delete"
            title="Delete Service Connection"
            onClick={() => handleDelete(row.id, row.service_no)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="service-master-container">
      {/* ── Notification Banners ── */}
      {successMsg && (
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '7px',
            color: '#1E40AF',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '7px',
            color: '#991B1B',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* ── Toolbar & Filter Bar ── */}
      <div className="master-toolbar">
        <div className="master-toolbar-left">
          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={PLACEHOLDERS.service.search}
              className="master-form-input"
              style={{ paddingLeft: '32px', height: '36px' }}
            />
          </div>

          {/* Concern Filter */}
          <div style={{ minWidth: '180px' }}>
            <Select2
              value={concernFilter}
              onChange={(val) => setConcernFilter(val)}
              size="sm"
              searchable={concerns.length >= 4}
              options={[
                { value: 'All', label: PLACEHOLDERS.general.allConcerns },
                ...concerns.map((c) => ({ value: c.concern_name, label: c.concern_name })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '135px' }}>
            <Select2
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              size="sm"
              searchable={false}
              options={[
                { value: 'All', label: PLACEHOLDERS.general.allStatuses },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 650,
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(12, 30, 54, 0.08)',
              color: '#0C1E36',
              border: '1px solid rgba(12, 30, 54, 0.20)',
              whiteSpace: 'nowrap',
            }}
          >
            {serviceNos.length} Service Numbers Registered
          </span>
        </div>

        <div className="master-toolbar-right">
          <button className="master-btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={15} />
            Add Service No
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <DataTable
        columns={serviceNoColumns}
        data={filteredServiceNos}
        rowKey="id"
        isLoading={isDbLoading}
        emptyMessage="No service numbers found. Click '+ Add Service No' to link an EB connection."
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Service Connection' : 'Add New Service Connection'}
        subtitle="Configure electricity connection number, connected sub-meters, and plant location."
        maxWidth="660px"
      >
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                color: '#991B1B',
                fontSize: '0.78rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">
                Concern <span className="required">*</span>
              </label>
              <Select2
                value={svcConcern}
                onChange={(newCon) => {
                  setSvcConcern(newCon);
                  const matchLoc = locations.find((l) => l.concern_name === newCon);
                  setSvcLocation(matchLoc ? matchLoc.location_name : '');
                }}
                placeholder={PLACEHOLDERS.concern.select}
                searchable={concerns.length >= 4}
                options={concerns.map((c) => ({
                  value: c.concern_name,
                  label: c.concern_name,
                }))}
              />
            </div>

            <div className="master-form-group">
              <label className="master-form-label">
                Plant Location <span className="required">*</span>
              </label>
              <Select2
                value={svcLocation}
                onChange={(val) => setSvcLocation(val)}
                placeholder={PLACEHOLDERS.location.select}
                searchable={modalLocationOptions.length >= 4}
                options={modalLocationOptions.map((l) => ({
                  value: l.location_name,
                  label: l.location_name,
                }))}
              />
            </div>
          </div>

          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">
                EB Service Connection No <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={svcNo}
                onChange={(e) => setSvcNo(e.target.value)}
                placeholder={PLACEHOLDERS.service.number}
                className="master-form-input"
              />
            </div>

            <div className="master-form-group">
              <label className="master-form-label">
                Number of Sub-Meters <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSubMeterCountChange(subMeterCount - 1)}
                  disabled={subMeterCount <= 0}
                  className="master-btn-secondary"
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #CBD5E1)',
                    backgroundColor: subMeterCount <= 0 ? 'var(--bg-disabled, #F1F5F9)' : 'var(--bg-card, #FFFFFF)',
                    cursor: subMeterCount <= 0 ? 'not-allowed' : 'pointer',
                    color: subMeterCount <= 0 ? '#94A3B8' : '#334155',
                    userSelect: 'none',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  title="Decrease count (or mouse scroll down)"
                >
                  <Minus size={15} />
                </button>

                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={subMeterCount}
                    onChange={(e) => handleSubMeterCountChange(parseInt(e.target.value, 10))}
                    onWheel={(e) => {
                      if (e.deltaY < 0) {
                        handleSubMeterCountChange(subMeterCount + 1);
                      } else if (e.deltaY > 0) {
                        handleSubMeterCountChange(subMeterCount - 1);
                      }
                    }}
                    className="master-form-input"
                    style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      width: '100%',
                    }}
                    placeholder="0"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSubMeterCountChange(subMeterCount + 1)}
                  disabled={subMeterCount >= 25}
                  className="master-btn-secondary"
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #CBD5E1)',
                    backgroundColor: subMeterCount >= 25 ? 'var(--bg-disabled, #F1F5F9)' : 'var(--bg-card, #FFFFFF)',
                    cursor: subMeterCount >= 25 ? 'not-allowed' : 'pointer',
                    color: subMeterCount >= 25 ? '#94A3B8' : '#334155',
                    userSelect: 'none',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  title="Increase count (or mouse scroll up)"
                >
                  <Plus size={15} />
                </button>
              </div>
              <span
                style={{
                  fontSize: '0.70rem',
                  color: 'var(--text-secondary, #64748B)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Scroll mouse wheel 🖱️ over the box or click + / − to change count (1, 2, 3...)
              </span>
            </div>
          </div>

          {/* Dynamically Generated Sub-Meter Fields */}
          {subMeterCount > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #64748B)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Sub-Meter Configuration ({subMeterCount})</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--primary, #0D9488)' }}>
                  Associated with {svcNo || 'this connection'}
                </span>
              </div>

              <div
                className="master-form-grid"
                style={{
                  gridTemplateColumns: subMeterCount === 1 ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                }}
              >
                {Array.from({ length: subMeterCount }).map((_, idx) => (
                  <div className="master-form-group" key={idx} style={{ marginBottom: 0 }}>
                    <label className="master-form-label">
                      Sub-Meter {idx + 1} Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subMeterNames[idx] || ''}
                      onChange={(e) => handleSubMeterNameChange(idx, e.target.value)}
                      placeholder={`e.g. Sub-Meter #${idx + 1} Name`}
                      className="master-form-input"
                      list={`sub-meter-suggestions-${idx}`}
                    />
                    <datalist id={`sub-meter-suggestions-${idx}`}>
                      {meters.map((m) => (
                        <option
                          key={m.Meter_id}
                          value={m.customName || m.Meter_name || m.tag || ''}
                        />
                      ))}
                    </datalist>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="master-form-group">
            <label className="master-form-label">Operational Status</label>
            <Select2
              value={svcStatus}
              onChange={(val) => setSvcStatus(val as any)}
              placeholder={PLACEHOLDERS.select.status}
              searchable={false}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>

          {/* Modal Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color, #E2E8E5)',
            }}
          >
            <button
              type="button"
              className="master-btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="master-btn-primary">
              <Check size={15} />
              {editingId ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServiceNoMasterPage;

