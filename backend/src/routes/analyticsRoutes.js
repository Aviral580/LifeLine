import express from 'express';
import { 
  getDashboardStats, 
  resetAnalytics, 
  deleteSpecificBounce 
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard', getDashboardStats);

// ADDED THESE TWO ROUTES TO MAKE BUTTONS WORK
router.post('/reset', resetAnalytics);
router.post('/delete-bounce', deleteSpecificBounce);

export default router;