import { get_faqs, get_privacy, get_terms } from "@controllers/legal";
import { Router } from "express";

const router = Router();

router.get("/faqs", get_faqs);
router.get("/terms", get_terms);
router.get("/privacy", get_privacy);

export default router;
