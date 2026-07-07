const express = require('express');
const router = express.Router();
const bhwController = require('../controllers/bhwController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes (authenticated)
router.get('/', verifyToken, bhwController.getAllBHWs);
router.get('/:id', verifyToken, bhwController.getBHWById);
router.get('/:id/schedules', verifyToken, bhwController.getBHWSchedules);

// Admin only routes
router.post('/', verifyToken, isAdmin, bhwController.createBHW);
router.put('/:id', verifyToken, isAdmin, bhwController.updateBHW);
router.delete('/:id', verifyToken, isAdmin, bhwController.deleteBHW);
router.post('/:id/assign-purok', verifyToken, isAdmin, bhwController.assignBHWToPurok);

module.exports = router;