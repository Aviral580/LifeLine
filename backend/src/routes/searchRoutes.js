import express from 'express';
import { getPredictions, logSearch, executeSearch } from '../controllers/searchController.js';
const router = express.Router();
router.get('/predict', getPredictions);
router.post('/log', logSearch);
router.get('/execute', executeSearch);
export default router;