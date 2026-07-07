const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    };
};

// ==================== Auth Validators ====================
const validateLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const validateRegister = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'bhw']).withMessage('Role must be admin or bhw'),
    body('firstName').optional().isString().withMessage('First name must be a string'),
    body('lastName').optional().isString().withMessage('Last name must be a string'),
    body('purokId').optional().isUUID().withMessage('Invalid purok ID'),
];

const validateChangePassword = [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ==================== Resident Validators ====================
// ==================== Resident Validators ====================
const validateResident = [
    body('first_name')
        .notEmpty()
        .withMessage('First name is required')
        .trim(),
    body('last_name')
        .notEmpty()
        .withMessage('Last name is required')
        .trim(),
    body('birth_date')
        .isDate()
        .withMessage('Valid birth date is required'),
    body('sex')
        .isIn(['Male', 'Female'])
        .withMessage('Sex must be Male or Female'),
    body('civil_status')
        .isIn(['Single', 'Married', 'Divorced', 'Widowed'])
        .withMessage('Invalid civil status'),
    body('contact_number')
        .optional()
        .isString()
        .withMessage('Contact number must be a string')
        .trim(),
    body('household_id')
        .optional()
        .isUUID()
        .withMessage('Invalid household ID'),
    // Add household number validation for creating new household
    body('household_number')
        .optional()
        .isString()
        .withMessage('Household number must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Household number must be between 1 and 50 characters'),
    body('purok_id')
        .optional()
        .isUUID()
        .withMessage('Invalid purok ID'),
    body('address_details')
        .optional()
        .isString()
        .withMessage('Address must be a string')
        .trim(),
    body('is_household_head')
        .optional()
        .isBoolean()
        .withMessage('is_household_head must be a boolean'),
];

// Also add a specific validator for creating a resident with a new household
const validateResidentWithNewHousehold = [
    ...validateResident,
    body('household_number')
        .notEmpty()
        .withMessage('Household number is required when creating a new household')
        .isString()
        .withMessage('Household number must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Household number must be between 1 and 50 characters'),
    body('purok_id')
        .notEmpty()
        .withMessage('Purok ID is required when creating a new household')
        .isUUID()
        .withMessage('Invalid purok ID'),
];

const validateResidentUpdate = [
    param('id').isUUID().withMessage('Invalid resident ID'),
    ...validateResident,
];

// ==================== Health Profile Validators ====================
const validateHealthProfile = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
    body('has_chronic_condition').optional().isBoolean().withMessage('has_chronic_condition must be a boolean'),
];

// ==================== Vital Signs Validators ====================
const validateVitalSigns = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('systolic_bp').optional().isInt({ min: 60, max: 250 }).withMessage('Systolic BP must be between 60 and 250'),
    body('diastolic_bp').optional().isInt({ min: 30, max: 150 }).withMessage('Diastolic BP must be between 30 and 150'),
    body('heart_rate').optional().isInt({ min: 30, max: 250 }).withMessage('Heart rate must be between 30 and 250'),
    body('temperature').optional().isFloat({ min: 30, max: 45 }).withMessage('Temperature must be between 30 and 45°C'),
    body('weight_kg').optional().isFloat({ min: 0.5, max: 500 }).withMessage('Weight must be between 0.5 and 500 kg'),
    body('height_cm').optional().isFloat({ min: 20, max: 300 }).withMessage('Height must be between 20 and 300 cm'),
    body('recorded_by_bhw_id').optional().isUUID().withMessage('Invalid BHW ID'),
];

// ==================== Chronic Condition Validators ====================
const validateCondition = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('disease_name').notEmpty().withMessage('Disease name is required'),
    body('date_diagnosed').optional().isDate().withMessage('Invalid date format'),
    body('severity').optional().isIn(['Mild', 'Moderate', 'Severe']).withMessage('Severity must be Mild, Moderate, or Severe'),
    body('status').optional().isIn(['Active', 'Inactive', 'Resolved']).withMessage('Status must be Active, Inactive, or Resolved'),
];

// ==================== Medication Validators ====================
const validateMedication = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('medication_name').notEmpty().withMessage('Medication name is required'),
    body('dosage').optional().isString().withMessage('Dosage must be a string'),
    body('dosage_frequency').notEmpty().withMessage('Dosage frequency is required'),
    body('start_date').optional().isDate().withMessage('Invalid date format'),
    body('end_date').optional().isDate().withMessage('Invalid date format'),
    body('status').optional().isIn(['Active', 'Completed', 'Discontinued']).withMessage('Invalid status'),
];

// ==================== Allergen Validators ====================
const validateAllergen = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('allergen').notEmpty().withMessage('Allergen name is required'),
    body('severity_level').optional().isIn(['Mild', 'Moderate', 'Severe']).withMessage('Severity must be Mild, Moderate, or Severe'),
    body('reaction').optional().isString().withMessage('Reaction must be a string'),
];

