// routes/bhwRoutes.js
import express from 'express';
import {
  getAllBHWs,
  getBHWById,
  createBHW,
  updateBHW,
  deleteBHW,
  getBHWSchedules
} from '../controllers/bhwController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllBHWs);
router.get('/:id', authenticate, getBHWById);
router.get('/:bhwId/schedules', authenticate, getBHWSchedules);
router.post('/', authenticate, authorizeAdmin, createBHW);
router.put('/:id', authenticate, authorizeAdmin, updateBHW);
router.delete('/:id', authenticate, authorizeAdmin, deleteBHW);

export default router;