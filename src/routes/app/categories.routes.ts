import { get_categories, get_popular_categories } from "@controllers/categories";
import { Router } from "express";

const router = Router();

router.get("/", get_categories);
router.get("/popular-categories", get_popular_categories);

export default router;
