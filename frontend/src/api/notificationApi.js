import axiosInstance from './axiosInstance';

export const notificationApi = {
  list: (params) => axiosInstance.get('/notifications', { params }).then((r) => r.data.data),
  markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/read`).then((r) => r.data.data),
  markAllAsRead: () => axiosInstance.patch('/notifications/read-all').then((r) => r.data.data),
  remove: (id) => axiosInstance.delete(`/notifications/${id}`).then((r) => r.data.data),
};
