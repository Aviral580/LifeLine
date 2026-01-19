import express from "express";
import { logClick, logFeedback, logEvent } from "../controllers/analyticsController.js";

const router = express.Router();

router.post("/click", logClick);
router.post("/feedback", logFeedback);
router.post("/log", logEvent);

export default router;
