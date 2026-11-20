import { apiClient } from '../../../services/client';

export const assetMappingApi = {
  getAll: () => apiClient.get('/AssetMapping/GetAll').catch(() => null),
  getById: (id) => apiClient.get(`/AssetMapping/GetById?id=${id}`).catch(() => null),
  create: (data) => apiClient.post('/AssetMapping/Create', data),
  update: (data) => apiClient.put('/AssetMapping/Update', data),
  delete: (id) => apiClient.delete(`/AssetMapping/Delete?id=${id}`),
};

export default assetMappingApi;

