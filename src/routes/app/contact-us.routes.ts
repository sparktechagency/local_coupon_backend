import { Router } from "express";
import { contact_us } from "@controllers/contact-us";

const router = Router();

router.post("/", contact_us);

export default router;
