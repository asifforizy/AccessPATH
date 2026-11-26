import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { ModerationController } from "./moderation.controller";
import { ModerationValidation } from "./moderation.validation";

const router = Router();

router.use(auth(UserRole.ADMIN, UserRole.MODERATOR));

router.get("/queue", ModerationController.getQueue);
router.get("/locations", ModerationController.getLocations);
router.get("/reports", ModerationController.getReports);
router.get("/contributions", ModerationController.getContributions);
router.get("/feedback", ModerationController.getFeedback);
router.get("/history", ModerationController.getHistory);
router.get("/statistics", ModerationController.getStatistics);
router.get("/:submissionId", ModerationController.getSubmission);
router.post(
	"/:submissionId/approve",
	validateRequest(ModerationValidation.ApproveZodSchema),
	ModerationController.approveSubmission,
);
router.post(
	"/:submissionId/reject",
	validateRequest(ModerationValidation.RejectZodSchema),
	ModerationController.rejectSubmission,
);
router.post(
	"/:submissionId/request-changes",
	validateRequest(ModerationValidation.RequestChangesZodSchema),
	ModerationController.requestChanges,
);
router.post(
	"/:submissionId/verify",
	validateRequest(ModerationValidation.VerifyZodSchema),
	ModerationController.verifySubmission,
);
router.post(
	"/:submissionId/flag",
	validateRequest(ModerationValidation.FlagZodSchema),
	ModerationController.flagSubmission,
);

export const ModerationRoutes = router;
