import { Router } from "express";
import { PublicController } from "./public.controller";

const router = Router();

router.get("/home", PublicController.getHome);

export const PublicRoutes = router;
