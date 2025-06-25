import {
  add_coupon,
  analytics,
  delete_coupon,
  download_coupon,
  get_coupon,
  get_coupons,
  get_qr_code,
  get_tour_coupons,
  redeem_coupon,
  share_coupon,
  update_coupon,
} from "@controllers/coupons";
import authorize from "@middleware/auth";
import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.get("/", authorize(["user", "business"]), get_coupons);
router.get("/get", get_coupon);
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "carousel_image", maxCount: 1 },
  ]),
  authorize(["business"]),
  add_coupon
);
router.patch(
  "/",
  upload.single("photo"),
  authorize(["business"]),
  update_coupon
);
router.delete("/", authorize(["user", "business"]), delete_coupon);

router.get("/download", authorize(["user", "business"]), download_coupon);
router.get("/qr-code", authorize(["user"]), get_qr_code);
router.get("/redeem-coupon", redeem_coupon);
router.post("/share-coupon", share_coupon);
router.get("/analytics", authorize(["business"]), analytics);
router.get("/tours-coupon", get_tour_coupons);

export default router;
