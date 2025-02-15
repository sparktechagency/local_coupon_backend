import { get_profile, update_profile } from "@controllers/profile";
import { Router } from "express";

const router = Router();

router.get("/", get_profile);
router.put("/", update_profile);
export default router;
