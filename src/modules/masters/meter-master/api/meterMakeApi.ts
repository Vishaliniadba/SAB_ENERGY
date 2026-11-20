import { request } from '../../../../services/client';
import { resolveIntegerId } from '../../../../services/idHelper';

const BASE_URL = '/api/Make/meter-makes';

export const meterMakeApi = {
  getAll: (): Promise<any[]> => request(`${BASE_URL}/GetAll`),

  getById: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Meter Make ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${BASE_URL}/GetById?id=${intId}`);
  },

  create: (payload: any): Promise<any> => {
    const name = typeof payload === 'string'
      ? payload
      : (payload?.meterMakeName || payload?.make_name || '');
    return request(`${BASE_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify({
        meterMakeName: String(name).trim(),
      }),
    });
  },

  update: (idOrPayload: any, maybePayload?: any): Promise<any> => {
    let rawId: any;
    let payload: any;
    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      rawId = idOrPayload.id ?? idOrPayload.makeId ?? idOrPayload.make_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Meter Make ID '${rawId}'. Cannot update without a valid database integer primary key.`)
      );
    }

    const name = typeof payload === 'string'
      ? payload
      : (payload?.meterMakeName || payload?.make_name || '');
    const isActive = payload?.isActive !== undefined ? Boolean(payload.isActive) : true;

    return request(`${BASE_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify({
        meterMakeName: String(name).trim(),
        isActive,
      }),
    });
  },

  delete: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Meter Make ID '${id}'. Cannot delete without a valid database integer primary key.`)
      );
    }
    return request(`${BASE_URL}/Delete?id=${intId}`, {
      method: 'DELETE',
    });
  },
};

export default meterMakeApi;
