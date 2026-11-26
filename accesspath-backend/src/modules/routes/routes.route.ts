import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { RouteController } from "./routes.controller";
import { RouteValidation } from "./routes.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.post(
	"/plan",
	validateRequest(RouteValidation.PlanZodSchema),
	RouteController.planRoute,
);
router.post(
	"/alternatives",
	validateRequest(RouteValidation.AlternativesZodSchema),
	RouteController.getAlternatives,
);
router.get("/preferences", RouteController.getPreferences);
router.put(
	"/preferences",
	validateRequest(RouteValidation.PreferencesZodSchema),
	RouteController.updatePreferences,
);
router.post(
	"/validate",
	validateRequest(RouteValidation.ValidateZodSchema),
	RouteController.validateRoute,
);
router.post(
	"/score",
	validateRequest(RouteValidation.ScoreZodSchema),
	RouteController.scoreRoute,
);
router.get("/:routeId", RouteController.getRoute);
router.get("/:routeId/barriers", RouteController.getBarriers);
router.get("/:routeId/accessibility", RouteController.getAccessibility);
router.post(
	"/:routeId/feedback",
	validateRequest(RouteValidation.FeedbackZodSchema),
	RouteController.addFeedback,
);

export const RouteRoutes = router;
