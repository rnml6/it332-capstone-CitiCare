import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authorize } from '../middleware/auth.js';

const router = Router();

router.get('/risk-distribution', authorize(['Admin']), analyticsController.getPurokRiskDistributions);
router.get('/disease-metrics', authorize(['Admin']), analyticsController.getDiseaseMetricsPerPurok);
router.get('/ai-recommendations', authorize(['Admin']), analyticsController.getAIRecommendations);

export default router;