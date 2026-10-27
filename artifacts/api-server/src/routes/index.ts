import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountRouter from "./account";
import adminRouter from "./admin";
import competitionRouter from "./competition";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(adminRouter);
router.use(competitionRouter);

export default router;
