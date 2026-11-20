import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  Building2,
  MapPin,
  Eye,
  ChevronDown,
  X,
  Cpu,
  Columns,
  RefreshCw,
} from 'lucide-react';
import { useEnergyData } from '../../../context/EnergyDataContext';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { DataTable, ColumnDef } from '../../../components/common/DataTable';
import { InputField, SelectField } from '../../../components/common/FormField';
import type { AssetMappingRecord } from '../api/assetMappingApi';
import '../styles/assetMapping.css';

/* ═════════════════════════════════════════════════════════════════════
   Category Aesthetic Styling Palette
   ═════════════════════════════════════════════════════════════════════ */
const getCategoryStyle = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('incomer') || cat.includes('transformer')) {
    return { bg: 'rgba(37, 99, 235, 0.10)', color: '#1D4ED8', border: 'rgba(37, 99, 235, 0.25)', dot: '#2563EB' };
  }
  if (cat.includes('hvac') || cat.includes('chiller')) {
    return { bg: 'rgba(124, 58, 237, 0.10)', color: '#6D28D9', border: 'rgba(124, 58, 237, 0.25)', dot: '#7C3AED' };
  }
  if (cat.includes('ups') || cat.includes('battery')) {
    return { bg: 'rgba(217, 119, 6, 0.10)', color: '#B45309', border: 'rgba(217, 119, 6, 0.25)', dot: '#D97706' };
  }
  if (cat.includes('solar') || cat.includes('renewable')) {
    return { bg: 'rgba(5, 150, 105, 0.10)', color: '#047857', border: 'rgba(5, 150, 105, 0.25)', dot: '#059669' };
  }
  if (cat.includes('production') || cat.includes('machinery')) {
    return { bg: 'rgba(2, 132, 199, 0.10)', color: '#0369A1', border: 'rgba(2, 132, 199, 0.25)', dot: '#0284C7' };
  }
  if (cat.includes('compressor') || cat.includes('pneumatic')) {
    return { bg: 'rgba(234, 88, 12, 0.10)', color: '#C2410C', border: 'rgba(234, 88, 12, 0.25)', dot: '#EA580C' };
  }
  return { bg: 'rgba(71, 85, 105, 0.10)', color: '#334155', border: 'rgba(71, 85, 105, 0.25)', dot: '#64748B' };
};

/* ═════════════════════════════════════════════════════════════════════
   Asset Mapping Page Component
   ═════════════════════════════════════════════════════════════════════ */
