import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { ContributionController } from "./contributions.controller";
import { ContributionValidation } from "./contributions.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", ContributionController.listContributions);
router.post(
	"/",
	validateRequest(ContributionValidation.CreateContributionZodSchema),
	ContributionController.createContribution,
);
router.get("/my-contributions", ContributionController.getMyContributions);
router.get("/statistics", ContributionController.getStatistics);
router.get("/:contributionId", ContributionController.getContribution);
router.patch(
	"/:contributionId",
	validateRequest(ContributionValidation.UpdateContributionZodSchema),
	ContributionController.updateContribution,
);
router.delete("/:contributionId", ContributionController.deleteContribution);
router.get("/:contributionId/history", ContributionController.getHistory);

export const ContributionRoutes = router;
