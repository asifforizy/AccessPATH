import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { FeedbackController } from "./feedback.controller";
import { FeedbackValidation } from "./feedback.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", FeedbackController.listFeedback);
router.post(
	"/",
	validateRequest(FeedbackValidation.CreateFeedbackZodSchema),
	FeedbackController.createFeedback,
);
router.get("/locations/:locationId", FeedbackController.getLocationFeedback);
router.get(
	"/locations/:locationId/reviews",
	FeedbackController.getLocationReviews,
);
router.post(
	"/locations/:locationId/reviews",
	validateRequest(FeedbackValidation.CreateLocationReviewZodSchema),
	FeedbackController.createLocationReview,
);
router.get("/:feedbackId", FeedbackController.getFeedback);
router.patch(
	"/:feedbackId",
	validateRequest(FeedbackValidation.UpdateFeedbackZodSchema),
	FeedbackController.updateFeedback,
);
router.delete("/:feedbackId", FeedbackController.deleteFeedback);
router.post(
	"/:feedbackId/flag",
	validateRequest(FeedbackValidation.FlagFeedbackZodSchema),
	FeedbackController.flagFeedback,
);
router.post("/:feedbackId/helpful", FeedbackController.markHelpful);

export const FeedbackRoutes = router;
