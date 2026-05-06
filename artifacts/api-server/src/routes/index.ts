import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import businessesRouter from "./businesses";
import staffRouter from "./staff";
import servicesRouter from "./services";
import customersRouter from "./customers";
import bookingsRouter from "./bookings";
import availabilityRouter from "./availability";
import slotsRouter from "./slots";
import dashboardRouter from "./dashboard";
import featureFlagsRouter from "./feature-flags";
import publicRouter from "./public";
import devRouter from "./dev";
import chatRouter from "./chat";
import conversationsRouter from "./conversations";
import marketingRouter from "./marketing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(businessesRouter);
router.use(staffRouter);
router.use(servicesRouter);
router.use(customersRouter);
router.use(bookingsRouter);
router.use(availabilityRouter);
router.use(slotsRouter);
router.use(dashboardRouter);
router.use(featureFlagsRouter);
router.use(publicRouter);
router.use(chatRouter);
router.use(conversationsRouter);
router.use(marketingRouter);
router.use(devRouter);

export default router;
