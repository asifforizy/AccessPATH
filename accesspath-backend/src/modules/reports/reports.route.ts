import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { ReportController } from "./reports.controller";
import { ReportValidation } from "./reports.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", ReportController.listReports);
router.post(
	"/",
	validateRequest(ReportValidation.CreateReportZodSchema),
	ReportController.createReport,
);
router.get("/my-reports", ReportController.getMyReports);
router.get("/nearby", ReportController.getNearby);
router.get("/:reportId", ReportController.getReport);
router.patch(
	"/:reportId",
	validateRequest(ReportValidation.UpdateReportZodSchema),
	ReportController.updateReport,
);
router.delete("/:reportId", ReportController.deleteReport);
router.get("/:reportId/history", ReportController.getHistory);
router.post(
	"/:reportId/attachments",
	validateRequest(ReportValidation.AddAttachmentsZodSchema),
	ReportController.addAttachments,
);
router.get("/:reportId/verification", ReportController.getVerification);

export const ReportRoutes = router;
