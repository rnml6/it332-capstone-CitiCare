import { Router } from 'express';
import { bhwController } from '../controllers/bhw.controller.js';
import { authorize } from '../middleware/auth.js';

const router = Router();

router.post('/register', authorize(['Admin']), bhwController.createBHWAccount);
router.get('/schedules', authorize(['Admin', 'BHW']), bhwController.getSchedules);
router.post('/schedules/execute', authorize(['BHW']), bhwController.completeAppointment);

export default router;