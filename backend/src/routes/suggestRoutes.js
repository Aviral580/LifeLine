import express from 'express';
import { getSuggestions } from '../services/serpApiService.js';  // Import the getSuggestions function from the service

const router = express.Router();

// Route to get query suggestions based on prefix
router.get('/', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query prefix is required' });
  }

  try {
    const suggestions = await getSuggestions(q);  // Fetch suggestions from the service
    res.json({ suggestions });
  } catch (err) {
    console.error('Error fetching suggestions:', err.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
