import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { MapController } from "./maps.controller";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/explore", MapController.explore);

export const MapRoutes = router;
