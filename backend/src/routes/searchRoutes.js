import express from 'express';
import { executeSearch } from '../controllers/searchController.js';
const router = express.Router();
router.get('/predict');
router.post('/log');
router.get('/execute', executeSearch);
export default router;