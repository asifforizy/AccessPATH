import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { LocationController } from "./locations.controller";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", LocationController.listLocations);
router.get("/cities", LocationController.listCities);
router.get("/:locationId", LocationController.getLocation);

export const LocationRoutes = router;
