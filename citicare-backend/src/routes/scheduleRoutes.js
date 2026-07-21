// routes/scheduleRoutes.js
import express from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByBHW,
  addParticipant,
  removeParticipant,
  updateParticipant,
  getParticipants,
  getProgramStats
} from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllSchedules);
router.get('/bhw/:bhwId', authenticate, getSchedulesByBHW);
router.get('/:id', authenticate, getScheduleById);
router.post('/', authenticate, createSchedule);
router.put('/:id', authenticate, updateSchedule);
router.delete('/:id', authenticate, deleteSchedule);

router.get('/:scheduleId/participants', authenticate, getParticipants);
router.post('/:scheduleId/participants', authenticate, addParticipant);
router.put('/:scheduleId/participants/:residentId', authenticate, updateParticipant);
router.delete('/:scheduleId/participants/:residentId', authenticate, removeParticipant);

router.get('/:scheduleId/stats', authenticate, getProgramStats);

export default router;