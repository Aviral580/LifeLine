import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";

import connectDB from "./config/db.js";

import apiRoutes from "./routes/apiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import newsSearchRoutes from "./routes/newsSearchRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// DB
connectDB();

// ROUTES
app.use("/api", apiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/news", newsSearchRoutes);

// ROOT
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LifeLine backend running",
  });
});

// 🔎 ENV CHECK
app.get("/test-env", (req, res) => {
  res.json({
    NEWS_API_KEY_LOADED: Boolean(process.env.NEWS_API_KEY),
    KEY_PREVIEW: process.env.NEWS_API_KEY?.slice(0, 6) + "*****",
  });
});

//  GUARANTEED NEWS API TEST (NO SERVICES / NO CONTROLLERS)
app.get("/news-test", async (req, res) => {
  try {
    const response = await axios.get(
      "https://newsapi.org/v2/top-headlines",
      {
        params: {
          q: "covid",
          language: "en",
          apiKey: process.env.NEWS_API_KEY,
        },
      }
    );

    res.status(200).json({
      success: true,
      totalResults: response.data.totalResults,
      articles: response.data.articles,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
