import { Router } from "express";
import protect from "../middlewares/auth.js";
import {
  getSummary,
  getByCategory,
  getMonthly,
} from "../controllers/stats.controller.js";

const router = Router();

router.use(protect);

router.get("/summary", getSummary);
router.get("/by-category", getByCategory);
router.get("/monthly", getMonthly);

export default router;