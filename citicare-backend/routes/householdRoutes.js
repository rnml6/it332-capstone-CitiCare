const express = require('express');
const router = express.Router();
const householdController = require('../controllers/householdController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes (authenticated)
router.get('/', verifyToken, householdController.getAllHouseholds);
router.get('/:id', verifyToken, householdController.getHouseholdById);

// Admin only routes
router.post('/', verifyToken, isAdmin, householdController.createHousehold);
router.put('/:id', verifyToken, isAdmin, householdController.updateHousehold);
router.delete('/:id', verifyToken, isAdmin, householdController.deleteHousehold);

module.exports = router;