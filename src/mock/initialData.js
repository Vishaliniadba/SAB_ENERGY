// ─── GATEWAY MAKES (Manufacturers of gateway/edge devices) ───────────────────
export const initialGatewayMakes = [
  {
    gw_make_id: 'GWMAKE-SAB',
    gw_make_name: 'SaB Systems',
    country: 'India',
    contact_person: 'SaB Support Team',
    support_email: 'support@sabsystems.in',
    description: 'Industrial IoT gateways and SCADA edge devices for energy monitoring.'
  },
  {
    gw_make_id: 'GWMAKE-ADV',
    gw_make_name: 'Advantech',
    country: 'Taiwan',
    contact_person: 'Advantech Support',
    support_email: 'support@advantech.com',
    description: 'Industrial automation and IoT gateway hardware with Modbus and MQTT support.'
  },
  {
    gw_make_id: 'GWMAKE-SEI',
    gw_make_name: 'Seimens IoT Edge',
    country: 'Germany',
    contact_person: 'Siemens Edge Support',
    support_email: 'support@siemens-iot.com',
    description: 'Industrial PC and IoT edge gateway platforms for smart grid applications.'
  },
  {
    gw_make_id: 'GWMAKE-WEG',
    gw_make_name: 'Wago',
    country: 'Germany',
    contact_person: 'Wago Technical Support',
    support_email: 'support@wago.com',
    description: 'Compact industrial controllers and gateways for energy management systems.'
  },
];

// ─── GATEWAY MODELS ──────────────────────────────────────────────────────────
export const initialGatewayModels = [
  {
    gw_model_id: 'GWMOD-SAB-G1',
    gw_make_id: 'GWMAKE-SAB',
    gw_model_name: 'SAB-GW-G1',
    category: 'IoT Edge Gateway',
    channel_count: 2,
    channel_names: ['Main Feeder RS485 Loop', 'Plant Grid TCP Link'],
    description: 'SaB IoT Edge Gateway Gen1 with 2 channels and Ethernet + MQTT',
    firmware_version: 'v2.4.1',
  },
  {
    gw_model_id: 'GWMOD-SAB-G2',
    gw_make_id: 'GWMAKE-SAB',
    gw_model_name: 'SAB-GW-G2',
    category: 'IoT Edge Gateway',
    channel_count: 2,
    channel_names: ['Solar Array Line 1', 'Inverter Bus 1'],
    description: 'SaB IoT Edge Gateway Gen2 with 2 channels, 4G, and cloud-ready MQTT',
    firmware_version: 'v3.1.0',
  },
  {
    gw_model_id: 'GWMOD-ADV-EKI',
    gw_make_id: 'GWMAKE-ADV',
    gw_model_name: 'EKI-1521',
    category: 'Serial Device Server',
    channel_count: 2,
    channel_names: ['Serial Port 1 (RS485)', 'Serial Port 2 (RS485)'],
    description: 'Advantech EKI-1521 2-port RS232/485 serial device server with Modbus gateway',
    firmware_version: 'v1.3.2',
  },
  {
    gw_model_id: 'GWMOD-WEG-750',
    gw_make_id: 'GWMAKE-WEG',
    gw_model_name: 'WAGO-750-893',
    category: 'Controller Gateway',
    channel_count: 1,
    channel_names: ['Modbus TCP Port 1'],
    description: 'WAGO 750-893 Modbus TCP controller gateway for energy metering systems',
    firmware_version: 'v2.0.1',
  },
];

