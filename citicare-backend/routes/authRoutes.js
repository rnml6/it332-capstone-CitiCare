const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth'); // ADD THIS

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getCurrentUser); // FIXED
router.post('/change-password', verifyToken, authController.changePassword); // FIXED

module.exports = router;