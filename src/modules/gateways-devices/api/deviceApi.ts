import { gatewayApi } from './gatewayApi';
import { channelApi } from './channelApi';
import { apiClient } from '../../../services/client';

export * from './gatewayApi';
export * from './channelApi';

/**
 * Gateways & Devices API facade
 */
export const deviceApi = {
  // Gateways
  getGateways: () => gatewayApi.getAll(),
  getGatewayById: (id: number | string) => gatewayApi.getById(id),
  createGateway: (data: any) => gatewayApi.create(data),
  updateGateway: (idOrPayload: any, maybePayload?: any) => gatewayApi.update(idOrPayload, maybePayload),
  deleteGateway: (id: number | string) => gatewayApi.delete(id),

  // Channels
  getChannels: () => channelApi.getAll(),
  getChannelById: (id: number | string) => channelApi.getById(id),
  getChannelsByGatewayId: (gatewayId: number | string) => channelApi.getByGatewayId(gatewayId),
  createChannel: (data: any) => channelApi.create(data),
  updateChannel: (idOrPayload: any, maybePayload?: any) => channelApi.update(idOrPayload, maybePayload),
  deleteChannel: (id: number | string) => channelApi.delete(id),

  // Meters / Devices
  getMeters: () => apiClient.get('/Meter/meters/GetAll').catch(() => null),
  createMeter: (data: any) => apiClient.post('/Meter/meters/Create', data),
  updateMeter: (id: any, data: any) => apiClient.put(`/Meter/meters/Update?id=${encodeURIComponent(id)}`, data),
  deleteMeter: (id: any) => apiClient.delete(`/Meter/meters/Delete?id=${encodeURIComponent(id)}`),
};

export default deviceApi;
