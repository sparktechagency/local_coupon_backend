import {
  change_password,
  delete_profile,
  get_business_profile,
  get_last_visits,
  get_profile,
  invite,
  update_profile,
} from "@controllers/profile";
import authorize from "@middleware/auth";
import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/", authorize(["user", "business", "admin"]), get_profile);
router.get("/business-profile", get_business_profile);
router.get("/last-visits", authorize(["user", "business"]), get_last_visits);
router.put(
  "/",
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "company_picture", maxCount: 1 },
  ]),
  authorize(["user", "business", "admin"]),
  update_profile
);
router.delete("/", authorize(["user", "business", "admin"]), delete_profile);
router.post(
  "/change-password",
  authorize(["user", "business", "admin"]),
  change_password
);
router.get("/invite", authorize(["user", "business", "admin"]), invite);

export default router;
