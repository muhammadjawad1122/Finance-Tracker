import { Router } from "express";
import protect from "../middlewares/auth.js";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = Router();

router.use(protect);

router.get("/", getTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;