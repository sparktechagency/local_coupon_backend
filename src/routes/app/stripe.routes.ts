import { create_payment } from "@controllers/stripe";
import { get_subscriptions } from "@controllers/subscriptions";
import { Router } from "express";

const router = Router();

router.get("/subscriptions", get_subscriptions);
router.post("/create-payment", create_payment);

export default router;
