import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { AdminController } from "./admin.controller";
import { AdminManageController } from "./admin.manage.controller";
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

// User management
router.get("/users", AdminManageController.listUsers);
router.patch(
	"/users/:userId",
	validateRequest(AdminValidation.UpdateUserZodSchema),
	AdminManageController.updateUser,
);

// Category management
router.get("/categories", AdminManageController.listCategories);
router.post(
	"/categories",
	validateRequest(AdminValidation.CreateCategoryZodSchema),
	AdminManageController.createCategory,
);
router.patch(
	"/categories/:categoryId",
	validateRequest(AdminValidation.UpdateCategoryZodSchema),
	AdminManageController.updateCategory,
);
router.delete("/categories/:categoryId", AdminManageController.deleteCategory);

// Location + accessibility management
router.get("/locations", AdminManageController.listLocations);
router.patch(
	"/locations/:locationId",
	validateRequest(AdminValidation.UpdateLocationZodSchema),
	AdminManageController.updateLocation,
);
router.put(
	"/locations/:locationId/accessibility",
	validateRequest(AdminValidation.UpdateAccessibilityZodSchema),
	AdminManageController.updateAccessibility,
);
router.delete("/locations/:locationId", AdminManageController.archiveLocation);


export const AdminRoutes = router;
