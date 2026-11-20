import React, { useState, useMemo } from 'react';
import { Search, Zap, Activity, Gauge, Radio, Cpu, ShieldCheck } from 'lucide-react';
import type { EnerlinkTelemetryReading } from '../api/enerlinkApi';
import { DataTable, ColumnDef } from '../../../components/common/DataTable';

export interface ModbusRegisterDef {
  key: string;
  name: string;
  address: number;
  unit: string;
  type: string;
  category: 'power' | 'voltage' | 'current' | 'pf' | 'freq' | 'energy';
}

export const MODBUS_REGISTERS_CATALOG: ModbusRegisterDef[] = [
  { key: 'total_active_power', name: 'Total Active Power', address: 40101, unit: 'W', type: 'float32', category: 'power' },
  { key: 'phase1_active_power', name: 'Phase 1 Active Power (R)', address: 40103, unit: 'W', type: 'float32', category: 'power' },
  { key: 'phase2_active_power', name: 'Phase 2 Active Power (Y)', address: 40105, unit: 'W', type: 'float32', category: 'power' },
  { key: 'phase3_active_power', name: 'Phase 3 Active Power (B)', address: 40107, unit: 'W', type: 'float32', category: 'power' },
  { key: 'total_apparent_power', name: 'Total Apparent Power', address: 40113, unit: 'VA', type: 'float32', category: 'power' },
  { key: 'line_to_line_voltage', name: 'Line-to-Line Voltage (VLL)', address: 40121, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'l1_to_l2_voltage', name: 'Voltage L1 to L2 (VRY)', address: 40123, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'l2_to_l3_voltage', name: 'Voltage L2 to L3 (VYB)', address: 40125, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'l3_to_l1_voltage', name: 'Voltage L3 to L1 (VBR)', address: 40127, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'line_to_neutral_voltage', name: 'Line-to-Neutral Voltage (VLN)', address: 40129, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'l1_to_neutral_voltage', name: 'Voltage L1 to Neutral (VRN)', address: 40131, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'l2_to_neutral_voltage', name: 'Voltage L2 to Neutral (VYN)', address: 40133, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'l3_to_neutral_voltage', name: 'Voltage L3 to Neutral (VBN)', address: 40135, unit: 'V', type: 'float32', category: 'voltage' },
  { key: 'average_current', name: 'Average Current (Iavg)', address: 40137, unit: 'A', type: 'float32', category: 'current' },
  { key: 'l1_current', name: 'Phase 1 Current (IR)', address: 40139, unit: 'A', type: 'float32', category: 'current' },
  { key: 'l2_current', name: 'Phase 2 Current (IY)', address: 40141, unit: 'A', type: 'float32', category: 'current' },
  { key: 'l3_current', name: 'Phase 3 Current (IB)', address: 40143, unit: 'A', type: 'float32', category: 'current' },
  { key: 'power_factor', name: 'Total Power Factor (PF)', address: 40145, unit: '', type: 'float32', category: 'pf' },
  { key: 'frequency', name: 'System Frequency', address: 40153, unit: 'Hz', type: 'float32', category: 'freq' },
  { key: 'active_energy', name: 'Cumulative Active Energy', address: 40155, unit: 'kWh', type: 'float32', category: 'energy' },
];

const categoryBadgeStyles = {
  power: { bg: 'rgba(189, 98, 31, 0.12)', color: '#BD621F', border: 'rgba(189, 98, 31, 0.25)' },
  voltage: { bg: 'rgba(12, 30, 54, 0.10)', color: '#0C1E36', border: 'rgba(12, 30, 54, 0.22)' },
  current: { bg: 'rgba(217, 119, 6, 0.12)', color: '#D97706', border: 'rgba(217, 119, 6, 0.25)' },
  pf: { bg: 'rgba(139, 92, 246, 0.12)', color: '#6d28d9', border: 'rgba(139, 92, 246, 0.25)' },
  freq: { bg: 'rgba(14, 165, 233, 0.12)', color: '#0369a1', border: 'rgba(14, 165, 233, 0.25)' },
  energy: { bg: 'rgba(37, 99, 235, 0.12)', color: '#1d4ed8', border: 'rgba(37, 99, 235, 0.25)' },
};