// ─── GATEWAYS (Devices) ──────────────────────────────────────────────────────
export const initialGateways = [
  {
    Gateway_id: 'GW-101',
    Gateway_name: 'Substation Alpha Gateway',
    serial_number: 'SAB-GW-2026-001',
    ip_address: '192.168.1.150',
    mac_address: '00:1B:44:11:3A:B7',
    gw_make_id: 'GWMAKE-SAB',
    gw_make_name: 'SaB Systems',
    gw_model_id: 'GWMOD-SAB-G1',
    gw_model_name: 'SAB-GW-G1',
    firmware_version: 'v2.4.1',
    channel_count: 2,
    status: 'Active',
    keep_alive_seconds: 30,
    last_communicate_time: new Date(Date.now() - 15000).toISOString(), // 15s ago
    created_at: '2026-01-10 09:30:00',
    updated_at: '2026-10-18 14:12:00'
  },
  {
    Gateway_id: 'GW-102',
    Gateway_name: 'Solar Inverter Bay Gateway',
    serial_number: 'SAB-GW-2026-002',
    ip_address: '192.168.1.155',
    mac_address: '00:1B:44:22:9C:14',
    gw_make_id: 'GWMAKE-SAB',
    gw_make_name: 'SaB Systems',
    gw_model_id: 'GWMOD-SAB-G2',
    gw_model_name: 'SAB-GW-G2',
    firmware_version: 'v3.1.0',
    channel_count: 2,
    status: 'Active',
    keep_alive_seconds: 30,
    last_communicate_time: new Date(Date.now() - 8000).toISOString(), // 8s ago
    created_at: '2026-02-15 11:20:00',
    updated_at: '2026-10-19 16:40:00'
  },
  {
    Gateway_id: 'GW-103',
    Gateway_name: 'Wind Farm Collector Gateway',
    serial_number: 'SAB-GW-2026-003',
    ip_address: '192.168.2.110',
    mac_address: '00:1B:44:7F:50:88',
    gw_make_id: 'GWMAKE-ADV',
    gw_make_name: 'Advantech',
    gw_model_id: 'GWMOD-ADV-EKI',
    gw_model_name: 'EKI-1521',
    firmware_version: 'v1.3.2',
    channel_count: 2,
    status: 'Offline',
    keep_alive_seconds: 30,
    last_communicate_time: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    created_at: '2026-03-01 10:00:00',
    updated_at: '2026-10-20 08:15:00'
  }
];

// ─── CHANNELS ────────────────────────────────────────────────────────────────
export const initialChannels = [
  {
    Channel_id: 'CH-01',
    Gateway_id: 'GW-101',
    Channel_name: 'Main Feeder RS485 Loop',
    protocol: 'Modbus RTU',
    baud_rate: '9600',
    port: 'COM1',
    parity_bit: 'None',
    stop_bit: '1',
    data_bit: '8',
    status: 'Active',
    created_at: '2026-01-10 10:00:00',
    updated_at: '2026-10-15 12:00:00'
  },
  {
    Channel_id: 'CH-02',
    Gateway_id: 'GW-101',
    Channel_name: 'Plant Grid TCP Link',
    protocol: 'Modbus TCP',
    baud_rate: '115200',
    port: '502',
    parity_bit: 'None',
    stop_bit: '1',
    data_bit: '8',
    status: 'Active',
    created_at: '2026-01-12 14:30:00',
    updated_at: '2026-10-18 09:20:00'
  },
  {
    Channel_id: 'CH-03',
    Gateway_id: 'GW-102',
    Channel_name: 'Solar Array Modbus Line',
    protocol: 'Modbus RTU',
    baud_rate: '19200',
    port: 'COM2',
    parity_bit: 'Even',
    stop_bit: '1',
    data_bit: '8',
    status: 'Active',
    created_at: '2026-02-16 09:45:00',
    updated_at: '2026-10-17 11:10:00'
  },
  {
    Channel_id: 'CH-04',
    Gateway_id: 'GW-102',
    Channel_name: 'MQTT Edge Telemetry',
    protocol: 'MQTT',
    baud_rate: '115200',
    port: '1883',
    parity_bit: 'None',
    stop_bit: '1',
    data_bit: '8',
    status: 'Inactive',
    created_at: '2026-02-18 16:00:00',
    updated_at: '2026-10-19 13:00:00'
  }
];

