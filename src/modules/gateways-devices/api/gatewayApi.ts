import { request } from '../../../services/client';
import { resolveIntegerId, ensureValidIntegerId } from '../../../services/idHelper';

const BASE_URL = '/api/Gateway/gateways';

export interface CreateGatewayDto {
  deviceName: string;
  serialNo: string;
  gatewayMakeId: number;
  gatewayModelId?: number | null;
  ipAddress: string;
  macAddress: string;
  channelCount: number;
  firmwareVersion?: string | null;
  keepaliveTime: number;
  wifi_SSID?: string | null;
  wifi_Port?: number | null;
}

export interface UpdateGatewayDto extends CreateGatewayDto {
  isActive?: boolean;
}

export const gatewayApi = {
  getAll: (): Promise<any> => request(`${BASE_URL}/GetAll`),

  getById: async (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return { isSuccess: false, data: null, message: `Invalid Gateway ID '${id}'` };
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

  create: (payload: any): Promise<any> => {
    const makeId = resolveIntegerId(payload.gatewayMakeId ?? payload.gw_make_id, 1);
    const modelId = resolveIntegerId(payload.gatewayModelId ?? payload.gw_model_id, null);

    const dto: CreateGatewayDto = {
      deviceName: String(payload.deviceName || payload.Gateway_name || 'Enerlink IoT Gateway'),
      serialNo: String(payload.serialNo || payload.serial_number || ''),
      gatewayMakeId: makeId ?? 1,
      gatewayModelId: modelId,
      ipAddress: String(payload.ipAddress || payload.ip_address || ''),
      macAddress: String(payload.macAddress || payload.mac_address || ''),
      channelCount: Number(payload.channelCount || payload.channel_count || 2),
      firmwareVersion: payload.firmwareVersion || payload.firmware_version || null,
      keepaliveTime: Number(payload.keepaliveTime || payload.keep_alive_seconds || 30),
      wifi_SSID: String(payload.wifi_SSID || payload.wifiSsid || payload.wifi_ssid || 'SaB-Energy-WiFi').trim(),
      wifi_Port: payload.wifi_Port !== undefined && payload.wifi_Port !== null && payload.wifi_Port !== ''
        ? Number(payload.wifi_Port)
        : (payload.wifi_port !== undefined && payload.wifi_port !== null && payload.wifi_port !== '' ? Number(payload.wifi_port) : 8080),
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
      rawId = idOrPayload.id ?? idOrPayload.gatewayId ?? idOrPayload.Gateway_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Gateway ID '${rawId}'. Cannot update gateway without a valid database integer primary key.`)
      );
    }

    const makeId = resolveIntegerId(payload.gatewayMakeId ?? payload.gw_make_id, 1);
    const modelId = resolveIntegerId(payload.gatewayModelId ?? payload.gw_model_id, null);

    const dto: UpdateGatewayDto = {
      deviceName: String(payload.deviceName || payload.Gateway_name || 'Enerlink IoT Gateway'),
      serialNo: String(payload.serialNo || payload.serial_number || ''),
      gatewayMakeId: makeId ?? 1,
      gatewayModelId: modelId,
      ipAddress: String(payload.ipAddress || payload.ip_address || ''),
      macAddress: String(payload.macAddress || payload.mac_address || ''),
      channelCount: Number(payload.channelCount || payload.channel_count || 2),
      firmwareVersion: payload.firmwareVersion || payload.firmware_version || null,
      keepaliveTime: Number(payload.keepaliveTime || payload.keep_alive_seconds || 30),
      wifi_SSID: String(payload.wifi_SSID || payload.wifiSsid || payload.wifi_ssid || 'SaB-Energy-WiFi').trim(),
      wifi_Port: payload.wifi_Port !== undefined && payload.wifi_Port !== null && payload.wifi_Port !== ''
        ? Number(payload.wifi_Port)
        : (payload.wifi_port !== undefined && payload.wifi_port !== null && payload.wifi_port !== '' ? Number(payload.wifi_port) : 8080),
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
        return { isSuccess: true, message: 'Gateway already deleted or not found.' };
      }
      throw err;
    }
  },
};

export default gatewayApi;
