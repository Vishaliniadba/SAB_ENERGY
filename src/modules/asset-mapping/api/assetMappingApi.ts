import { apiClient } from '../../../services/client';

export interface AssetMappingRecord {
  Mapping_id: string;
  Asset_id: string;
  asset_name?: string;
  concern_name: string;
  category_name: string;
  location: string;
  zone: string;
  building: string;
  department: string;
  floor: string;
  room_name: string;
  details: string;
  Meter_id?: string;
  meter_name?: string;
  multiplication_factor?: string | number;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const assetMappingApi = {
  getAll: () => apiClient.get('/AssetMapping/GetAll').catch(() => null),
  getById: (id: string) => apiClient.get(`/AssetMapping/GetById?id=${id}`).catch(() => null),
  create: (data: Partial<AssetMappingRecord>) => apiClient.post('/AssetMapping/Create', data),
  update: (data: Partial<AssetMappingRecord>) => apiClient.put('/AssetMapping/Update', data),
  delete: (id: string) => apiClient.delete(`/AssetMapping/Delete?id=${id}`),
};

export default assetMappingApi;

