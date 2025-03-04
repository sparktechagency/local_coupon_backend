import { Router } from "express";
import { add_subscription } from "@controllers/subscriptions";

const router = Router();

router.post("/", add_subscription);

export default router;
