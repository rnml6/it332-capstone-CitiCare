const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { verifyToken, isAdmin, isBHW } = require('../middleware/auth');
const { validate, validateHealthProfile, validateVitalSigns, validateCondition, validateMedication, validateAllergen, validateImmunization } = require('../utils/validators');

// ==================== Health Profile Routes ====================
router.get('/profile/:residentId', verifyToken, healthController.getHealthProfile);
router.put('/profile/:residentId', verifyToken, isAdmin, validate(validateHealthProfile), healthController.updateHealthProfile);

// ==================== Vital Signs Routes ====================
router.get('/vitals/:residentId', verifyToken, healthController.getVitalSigns);
router.get('/vitals/:residentId/latest', verifyToken, healthController.getLatestVitalSigns);
router.post('/vitals/:residentId', verifyToken, isBHW, validate(validateVitalSigns), healthController.recordVitalSigns);

// ==================== Chronic Conditions Routes ====================
router.get('/conditions/:residentId', verifyToken, healthController.getChronicConditions);
router.post('/conditions/:residentId', verifyToken, isAdmin, validate(validateCondition), healthController.addChronicCondition);
router.put('/conditions/:residentId/:conditionId', verifyToken, isAdmin, validate(validateCondition), healthController.updateChronicCondition);
router.delete('/conditions/:residentId/:conditionId', verifyToken, isAdmin, healthController.deleteChronicCondition);

// ==================== Medications Routes ====================
router.get('/medications/:residentId', verifyToken, healthController.getMedications);
router.post('/medications/:residentId', verifyToken, isAdmin, validate(validateMedication), healthController.addMedication);
router.put('/medications/:residentId/:medicationId', verifyToken, isAdmin, validate(validateMedication), healthController.updateMedication);
router.delete('/medications/:residentId/:medicationId', verifyToken, isAdmin, healthController.deleteMedication);

// ==================== Allergens Routes ====================
router.get('/allergens/:residentId', verifyToken, healthController.getAllergens);
router.post('/allergens/:residentId', verifyToken, isAdmin, validate(validateAllergen), healthController.addAllergen);
router.delete('/allergens/:residentId/:allergenId', verifyToken, isAdmin, healthController.deleteAllergen);

// ==================== Focus Groups Routes ====================
router.get('/focus-groups', verifyToken, healthController.getFocusGroups);
router.get('/focus-groups/:residentId', verifyToken, healthController.getResidentFocusGroups);
router.put('/focus-groups/:residentId', verifyToken, isAdmin, healthController.updateResidentFocusGroups);

// ==================== Risk Score Routes ====================
router.post('/calculate-risk/:residentId', verifyToken, isAdmin, healthController.calculateRiskScore);

// ==================== Statistics Routes ====================
router.get('/statistics', verifyToken, healthController.getHealthStatistics);

// ==================== Vaccines & Immunizations Routes ====================
router.get('/vaccines', verifyToken, healthController.getVaccines);
router.get('/immunizations/:residentId', verifyToken, healthController.getChildImmunizations);
router.post('/immunizations/:residentId', verifyToken, isAdmin, validate(validateImmunization), healthController.addChildImmunization);

module.exports = router;