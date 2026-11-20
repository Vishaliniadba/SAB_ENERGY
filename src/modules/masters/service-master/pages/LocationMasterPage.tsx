import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useEnergyData } from '../../../../context/EnergyDataContext';
import { LocationPinIcon } from '../../../../components/common/CardIcons';
import { DataTable, ColumnDef } from '../../../../components/common/DataTable';
import { Modal } from '../../../../components/common/Modal';
import { Select2 } from '../../../../components/common/Select2';
import { PLACEHOLDERS } from '../../../../constants/placeholders';
import { LocationRecord } from '../api/serviceMasterApi';
import '../styles/serviceMaster.css';

export const LocationMasterPage: React.FC = () => {
  const {
    concerns = [],
    locations = [],
    serviceNos = [],
    isDbLoading,
    addLocation,
    updateLocation,
    deleteLocation,
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

  // ─── Location Form Fields ─────────────────────────────────────────────────
  const [locName, setLocName] = useState('');
  const [locConcern, setLocConcern] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [locAreaType, setLocAreaType] = useState('North Zone');
  const [locStatus, setLocStatus] = useState<'Active' | 'Inactive'>('Active');

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

  // ─── Open Modal for CREATE ────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setErrorMsg('');
    const defaultConcern = concerns[0]?.concern_name || '';
    setLocName('');
    setLocConcern(defaultConcern);
    setLocFloor('Ground Floor');
    setLocAreaType('North Zone');
    setLocStatus('Active');
    setIsModalOpen(true);
  };

  // ─── Open Modal for EDIT ──────────────────────────────────────────────────
  const handleOpenEditModal = (row: LocationRecord) => {
    setEditingId(row.id);
    setErrorMsg('');
    setLocName(row.location_name || '');
    setLocConcern(row.concern_name || '');
    setLocFloor(row.floor || '');
    setLocAreaType(row.area_type || 'North Zone');
    setLocStatus(row.status || 'Active');
    setIsModalOpen(true);
  };

  // ─── Submit Add/Edit Form ─────────────────────────────────────────────────
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locName.trim()) {
      notifyError('Please enter a valid Location Name.');
      return;
    }
    if (!locConcern.trim()) {
      notifyError('Please select a Concern for this location.');
      return;
    }

    if (editingId) {
      updateLocation(editingId, {
        location_code: '',
        location_name: locName.trim(),
        concern_name: locConcern.trim(),
        building: '',
        floor: locFloor.trim(),
        area_type: locAreaType.trim(),
        status: locStatus,
      });
      notifySuccess(`Location "${locName}" updated successfully.`);
    } else {
      addLocation({
        location_code: '',
        location_name: locName.trim(),
        concern_name: locConcern.trim(),
        building: '',
        floor: locFloor.trim(),
        area_type: locAreaType.trim(),
        status: locStatus,
      });
      notifySuccess(`Location "${locName}" created successfully.`);
    }

    setIsModalOpen(false);
  };

  // ─── Delete Handler ───────────────────────────────────────────────────────
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    deleteLocation(id);
    notifySuccess(`Location "${name}" deleted.`);
  };

  // ─── Filtered Data Memo ───────────────────────────────────────────────────
  const filteredLocations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return locations.filter((l) => {
      const matchesSearch =
        !q ||
        (l.location_name || '').toLowerCase().includes(q) ||
        (l.area_type || '').toLowerCase().includes(q) ||
        (l.floor || '').toLowerCase().includes(q) ||
        (l.concern_name || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchesConcern = concernFilter === 'All' || l.concern_name === concernFilter;
      return matchesSearch && matchesStatus && matchesConcern;
    });
  }, [locations, searchTerm, statusFilter, concernFilter]);

  // ─── Table Columns ────────────────────────────────────────────────────────
  const locationColumns: ColumnDef<LocationRecord>[] = [
    {
      header: 'Location Name',
      render: (row) => (
        <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{row.location_name}</div>
      ),
    },
    {
      header: 'Concern Entity',
      render: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.76rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <Building2 size={13} style={{ color: '#2563EB' }} />
          {row.concern_name}
        </span>
      ),
    },
    {
      header: 'Area / Zone',
      width: '130px',
      render: (row) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 9px',
            borderRadius: '6px',
            backgroundColor: 'rgba(254, 175, 4, 0.12)',
            color: '#B45309',
            fontWeight: 700,
            fontSize: '0.74rem',
          }}
        >
          {row.area_type || 'North Zone'}
        </span>
      ),
    },
    {
      header: 'Floor / Level',
      width: '120px',
      render: (row) => (
        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          {row.floor || 'Ground / 1st Floor'}
        </span>
      ),
    },
    {
      header: 'Linked Services',
      width: '120px',
      align: 'center',
      render: (row) => {
        const count = serviceNos.filter((s) => s.location_name === row.location_name).length;
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#1D4ED8',
              fontWeight: 750,
              fontSize: '0.72rem',
            }}
          >
            {count} {count === 1 ? 'Connection' : 'Connections'}
          </span>
        );
      },
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
            title="Edit Location"
            onClick={() => handleOpenEditModal(row)}
          >
            <Edit3 size={13} />
          </button>
          <button
            className="master-action-btn delete"
            title="Delete Location"
            onClick={() => handleDelete(row.id, row.location_name)}
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
              placeholder={PLACEHOLDERS.location.search}
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
            {locations.length} Locations Registered
          </span>
        </div>

        <div className="master-toolbar-right">
          <button className="master-btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={15} />
            Add Location
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <DataTable
        columns={locationColumns}
        data={filteredLocations}
        rowKey="id"
        isLoading={isDbLoading}
        emptyMessage="No facility locations found. Click '+ Add Location' to create one."
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Location' : 'Add New Location'}
        subtitle="Specify physical plant site, floor, or substation room."
        maxWidth="600px"
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

          <div className="master-form-group">
            <label className="master-form-label">
              Belongs to Concern <span className="required">*</span>
            </label>
            <Select2
              value={locConcern}
              onChange={(val) => setLocConcern(val)}
              placeholder={PLACEHOLDERS.concern.select}
              searchable={concerns.length >= 4}
              options={concerns.map((c) => ({
                value: c.concern_name,
                label: `${c.concern_name} (${c.concern_code})`,
              }))}
            />
          </div>

          <div className="master-form-group">
            <label className="master-form-label">
              Location Display Name <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder={PLACEHOLDERS.location.name}
              className="master-form-input"
            />
          </div>

          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">
                Area / Zone Function <span className="required">*</span>
              </label>
              <Select2
                value={locAreaType}
                onChange={(val) => setLocAreaType(val)}
                placeholder={PLACEHOLDERS.location.zone}
                searchable={false}
                options={[
                  { value: 'North Zone', label: 'North Zone' },
                  { value: 'South Zone', label: 'South Zone' },
                  { value: 'East Zone', label: 'East Zone' },
                  { value: 'West Zone', label: 'West Zone' },
                  { value: 'Central Zone', label: 'Central Zone' },
                ]}
              />
            </div>

            <div className="master-form-group">
              <label className="master-form-label">Floor / Level</label>
              <input
                type="text"
                value={locFloor}
                onChange={(e) => setLocFloor(e.target.value)}
                placeholder={PLACEHOLDERS.location.floor}
                className="master-form-input"
              />
            </div>
          </div>

          <div className="master-form-group">
            <label className="master-form-label">Operational Status</label>
            <Select2
              value={locStatus}
              onChange={(val) => setLocStatus(val as any)}
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

export default LocationMasterPage;

