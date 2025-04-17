import {
  add_faq,
  delete_faq,
  update_privacy,
  update_terms,
} from "@controllers/legal";
import { Router } from "express";

const router = Router();
router.post("/faqs", add_faq);
router.delete("/faqs", delete_faq);
router.post("/terms", update_terms);
router.post("/privacy", update_privacy);
export default router;
