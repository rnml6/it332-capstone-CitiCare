import express from 'express';
import {
  getAllResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  addMedicalHistory
} from '../controllers/residentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllResidents);
router.get('/:id', authenticate, getResidentById);
router.post('/', authenticate, createResident);
router.put('/:id', authenticate, updateResident);
router.delete('/:id', authenticate, deleteResident);
router.post('/:id/medical-history', authenticate, addMedicalHistory);

export default router;