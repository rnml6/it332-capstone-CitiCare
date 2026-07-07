const express = require('express');
const router = express.Router();
const purokController = require('../controllers/purokController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// SPECIFIC ROUTES FIRST (these must come before /:id)
router.get('/risk-scores', verifyToken, purokController.getPurokRiskScores);
router.get('/:id/stats', verifyToken, purokController.getPurokWithStats);  // <-- THIS MUST BE BEFORE /:id

// GENERIC ROUTES LAST
router.get('/', verifyToken, purokController.getAllPuroks);
router.get('/:id', verifyToken, purokController.getPurokById);  // <-- THIS COMES LAST

// Admin only routes
router.post('/', verifyToken, isAdmin, purokController.createPurok);
router.put('/:id', verifyToken, isAdmin, purokController.updatePurok);
router.delete('/:id', verifyToken, isAdmin, purokController.deletePurok);

module.exports = router;