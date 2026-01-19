import express from "express";
import newsSearchRoutes from "./newsSearchRoutes.js";
import {
  logInteraction,
  submitFeedback,
  getPredictions,
  getDashboardMetrics,
} from "../controllers/mainController.js";

const router = express.Router();

router.post("/analytics/log", logInteraction);
router.post("/feedback", submitFeedback);
router.get("/predict", getPredictions);
router.get("/analytics/dashboard", getDashboardMetrics);

// ✅ News search route
router.use("/search", newsSearchRoutes);

export default router;