// ─── METERS ──────────────────────────────────────────────────────────────────
export const initialMeters = [
  {
    Meter_id: 'MTR-001',
    Channel_id: 'CH-01',
    Meter_name: 'Incomer Multi-Function Meter',
    meter_serial_number: 'SCH-EM-9921',
    slave_id: '1',
    make_id: 'MAKE-SCH',
    make_name: 'Schneider Electric',
    model_id: 'MOD-EM6400NG',
    meter_model: 'EM6400NG',
    status: 'Active',
    created_at: '2026-01-10 11:00:00',
    updated_at: '2026-10-19 15:30:00'
  },
  {
    Meter_id: 'MTR-002',
    Channel_id: 'CH-01',
    Meter_name: 'Transformer Primary Feeder Meter',
    meter_serial_number: 'ELM-LG-4401',
    slave_id: '2',
    make_id: 'MAKE-ELM',
    make_name: 'Elmeasure',
    model_id: 'MOD-LG6400',
    meter_model: 'LG6400',
    status: 'Active',
    created_at: '2026-01-11 12:15:00',
    updated_at: '2026-10-18 10:45:00'
  },
  {
    Meter_id: 'MTR-003',
    Channel_id: 'CH-03',
    Meter_name: 'Solar String Meter Array 1',
    meter_serial_number: 'SLC-MFM-3840',
    slave_id: '5',
    make_id: 'MAKE-SLC',
    make_name: 'Selec',
    model_id: 'MOD-MFM384',
    meter_model: 'MFM384',
    status: 'Active',
    created_at: '2026-02-16 10:30:00',
    updated_at: '2026-10-19 11:20:00'
  },
  {
    Meter_id: 'MTR-004',
    Channel_id: 'CH-02',
    Meter_name: 'Diesel Generator Output Meter',
    meter_serial_number: 'SCH-PM-5300',
    slave_id: '10',
    make_id: 'MAKE-SCH',
    make_name: 'Schneider Electric',
    model_id: 'MOD-PM5350',
    meter_model: 'PM5350',
    status: 'Inactive',
    created_at: '2026-02-20 14:10:00',
    updated_at: '2026-10-17 18:00:00'
  }
];

export const initialAssets = [
  {
    Asset_id: 'AST-501',
    Asset_name: 'Rooftop Solar Array 1',
    asset_type: 'Solar Panel',
    description: 'Monocrystalline 500kW PV Array on Block C',
    location: 'Roof Zone A, Building 3',
    capacity: '500 kW',
    status: 'Active',
    created_at: '2026-01-05 08:30:00',
    updated_at: '2026-10-15 14:00:00'
  },
  {
    Asset_id: 'AST-502',
    Asset_name: 'Backup Diesel Generator 1',
    asset_type: 'Generator',
    description: 'Cummins 750kVA Emergency Standby Genset',
    location: 'Utility Yard, Ground Level',
    capacity: '750 kVA',
    status: 'Standby',
    created_at: '2026-01-06 10:15:00',
    updated_at: '2026-10-18 16:30:00'
  },
  {
    Asset_id: 'AST-503',
    Asset_name: 'Main Factory Incomer Feeder',
    asset_type: 'Feeder',
    description: '11kV HT Substation Incomer Feeder Line',
    location: 'Substation Alpha Bay 1',
    capacity: '1500 kVA',
    status: 'Active',
    created_at: '2026-01-08 09:00:00',
    updated_at: '2026-10-19 11:15:00'
  },
  {
    Asset_id: 'AST-504',
    Asset_name: 'Wind Turbine North #2',
    asset_type: 'Wind Turbine',
    description: 'Gamesa 2.0MW Utility Scale Turbine',
    location: 'Wind Farm Perimeter, Ridge 2',
    capacity: '2000 kW',
    status: 'Maintenance',
    created_at: '2026-02-01 13:45:00',
    updated_at: '2026-10-20 07:30:00'
  }
];

export const initialAssetMeterMappings = [
  {
    Mapping_id: 'MAP-001',
    Asset_id: 'AST-503',
    Meter_id: 'MTR-001',
    multiplication_factor: '40',
    effective_from: '2026-01-10',
    effective_to: '2027-01-10',
    is_active: true,
    created_at: '2026-01-10 12:00:00',
    updated_at: '2026-10-15 10:00:00'
  },
  {
    Mapping_id: 'MAP-002',
    Asset_id: 'AST-501',
    Meter_id: 'MTR-003',
    multiplication_factor: '20',
    effective_from: '2026-02-16',
    effective_to: '2027-02-16',
    is_active: true,
    created_at: '2026-02-16 11:30:00',
    updated_at: '2026-10-18 14:00:00'
  },
  {
    Mapping_id: 'MAP-003',
    Asset_id: 'AST-502',
    Meter_id: 'MTR-004',
    multiplication_factor: '80',
    effective_from: '2026-02-20',
    effective_to: '2027-02-20',
    is_active: false,
    created_at: '2026-02-20 15:00:00',
    updated_at: '2026-10-19 12:00:00'
  }
];

