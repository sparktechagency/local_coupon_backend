import {
  change_password,
  delete_profile,
  get_business_profile,
  get_profile,
  update_picture,
  update_profile,
} from "@controllers/profile";
import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/", get_profile);
router.get("/business-profile", get_business_profile);
router.put("/", update_profile);
router.put("/picture", upload.single("picture"), update_picture);
router.delete("/", delete_profile);
router.post("/change-password", change_password);

export default router;
