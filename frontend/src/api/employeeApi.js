import axiosInstance from './axiosInstance';

export const employeeApi = {
  list: (params) => axiosInstance.get('/employees', { params }).then((r) => r.data.data),
  getById: (id) => axiosInstance.get(`/employees/${id}`).then((r) => r.data.data),
  create: (payload) => axiosInstance.post('/employees', payload).then((r) => r.data.data),
  update: (id, payload) => axiosInstance.patch(`/employees/${id}`, payload).then((r) => r.data.data),
  remove: (id) => axiosInstance.delete(`/employees/${id}`).then((r) => r.data.data),
};
