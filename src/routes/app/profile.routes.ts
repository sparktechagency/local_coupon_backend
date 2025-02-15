import {
  delete_profile,
  get_profile,
  update_picture,
  update_profile,
} from "@controllers/profile";
import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/", get_profile);
router.put("/", update_profile);
router.put("/picture", upload.single("picture"), update_picture);
router.delete("/", delete_profile);

export default router;
