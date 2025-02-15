import { create_checkout_session } from "@controllers/stripe";
import { Router } from "express";

const router = Router();

router.post("/create-checkout-session", create_checkout_session);

export default router;
