import { Router } from "express";
import {
  add_subscription,
  delete_subscription,
  get_subscriptions,
  update_subscription,
} from "@controllers/subscriptions";

const router = Router();

router.post("/", add_subscription);
router.get("/", get_subscriptions);
router.patch("/", update_subscription);
router.delete("/", delete_subscription);

export default router;
