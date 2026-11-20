/**
 * Centralized Common Placeholders Dictionary
 * SaB Energy Management Platform
 * 
 * Reusable placeholder constants across all forms, modals, tables, search inputs,
 * and Select2 dropdowns for consistency across the entire application.
 */

export const PLACEHOLDERS = {
  // Global & General
  general: {
    search: 'Search...',
    filter: 'Filter...',
    select: 'Select an option...',
    selectWithCount: (entity: string) => `Select ${entity}...`,
    enter: (fieldName: string) => `Enter ${fieldName.toLowerCase()}...`,
    optional: 'Optional',
    none: 'None / Unlinked',
    loading: 'Loading...',
    allStatuses: 'All Statuses',
    allConcerns: 'All Concerns',
    allLocations: 'All Locations',
  },

  // Search Inputs
  search: {
    general: 'Search...',
    concerns: 'Search concerns...',
    locations: 'Search locations...',
    services: 'Search service connections...',
    meters: 'Search meters by tag, serial, or model...',
    gateways: 'Search gateways by name, serial, or IP...',
    meterMakes: 'Search meter makes by name or ID...',
    meterModels: 'Search meter models by name or ID...',
    gatewayMakes: 'Search gateway makes by name or ID...',
    gatewayModels: 'Search gateway models by name or ID...',
    parameters: 'Search key, name, unit, category...',
    profiles: 'Search by Make, Model, Version...',
    registers: 'Search register name or address...',
    assets: 'Search mappings by asset or meter...',
    coordinates: 'Search coordinates or place (e.g. 11°16\'29.9"N 77°34\'47.6"E, Plant Bay 1, Coimbatore)...',
  },

  // Dropdown / Select2 Placeholders
  select: {
    concern: 'Select Concern...',
    location: 'Select Location...',
    zone: 'Select Zone...',
    status: 'Select Status...',
    physicalMeter: 'Select Physical Meter (Optional)...',
    tariff: 'Select Tariff Category...',
    make: 'Select Make / Manufacturer...',
    model: 'Select Model...',
    gateway: 'Select Gateway...',
    protocol: 'Select Protocol...',
    baudRate: 'Select Baud Rate...',
    parity: 'Select Parity...',
    stopBits: 'Select Stop Bits...',
    category: 'Select Category...',
    dataType: 'Select Data Type...',
    parameter: 'Select Parameter...',
    feeder: 'Select Feeder / Service...',
  },

  // Concern Master
  concern: {
    code: 'SES',
    codeAuto: 'CON-01',
    name: 'SaB Energy Solutions (SES)',
    city: 'Coimbatore',
    search: 'Search concerns...',
    select: 'Select Concern...',
  },

  // Location Master
  location: {
    name: '1st Floor (Main Incomer / UPS Room)',
    floor: '1st Floor',
    zone: 'Select Zone...',
    search: 'Search locations...',
    select: 'Select Location...',
  },

  // Service No Master
  service: {
    number: 'SC-03-241-001-4476',
    name: 'Main Incomer Feeder EB-01',
    sanctionedDemand: '250',
    contractDemand: '200',
    powerFactor: '0.98',
    search: 'Search service connections...',
    selectMeter: 'Select Physical Meter (Optional)...',
    selectTariff: 'Select Tariff Category...',
  },

  // Meter & Hardware Master
  meter: {
    tag: 'Incomer Feeder EM6400',
    serial: 'SCH-EM-2026-001',
    slaveId: '1',
    ip: '192.168.1.150',
    mac: '00:1B:44:11:3A:B7',
    make: 'Schneider Electric',
    model: 'LG5310',
    version: '1.0.0',
    search: 'Search by Make, Model, Version...',
    profileJson: 'Paste valid profile JSON here...',
  },

  // Gateway Master
  gateway: {
    name: 'Enerlink IoT Gateway',
    serial: 'SAB-GW-2026-001',
    ip: '192.168.1.150',
    mac: '00:1B:44:11:3A:B7',
    port: '502',
    serialPort: 'COM1',
    busName: 'RS-485 Main Feeder Bus',
    make: 'SaB Systems',
    model: 'SAB-GW-G1',
    version: 'v1.0.0',
  },

  // Parameter Dictionary
  parameter: {
    key: 'active_power_total',
    name: 'Watts Total',
    unit: 'W',
    address: '40101',
    registerOffset: '-40001',
    description: 'Active Power Total',
    search: 'Search key, name, unit, category...',
  },

  // Comm Configuration
  comm: {
    mqttBroker: 'mqtt://broker.sabenergy.internal:1883',
    apiUrl: 'https://api.sabenergy.internal/v1',
    targetDeviceId: '441BF6D37C80',
    pollInterval: '40',
  },

  // Geolocation
  geolocation: {
    latitude: '11.275143',
    longitude: '77.579820',
    landmark: 'Main Switchboard Room, Panel B',
    search: 'Search coordinates or place...',
  },
} as const;

/**
 * Common Helper: Returns an intelligent default placeholder if none is explicitly provided.
 * Checks known field names and labels.
 */
export function getSmartPlaceholder(nameOrLabel?: string, type?: string): string {
  if (!nameOrLabel) {
    if (type === 'select') return PLACEHOLDERS.general.select;
    return '';
  }

  const key = nameOrLabel.toLowerCase().trim();

  // Search
  if (key.includes('search')) return PLACEHOLDERS.general.search;

  // Concern fields
  if (key.includes('concern code')) return PLACEHOLDERS.concern.code;
  if (key.includes('concern') && key.includes('name')) return PLACEHOLDERS.concern.name;
  if (key.includes('city') || key.includes('region')) return PLACEHOLDERS.concern.city;

  // Location fields
  if (key.includes('location') && key.includes('name')) return PLACEHOLDERS.location.name;
  if (key.includes('floor') || key.includes('level')) return PLACEHOLDERS.location.floor;
  if (key.includes('zone')) return PLACEHOLDERS.location.zone;

  // Service fields
  if (key.includes('service') && key.includes('no')) return PLACEHOLDERS.service.number;
  if (key.includes('service') && (key.includes('name') || key.includes('desc'))) return PLACEHOLDERS.service.name;
  if (key.includes('sanctioned')) return PLACEHOLDERS.service.sanctionedDemand;
  if (key.includes('power factor')) return PLACEHOLDERS.service.powerFactor;

  // Meter & Gateway
  if (key.includes('serial')) return 'SN-2026-001';
  if (key.includes('ip address') || key === 'ip') return '192.168.1.150';
  if (key.includes('mac')) return '00:1B:44:11:3A:B7';

  // Generic fallback
  if (type === 'select') return `Select ${nameOrLabel}...`;
  return `Enter ${nameOrLabel}...`;
}

export default PLACEHOLDERS;