export const initialConfig = {
  system_name: 'SaB Energy Monitoring Engine',
  polling_interval_seconds: 5,
  modbus_timeout_ms: 1000,
  mqtt_broker_url: 'mqtt://broker.sabenergy.internal:1883',
  mqtt_client_id: 'sab_edge_gw_alpha',
  database_type: 'Microsoft SQL Server (.NET ASP.NET Backend)',
  api_endpoint: 'https://api.sabenergy.internal/v1',
  data_retention_days: 365,
  auto_reconnect: true,
  alert_email: 'scada-alerts@sabenergy.com',
  log_level: 'Information'
};

// ─── METER MAKES ─────────────────────────────────────────────────────────────
export const initialMakes = [
  {
    make_id: 'MAKE-ELM',
    make_name: 'Elmeasure',
    country: 'India',
    contact_person: 'Technical Support',
    support_email: 'support@elmeasure.com',
    description: 'Multifunction digital energy meters, dual source, smart pre-paid & branch circuit monitoring meters.'
  },
  {
    make_id: 'MAKE-SCH',
    make_name: 'Schneider Electric',
    country: 'France',
    contact_person: 'EcoStruxure Automation',
    support_email: 'customercare.in@se.com',
    description: 'PowerLogic & EasyLogic series power quality meters, feeder managers, and digital power meters.'
  },
  {
    make_id: 'MAKE-SLC',
    make_name: 'Selec',
    country: 'India',
    contact_person: 'Support Team',
    support_email: 'sales@selec.com',
    description: 'Multifunction electrical meters, basic VAF indicators, APFC controllers and protection relays.'
  },
  {
    make_id: 'MAKE-SEC',
    make_name: 'Secure Meters',
    country: 'India / UK',
    contact_person: 'Apex Support',
    support_email: 'support@securemeters.com',
    description: 'Apex, Premier and Sprint series high-accuracy grid and revenue energy meters.'
  },
  {
    make_id: 'MAKE-SIE',
    make_name: 'Siemens',
    country: 'Germany',
    contact_person: 'Digital Industries Support',
    support_email: 'support.automation@siemens.com',
    description: 'SENTRON PAC series multifunctional power meters and network analyzers.'
  }
];

// ─── METER MODELS ─────────────────────────────────────────────────────────────
export const initialModels = [
  {
    model_id: 'MOD-LG5310',
    make_id: 'MAKE-ELM',
    model_name: 'LG5310',
    category: 'Multifunction Meter',
    description: 'Dual Source 3-Phase 4-Wire Digital Multifunction Meter with RS485 Modbus RTU',
    default_byte_order: 'CDAB',
    default_offset: -40001,
    default_fc: 3
  },
  {
    model_id: 'MOD-LG6400',
    make_id: 'MAKE-ELM',
    model_name: 'LG6400',
    category: 'Multifunction Meter',
    description: 'Microcontroller based High Accuracy 3-Phase Multi-parameter Energy Meter',
    default_byte_order: 'CDAB',
    default_offset: -40001,
    default_fc: 3
  },
  {
    model_id: 'MOD-EM6400NG',
    make_id: 'MAKE-SCH',
    model_name: 'EM6400NG',
    category: 'Power Meter',
    description: 'EasyLogic 3-Phase Multifunction Meter with CL 0.5S/1.0 accuracy',
    default_byte_order: 'ABCD',
    default_offset: 0,
    default_fc: 3
  },
  {
    model_id: 'MOD-PM5350',
    make_id: 'MAKE-SCH',
    model_name: 'PM5350',
    category: 'Power & Energy Meter',
    description: 'PowerLogic High-end Meter with multi-tariff, power quality, and alarms',
    default_byte_order: 'ABCD',
    default_offset: 0,
    default_fc: 3
  },
  {
    model_id: 'MOD-MFM384',
    make_id: 'MAKE-SLC',
    model_name: 'MFM384',
    category: 'Multifunction Meter',
    description: 'Compact 96x96 3-Phase Multifunction Meter with LCD display and Modbus communication',
    default_byte_order: 'CDAB',
    default_offset: 0,
    default_fc: 3
  },
  {
    model_id: 'MOD-PAC3200',
    make_id: 'MAKE-SIE',
    model_name: 'PAC3200',
    category: 'Power Monitoring Device',
    description: 'SENTRON PAC3200 Multifunction Energy Meter with Ethernet & RS485 options',
    default_byte_order: 'ABCD',
    default_offset: 1,
    default_fc: 3
  }
];

