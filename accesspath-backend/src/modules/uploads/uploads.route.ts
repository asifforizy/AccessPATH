import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { UploadController } from "./uploads.controller";
import { UploadValidation } from "./uploads.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.post(
	"/images",
	validateRequest(UploadValidation.UploadImageZodSchema),
	UploadController.createImage,
);
router.post(
	"/images/multiple",
	validateRequest(UploadValidation.UploadMultipleZodSchema),
	UploadController.createImages,
);
router.post(
	"/presigned-url",
	validateRequest(UploadValidation.PresignedUrlZodSchema),
	UploadController.createPresignedUrl,
);
router.get("/:mediaId", UploadController.getMedia);
router.delete("/:mediaId", UploadController.deleteMedia);

export const UploadRoutes = router;
