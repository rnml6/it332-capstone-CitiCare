const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ============================================
// RESIDENT RECOMMENDATIONS
// ============================================

// Get resident recommendations (Authenticated users)
router.get('/residents/:id/recommendations', verifyToken, aiController.getResidentRecommendations);

// Generate new recommendation for a specific resident (Admin only)
router.post('/residents/:id/recommendations', verifyToken, isAdmin, aiController.generateRecommendations);

// Alternative: Generate recommendations with period in params (Admin only)
router.post('/recommendations/:residentId', verifyToken, isAdmin, aiController.generateRecommendations);

// Get resident recommendations (Alternative route)
router.get('/recommendations/:residentId', verifyToken, aiController.getResidentRecommendations);

// ============================================
// PUROK RECOMMENDATIONS
// ============================================

// Get purok-level recommendations (Authenticated users)
router.get('/puroks/:id/recommendations', verifyToken, aiController.getPurokRecommendations);

// ============================================
// SYSTEM INSIGHTS & FORECASTING
// ============================================

// Get trend forecasting (Authenticated users)
router.get('/forecast', verifyToken, aiController.getTrendForecast);

// Get system-wide insights dashboard (Authenticated users)
router.get('/insights', verifyToken, aiController.getSystemInsights);

// ============================================
// BULK RECOMMENDATIONS
// ============================================

// Generate bulk recommendations for all residents (Admin only)
router.post('/recommendations/bulk/:period', verifyToken, isAdmin, aiController.generateBulkRecommendations);

// Alternative bulk route with period in body
router.post('/recommendations/bulk', verifyToken, isAdmin, aiController.generateBulkRecommendations);

// ============================================
// RECOMMENDATION HISTORY & EXPORT
// ============================================

// Get recommendation history (Authenticated users)
router.get('/history', verifyToken, aiController.getRecommendationHistory);

// Export recommendations (Authenticated users)
router.get('/export', verifyToken, aiController.exportRecommendations);

module.exports = router;