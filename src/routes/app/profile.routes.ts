import { get_profile } from "@controllers/profile";
import { Router } from "express";

const router = Router();

router.get("/", get_profile);

export default router;
