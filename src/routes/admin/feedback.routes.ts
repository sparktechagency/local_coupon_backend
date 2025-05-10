import { get_reports } from "@controllers/feedback";
import { Router } from "express";

const router = Router();

router.get("/report", get_reports);

export default router;
