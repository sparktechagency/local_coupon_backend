import { Router } from "express";
import {
  signup,
  verify_otp,
  forgot_password,
  reset_password,
  facebook_login,
  login,
  google_login,
  refresh_token,
  apple_login,
  switch_account,
  resend_otp,
} from "@controllers/auth";
import authorize from "@middleware/auth";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verify_otp);
router.post("/forgot-password", forgot_password);
router.post("/reset-password", reset_password);
router.post("/login", login);
router.post("/refresh-token", refresh_token);
router.post("/google-login", google_login);
router.post("/facebook-login", facebook_login);
router.post("/apple-login", apple_login);
router.post("/resend", resend_otp);
router.post("/switch-account", authorize(["user", "business"]), switch_account);

export default router;
