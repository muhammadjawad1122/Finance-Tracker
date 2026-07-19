import { Router } from "express";
import protect from "../middlewares/auth.js";
import { updateMe } from "../controllers/user.controller.js";

const router = Router();

router.use(protect);

router.patch("/me", updateMe);

export default router;