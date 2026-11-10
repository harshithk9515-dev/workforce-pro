import axiosInstance from './axiosInstance';

export const dashboardApi = {
  getMine: () => axiosInstance.get('/dashboard').then((r) => r.data.data),
};