interface ModbusRegisterTableProps {
  liveReadings: EnerlinkTelemetryReading[];
}

export const ModbusRegisterTable: React.FC<ModbusRegisterTableProps> = ({ liveReadings }) => {
  const [filterQuery, setFilterQuery] = useState('');

  const firstVals = liveReadings[0]?.values?.[0] || {};

  const filteredRegisters = useMemo(() => {
    if (!filterQuery.trim()) return MODBUS_REGISTERS_CATALOG;
    const q = filterQuery.toLowerCase();
    return MODBUS_REGISTERS_CATALOG.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        String(r.address).includes(q)
    );
  }, [filterQuery]);

  const columns: ColumnDef<ModbusRegisterDef>[] = [
    {
      header: 'MODBUS KEY',
      render: (reg) => (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.75rem',
            fontWeight: 650,
            color: 'var(--color-primary)',
          }}
        >
          {reg.key}
        </span>
      ),
    },
    {
      header: 'PARAMETER NAME',
      render: (reg) => (
        <span style={{ fontWeight: 650, color: 'var(--color-text-primary)' }}>
          {reg.name}
        </span>
      ),
    },
    {
      header: 'ADDRESS',
      render: (reg) => (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.74rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {reg.address}
        </span>
      ),
    },
    {
      header: 'CATEGORY',
      render: (reg) => {
        const catStyle = categoryBadgeStyles[reg.category] || categoryBadgeStyles.power;
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.70rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              backgroundColor: catStyle.bg,
              color: catStyle.color,
              border: `1px solid ${catStyle.border}`,
            }}
          >
            {reg.category}
          </span>
        );
      },
    },
    {
      header: 'DATA TYPE',
      render: (reg) => (
        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
          {reg.type}
        </span>
      ),
    },
    {
      header: 'LIVE READING',
      align: 'right',
      render: (reg) => {
        const rawVal = firstVals[reg.key];
        const hasVal = rawVal !== undefined && rawVal !== null && rawVal !== '';
        let formattedVal = '—';
        if (hasVal) {
          const num = Number(rawVal);
          if (reg.unit === 'W' && num > 1000) {
            formattedVal = `${(num / 1000).toFixed(2)} kW`;
          } else if (reg.unit === 'kWh') {
            formattedVal = `${(num / 1000).toLocaleString(undefined, { minimumFractionDigits: 1 })} kWh`;
          } else if (reg.unit) {
            formattedVal = `${num.toFixed(2)} ${reg.unit}`;
          } else {
            formattedVal = num.toFixed(2);
          }
        }
        return (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 750,
              fontSize: '0.80rem',
              color: hasVal ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            {formattedVal}
          </span>
        );
      },
    },
    {
      header: 'STATUS',
      align: 'center',
      width: '90px',
      render: (reg) => {
        const rawVal = firstVals[reg.key];
        const hasVal = rawVal !== undefined && rawVal !== null && rawVal !== '';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 750,
              backgroundColor: hasVal ? '#DCFCE7' : '#F1F5F9',
              color: hasVal ? '#15803D' : '#64748B',
              border: `1px solid ${hasVal ? '#BBF7D0' : '#E2E8F0'}`,
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: hasVal ? '#10B981' : '#94A3B8',
              }}
            />
            {hasVal ? 'ACTIVE' : 'STANDBY'}
          </span>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Search Bar & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search
            size={14}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search register name or address..."
            style={{
              height: '34px',
              width: '100%',
              paddingLeft: '32px',
              paddingRight: '10px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
            Total Registers: <strong>{MODBUS_REGISTERS_CATALOG.length}</strong>
          </span>
          <span
            style={{
              fontSize: '0.70rem',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              fontWeight: 700,
            }}
          >
            Modbus RTU Standard
          </span>
        </div>
      </div>

      {/* Registers Table with Common Enterprise DataTable + Pagination */}
      <DataTable
        columns={columns}
        data={filteredRegisters}
        rowKey="key"
        showIndexColumn={true}
        pagination={true}
        defaultPageSize={5}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    </div>
  );
};

export default ModbusRegisterTable;
