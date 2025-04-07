import {
  get_dashboard,
  get_notifications,
  get_recent_transactions,
} from "@controllers/dashboard";
import { Router } from "express";

const router = Router();

router.get("/", get_dashboard);
router.get("/transactions", get_recent_transactions);
router.get("/notifications", get_notifications);

export default router;
