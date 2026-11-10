import axiosInstance from './axiosInstance';

export const userApi = {
  list: (params) => axiosInstance.get('/users', { params }).then((r) => r.data.data),
  create: (payload) => axiosInstance.post('/users', payload).then((r) => r.data.data),
  update: (id, payload) => axiosInstance.patch(`/users/${id}`, payload).then((r) => r.data.data),
  remove: (id) => axiosInstance.delete(`/users/${id}`).then((r) => r.data.data),
};
