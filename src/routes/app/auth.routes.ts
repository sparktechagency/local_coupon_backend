import { Router } from "express";
import {
  forgot_password,
  reset_password,
  signup,
  verify_otp,
} from "@controllers/auth";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verify_otp);
router.post("/forgot-password", forgot_password);
router.post("/reset-password", reset_password);

export default router;