// ─── STANDARD PARAMETERS (Key-Value Master) ───────────────────────────────────
export const initialStandardParameters = [
  { key: 'power_active_total',    display_name: 'Watts Total',           category: 'Power',         datatype: 'float32', multiplier: 1.0, unit: 'W',   description: 'Total 3-phase Active Real Power' },
  { key: 'power_active_r',        display_name: 'Watts R phase',         category: 'Power',         datatype: 'float32', multiplier: 1.0, unit: 'W',   description: 'R-Phase Active Real Power' },
  { key: 'power_active_y',        display_name: 'Watts Y phase',         category: 'Power',         datatype: 'float32', multiplier: 1.0, unit: 'W',   description: 'Y-Phase Active Real Power' },
  { key: 'power_active_b',        display_name: 'Watts B phase',         category: 'Power',         datatype: 'float32', multiplier: 1.0, unit: 'W',   description: 'B-Phase Active Real Power' },
  { key: 'pf_avg',                display_name: 'PF Avg(inst)',          category: 'Power Factor',  datatype: 'float32', multiplier: 1.0, unit: '',    description: 'Average Instantaneous Power Factor' },
  { key: 'pf_r',                  display_name: 'PF R phase',            category: 'Power Factor',  datatype: 'float32', multiplier: 1.0, unit: '',    description: 'R-Phase Power Factor' },
  { key: 'pf_y',                  display_name: 'PF Y phase',            category: 'Power Factor',  datatype: 'float32', multiplier: 1.0, unit: '',    description: 'Y-Phase Power Factor' },
  { key: 'pf_b',                  display_name: 'PF B phase',            category: 'Power Factor',  datatype: 'float32', multiplier: 1.0, unit: '',    description: 'B-Phase Power Factor' },
  { key: 'power_apparent_total',  display_name: 'VA total',              category: 'Apparent Power',datatype: 'float32', multiplier: 1.0, unit: 'VA',  description: 'Total 3-phase Apparent Power' },
  { key: 'power_apparent_r',      display_name: 'VA R phase',            category: 'Apparent Power',datatype: 'float32', multiplier: 1.0, unit: 'VA',  description: 'R-Phase Apparent Power' },
  { key: 'power_apparent_y',      display_name: 'VA Y phase',            category: 'Apparent Power',datatype: 'float32', multiplier: 1.0, unit: 'VA',  description: 'Y-Phase Apparent Power' },
  { key: 'power_apparent_b',      display_name: 'VA B phase',            category: 'Apparent Power',datatype: 'float32', multiplier: 1.0, unit: 'VA',  description: 'B-Phase Apparent Power' },
  { key: 'power_reactive_total',  display_name: 'VAR total',             category: 'Reactive Power',datatype: 'float32', multiplier: 1.0, unit: 'VAR', description: 'Total Reactive Power' },
  { key: 'voltage_ll_avg',        display_name: 'VLL average',           category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'Line-to-Line Average Voltage' },
  { key: 'voltage_ry',            display_name: 'Vry phase',             category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'R-Y Line Voltage' },
  { key: 'voltage_yb',            display_name: 'Vyb phase',             category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'Y-B Line Voltage' },
  { key: 'voltage_br',            display_name: 'Vbr phase',             category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'B-R Line Voltage' },
  { key: 'voltage_ln_avg',        display_name: 'VLN average',           category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'Line-to-Neutral Average Voltage' },
  { key: 'voltage_r',             display_name: 'V R phase',             category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'R-Phase to Neutral Voltage' },
  { key: 'voltage_y',             display_name: 'V Y phase',             category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'Y-Phase to Neutral Voltage' },
  { key: 'voltage_b',             display_name: 'V B phase',             category: 'Voltage',       datatype: 'float32', multiplier: 1.0, unit: 'V',   description: 'B-Phase to Neutral Voltage' },
  { key: 'current_avg',           display_name: 'Current average',       category: 'Current',       datatype: 'float32', multiplier: 1.0, unit: 'A',   description: '3-Phase Average Current' },
  { key: 'current_r',             display_name: 'Current R phase',       category: 'Current',       datatype: 'float32', multiplier: 1.0, unit: 'A',   description: 'R-Phase Current' },
  { key: 'current_y',             display_name: 'Current Y phase',       category: 'Current',       datatype: 'float32', multiplier: 1.0, unit: 'A',   description: 'Y-Phase Current' },
  { key: 'current_b',             display_name: 'Current B phase',       category: 'Current',       datatype: 'float32', multiplier: 1.0, unit: 'A',   description: 'B-Phase Current' },
  { key: 'current_neutral',       display_name: 'Current Neutral',       category: 'Current',       datatype: 'float32', multiplier: 1.0, unit: 'A',   description: 'Neutral Wire Current' },
  { key: 'frequency',             display_name: 'Frequency',             category: 'Frequency',     datatype: 'float32', multiplier: 1.0, unit: 'Hz',  description: 'Grid Power Frequency' },
  { key: 'energy_active_import',  display_name: 'Wh received',           category: 'Energy',        datatype: 'float32', multiplier: 1.0, unit: 'Wh',  description: 'Imported Active Energy Accumulator' },
  { key: 'energy_active_export',  display_name: 'Wh delivered',          category: 'Energy',        datatype: 'float32', multiplier: 1.0, unit: 'Wh',  description: 'Exported Active Energy Accumulator' },
  { key: 'energy_apparent_import',display_name: 'VAh received',          category: 'Energy',        datatype: 'float32', multiplier: 1.0, unit: 'VAh', description: 'Imported Apparent Energy Accumulator' },
  { key: 'speed_rpm',             display_name: 'RPM',                   category: 'Speed/Runtime', datatype: 'float32', multiplier: 1.0, unit: 'RPM', description: 'Calculated Rotational Speed' },
  { key: 'hours_load_received',   display_name: 'Load Hours Received',   category: 'Speed/Runtime', datatype: 'uint32',  multiplier: 1.0, unit: 'hrs', description: 'Cumulative Loaded Operating Hours' },
  { key: 'hours_on_seconds',      display_name: 'ON hours (in seconds)', category: 'Speed/Runtime', datatype: 'uint32',  multiplier: 1.0, unit: 's',   description: 'Total Power ON Time in Seconds' }
];

