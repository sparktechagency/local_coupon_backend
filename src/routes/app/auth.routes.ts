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
  subscriptionsFeature
} from "@controllers/auth";


import authorize from "@middleware/auth";
import multer from "multer";

const router = Router();
const upload = multer({
  dest: "uploads/",
});

router.post(
  "/signup",
  upload.fields([
    {
      name: "id_proof",
      maxCount: 1,
    },
    {
      name: "verification_document",
      maxCount: 1,
    },
  ]),
  signup
);

router.post("/verify-otp", verify_otp);
router.get("/subscriptions_feature", authorize(["business", "user"]), subscriptionsFeature);
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
