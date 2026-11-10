import axiosInstance from './axiosInstance';

export const authApi = {
  register: (payload) => axiosInstance.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => axiosInstance.post('/auth/login', payload).then((r) => r.data.data),
  logout: () => axiosInstance.post('/auth/logout').then((r) => r.data.data),
  getMe: () => axiosInstance.get('/auth/me').then((r) => r.data.data),
  updateMe: (payload) => axiosInstance.patch('/auth/me', payload).then((r) => r.data.data),
  updatePassword: (payload) =>
    axiosInstance.patch('/auth/me/password', payload).then((r) => r.data.data),
};
