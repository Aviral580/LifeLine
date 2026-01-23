import express from 'express';
import { executeSearch } from '../controllers/searchController.js';
import { getPredictions, logInteraction } from '../controllers/mainController.js';
const router = express.Router();
router.get('/predict', getPredictions);
router.post('/log',logInteraction);
router.get('/execute', executeSearch);
export default router;