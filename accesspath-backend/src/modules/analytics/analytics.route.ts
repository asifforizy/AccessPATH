import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.use(auth(UserRole.ADMIN, UserRole.MODERATOR));

router.get("/overview", AnalyticsController.getOverview);
router.get("/locations", AnalyticsController.getLocations);
router.get("/reports", AnalyticsController.getReports);
router.get("/contributions", AnalyticsController.getContributions);
router.get("/users", AnalyticsController.getUsers);
router.get("/moderation", AnalyticsController.getModeration);
router.get("/trends/monthly", AnalyticsController.getMonthlyTrends);
router.get("/barriers/top-areas", AnalyticsController.getTopBarrierAreas);
router.get(
	"/categories/distribution",
	AnalyticsController.getCategoryDistribution,
);
router.get(
	"/accessibility/distribution",
	AnalyticsController.getAccessibilityDistribution,
);
router.get("/heatmap", AnalyticsController.getHeatmap);

export const AnalyticsRoutes = router;
