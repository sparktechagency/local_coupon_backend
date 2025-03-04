import { update_faqs, update_privacy, update_terms } from "@controllers/legal";
import { Router } from "express";

const router = Router();
router.patch("/faqs", update_faqs);
router.post("/terms", update_terms);
router.post("/privacy", update_privacy);
export default router;
