import { request } from '../../../services/client';
import { resolveIntegerId } from '../../../services/idHelper';

const BASE_URL = '/api/Channel';

export interface CreateChannelDto {
  channelName: string;
  gatewayId: number;
}

export interface UpdateChannelDto extends CreateChannelDto {
  isActive?: boolean;
}

export const channelApi = {
  getAll: (): Promise<any> => request(`${BASE_URL}/GetAll`),

  getById: async (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return { isSuccess: false, data: null, message: `Invalid Channel ID '${id}'` };
    }
    try {
      return await request(`${BASE_URL}/GetById?id=${intId}`);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.status === 404 || msg.includes('not found')) {
        return { isSuccess: false, data: null, message: err.message };
      }
      throw err;
    }
  },

  getByGatewayId: async (gatewayId: number | string): Promise<any> => {
    const intGwId = resolveIntegerId(gatewayId);
    if (!intGwId) {
      return { isSuccess: true, data: [] };
    }
    try {
      return await request(`${BASE_URL}/GetByGatewayId?gatewayId=${intGwId}`);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.status === 404 || msg.includes('not found')) {
        return { isSuccess: true, data: [] };
      }
      throw err;
    }
  },

  create: (payload: any): Promise<any> => {
    const gwId = resolveIntegerId(payload.gatewayId ?? payload.Gateway_id, 1);

    const dto: CreateChannelDto = {
      channelName: String(payload.channelName || payload.Channel_name || 'Channel 1'),
      gatewayId: gwId ?? 1,
    };

    return request(`${BASE_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  update: (idOrPayload: any, maybePayload?: any): Promise<any> => {
    let rawId: any;
    let payload: any;
    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      rawId = idOrPayload.id ?? idOrPayload.channelId ?? idOrPayload.Channel_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Channel ID '${rawId}'. Cannot update channel without a valid database integer primary key.`)
      );
    }

    const gwId = resolveIntegerId(payload.gatewayId ?? payload.Gateway_id, 1);

    const dto: UpdateChannelDto = {
      channelName: String(payload.channelName || payload.Channel_name || 'Channel 1'),
      gatewayId: gwId ?? 1,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    };

    return request(`${BASE_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  delete: async (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return { isSuccess: true, message: 'Deleted' };
    }
    try {
      return await request(`${BASE_URL}/Delete?id=${intId}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.status === 404 || msg.includes('not found')) {
        return { isSuccess: true, message: 'Channel already deleted or not found.' };
      }
      throw err;
    }
  },
};

export default channelApi;
