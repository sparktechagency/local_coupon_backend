import { analytics, home } from "@controllers/home";
import authorize from "@middleware/auth";
import { Router } from "express";

const router = Router();

router.get("/", home);
router.get("/analytics", authorize(["business"]), analytics);

export default router;
