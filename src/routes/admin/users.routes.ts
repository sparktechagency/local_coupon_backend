import { get_users } from "@controllers/users";
import { Router } from "express";

const router = Router();

router.get("/", get_users);

export default router;