export const AssetMappingPage: React.FC = () => {
  const {
    mappings = [],
    assets = [],
    meters = [],
    concerns = [],
    locations = [],
    isDbLoading,
    addMapping,
    updateMapping,
    deleteMapping,
  } = useEnergyData();

  // ── Normalize Mappings with Safe Fallbacks ──
  const normalizedRecords: AssetMappingRecord[] = useMemo(() => {
    return (mappings || []).map((m: any, idx: number) => {
      const linkedAsset = assets.find((a) => a.Asset_id === m.Asset_id);
      const linkedMeter = meters.find((mtr) => mtr.Meter_id === m.Meter_id);

      return {
        Mapping_id: m.Mapping_id || `MAP-${String(idx + 1).padStart(3, '0')}`,
        Asset_id: m.Asset_id || m.asset_id || linkedAsset?.Asset_id || `AST-${String(idx + 1).padStart(3, '0')}`,
        asset_name: m.asset_name || linkedAsset?.Asset_name || `Asset ${idx + 1}`,
        concern_name: m.concern_name || linkedAsset?.concern_name || 'NavaNala Spinning Mills',
        category_name: m.category_name || linkedAsset?.category_name || linkedAsset?.asset_type || 'Main Incomer & Transformer',
        location: m.location || linkedAsset?.location || 'Coimbatore Facility',
        zone: m.zone || linkedAsset?.zone || 'North Zone',
        building: m.building || linkedAsset?.building || 'Building 1 - Main Mill',
        department: m.department || linkedAsset?.department || 'Electrical Engineering',
        floor: m.floor || linkedAsset?.floor || 'Ground Floor',
        room_name: m.room_name || linkedAsset?.room_name || 'MCC Panel Room 1',
        details: m.details || linkedAsset?.description || 'Primary Substation Feeder',
        Meter_id: m.Meter_id || linkedMeter?.Meter_id || '',
        meter_name: m.meter_name || linkedMeter?.Meter_name || '',
        multiplication_factor: m.multiplication_factor || '1',
        effective_from: m.effective_from || '2026-01-01',
        effective_to: m.effective_to || '2027-12-31',
        is_active: m.is_active !== undefined ? m.is_active : true,
      };
    });
  }, [mappings, assets, meters]);

  // ── Search State ──
  const [searchTerm, setSearchTerm] = useState('');

  // ── Column Visibility Multi-Select Filter ──
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    asset_id: true,
    concern_name: true,
    category_name: true,
    location: true,
    zone: true,
    building: true,
    department: true,
    floor: true,
    room_name: true,
    details: true,
  });

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };
    if (isColumnMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isColumnMenuOpen]);

  // ── Details View Modal State ──
  const [detailsRecord, setDetailsRecord] = useState<AssetMappingRecord | null>(null);

  // ── Add / Edit Modal State ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AssetMappingRecord | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    Asset_id: '',
    asset_name: '',
    concern_name: 'NavaNala Spinning Mills',
    category_name: 'Main Incomer & Transformer',
    location: 'Coimbatore Facility',
    zone: 'North Zone',
    building: 'Building 1 - Main Mill',
    department: 'Electrical Engineering',
    floor: 'Ground Floor',
    room_name: 'MCC Panel Room 1',
    details: '',
    Meter_id: meters[0]?.Meter_id || '',
    multiplication_factor: '40',
    effective_from: '2026-01-01',
    effective_to: '2027-12-31',
    is_active: true,
  });

  // ── Open Modal for CREATE ──
  const handleOpenAdd = () => {
    setEditingMapping(null);
    const nextId = `AST-${String(normalizedRecords.length + 1).padStart(3, '0')}`;
    setFormData({
      Asset_id: nextId,
      asset_name: '',
      concern_name: concerns[0]?.concern_name || 'NavaNala Spinning Mills',
      category_name: 'Main Incomer & Transformer',
      location: locations[0]?.location_name || 'Coimbatore Facility',
      zone: 'North Zone',
      building: 'Building 1 - Main Mill',
      department: 'Electrical Engineering',
      floor: 'Ground Floor',
      room_name: '',
      details: '',
      Meter_id: meters[0]?.Meter_id || '',
      multiplication_factor: '40',
      effective_from: new Date().toISOString().substring(0, 10),
      effective_to: '2027-12-31',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // ── Open Modal for EDIT ──
  const handleOpenEdit = (rec: AssetMappingRecord) => {
    setEditingMapping(rec);
    setFormData({
      Asset_id: rec.Asset_id,
      asset_name: rec.asset_name || '',
      concern_name: rec.concern_name,
      category_name: rec.category_name,
      location: rec.location,
      zone: rec.zone,
      building: rec.building,
      department: rec.department,
      floor: rec.floor,
      room_name: rec.room_name,
      details: rec.details,
      Meter_id: rec.Meter_id || '',
      multiplication_factor: String(rec.multiplication_factor || '1'),
      effective_from: rec.effective_from,
      effective_to: rec.effective_to,
      is_active: rec.is_active !== false,
    });
    setIsModalOpen(true);
  };

  // ── Open Details View ──
  const handleOpenDetails = (rec: AssetMappingRecord) => {
    setDetailsRecord(rec);
  };

  // ── Form Submit ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Asset_id.trim()) {
      alert('Please enter a valid Asset ID.');
      return;
    }

    if (editingMapping) {
      updateMapping(editingMapping.Mapping_id, {
        ...formData,
        updated_at: new Date().toISOString(),
      });
      setSuccessMsg(`✓ Asset Mapping "${formData.Asset_id}" updated successfully.`);
    } else {
      addMapping({
        ...formData,
        Mapping_id: `MAP-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
      });
      setSuccessMsg(`✓ New Asset Mapping "${formData.Asset_id}" created successfully.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ── Filtered Records Based on Search ──
  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((rec) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          rec.Asset_id.toLowerCase().includes(q) ||
          rec.concern_name.toLowerCase().includes(q) ||
          rec.category_name.toLowerCase().includes(q) ||
          rec.location.toLowerCase().includes(q) ||
          rec.zone.toLowerCase().includes(q) ||
          rec.building.toLowerCase().includes(q) ||
          rec.department.toLowerCase().includes(q) ||
          rec.floor.toLowerCase().includes(q) ||
          rec.room_name.toLowerCase().includes(q) ||
          (rec.details && rec.details.toLowerCase().includes(q)) ||
          (rec.asset_name && rec.asset_name.toLowerCase().includes(q));

        if (!matches) return false;
      }

      return true;
    });
  }, [normalizedRecords, searchTerm]);

  // ── Construct Dynamic Table Columns Based on User Specification ──
  const tableColumns: ColumnDef<AssetMappingRecord>[] = useMemo(() => {
    const cols: ColumnDef<AssetMappingRecord>[] = [];

    // 1. Asset ID
    if (visibleColumns.asset_id) {
      cols.push({
        header: 'Asset ID',
        dataIndex: 'Asset_id',
        key: 'Asset_id',
        render: (row) => (
          <span
            className="mono-num"
            style={{
              fontWeight: 700,
              color: '#008FFB',
              backgroundColor: 'rgba(0, 143, 251, 0.08)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 143, 251, 0.22)',
              fontSize: '0.78rem',
              letterSpacing: '0.02em',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            {row.Asset_id}
          </span>
        ),
      });
    }

    // 2. Concern Name
    if (visibleColumns.concern_name) {
      cols.push({
        header: 'Concern Name',
        dataIndex: 'concern_name',
        key: 'concern_name',
        render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Building2 size={14} style={{ color: '#64748B', flexShrink: 0 }} />
            <span style={{ fontWeight: 650, color: '#0F172A', fontSize: '0.8125rem' }}>
              {row.concern_name}
            </span>
          </div>
        ),
      });
    }

    // 3. Category Name
    if (visibleColumns.category_name) {
      cols.push({
        header: 'Category Name',
        dataIndex: 'category_name',
        key: 'category_name',
        render: (row) => {
          const style = getCategoryStyle(row.category_name);
          return (
            <span
              className="asset-category-pill"
              style={{
                backgroundColor: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: style.dot,
                  display: 'inline-block',
                }}
              />
              {row.category_name}
            </span>
          );
        },
      });
    }

    // 4. Location
    if (visibleColumns.location) {
      cols.push({
        header: 'Location',
        dataIndex: 'location',
        key: 'location',
        render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} style={{ color: '#E11D48', flexShrink: 0 }} />
            <span style={{ color: '#1E293B', fontWeight: 550, fontSize: '0.80rem' }}>
              {row.location}
            </span>
          </div>
        ),
      });
    }

    // 5. Zone
    if (visibleColumns.zone) {
      cols.push({
        header: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        render: (row) => (
          <span style={{ color: '#334155', fontSize: '0.78rem', fontWeight: 500 }}>
            {row.zone}
          </span>
        ),
      });
    }

    // 6. Building
    if (visibleColumns.building) {
      cols.push({
        header: 'Building',
        dataIndex: 'building',
        key: 'building',
        render: (row) => (
          <span style={{ color: '#334155', fontSize: '0.78rem', fontWeight: 550 }}>
            {row.building}
          </span>
        ),
      });
    }

    // 7. Department
    if (visibleColumns.department) {
      cols.push({
        header: 'Department',
        dataIndex: 'department',
        key: 'department',
        render: (row) => (
          <span style={{ color: '#334155', fontSize: '0.78rem', fontWeight: 500 }}>
            {row.department}
          </span>
        ),
      });
    }

    // 8. Floor
    if (visibleColumns.floor) {
      cols.push({
        header: 'Floor',
        dataIndex: 'floor',
        key: 'floor',
        render: (row) => (
          <span
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#475569',
              whiteSpace: 'nowrap',
            }}
          >
            {row.floor}
          </span>
        ),
      });
    }

    // 9. Room Name
    if (visibleColumns.room_name) {
      cols.push({
        header: 'Room Name',
        dataIndex: 'room_name',
        key: 'room_name',
        render: (row) => (
          <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.78rem' }}>
            {row.room_name}
          </span>
        ),
      });
    }

    // 10. Details
    if (visibleColumns.details) {
      cols.push({
        header: 'Details',
        dataIndex: 'details',
        key: 'details',
        render: (row) => (
          <button
            type="button"
            className="btn-asset-details"
            onClick={() => handleOpenDetails(row)}
            title="Click to view complete asset details and meter telemetry"
          >
            <Eye size={13} color="#2563EB" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.details || 'View Details'}
            </span>
          </button>
        ),
      });
    }

    // 11. Actions
    cols.push({
      header: 'Actions',
      key: 'actions',
      align: 'center',
      width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => handleOpenEdit(row)}
            className="btn-icon"
            title="Edit Asset Mapping"
            aria-label="Edit Mapping"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete Asset Mapping "${row.Asset_id}"?`)) {
                deleteMapping(row.Mapping_id);
              }
            }}
            className="btn-icon"
            style={{ color: '#DC2626' }}
            title="Delete Mapping"
            aria-label="Delete Mapping"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    });

    return cols;
  }, [visibleColumns, deleteMapping]);

  return (
    <div className="asset-mapping-page">
      {/* ── Success Notification Banner ── */}
      {successMsg && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#065F46',
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

      {/* ── Informative Formula & Scaling Banner ── */}
      <div className="asset-mapping-banner">
        <div className="asset-mapping-banner-left">
          <div className="asset-mapping-banner-icon">
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
              Asset Telemetry & CT/PT Multiplier Mapping
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
              Maps physical facility assets to edge energy meters. Active Telemetry Power (kW) = Modbus Register Reading × CT/PT Ratio.
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 550 }}>
          Active Mappings: <strong style={{ color: '#008FFB' }}>{normalizedRecords.filter((m) => m.is_active).length}</strong> of {normalizedRecords.length}
        </div>
      </div>

      {/* ── Integrated Toolbar with Search, Column Filter & New Mapping ── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Quick Search */}
        <div style={{ position: 'relative', width: 320, minWidth: 240 }}>
          <Search
            size={14}
            color="#94A3B8"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by Asset ID, Room, Concern, Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 32,
              paddingRight: 30,
              fontSize: '0.80rem',
              borderRadius: 7,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Columns Visibility Multi-Select Filter & New Mapping Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Columns Visibility Multi-Select Filter */}
          <div className="multi-filter-wrapper" ref={columnMenuRef}>
            <button
              type="button"
              className="multi-filter-btn"
              onClick={() => setIsColumnMenuOpen((prev) => !prev)}
              title="Filter columns to show or hide in UI screen"
              style={{
                height: 36,
                padding: '0 14px',
                fontSize: '0.80rem',
                backgroundColor: '#FFFFFF',
                borderColor: isColumnMenuOpen ? '#3B82F6' : '#CBD5E1',
              }}
            >
              <Columns size={14} color="#64748B" />
              <span>Columns</span>
              <span className="multi-filter-count-badge" style={{ backgroundColor: '#475569' }}>
                {Object.values(visibleColumns).filter(Boolean).length}/10
              </span>
              <ChevronDown size={13} style={{ opacity: 0.7 }} />
            </button>

            {isColumnMenuOpen && (
              <div className="multi-filter-dropdown" style={{ right: 0, left: 'auto', minWidth: 210 }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #F1F5F9',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    color: '#334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Select Columns to Show</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allTrue = Object.fromEntries(
                        Object.keys(visibleColumns).map((k) => [k, true])
                      );
                      setVisibleColumns(allTrue);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Select All
                  </button>
                </div>
                <div className="multi-filter-list">
                  {[
                    { key: 'asset_id', label: 'Asset ID' },
                    { key: 'concern_name', label: 'Concern Name' },
                    { key: 'category_name', label: 'Category Name' },
                    { key: 'location', label: 'Location' },
                    { key: 'zone', label: 'Zone' },
                    { key: 'building', label: 'Building' },
                    { key: 'department', label: 'Department' },
                    { key: 'floor', label: 'Floor' },
                    { key: 'room_name', label: 'Room Name' },
                    { key: 'details', label: 'Details' },
                  ].map((col) => (
                    <label key={col.key} className="multi-filter-item">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={(e) =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [col.key]: e.target.checked,
                          }))
                        }
                      />
                      <span className="multi-filter-item-label">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Mapping Button */}
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ height: 36, padding: '0 16px' }}>
            <Plus size={15} />
            <span>New Mapping</span>
          </button>
        </div>
      </div>

      {/* ── Enterprise DataTable with Requested Columns ── */}
      <DataTable
        columns={tableColumns}
        data={filteredRecords}
        rowKey="Mapping_id"
        isLoading={isDbLoading}
        showIndexColumn={true}
        indexColumnHeader="#"
        emptyMessage={
          <span>
            No asset mappings found matching your search. Click <strong>"New Mapping"</strong> to create one.
          </span>
        }
        emptyAction={
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '6px' }}>
            <Plus size={14} />
            <span>New Mapping</span>
          </button>
        }
      />

      {/* ══ DETAILS VIEW MODAL ═════════════════════════════════════ */}
      {detailsRecord && (
        <Modal
          isOpen={Boolean(detailsRecord)}
          onClose={() => setDetailsRecord(null)}
          title={`Asset Details — ${detailsRecord.Asset_id}`}
          maxWidth="680px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Mapping ID: <strong className="mono-num">{detailsRecord.Mapping_id}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setDetailsRecord(null)} className="btn btn-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    const target = detailsRecord;
                    setDetailsRecord(null);
                    handleOpenEdit(target);
                  }}
                  className="btn btn-primary"
                >
                  <Edit3 size={14} />
                  <span>Edit Mapping</span>
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Modal Top Card */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  {detailsRecord.Asset_id}
                </div>
                <div style={{ fontSize: '0.80rem', color: '#64748B', marginTop: 2 }}>
                  {detailsRecord.asset_name || detailsRecord.details}
                </div>
              </div>
              <div>
                {(() => {
                  const style = getCategoryStyle(detailsRecord.category_name);
                  return (
                    <span
                      className="asset-category-pill"
                      style={{
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: style.dot,
                          display: 'inline-block',
                        }}
                      />
                      {detailsRecord.category_name}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* 2-Column Details Grid */}
            <div className="asset-details-grid">
              {/* Organizational & Spatial Location Hierarchy */}
              <div className="asset-details-card">
                <div className="asset-details-card-title">
                  <MapPin size={13} color="#2563EB" /> Spatial Hierarchy
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Concern Name</span>
                  <span className="asset-details-value">{detailsRecord.concern_name}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Location</span>
                  <span className="asset-details-value">{detailsRecord.location}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Zone</span>
                  <span className="asset-details-value">{detailsRecord.zone}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Building</span>
                  <span className="asset-details-value">{detailsRecord.building}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Department</span>
                  <span className="asset-details-value">{detailsRecord.department}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Floor</span>
                  <span className="asset-details-value">{detailsRecord.floor}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Room Name</span>
                  <span className="asset-details-value">{detailsRecord.room_name}</span>
                </div>
              </div>

              {/* Edge Meter & SCADA Telemetry Mapping */}
              <div className="asset-details-card">
                <div className="asset-details-card-title">
                  <Cpu size={13} color="#059669" /> Telemetry & Meter Specs
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Assigned Meter</span>
                  <span className="asset-details-value mono-num">
                    {detailsRecord.meter_name || detailsRecord.Meter_id || 'NavaNala_EB_Meter'}
                  </span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">CT/PT Multiplier</span>
                  <span className="asset-details-value mono-num" style={{ color: '#008FFB', fontWeight: 700 }}>
                    {detailsRecord.multiplication_factor}x
                  </span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Status</span>
                  <span className="asset-details-value">
                    <Badge status={detailsRecord.is_active ? 'Active' : 'Inactive'} text={detailsRecord.is_active ? 'Active' : 'Disabled'} />
                  </span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Effective From</span>
                  <span className="asset-details-value mono-num">{detailsRecord.effective_from}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Effective To</span>
                  <span className="asset-details-value mono-num">{detailsRecord.effective_to}</span>
                </div>
                <div className="asset-details-row">
                  <span className="asset-details-label">Equipment Details</span>
                  <span className="asset-details-value">{detailsRecord.details}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ ADD / EDIT MODAL ═══════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMapping ? `Edit Asset Mapping — ${editingMapping.Asset_id}` : 'New Asset Mapping'}
        maxWidth="640px"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingMapping ? 'Update Mapping' : 'Create Mapping'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <InputField
              label="Asset ID"
              required
              className="mono-num"
              value={formData.Asset_id}
              onChange={(e) => setFormData({ ...formData, Asset_id: e.target.value })}
              placeholder="e.g. AST-008"
            />

            <SelectField
              label="Category Name"
              required
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              options={[
                { value: 'Main Incomer & Transformer', label: 'Main Incomer & Transformer' },
                { value: 'UPS & Power Distribution', label: 'UPS & Power Distribution' },
                { value: 'HVAC & Chillers', label: 'HVAC & Chillers' },
                { value: 'Production Machinery', label: 'Production Machinery' },
                { value: 'Solar & Renewable', label: 'Solar & Renewable' },
                { value: 'Compressor & Pneumatics', label: 'Compressor & Pneumatics' },
                { value: 'Lighting & Auxiliary', label: 'Lighting & Auxiliary' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <SelectField
              label="Concern Name"
              required
              value={formData.concern_name}
              onChange={(e) => setFormData({ ...formData, concern_name: e.target.value })}
              options={
                concerns.length > 0
                  ? concerns.map((c: any) => ({ value: c.concern_name, label: c.concern_name }))
                  : [
                      { value: 'NavaNala Spinning Mills', label: 'NavaNala Spinning Mills' },
                      { value: 'SaB Energy Private Ltd', label: 'SaB Energy Private Ltd' },
                    ]
              }
            />

            <SelectField
              label="Location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              options={
                locations.length > 0
                  ? locations.map((l: any) => ({ value: l.location_name, label: l.location_name }))
                  : [
                      { value: 'Coimbatore Facility', label: 'Coimbatore Facility' },
                      { value: 'Chennai Main Plant', label: 'Chennai Main Plant' },
                    ]
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <SelectField
              label="Zone"
              required
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              options={[
                { value: 'North Zone', label: 'North Zone' },
                { value: 'South Utility Zone', label: 'South Utility Zone' },
                { value: 'East Wing', label: 'East Wing' },
                { value: 'Central Sector', label: 'Central Sector' },
                { value: 'West Utility Zone', label: 'West Utility Zone' },
              ]}
            />

            <InputField
              label="Building"
              required
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              placeholder="Building 1 - Main Mill"
            />

            <InputField
              label="Department"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Electrical Engineering"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <SelectField
              label="Floor"
              required
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              options={[
                { value: 'Ground Floor', label: 'Ground Floor' },
                { value: '1st Floor', label: '1st Floor' },
                { value: '2nd Floor', label: '2nd Floor' },
                { value: 'Basement 1', label: 'Basement 1' },
                { value: 'Rooftop', label: 'Rooftop' },
              ]}
            />

            <InputField
              label="Room Name"
              required
              value={formData.room_name}
              onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
              placeholder="e.g. MCC Panel Room 1"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <SelectField
              label="Assigned Energy Meter"
              required
              value={formData.Meter_id}
              onChange={(e) => setFormData({ ...formData, Meter_id: e.target.value })}
              options={
                meters.length > 0
                  ? meters.map((m: any) => ({
                      value: m.Meter_id,
                      label: `${m.Meter_name || m.customName || m.Meter_id} (Slave #${m.slave_id || m.slaveId})`,
                    }))
                  : [
                      { value: 'MTR-001', label: 'NavaNala_EB_Meter (Slave #1)' },
                      { value: 'MTR-002', label: 'NavaNala_UPS_Meter (Slave #2)' },
                    ]
              }
            />

            <InputField
              label="CT/PT Multiplication Factor"
              required
              type="number"
              className="mono-num"
              value={formData.multiplication_factor}
              onChange={(e) => setFormData({ ...formData, multiplication_factor: e.target.value })}
              min="0.01"
              step="any"
              placeholder="40"
            />
          </div>

          <InputField
            label="Equipment Details / Description"
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            placeholder="e.g. Main 11kV Grid Incomer Transformer 1000 kVA"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <InputField
              label="Effective From Date"
              type="date"
              className="mono-num"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              required
            />

            <InputField
              label="Effective To Date"
              type="date"
              className="mono-num"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="is_active_map"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#2563EB' }}
            />
            <label htmlFor="is_active_map" style={{ fontSize: '0.8125rem', color: '#1E293B', cursor: 'pointer', fontWeight: 550 }}>
              Active (Enabled for SCADA Telemetry Scaling)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const AssetMappingView = AssetMappingPage;
export default AssetMappingPage;
