import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import reportsRouter from "./reports";
import doctorsRouter from "./doctors";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(reportsRouter);
router.use(doctorsRouter);
router.use(statsRouter);

export default router;
