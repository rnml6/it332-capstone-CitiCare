const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes (authenticated)
router.get('/', verifyToken, appointmentController.getAllAppointments);
router.get('/bhw', verifyToken, appointmentController.getBHWAppointments);
router.get('/:id', verifyToken, appointmentController.getAppointmentById);

// BHW can update status
router.patch('/:id/status', verifyToken, appointmentController.updateAppointmentStatus);

// Admin only routes
router.post('/', verifyToken, isAdmin, appointmentController.createAppointment);
router.put('/:id', verifyToken, isAdmin, appointmentController.updateAppointment);
router.delete('/:id', verifyToken, isAdmin, appointmentController.deleteAppointment);

module.exports = router;