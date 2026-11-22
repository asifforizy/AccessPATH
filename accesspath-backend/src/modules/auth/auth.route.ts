import { Router } from "express";
import { validateRequest } from "../../middleware/validationRequest";
import { UserValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";

const router = Router();
router.post("/register",validateRequest(UserValidation.UserRegistrationZodSchema),AuthController.registerUser,);

export const AuthRoutes = router;
