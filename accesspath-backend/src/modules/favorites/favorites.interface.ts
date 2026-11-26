import type { z } from "zod";
import type { CreateFavoriteZodSchema } from "./favorites.validation";

export type ICreateFavoritePayload = z.infer<typeof CreateFavoriteZodSchema>;
