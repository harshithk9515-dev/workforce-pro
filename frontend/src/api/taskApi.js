import axiosInstance from './axiosInstance';

export const taskApi = {
  list: (params) => axiosInstance.get('/tasks', { params }).then((r) => r.data.data),
  getById: (id) => axiosInstance.get(`/tasks/${id}`).then((r) => r.data.data),
  create: (payload) => axiosInstance.post('/tasks', payload).then((r) => r.data.data),
  update: (id, payload) => axiosInstance.patch(`/tasks/${id}`, payload).then((r) => r.data.data),
  updateStatus: (id, payload) =>
    axiosInstance.patch(`/tasks/${id}/status`, payload).then((r) => r.data.data),
  remove: (id) => axiosInstance.delete(`/tasks/${id}`).then((r) => r.data.data),
};
