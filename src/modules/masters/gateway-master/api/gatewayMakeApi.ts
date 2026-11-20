import { request } from '../../../../services/client';
import { resolveIntegerId } from '../../../../services/idHelper';

const BASE_URL = '/api/Make/gateway-makes';

export interface GatewayMakeDto {
  id?: number | string;
  gatewayMakeName?: string;
  gw_make_name?: string;
  isActive?: boolean;
}

export const gatewayMakeApi = {
  getAll: (): Promise<any[]> => request(`${BASE_URL}/GetAll`),

  getById: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Gateway Make ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${BASE_URL}/GetById?id=${intId}`);
  },

  create: (payload: string | GatewayMakeDto): Promise<any> => {
    const name = typeof payload === 'string'
      ? payload
      : (payload?.gatewayMakeName || payload?.gw_make_name || '');
    return request(`${BASE_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify({
        gatewayMakeName: String(name).trim(),
      }),
    });
  },

  update: (idOrPayload: number | string | GatewayMakeDto, maybePayload?: GatewayMakeDto): Promise<any> => {
    let rawId: any;
    let payload: GatewayMakeDto;

    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      rawId = (idOrPayload as any).id ?? (idOrPayload as any).gatewayMakeId ?? (idOrPayload as any).gw_make_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Gateway Make ID '${rawId}'. Cannot update without a valid database integer primary key.`)
      );
    }

    const name = typeof payload === 'string'
      ? (payload as string)
      : (payload?.gatewayMakeName || payload?.gw_make_name || '');
    const isActive = payload?.isActive !== undefined ? Boolean(payload.isActive) : true;

    return request(`${BASE_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify({
        gatewayMakeName: typeof name === 'string' ? name.trim() : '',
        isActive,
      }),
    });
  },

  delete: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Gateway Make ID '${id}'. Cannot delete without a valid database integer primary key.`)
      );
    }
    return request(`${BASE_URL}/Delete?id=${intId}`, {
      method: 'DELETE',
    });
  },
};

export default gatewayMakeApi;
