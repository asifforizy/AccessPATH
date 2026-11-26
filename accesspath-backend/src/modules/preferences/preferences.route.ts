import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { PreferenceController } from "./preferences.controller";
import { PreferenceValidation } from "./preferences.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", PreferenceController.getPreferences);
router.put(
	"/",
	validateRequest(PreferenceValidation.UpdatePreferencesZodSchema),
	PreferenceController.updatePreferences,
);
router.get("/accessibility", PreferenceController.getAccessibilityPreferences);
router.put(
	"/accessibility",
	validateRequest(PreferenceValidation.UpdateAccessibilityZodSchema),
	PreferenceController.updateAccessibilityPreferences,
);
router.get("/recommendations", PreferenceController.getRecommendations);

export const PreferenceRoutes = router;
