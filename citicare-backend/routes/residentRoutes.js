const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes (authenticated)
router.get('/', verifyToken, residentController.getAllResidents);
router.get('/:id', verifyToken, residentController.getResidentById);
router.get('/:id/medical-history', verifyToken, residentController.getMedicalHistory);
router.post('/:id/vital-signs', verifyToken, residentController.addVitalSigns);
router.post('/:id/medical-history', verifyToken, residentController.addMedicalHistory);

// Admin only routes
router.post('/', verifyToken, isAdmin, residentController.createResident);
router.put('/:id', verifyToken, isAdmin, residentController.updateResident);
router.delete('/:id', verifyToken, isAdmin, residentController.deleteResident);

module.exports = router;