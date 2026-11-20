import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Search,
  ChevronDown,
  Check,
  X,
  Eye,
} from 'lucide-react';

interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  defaultLabel?: string;
}

const SearchSelectCombobox: React.FC<SearchSelectComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Search or select...',
  defaultLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the selected option's label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value || defaultLabel || '';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on user typing
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [options, searchTerm]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--color-text-muted, #94a3b8)',
            pointerEvents: 'none',
          }}
        />

        <input
          type="text"
          value={isOpen ? searchTerm : (displayLabel || searchTerm)}
          onChange={handleInputChange}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="filter-input-control"
          style={{
            paddingLeft: '32px',
            paddingRight: value ? '54px' : '30px',
            fontFamily: value && !selectedOption ? 'var(--font-mono, monospace)' : 'inherit',
            fontWeight: 600,
            cursor: 'text',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'var(--color-text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: 'var(--color-text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown
              size={14}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #E2E8E5)',
            borderRadius: 'var(--radius-sm, 6px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={`${opt.value || 'default'}-${idx}`}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--color-primary-dark, #11643A)' : 'var(--color-text-primary, #1F2937)',
                    backgroundColor: isSelected ? 'var(--color-primary-light, #EAF6EE)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-secondary, #F9FBF9)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={14} style={{ color: '#2563EB', flexShrink: 0 }} />}
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: '10px 12px',
                fontSize: '0.74rem',
                color: 'var(--color-text-muted, #94a3b8)',
                textAlign: 'center',
              }}
            >
              {searchTerm ? `Custom: "${searchTerm}"` : 'No matches found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface TelemetryFilterToolbarProps {
  deviceIdInput?: string;
  setDeviceIdInput?: (val: string) => void;
  locationInput?: string;
  setLocationInput?: (val: string) => void;
  concernInput?: string;
  setConcernInput?: (val: string) => void;
  serviceNoInput?: string;
  setServiceNoInput?: (val: string) => void;
  gateways?: any[];
  meters?: any[];
  concerns?: any[];
  locations?: any[];
  serviceNos?: any[];
  defaultDeviceId?: string;
  getGatewayDisplayName?: (gw: any) => string;
  isExecuting: boolean;
  onExecute: () => void;
  onReset: () => void;
  autoPoll?: boolean;
  onToggleAutoPoll?: () => void;
  telemetryViewMode?: 'cards' | 'table';
  setTelemetryViewMode?: (mode: 'cards' | 'table') => void;
}

export const TelemetryFilterToolbar: React.FC<TelemetryFilterToolbarProps> = ({
  concernInput = '',
  setConcernInput = () => {},
  locationInput = '',
  setLocationInput = () => {},
  serviceNoInput = '',
  setServiceNoInput = () => {},
  meters = [],
  concerns = [],
  locations = [],
  serviceNos = [],
  isExecuting,
  onExecute,
  onReset,
}) => {
  // 1. Dynamic Concern Options (Derived directly from Concern Master)
  const concernOptions = useMemo(() => {
    const list: SearchSelectOption[] = [{ value: '', label: 'Select Concern' }];
    const seen = new Set<string>();

    (concerns || []).forEach((c: any) => {
      const name = (c.concern_name || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ value: name, label: name });
      }
    });

    if (concerns.length === 0) {
      (meters || []).forEach((m: any) => {
        const c = (m.concern || m.Concern || m.client_name || '').trim();
        if (c && !seen.has(c.toLowerCase())) {
          seen.add(c.toLowerCase());
          list.push({ value: c, label: c });
        }
      });
    }

    return list;
  }, [concerns, meters]);

  // 2. Dynamic Cascading Location Options (Derived from Location Master belonging to selected Concern)
  const locationOptions = useMemo(() => {
    const list: SearchSelectOption[] = [{ value: '', label: 'All Locations' }];
    const seen = new Set<string>();
    const selectedConcern = concernInput.trim().toLowerCase();

    (locations || []).forEach((l: any) => {
      const lConcern = (l.concern_name || '').trim().toLowerCase();
      if (!selectedConcern || lConcern === selectedConcern || lConcern.includes(selectedConcern) || selectedConcern.includes(lConcern)) {
        const loc = (l.location_name || '').trim();
        if (loc && !seen.has(loc.toLowerCase())) {
          seen.add(loc.toLowerCase());
          list.push({ value: loc, label: loc });
        }
      }
    });

    if (locations.length === 0) {
      (meters || []).forEach((m: any) => {
        const mConcern = (m.concern || m.Concern || '').trim().toLowerCase();
        if (!selectedConcern || mConcern === selectedConcern || mConcern.includes(selectedConcern) || selectedConcern.includes(mConcern)) {
          const loc = (m.placementLocation || m.location || m.Floor || '').trim();
          if (loc && !seen.has(loc.toLowerCase())) {
            seen.add(loc.toLowerCase());
            list.push({ value: loc, label: loc });
          }
        }
      });
    }

    return list;
  }, [concernInput, locations, meters]);

  // 3. Dynamic Cascading Service No Options (Derived from Service No Master & connected sub-meters matching selected Concern & Location)
  const serviceNoOptions = useMemo(() => {
    const list: SearchSelectOption[] = [{ value: '', label: 'All Service Nos' }];
    const seenLabels = new Set<string>();
    const seenValues = new Set<string>();
    const selectedConcern = concernInput.trim().toLowerCase();
    const selectedLoc = locationInput.trim().toLowerCase();

    // Helper to find meter by sub-meter name, serial, tag, or service connection
    const findMeterForSubName = (subName: string, svcNo: string) => {
      const q = subName.toLowerCase().trim();
      const sNoQ = svcNo.toLowerCase().trim();
      return (meters || []).find((m: any) => {
        const cName = (m.customName || '').toLowerCase().trim();
        const mName = (m.Meter_name || '').toLowerCase().trim();
        const tag = (m.tag || '').toLowerCase().trim();
        const serial = (m.meter_serial_number || m.serialNo || '').toLowerCase().trim();
        const mSvc = (m.serviceNo || '').toLowerCase().trim();

        if (q && (cName === q || mName === q || tag === q || serial === q)) return true;
        const normQ = q.replace(/[^a-z0-9]/g, '');
        if (normQ && (cName.replace(/[^a-z0-9]/g, '') === normQ || mName.replace(/[^a-z0-9]/g, '') === normQ)) return true;
        if (sNoQ && mSvc === sNoQ) return true;
        return false;
      });
    };

    // 1. Process configured Service Connections and all their configured sub-meters
    (serviceNos || []).forEach((s: any) => {
      const sConcern = (s.concern_name || '').trim().toLowerCase();
      const sLoc = (s.location_name || '').trim().toLowerCase();

      const matchesConcern = !selectedConcern || sConcern === selectedConcern || sConcern.includes(selectedConcern) || selectedConcern.includes(sConcern);
      const matchesLoc = !selectedLoc || sLoc === selectedLoc || sLoc.includes(selectedLoc) || selectedLoc.includes(sLoc);

      if (matchesConcern && matchesLoc) {
        const svcNo = (s.service_no || '').trim();
        if (!svcNo) return;

        // Collect all sub-meters entered for this Service Connection
        const subMeters: string[] = Array.isArray(s.sub_meters) && s.sub_meters.length > 0
          ? s.sub_meters
          : s.meter_name
          ? [s.meter_name]
          : s.service_name && s.service_name !== svcNo
          ? [s.service_name]
          : [];

        if (subMeters.length > 0) {
          subMeters.forEach((subNameRaw, subIdx) => {
            const subName = (subNameRaw || '').trim();
            if (!subName) return;

            // Target format: {EB Service Connection Number} ({Sub-Meter Name})
            const label = `${svcNo} (${subName})`;
            if (seenLabels.has(label.toLowerCase())) return;

            // Match meter from active fleet to assign slave_id or sub-meter name
            let matchedMeter = findMeterForSubName(subName, svcNo);

            // If not found by exact name, match by sub-meter index (Sub-Meter 1 -> Slave 1, Sub-Meter 2 -> Slave 2)
            if (!matchedMeter && meters && meters.length > 0) {
              const metersForConcern = meters.filter((m: any) => {
                const mc = (m.concern || '').trim().toLowerCase();
                return !selectedConcern || mc === selectedConcern || mc.includes(selectedConcern) || selectedConcern.includes(mc);
              });
              if (metersForConcern[subIdx]) {
                matchedMeter = metersForConcern[subIdx];
              } else if (meters[subIdx]) {
                matchedMeter = meters[subIdx];
              }
            }

            const val = matchedMeter
              ? String(matchedMeter.slave_id !== undefined ? matchedMeter.slave_id : matchedMeter.slaveId !== undefined ? matchedMeter.slaveId : matchedMeter.Meter_id)
              : String(subIdx + 1);

            seenLabels.add(label.toLowerCase());
            seenValues.add(val.toLowerCase());
            list.push({ value: val, label });
          });
        } else {
          // If no specific sub-meters configured, list the connection itself
          const label = svcNo;
          if (!seenLabels.has(label.toLowerCase())) {
            seenLabels.add(label.toLowerCase());
            seenValues.add(svcNo.toLowerCase());
            list.push({ value: svcNo, label });
          }
        }
      }
    });

    // 2. Process registered meters in the fleet that belong to this Concern/Location
    (meters || []).forEach((m: any) => {
      const mConcern = (m.concern || m.Concern || '').trim().toLowerCase();
      const mLoc = (m.placementLocation || m.location || '').trim().toLowerCase();

      const matchesConcern = !selectedConcern || mConcern === selectedConcern || mConcern.includes(selectedConcern) || selectedConcern.includes(mConcern);
      const matchesLoc = !selectedLoc || mLoc === selectedLoc || mLoc.includes(selectedLoc) || selectedLoc.includes(mLoc);

      if (matchesConcern && matchesLoc) {
        const slave = String(m.slave_id !== undefined ? m.slave_id : m.slaveId !== undefined ? m.slaveId : m.Meter_id || '');
        const name = (m.customName || m.Meter_name || m.name || '').trim();

        // Skip if this meter slave/name is already covered in list
        if (seenValues.has(slave.toLowerCase()) || (name && seenLabels.has(name.toLowerCase()))) {
          return;
        }

        // Link with Service Connection from serviceNos
        const matchingSvc = (serviceNos || []).find((s: any) => {
          const sConcern = (s.concern_name || '').trim().toLowerCase();
          const sNo = (s.service_no || '').trim().toLowerCase();
          const sSubMeters: string[] = Array.isArray(s.sub_meters) ? s.sub_meters : [];

          if (m.serviceNo && sNo && m.serviceNo.trim().toLowerCase() === sNo) return true;
          if (sSubMeters.some((sm: string) => sm.trim().toLowerCase() === name.toLowerCase())) return true;
          if (s.meter_name && s.meter_name.trim().toLowerCase() === name.toLowerCase()) return true;
          if (sConcern && mConcern && sConcern === mConcern) return true;
          return false;
        });

        // Use real EB service connection no; avoid generic "Service #1" fallback
        const svcNo = (matchingSvc?.service_no || m.serviceNo || '').trim();
        const label = svcNo && name && name !== svcNo
          ? `${svcNo} (${name})`
          : svcNo || name || `Meter #${slave}`;

        if (!seenLabels.has(label.toLowerCase()) && !seenValues.has(slave.toLowerCase())) {
          seenLabels.add(label.toLowerCase());
          seenValues.add(slave.toLowerCase());
          list.push({ value: slave, label });
        }
      }
    });

    return list;
  }, [concernInput, locationInput, serviceNos, meters]);

  // Dependent fields (Location and Service No) ONLY display when a specific Concern is selected
  const isConcernSelected = Boolean(
    concernInput &&
    concernInput.trim() !== '' &&
    concernInput.toLowerCase() !== 'all' &&
    concernInput.toLowerCase() !== 'select concern' &&
    concernInput.toLowerCase() !== 'all concerns'
  );

  // Safety cleanup: when no concern is selected, ensure dependent inputs are cleared
  useEffect(() => {
    if (!isConcernSelected) {
      if (locationInput) setLocationInput('');
      if (serviceNoInput) setServiceNoInput('');
    }
  }, [isConcernSelected, locationInput, serviceNoInput, setLocationInput, setServiceNoInput]);

  return (
    <>
      {/* ── Hierarchical Telemetry Filter Toolbar (1. Concern -> 2. Location -> 3. Service No) ── */}
      <div className="telemetry-filter-bar">
        {/* 1. Concern (First) */}
        <div className="filter-input-group telemetry-filter-col">
          <div className="filter-input-header">
            <label className="filter-input-label">Concern</label>
          </div>
          <SearchSelectCombobox
            value={concernInput}
            onChange={(val) => {
              setConcernInput(val);
              // Reset dependent location & service no when concern changes
              setLocationInput('');
              setServiceNoInput('');
            }}
            options={concernOptions}
            placeholder="Select Concern"
          />
        </div>

        {/* 2 & 3. Location and Service No ONLY display when a Concern is selected */}
        {isConcernSelected ? (
          <>
            {/* 2. Location (Second - Cascaded from Concern) */}
            <div className="filter-input-group telemetry-filter-col">
              <div className="filter-input-header">
                <label className="filter-input-label">Location</label>
              </div>
              <SearchSelectCombobox
                value={locationInput}
                onChange={(val) => {
                  setLocationInput(val);
                  // Reset dependent service no when location changes
                  setServiceNoInput('');
                }}
                options={locationOptions}
                placeholder="All Locations"
              />
            </div>

            {/* 3. Service No (Third - Cascaded from Location & Concern) */}
            <div className="filter-input-group telemetry-filter-col">
              <div className="filter-input-header">
                <label className="filter-input-label">Service No</label>
              </div>
              <SearchSelectCombobox
                value={serviceNoInput}
                onChange={setServiceNoInput}
                options={serviceNoOptions}
                placeholder="All Service Nos"
              />
            </div>
          </>
        ) : (
          <div
            style={{
              flex: '1 1 240px',
              display: 'flex',
              alignItems: 'center',
              height: '32px',
              padding: '0 8px',
              marginBottom: '1px',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '0.76rem',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary, #0D9488)',
                flexShrink: 0,
              }}
            />
            <span>Select a Concern to display Location and Service Connection filters</span>
          </div>
        )}

        {/* Action Buttons: Reset to default + View button */}
        <div className="telemetry-filter-actions">
          <button
            type="button"
            onClick={onReset}
            title="Reset all filters"
            className="btn btn-secondary filter-action-btn"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--card-bg, #FFFFFF)',
              border: '1px solid var(--border-color, #E2E8E5)',
              color: 'var(--text-secondary, #475569)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <RotateCcw size={13} />
          </button>

          <button
            type="button"
            onClick={onExecute}
            disabled={isExecuting}
            className="btn btn-primary filter-action-btn view-btn"
            style={{
              height: '32px',
              padding: '0 16px',
              fontSize: '0.78rem',
              fontWeight: 750,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'linear-gradient(135deg, #BD621F 0%, #C86A24 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(189, 98, 31, 0.35)',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isExecuting ? (
              <RefreshCw size={13} className="spin" />
            ) : (
              <Eye size={13} />
            )}
            <span>{isExecuting ? 'Loading...' : 'View'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

