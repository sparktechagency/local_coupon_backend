import {
  add_coupon,
  delete_coupon,
  download_coupon,
  get_coupons,
  get_qr_code,
  update_coupon,
} from "@controllers/coupons";
import authorize from "@middleware/auth";
import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/", authorize(["user", "business"]), get_coupons);
router.post("/", upload.single("photo"), authorize(["business"]), add_coupon);
router.patch(
  "/",
  upload.single("photo"),
  authorize(["business"]),
  update_coupon
);
router.delete("/", authorize(["user", "business"]), delete_coupon);

router.get("/download", authorize(["user"]), download_coupon);
router.get("/qr-code", get_qr_code);

// [user] -> download coupon
// [user] -> remove from downloaded coupon
// [business] -> coupon performance analytics

export default router;
