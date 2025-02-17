import { Router } from "express";
import { add_subscription } from "@controllers/subscriptions";

const router = Router();

router.post("/subscriptions", add_subscription);

export default router;