// ─── METER PROFILES ───────────────────────────────────────────────────────────
export const initialMeterProfiles = [
  {
    profile_id: 'PROF-ELM-01',
    profile_version: '1.0.0',
    make_id: 'MAKE-ELM',
    make: 'Elmeasure',
    model_id: 'MOD-LG5310',
    model: 'LG5310',
    address_offset: -40001,
    function_code: 3,
    byte_order: 'CDAB',
    description: 'Elmeasure Dual Source Multifunction Energy Meter Profile',
    parameters: [
      { key: 'power_active_total',    display_name: 'Watts Total',           address: 40101, datatype: 'float32', multiplier: 1.0, unit: 'W'   },
      { key: 'power_active_r',        display_name: 'Watts R phase',         address: 40103, datatype: 'float32', multiplier: 1.0, unit: 'W'   },
      { key: 'power_active_y',        display_name: 'Watts Y phase',         address: 40105, datatype: 'float32', multiplier: 1.0, unit: 'W'   },
      { key: 'power_active_b',        display_name: 'Watts B phase',         address: 40107, datatype: 'float32', multiplier: 1.0, unit: 'W'   },
      { key: 'pf_avg',                display_name: 'PF Avg(inst)',          address: 40117, datatype: 'float32', multiplier: 1.0, unit: ''    },
      { key: 'pf_r',                  display_name: 'PF R phase',            address: 40119, datatype: 'float32', multiplier: 1.0, unit: ''    },
      { key: 'pf_y',                  display_name: 'PF Y phase',            address: 40121, datatype: 'float32', multiplier: 1.0, unit: ''    },
      { key: 'pf_b',                  display_name: 'PF B phase',            address: 40123, datatype: 'float32', multiplier: 1.0, unit: ''    },
      { key: 'power_apparent_total',  display_name: 'VA total',              address: 40125, datatype: 'float32', multiplier: 1.0, unit: 'VA'  },
      { key: 'power_apparent_r',      display_name: 'VA R phase',            address: 40127, datatype: 'float32', multiplier: 1.0, unit: 'VA'  },
      { key: 'power_apparent_y',      display_name: 'VA Y phase',            address: 40129, datatype: 'float32', multiplier: 1.0, unit: 'VA'  },
      { key: 'power_apparent_b',      display_name: 'VA B phase',            address: 40131, datatype: 'float32', multiplier: 1.0, unit: 'VA'  },
      { key: 'voltage_ll_avg',        display_name: 'VLL average',           address: 40133, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_ry',            display_name: 'Vry phase',             address: 40135, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_yb',            display_name: 'Vyb phase',             address: 40137, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_br',            display_name: 'Vbr phase',             address: 40139, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_ln_avg',        display_name: 'VLN average',           address: 40141, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_r',             display_name: 'V R phase',             address: 40143, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_y',             display_name: 'V Y phase',             address: 40145, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'voltage_b',             display_name: 'V B phase',             address: 40147, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'current_avg',           display_name: 'Current average',       address: 40149, datatype: 'float32', multiplier: 1.0, unit: 'A'   },
      { key: 'current_r',             display_name: 'Current R phase',         address: 40151, datatype: 'float32', multiplier: 1.0, unit: 'A'   },
      { key: 'current_y',             display_name: 'Current Y phase',         address: 40153, datatype: 'float32', multiplier: 1.0, unit: 'A'   },
      { key: 'current_b',             display_name: 'Current B phase',         address: 40155, datatype: 'float32', multiplier: 1.0, unit: 'A'   },
      { key: 'frequency',             display_name: 'Frequency',             address: 40157, datatype: 'float32', multiplier: 1.0, unit: 'Hz'  },
      { key: 'energy_active_import',  display_name: 'Wh received',           address: 40159, datatype: 'float32', multiplier: 1.0, unit: 'Wh'  },
      { key: 'energy_apparent_import',display_name: 'VAh received',          address: 40161, datatype: 'float32', multiplier: 1.0, unit: 'VAh' },
      { key: 'speed_rpm',             display_name: 'RPM',                   address: 40215, datatype: 'float32', multiplier: 1.0, unit: 'RPM' },
      { key: 'hours_load_received',   display_name: 'Load Hours Received',   address: 40217, datatype: 'uint32',  multiplier: 1.0, unit: 'hrs' },
      { key: 'hours_on_seconds',      display_name: 'ON hours (in seconds)', address: 40231, datatype: 'uint32',  multiplier: 1.0, unit: 's'   }
    ]
  },
  {
    profile_id: 'PROF-SCH-01',
    profile_version: '2.1.0',
    make_id: 'MAKE-SCH',
    make: 'Schneider Electric',
    model_id: 'MOD-EM6400NG',
    model: 'EM6400NG',
    address_offset: 0,
    function_code: 3,
    byte_order: 'ABCD',
    description: 'Schneider Electric EasyLogic Multi-Function Power Meter',
    parameters: [
      { key: 'power_active_total',   display_name: 'Active Power Total',  address: 3903, datatype: 'float32', multiplier: 1.0, unit: 'kW'  },
      { key: 'voltage_ll_avg',       display_name: 'Voltage L-L Avg',     address: 3909, datatype: 'float32', multiplier: 1.0, unit: 'V'   },
      { key: 'current_avg',          display_name: 'Current Avg',         address: 3913, datatype: 'float32', multiplier: 1.0, unit: 'A'   },
      { key: 'frequency',            display_name: 'Frequency',           address: 3915, datatype: 'float32', multiplier: 1.0, unit: 'Hz'  },
      { key: 'pf_avg',               display_name: 'Power Factor Avg',    address: 3917, datatype: 'float32', multiplier: 1.0, unit: ''    },
      { key: 'energy_active_import', display_name: 'Total Active Energy', address: 3927, datatype: 'float32', multiplier: 1.0, unit: 'kWh' }
    ]
  }
];
