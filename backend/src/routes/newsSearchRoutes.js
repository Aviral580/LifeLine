import express from "express";
import { searchNews } from "../controllers/newsSearchController.js";

const router = express.Router();

router.get("/", searchNews);

export default router;
