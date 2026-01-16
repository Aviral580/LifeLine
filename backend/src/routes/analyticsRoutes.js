import express from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';

const router = express.Router();

// This matches: GET /api/analytics/dashboard
router.get('/dashboard', getDashboardStats);

export default router;
