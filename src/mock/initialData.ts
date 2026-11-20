// Clean dataset initializers: All fleet records, meters, channels, profiles, and masters
// are fetched dynamically from the ASP.NET Core backend API and persistent user storage.

export const initialGatewayMakes: any[] = [];
export const initialGatewayModels: any[] = [];
export const initialGateways: any[] = [];
export const initialChannels: any[] = [];
export const initialMeters: any[] = [];
export const initialAssets: any[] = [];
export const initialAssetMeterMappings: any[] = [];
export const initialMakes: any[] = [];
export const initialModels: any[] = [];
export const initialStandardParameters: any[] = [];
export const initialMeterProfiles: any[] = [];

export const initialConfig = {
  system_name: 'SaB Energy Monitoring Engine',
  polling_interval_seconds: 30,
  mqtt_publish_interval_seconds: 300,
  modbus_timeout_ms: 1000,
  mqtt_broker_url: 'mqtt://192.23.1.7:1883',
  mqtt_client_id: 'sab_edge_gw_alpha',
  database_type: 'Microsoft SQL Server (.NET ASP.NET Backend)',
  api_endpoint: 'http://192.23.1.7:8007',
  data_retention_days: 365,
  auto_reconnect: true,
  alert_email: 'scada-alerts@sabenergy.com',
  log_level: 'Information'
};
