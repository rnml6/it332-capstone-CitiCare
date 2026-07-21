// api/dashboardApi.js
import api from './axios';

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRiskDistribution: () => api.get('/dashboard/risk-distribution'),
  getRiskDistributionByPurok: () => api.get('/dashboard/risk-distribution-by-purok'),
  getCommonDiseases: (purokId) => api.get('/dashboard/common-diseases', { params: { purokId } }),
  getMonthlyTrends: (year) => api.get('/dashboard/monthly-trends', { params: { year } }),
  getTodayActivities: () => api.get('/dashboard/today-activities'),
  getAIRecommendation: (period = 'monthly') => api.get('/dashboard/ai-recommendation', { params: { period } }),
};