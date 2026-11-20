import { enerlinkApi } from '../../../services/enerlinkApi';

/**
 * Communication Configuration API endpoints
 * Directly interfaces with http://192.23.1.7:8007/api/Enerlink/configuration
 */
export const commConfigApi = {
  getConfig: async (deviceId?: string) => {
    return enerlinkApi.getConfiguration(deviceId);
  },
  updateConfig: async (data: any) => {
    return enerlinkApi.saveConfiguration(data);
  },
  testConnection: () => enerlinkApi.testConnection(),
};

export default commConfigApi;

