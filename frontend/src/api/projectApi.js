import axiosInstance from './axiosInstance';

export const projectApi = {
  list: (params) => axiosInstance.get('/projects', { params }).then((r) => r.data.data),
  getById: (id) => axiosInstance.get(`/projects/${id}`).then((r) => r.data.data),
  create: (payload) => axiosInstance.post('/projects', payload).then((r) => r.data.data),
  update: (id, payload) => axiosInstance.patch(`/projects/${id}`, payload).then((r) => r.data.data),
  remove: (id) => axiosInstance.delete(`/projects/${id}`).then((r) => r.data.data),
};
