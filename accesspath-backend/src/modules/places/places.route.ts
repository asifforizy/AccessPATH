import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PlaceController } from "./places.controller";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/nearby", PlaceController.nearby);
router.get("/search", PlaceController.search);
router.get("/categories", PlaceController.categories);
router.get("/:placeId", PlaceController.getPlace);

export const PlaceRoutes = router;
