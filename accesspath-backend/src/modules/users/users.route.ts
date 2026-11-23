import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { UsersController } from "./users.controller";
import { UserValidation } from "./users.validation";

const router = Router();

router.use(auth());

router.get("/me", UsersController.getMe);
router.patch(
	"/me",
	validateRequest(UserValidation.UpdateMeZodSchema),
	UsersController.updateMe,
);
router.delete("/me", UsersController.deleteMe);
router.patch(
	"/me/avatar",
	validateRequest(UserValidation.AvatarZodSchema),
	UsersController.updateAvatar,
);
router.get("/me/contributions", UsersController.getMyContributions);
router.get("/me/reports", UsersController.getMyReports);
router.get("/me/activity", UsersController.getMyActivity);

export const UsersRoutes = router;
