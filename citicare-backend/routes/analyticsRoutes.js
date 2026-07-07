const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

router.get('/statistics', verifyToken, analyticsController.getOverallStatistics);
router.get('/monthly-risk', verifyToken, analyticsController.getMonthlyRiskDistribution);
router.get('/purok-risk', verifyToken, analyticsController.getPurokRiskDistribution);
router.get('/diseases', verifyToken, analyticsController.getCommonDiseasesByPurok);
router.get('/bhw-workload', verifyToken, analyticsController.getBHWWorkload);
router.get('/resident-risk', verifyToken, analyticsController.getResidentRiskDistribution);
router.get('/focus-groups', verifyToken, analyticsController.getFocusGroupStats);

module.exports = router;