// ==================== Appointment Validators ====================
const validateAppointment = [
    body('resident_id').isUUID().withMessage('Invalid resident ID'),
    body('assigned_to_bhw_id').isUUID().withMessage('Invalid BHW ID'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('scheduled_date').isDate().withMessage('Valid date is required'),
    body('status').optional().isIn(['Pending', 'Completed', 'Cancelled']).withMessage('Invalid status'),
    body('remarks').optional().isString().withMessage('Remarks must be a string'),
];

const validateAppointmentUpdate = [
    param('id').isUUID().withMessage('Invalid appointment ID'),
    ...validateAppointment,
];

const validateAppointmentStatus = [
    param('id').isUUID().withMessage('Invalid appointment ID'),
    body('status').isIn(['Pending', 'Completed', 'Cancelled']).withMessage('Status must be Pending, Completed, or Cancelled'),
    body('remarks').optional().isString().withMessage('Remarks must be a string'),
];

// ==================== BHW Validators ====================
const validateBHW = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('purok_id').isUUID().withMessage('Invalid purok ID'),
    body('contact_number').optional().isString().withMessage('Contact number must be a string'),
    body('account_status').optional().isIn(['Active', 'Inactive']).withMessage('Account status must be Active or Inactive'),
];

const validateBHWUpdate = [
    param('id').isUUID().withMessage('Invalid BHW ID'),
    body('first_name').optional().isString().withMessage('First name must be a string'),
    body('last_name').optional().isString().withMessage('Last name must be a string'),
    body('purok_id').optional().isUUID().withMessage('Invalid purok ID'),
    body('contact_number').optional().isString().withMessage('Contact number must be a string'),
    body('account_status').optional().isIn(['Active', 'Inactive']).withMessage('Account status must be Active or Inactive'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ==================== Purok Validators ====================
const validatePurok = [
    body('purok_name').notEmpty().withMessage('Purok name is required'),
];

const validatePurokUpdate = [
    param('id').isUUID().withMessage('Invalid purok ID'),
    body('purok_name').notEmpty().withMessage('Purok name is required'),
];

// ==================== Immunization Validators ====================
const validateImmunization = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('vaccine_id').isUUID().withMessage('Invalid vaccine ID'),
    body('dose_number').isInt({ min: 1 }).withMessage('Dose number must be a positive integer'),
    body('date_administered').isDate().withMessage('Valid date is required'),
    body('remarks').optional().isString().withMessage('Remarks must be a string'),
    body('vital_signs_id').optional().isUUID().withMessage('Invalid vital signs ID'),
];

// ==================== Query Parameter Validators ====================
const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
];

// ==================== Household Validators ====================
const validateHousehold = [
    body('household_number')
        .notEmpty()
        .withMessage('Household number is required')
        .isString()
        .withMessage('Household number must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Household number must be between 1 and 50 characters'),
    body('purok_id')
        .isUUID()
        .withMessage('Invalid purok ID'),
    body('address_details')
        .optional()
        .isString()
        .withMessage('Address must be a string')
        .trim(),
];

const validateHouseholdUpdate = [
    param('id')
        .isUUID()
        .withMessage('Invalid household ID'),
    body('household_number')
        .optional()
        .notEmpty()
        .withMessage('Household number cannot be empty')
        .isString()
        .withMessage('Household number must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Household number must be between 1 and 50 characters'),
    body('purok_id')
        .optional()
        .isUUID()
        .withMessage('Invalid purok ID'),
    body('address_details')
        .optional()
        .isString()
        .withMessage('Address must be a string')
        .trim(),
];

const validateDateRange = [
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date'),
];

// ==================== AI Recommendation Validators ====================
const validateAIRecommendation = [
    param('residentId').isUUID().withMessage('Invalid resident ID'),
    body('period').isIn(['monthly', 'quarterly', 'annual']).withMessage('Period must be monthly, quarterly, or annual'),
];

// ==================== Export All Validators ====================
module.exports = {
    validate,
    // Auth
    validateLogin,
    validateRegister,
    validateChangePassword,
    // Resident
    validateResident,
    validateResidentUpdate,
    // Health Profile
    validateHealthProfile,
    // Vital Signs
    validateVitalSigns,
    // Chronic Conditions
    validateCondition,
    // Medications
    validateMedication,
    // Allergens
    validateAllergen,
    // Appointments
    validateAppointment,
    validateAppointmentUpdate,
    validateAppointmentStatus,
    // BHW
    validateBHW,
    validateBHWUpdate,
    // Purok
    validatePurok,
    validatePurokUpdate,
    // Immunization
    validateImmunization,
    // Query Parameters
    validatePagination,
    validateDateRange,
    // AI
    validateAIRecommendation,
    validateHousehold,
    validateHouseholdUpdate,
};
