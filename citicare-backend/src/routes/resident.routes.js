import { Router } from 'express';
import { residentController } from '../controllers/resident.controller.js';
import { authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authorize(['Admin', 'BHW']), residentController.createResident);
router.get('/:id', authorize(['Admin', 'BHW']), residentController.getResidentProfile);
router.post('/:id/metadata/:target_table', authorize(['Admin', 'BHW']), residentController.addMedicalMetadata);
router.get('/:id/timeline', authorize(['Admin', 'BHW']), residentController.getTimeline);

export default router;