import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { NotificationController } from "./notifications.controller";

const router = Router();

router.use(
	auth(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CONTRIBUTOR, UserRole.USER),
);

router.get("/", NotificationController.listNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/read-all", NotificationController.markAllRead);
router.patch("/:notificationId/read", NotificationController.markRead);
router.delete("/", NotificationController.clearAll);
router.delete("/:notificationId", NotificationController.deleteNotification);

export const NotificationRoutes = router;
