import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { FavoriteController } from "./favorites.controller";
import { FavoriteValidation } from "./favorites.validation";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", FavoriteController.listFavorites);
router.post(
	"/",
	validateRequest(FavoriteValidation.CreateFavoriteZodSchema),
	FavoriteController.createFavorite,
);
router.get("/check/:locationId", FavoriteController.checkFavorite);
router.delete(
	"/locations/:locationId",
	FavoriteController.deleteFavoriteByLocation,
);
router.delete("/:favoriteId", FavoriteController.deleteFavorite);

export const FavoriteRoutes = router;
