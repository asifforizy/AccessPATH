import z from "zod";

const CreateFavoriteZodSchema = z.object({
	locationId: z.uuid(),
});

export { CreateFavoriteZodSchema };

export const FavoriteValidation = {
	CreateFavoriteZodSchema,
};
