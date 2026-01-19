import express from 'express';
import { getPredictions, logSearch, getSuggestions } from '../controllers/queryController.js';

const router = express.Router();

// Existing routes
router.get('/predict', getPredictions);
router.post('/log', logSearch);

// Suggestions route
router.get("/suggestions", getSuggestions);

export default router;
