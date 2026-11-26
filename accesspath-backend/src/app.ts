import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import config from "./config";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import { AdminRoutes } from "./modules/admin/admin.route";
import { AnalyticsRoutes } from "./modules/analytics/analytics.route";
import { AuthRoutes } from "./modules/auth/auth.route";
import { ContributionRoutes } from "./modules/contributions/contributions.route";
import { FavoriteRoutes } from "./modules/favorites/favorites.route";
import { FeedbackRoutes } from "./modules/feedback/feedback.route";
import { LocationRoutes } from "./modules/locations/locations.route";
import { MapRoutes } from "./modules/maps/maps.route";
import { ModerationRoutes } from "./modules/moderation/moderation.route";
import { NotificationRoutes } from "./modules/notifications/notifications.route";
import { PlaceRoutes } from "./modules/places/places.route";
import { PreferenceRoutes } from "./modules/preferences/preferences.route";
import { ReportRoutes } from "./modules/reports/reports.route";
import { RouteRoutes } from "./modules/routes/routes.route";
import { UploadRoutes } from "./modules/uploads/uploads.route";
import { UsersRoutes } from "./modules/users/users.route";

const app: Application = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(
	cors({
		origin: config.app_url,
		credentials: true,
	}),
);

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UsersRoutes);
app.use("/api/v1/routes", RouteRoutes);
app.use("/api/v1/reports", ReportRoutes);
app.use("/api/v1/contributions", ContributionRoutes);
app.use("/api/v1/moderation", ModerationRoutes);
app.use("/api/v1/feedback", FeedbackRoutes);
app.use("/api/v1/favorites", FavoriteRoutes);
app.use("/api/v1/locations", LocationRoutes);
app.use("/api/v1/maps", MapRoutes);
app.use("/api/v1/places", PlaceRoutes);
app.use("/api/v1/uploads", UploadRoutes);
app.use("/api/v1/analytics", AnalyticsRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/preferences", PreferenceRoutes);
app.use("/api/v1/admin", AdminRoutes);

app.get("/", async (req: Request, res: Response) => {
	res.send("accesspath server is running");
});

app.use(notFound);
app.use(globalErrorHandler);
export default app;
