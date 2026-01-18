import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

import apiRoutes from './routes/apiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', apiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/query', queryRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LifeLine backend running'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
