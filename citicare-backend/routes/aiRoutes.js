const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validate, validateAIRecommendation } = require('../utils/validators');

// Generate recommendations for a resident
router.post('/recommendations/:residentId', verifyToken, isAdmin, validate(validateAIRecommendation), aiController.generateRecommendations);

// Get resident recommendations
router.get('/recommendations/:residentId', verifyToken, aiController.getResidentRecommendations);

// Bulk generate (Admin only)
router.post('/recommendations/bulk/:period', verifyToken, isAdmin, aiController.generateBulkRecommendations);

module.exports = router;