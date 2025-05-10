import { Router } from "express";
import { contact_us, report } from "@controllers/feedback";
import authorize from "@middleware/auth";

const router = Router();

router.post("/contact-us", contact_us);
router.post("/report", authorize(["user"]), report);

export default router;
