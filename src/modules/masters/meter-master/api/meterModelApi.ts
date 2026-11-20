import { request } from '../../../../services/client';
import { resolveIntegerId } from '../../../../services/idHelper';

const BASE_URL = '/api/Model/meter-models';

export const meterModelApi = {
  getAll: (): Promise<any[]> => request(`${BASE_URL}/GetAll`),

  getById: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Meter Model ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${BASE_URL}/GetById?id=${intId}`);
  },

  create: (payload: any): Promise<any> => {
    const makeId = resolveIntegerId(payload.meterMakeId ?? payload.make_id, 1);
    const name = payload.meterModelName || payload.model_name || '';

    return request(`${BASE_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify({
        meterModelName: String(name).trim(),
        meterMakeId: makeId ?? 1,
      }),
    });
  },

  update: (idOrPayload: any, maybePayload?: any): Promise<any> => {
    let rawId: any;
    let payload: any;
    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      rawId = idOrPayload.id ?? idOrPayload.modelId ?? idOrPayload.model_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Meter Model ID '${rawId}'. Cannot update without a valid database integer primary key.`)
      );
    }

    const makeId = resolveIntegerId(payload.meterMakeId ?? payload.make_id, 1);
    const name = payload.meterModelName || payload.model_name || '';
    const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

    return request(`${BASE_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify({
        meterModelName: String(name).trim(),
        meterMakeId: makeId ?? 1,
        isActive,
      }),
    });
  },

  delete: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Meter Model ID '${id}'. Cannot delete without a valid database integer primary key.`)
      );
    }
    return request(`${BASE_URL}/Delete?id=${intId}`, {
      method: 'DELETE',
    });
  },
};

export default meterModelApi;
