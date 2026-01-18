import express from 'express';
import { getPredictions, logSearch } from '../controllers/queryController.js';

const router = express.Router();

router.get('/predict', getPredictions);
router.post('/log', logSearch);

export default router;
