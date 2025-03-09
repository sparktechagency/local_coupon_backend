import { get_categories } from "@controllers/categories";
import { Router } from "express";

const router = Router();

router.get("/", get_categories);

export default router;
