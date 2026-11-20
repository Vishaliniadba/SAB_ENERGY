import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Plus,
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
import { ConcernRecord } from '../api/serviceMasterApi';
import '../styles/serviceMaster.css';

export const ConcernMasterPage: React.FC = () => {
  const {
    concerns = [],
    locations = [],
    isDbLoading,
    addConcern,
    updateConcern,
    deleteConcern,
  } = useEnergyData();

  // ─── Filter States ─────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // ─── Modal & Notification State ───────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Concern Form Fields ──────────────────────────────────────────────────
  const [conCode, setConCode] = useState('');
  const [conName, setConName] = useState('');
  const [conCity, setConCity] = useState('');
  const [conStatus, setConStatus] = useState<'Active' | 'Inactive'>('Active');

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
    setConCode(`CON-${Math.floor(10 + Math.random() * 90)}`);
    setConName('');
    setConCity('Perundurai / Erode');
    setConStatus('Active');
    setIsModalOpen(true);
  };

  // ─── Open Modal for EDIT ──────────────────────────────────────────────────
  const handleOpenEditModal = (row: ConcernRecord) => {
    setEditingId(row.id);
    setErrorMsg('');
    setConCode(row.concern_code || '');
    setConName(row.concern_name || '');
    setConCity(row.city || '');
    setConStatus(row.status || 'Active');
    setIsModalOpen(true);
  };

  // ─── Submit Add/Edit Form ─────────────────────────────────────────────────
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!conName.trim()) {
      notifyError('Please enter a valid Concern / Company Name.');
      return;
    }
    if (!conCode.trim()) {
      notifyError('Please enter a Concern Code.');
      return;
    }

    if (editingId) {
      updateConcern(editingId, {
        concern_code: conCode.trim(),
        concern_name: conName.trim(),
        email: '',
        city: conCity.trim(),
        status: conStatus,
      });
      notifySuccess(`Concern "${conName}" updated successfully.`);
    } else {
      addConcern({
        concern_code: conCode.trim(),
        concern_name: conName.trim(),
        email: '',
        city: conCity.trim(),
        status: conStatus,
      });
      notifySuccess(`Concern "${conName}" created successfully.`);
    }

    setIsModalOpen(false);
  };

  // ─── Delete Handler ───────────────────────────────────────────────────────
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    deleteConcern(id);
    notifySuccess(`Concern "${name}" deleted.`);
  };

  // ─── Filtered Data Memo ───────────────────────────────────────────────────
  const filteredConcerns = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return concerns.filter((c) => {
      const matchesSearch =
        !q ||
        (c.concern_name || '').toLowerCase().includes(q) ||
        (c.concern_code || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [concerns, searchTerm, statusFilter]);

  // ─── Table Columns ────────────────────────────────────────────────────────
  const concernColumns: ColumnDef<ConcernRecord>[] = [
    {
      header: 'Concern Code',
      width: '120px',
      render: (row) => <span className="entity-code-badge">{row.concern_code}</span>,
    },
    {
      header: 'Concern / Company Name',
      render: (row) => (
        <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{row.concern_name}</div>
      ),
    },
    {
      header: 'City / Region',
      render: (row) => (
        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          {row.city || '—'}
        </span>
      ),
    },
    {
      header: 'Linked Locations',
      width: '130px',
      align: 'center',
      render: (row) => {
        const count = locations.filter((l) => l.concern_name === row.concern_name).length;
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#1D4ED8',
              fontWeight: 700,
              fontSize: '0.72rem',
            }}
          >
            {count} {count === 1 ? 'Floor/Site' : 'Floors/Sites'}
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
            title="Edit Concern"
            onClick={() => handleOpenEditModal(row)}
          >
            <Edit3 size={13} />
          </button>
          <button
            className="master-action-btn delete"
            title="Delete Concern"
            onClick={() => handleDelete(row.id, row.concern_name)}
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
              placeholder={PLACEHOLDERS.concern.search}
              className="master-form-input"
              style={{ paddingLeft: '32px', height: '36px' }}
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
            {concerns.length} Concerns Registered
          </span>
        </div>

        <div className="master-toolbar-right">
          <button className="master-btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={15} />
            Add Concern
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <DataTable
        columns={concernColumns}
        data={filteredConcerns}
        rowKey="id"
        isLoading={isDbLoading}
        emptyMessage="No concern records found matching your filters."
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Concern' : 'Add New Concern'}
        subtitle="Define the client company or organizational entity."
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

          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">
                Concern Code <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={conCode}
                onChange={(e) => setConCode(e.target.value)}
                placeholder={PLACEHOLDERS.concern.code}
                className="master-form-input"
              />
            </div>

            <div className="master-form-group">
              <label className="master-form-label">Operational Status</label>
              <Select2
                value={conStatus}
                onChange={(val) => setConStatus(val as any)}
                placeholder={PLACEHOLDERS.select.status}
                searchable={false}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <div className="master-form-group">
            <label className="master-form-label">
              Concern / Company Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              value={conName}
              onChange={(e) => setConName(e.target.value)}
              placeholder={PLACEHOLDERS.concern.name}
              className="master-form-input"
            />
          </div>

          <div className="master-form-group">
            <label className="master-form-label">City / Region</label>
            <input
              type="text"
              value={conCity}
              onChange={(e) => setConCity(e.target.value)}
              placeholder={PLACEHOLDERS.concern.city}
              className="master-form-input"
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

export default ConcernMasterPage;

