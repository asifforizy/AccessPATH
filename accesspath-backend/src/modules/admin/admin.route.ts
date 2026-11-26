import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.get("/health", AdminController.getHealth);
router.get("/version", AdminController.getVersion);

router.use(auth(UserRole.ADMIN));

router.get("/stats", AdminController.getStats);
router.get("/audit-logs", AdminController.listAuditLogs);
router.get("/settings", AdminController.getSettings);
router.put(
	"/settings",
	validateRequest(AdminValidation.UpdateSettingsZodSchema),
	AdminController.updateSettings,
);
router.post("/cache/clear", AdminController.clearCache);

export const AdminRoutes = router;
