import { request } from '../../../../services/client';
import { resolveIntegerId } from '../../../../services/idHelper';

const BASE_URL = '/api/ParameterMaster';

export const parameterMasterApi = {
  getAll: (): Promise<any[]> =>
    request(`${BASE_URL}/GetAll`).catch(async () => {
      // Fallback to /Get if /GetAll endpoint is not defined
      return request(`${BASE_URL}/Get`);
    }),

  getById: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Parameter Master ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${BASE_URL}/GetById?id=${intId}`);
  },

  create: (payload: any): Promise<any> => {
    const catId = resolveIntegerId(payload.categoryId ?? payload.category_id, 1);

    return request(`${BASE_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify({
        key: String(payload.key || '').trim(),
        displayName: String(payload.displayName || payload.display_name || payload.key || '').trim(),
        categoryId: catId ?? 1,
        unit: String(payload.unit || ''),
      }),
    });
  },

  update: (idOrPayload: any, maybePayload?: any): Promise<any> => {
    let rawId: any;
    let payload: any;
    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      rawId = idOrPayload.id ?? idOrPayload.parameterMasterId;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Parameter Master ID '${rawId}'. Cannot update without a valid database integer primary key.`)
      );
    }

    const catId = resolveIntegerId(payload.categoryId ?? payload.category_id, 1);

    return request(`${BASE_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify({
        key: String(payload.key || '').trim(),
        displayName: String(payload.displayName || payload.display_name || payload.key || '').trim(),
        categoryId: catId ?? 1,
        unit: String(payload.unit || ''),
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      }),
    });
  },

  delete: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Parameter Master ID '${id}'. Cannot delete without a valid database integer primary key.`)
      );
    }
    return request(`${BASE_URL}/Delete?id=${intId}`, {
      method: 'DELETE',
    });
  },
};

export default parameterMasterApi;
