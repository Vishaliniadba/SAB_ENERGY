import { request } from '../../../services/client';
import { resolveIntegerId } from '../../../services/idHelper';

const BASE_URL = '/api/Meter/meters';

export interface CreateMeterDto {
  serialNo?: string;
  customName?: string;
  channelId: number;
  slaveId: number;
  deviceProfileId: number;
  meterMakeId: number;
  meterModelId?: number | null;
  status?: string;
  baudRate: number;
  parityBit?: string;
  stopBit: number;
  dataBit: number;
}

export interface UpdateMeterDto extends CreateMeterDto {
  isActive?: boolean;
}

// Convert baud rate strings to integer codes expected by backend if needed
export const mapBaudRateToInt = (b: string | number): number => {
  const num = Number(b);
  if (num === 2400) return 1;
  if (num === 4800) return 2;
  if (num === 9600) return 3;
  if (num === 19200) return 4;
  if (num === 38400) return 5;
  if (num === 115200) return 6;
  return typeof b === 'number' && b < 10 ? b : 3;
};

export const mapIntToBaudRate = (code: number | string): string => {
  const num = Number(code);
  if (num === 1) return '2400';
  if (num === 2) return '4800';
  if (num === 3) return '9600';
  if (num === 4) return '19200';
  if (num === 5) return '38400';
  if (num === 6) return '115200';
  return String(code || '9600');
};

export const meterApi = {
  getAll: (): Promise<any> => request(`${BASE_URL}/GetAll`),

  getById: async (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return { isSuccess: false, data: null, message: `Invalid Meter ID '${id}'` };
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
    const channelId = resolveIntegerId(payload.channelId ?? payload.Channel_id, 1);
    const profileId = resolveIntegerId(payload.deviceProfileId ?? payload.device_profile ?? payload.profile_id, 1);
    const makeId = resolveIntegerId(payload.meterMakeId ?? payload.make_id, 1);
    const modelId = resolveIntegerId(payload.meterModelId ?? payload.model_id, null);

    const dto: CreateMeterDto = {
      serialNo: String(payload.serialNo || payload.serial_number || payload.meter_serial_number || ''),
      customName: String(payload.customName || payload.Meter_name || payload.name || 'Meter'),
      channelId: channelId ?? 1,
      slaveId: Number(payload.slaveId || payload.slave_id || 1),
      deviceProfileId: profileId ?? 1,
      meterMakeId: makeId ?? 1,
      meterModelId: modelId,
      status: payload.status || 'Active',
      baudRate: mapBaudRateToInt(payload.baudRate || payload.baud_rate || 9600),
      parityBit: String(payload.parityBit || payload.parity_bit || '1'),
      stopBit: Number(payload.stopBit || payload.stop_bit || 1),
      dataBit: Number(payload.dataBit || payload.data_bit || 8),
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
      rawId = idOrPayload.id ?? idOrPayload.meterId ?? idOrPayload.Meter_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Meter ID '${rawId}'. Cannot update meter without a valid database integer primary key.`)
      );
    }

    const channelId = resolveIntegerId(payload.channelId ?? payload.Channel_id, 1);
    const profileId = resolveIntegerId(payload.deviceProfileId ?? payload.device_profile ?? payload.profile_id, 1);
    const makeId = resolveIntegerId(payload.meterMakeId ?? payload.make_id, 1);
    const modelId = resolveIntegerId(payload.meterModelId ?? payload.model_id, null);

    const dto: UpdateMeterDto = {
      serialNo: String(payload.serialNo || payload.serial_number || payload.meter_serial_number || ''),
      customName: String(payload.customName || payload.Meter_name || payload.name || 'Meter'),
      channelId: channelId ?? 1,
      slaveId: Number(payload.slaveId || payload.slave_id || 1),
      deviceProfileId: profileId ?? 1,
      meterMakeId: makeId ?? 1,
      meterModelId: modelId,
      status: payload.status || 'Active',
      baudRate: mapBaudRateToInt(payload.baudRate || payload.baud_rate || 9600),
      parityBit: String(payload.parityBit || payload.parity_bit || '1'),
      stopBit: Number(payload.stopBit || payload.stop_bit || 1),
      dataBit: Number(payload.dataBit || payload.data_bit || 8),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : payload.status !== 'Inactive' && payload.status !== 'Offline',
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
        return { isSuccess: true, message: 'Meter already deleted or not found.' };
      }
      throw err;
    }
  },
};

export default meterApi;
