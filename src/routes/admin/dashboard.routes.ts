import { get_dashboard, get_recent_transactions } from "@controllers/dashboard";
import { Router } from "express";

const router = Router();

router.get("/", get_dashboard);
router.get("/transactions", get_recent_transactions);

export default router;
