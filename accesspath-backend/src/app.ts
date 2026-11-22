import cookieParser from "cookie-parser";
import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import config from "./config";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import { AuthRoutes } from "./modules/auth/auth.route";

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

app.get("/", async (req: Request, res: Response) => {
	res.send("accesspath server is running");
});

app.use(notFound);
app.use(globalErrorHandler);
export default app;
