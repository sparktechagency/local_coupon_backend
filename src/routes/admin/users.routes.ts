import {
  add_user,
  delete_user,
  edit_user,
  get_users,
  toggle_ban,
} from "@controllers/users";
import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/", get_users);
router.post(
  "/",
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "id_proof", maxCount: 1 },
    { name: "verification_id", maxCount: 1 },
  ]),
  add_user
);
router.patch("/", edit_user);
router.delete("/", delete_user);
router.post("/toggle-ban", toggle_ban);

export default router;
