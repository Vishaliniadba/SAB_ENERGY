import { request } from '../../../../services/client';
import { resolveIntegerId } from '../../../../services/idHelper';

const BASE_URL = '/api/Model/gateway-models';

export interface GatewayModelDto {
  id?: number | string;
  gw_model_id?: number | string;
  gatewayModelName?: string;
  gw_model_name?: string;
  gatewayMakeId?: number | string;
  gw_make_id?: number | string;
  isActive?: boolean;
  channel_count?: number;
  channel_names?: string[];
  firmware_version?: string;
}

export const gatewayModelApi = {
  getAll: (): Promise<any[]> => request(`${BASE_URL}/GetAll`),

  getById: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(new Error(`Invalid Gateway Model ID '${id}'. Expected an integer primary key.`));
    }
    return request(`${BASE_URL}/GetById?id=${intId}`);
  },

  create: (payload: GatewayModelDto): Promise<any> => {
    const name = payload.gatewayModelName || payload.gw_model_name || '';
    const makeId = resolveIntegerId(payload.gatewayMakeId ?? payload.gw_make_id, 1);

    return request(`${BASE_URL}/Create`, {
      method: 'POST',
      body: JSON.stringify({
        gatewayModelName: String(name).trim(),
        gatewayMakeId: makeId ?? 1,
      }),
    });
  },

  update: (idOrPayload: number | string | GatewayModelDto, maybePayload?: GatewayModelDto): Promise<any> => {
    let rawId: any;
    let payload: GatewayModelDto;

    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      rawId = (idOrPayload as any).id ?? (idOrPayload as any).gatewayModelId ?? (idOrPayload as any).gw_model_id;
      payload = idOrPayload;
    } else {
      rawId = idOrPayload;
      payload = maybePayload || {};
    }

    const intId = resolveIntegerId(rawId);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Gateway Model ID '${rawId}'. Cannot update without a valid database integer primary key.`)
      );
    }

    const name = payload.gatewayModelName || payload.gw_model_name || '';
    const makeId = resolveIntegerId(payload.gatewayMakeId ?? payload.gw_make_id, 1);
    const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

    return request(`${BASE_URL}/Update?id=${intId}`, {
      method: 'PUT',
      body: JSON.stringify({
        gatewayModelName: typeof name === 'string' ? name.trim() : '',
        gatewayMakeId: makeId ?? 1,
        isActive,
      }),
    });
  },

  delete: (id: number | string): Promise<any> => {
    const intId = resolveIntegerId(id);
    if (!intId) {
      return Promise.reject(
        new Error(`Invalid Gateway Model ID '${id}'. Cannot delete without a valid database integer primary key.`)
      );
    }
    return request(`${BASE_URL}/Delete?id=${intId}`, {
      method: 'DELETE',
    });
  },
};

export default gatewayModelApi;
