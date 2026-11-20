import { apiClient } from '../../../services/client';

/**
 * Energy Dashboard API endpoints
 */
export const dashboardApi = {
  // Fetch high-level summary KPI metrics
  getSummary: () => apiClient.get('/Dashboard/summary').catch(() => null),

  // Fetch live telemetry stream / snapshot
  getLiveTelemetry: () => apiClient.get('/Dashboard/live-telemetry').catch(() => null),

  // Fetch gateway health statuses for dashboard
  getGatewayHealth: () => apiClient.get('/Dashboard/gateway-health').catch(() => null),
};

export default dashboardApi;

