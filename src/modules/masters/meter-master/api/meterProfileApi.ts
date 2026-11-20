import { request } from '../../../../services/client';
import { resolveIntegerId } from '../../../../services/idHelper';

const BASE_URL = '/api/MeterProfile';
const PARAM_URL = '/api/MeterParameter';

export interface CreateMeterProfileDto {
  profileVersion: string;
  makeId: number;
  modelId: number;
  addressOffest: number;
  holdingRegister: number;
  byteOrder: number;
}

export interface UpdateMeterProfileDto extends CreateMeterProfileDto {
  isActive?: boolean;
}

export interface MeterParameterDto {
  id?: number;
  meterProfileId: number;
  parameterMasterId: number;
  address: number;
  dataType: number;
  multiplier: number;
  isActive?: boolean;
}

export const meterProfileApi = {
  // ── Profile Endpoints ──
  getAll: (): Promise<any> => request(`${BASE_URL}/GetAll`),

  getById: async (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return { isSuccess: false, data: null, message: `Invalid Meter Profile ID '${id}'` };
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
    const makeId = resolveIntegerId(payload.makeId ?? payload.make_id, 1);
    const modelId = resolveIntegerId(payload.modelId ?? payload.model_id, 1);

    const byteOrderVal =
      typeof payload.byteOrder === 'number'
        ? payload.byteOrder
        : payload.byte_order === 'ABCD' ? 1
        : payload.byte_order === 'CDAB' ? 2
        : payload.byte_order === 'BADC' ? 3
        : payload.byte_order === 'DCBA' ? 4
        : 2;

    const dto: CreateMeterProfileDto = {
      profileVersion: String(payload.profileVersion || payload.profile_version || '1.0.0'),
      makeId: makeId ?? 1,
      modelId: modelId ?? 1,
      addressOffest: Number(
        payload.addressOffest !== undefined
          ? payload.addressOffest
          : (payload.address_offset !== undefined ? payload.address_offset : -40001)
      ),
      holdingRegister: Number(
        payload.holdingRegister !== undefined
          ? payload.holdingRegister
          : (payload.function_code !== undefined ? payload.function_code : 3)
      ),
      byteOrder: byteOrderVal,
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
      rawId = idOrPayload.id ?? idOrPayload.meterProfileId ?? idOrPayload.profile_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Meter Profile ID '${rawId}'. Cannot update meter profile without a valid database integer primary key.`)
      );
    }

    const makeId = resolveIntegerId(payload.makeId ?? payload.make_id, 1);
    const modelId = resolveIntegerId(payload.modelId ?? payload.model_id, 1);

    const byteOrderVal =
      typeof payload.byteOrder === 'number'
        ? payload.byteOrder
        : payload.byte_order === 'ABCD' ? 1
        : payload.byte_order === 'CDAB' ? 2
        : payload.byte_order === 'BADC' ? 3
        : payload.byte_order === 'DCBA' ? 4
        : 2;

    const dto: UpdateMeterProfileDto = {
      profileVersion: String(payload.profileVersion || payload.profile_version || '1.0.0'),
      makeId: makeId ?? 1,
      modelId: modelId ?? 1,
      addressOffest: Number(
        payload.addressOffest !== undefined
          ? payload.addressOffest
          : (payload.address_offset !== undefined ? payload.address_offset : -40001)
      ),
      holdingRegister: Number(
        payload.holdingRegister !== undefined
          ? payload.holdingRegister
          : (payload.function_code !== undefined ? payload.function_code : 3)
      ),
      byteOrder: byteOrderVal,
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
        return { isSuccess: true, message: 'Meter profile already deleted or not found.' };
      }
      throw err;
    }
  },

  // ── Parameter Endpoints (Registers in Profile) ──
  getAllParameters: (): Promise<any> => request(`${PARAM_URL}/GetAll`),

  getParameterById: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Parameter ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${PARAM_URL}/GetById?id=${intId}`);
  },

  createParameter: (payload: any): Promise<any> => {
    const profileId = resolveIntegerId(payload.meterProfileId ?? payload.profile_id, 1);
    const pMasterId = resolveIntegerId(payload.parameterMasterId ?? payload.parameter_master_id, 1);

    const dto = {
      meterProfileId: profileId ?? 1,
      parameterMasterId: pMasterId ?? 1,
      address: Number(payload.address || 0),
      dataType: Number(payload.dataType || 1),
      multiplier: Number(payload.multiplier || 1),
    };

    return request(`${PARAM_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateParameter: (id: number | string, payload: any): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Parameter ID '${id}'. Expected an integer primary key.`));
    }

    const profileId = resolveIntegerId(payload.meterProfileId ?? payload.profile_id, 1);
    const pMasterId = resolveIntegerId(payload.parameterMasterId ?? payload.parameter_master_id, 1);

    const dto = {
      meterProfileId: profileId ?? 1,
      parameterMasterId: pMasterId ?? 1,
      address: Number(payload.address || 0),
      dataType: Number(payload.dataType || 1),
      multiplier: Number(payload.multiplier || 1),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    };

    return request(`${PARAM_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deleteParameter: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Parameter ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${PARAM_URL}/Delete?id=${intId}`, {
      method: 'DELETE',
    });
  },
};

export default meterProfileApi;
