import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import searchRoutes from './routes/searchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js'; 
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes); 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` NLP Engine: Online`);
  console.log(` Analytics Engine: Online`); 
});