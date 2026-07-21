import express from 'express';
import {
  getAllPuroks,
  getPurokById,
  createPurok,
  deletePurok
} from '../controllers/purokController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllPuroks);
router.get('/:id', authenticate, getPurokById);
router.post('/', authenticate, authorizeAdmin, createPurok);
router.delete('/:id', authenticate, authorizeAdmin, deletePurok);

export default router;