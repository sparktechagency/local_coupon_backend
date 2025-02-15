import { stripe_webhook } from "@controllers/stripe";
import { Router } from "express";
import express from "express";

const router = Router();

router.post("/webhook", express.raw({ type: "application/json" }), stripe_webhook);

export default router;
