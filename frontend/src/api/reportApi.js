import axiosInstance from './axiosInstance';

export const reportApi = {
  getHistory: () => axiosInstance.get('/reports/history').then((r) => r.data.data),

  // Downloads a report file (PDF/CSV) and triggers a browser save.
  download: async (type, format) => {
    const response = await axiosInstance.get(`/reports/${type}`, {
      params: { format },
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `${type}-report.${format}`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
