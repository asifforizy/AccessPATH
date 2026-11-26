import type { z } from "zod";
import type { ListLocationsQueryZodSchema } from "./locations.validation";

export type IListLocationsQuery = z.infer<typeof ListLocationsQueryZodSchema>;
