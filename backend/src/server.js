
import express from 'express';

import dotenv from 'dotenv';

import cors from 'cors';

import connectDB from './config/db.js';

import searchRoutes from './routes/searchRoutes.js';

// Import other routes...



dotenv.config();



// Connect to MongoDB

connectDB();



const app = express();

app.use(express.json());

app.use(cors());



// Routes

app.use('/api/search', searchRoutes);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`✅ Server running on port ${PORT}`);

  console.log(`🧠 NLP Engine: Online`);

});

