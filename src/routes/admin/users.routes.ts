import { get_users, toggle_ban } from "@controllers/users";
import { Router } from "express";

const router = Router();

router.get("/", get_users);
router.post("/toggle-ban", toggle_ban);

export default router;
