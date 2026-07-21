// routes/dashboardRoutes.js
import express from 'express';
import {
  getDashboardStats,
  getRiskDistribution,
  getRiskDistributionByPurok,
  getCommonDiseases,
  getMonthlyTrends,
  getTodayActivities,
  getAIRecommendation
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, getDashboardStats);
router.get('/risk-distribution', authenticate, getRiskDistribution);
router.get('/risk-distribution-by-purok', authenticate, getRiskDistributionByPurok);
router.get('/common-diseases', authenticate, getCommonDiseases);
router.get('/monthly-trends', authenticate, getMonthlyTrends);
router.get('/today-activities', authenticate, getTodayActivities);
router.get('/ai-recommendation', authenticate, getAIRecommendation);

export default router;