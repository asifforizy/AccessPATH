import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import type {
	LocationStatus,
	UserRole,
	UserStatus,
} from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import { slugify } from "../../utils/slug";

/**
 * Admin management operations (users, categories, locations, accessibility).
 * Every mutation writes an audit log entry. Admin-only at the route level.
 */

const audit = (
	action: string,
	entityType: string,
	entityId: string,
	actorId: string,
	metadata?: Record<string, unknown>,
) =>
	prisma.auditLog.create({
		data: {
			action,
			entityType,
			entityId,
			actorId,
			metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
		},
	});

/* ------------------------------- users ------------------------------- */

const listUsers = async (
	query: {
		q?: string;
		role?: UserRole;
		status?: UserStatus;
	} & IPagination,
) => {
	const where: Prisma.UserWhereInput = { deletedAt: null };

	if (query.q) {
		where.OR = [
			{ name: { contains: query.q, mode: "insensitive" } },
			{ email: { contains: query.q, mode: "insensitive" } },
		];
	}
	if (query.role) where.role = query.role;
	if (query.status) where.status = query.status;

	const [data, total] = await Promise.all([
		prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				emailVerifiedAt: true,
				createdAt: true,
				_count: {
					select: { reports: true, contributions: true, reviews: true },
				},
			},
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(query),
		}),
		prisma.user.count({ where }),
	]);

	return { data, meta: buildMeta(total, query.page, query.limit) };
};

const updateUser = async (
	actorId: string,
	userId: string,
	payload: { role?: UserRole; status?: UserStatus },
) => {
	if (actorId === userId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You cannot change your own role or status. Ask another admin.",
		);
	}

	const user = await prisma.user.findFirst({
		where: { id: userId, deletedAt: null },
		select: { id: true },
	});
	if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { role: payload.role, status: payload.status },
		select: { id: true, name: true, email: true, role: true, status: true },
	});

	await audit("USER_UPDATED", "User", userId, actorId, { ...payload });

	return updated;
};

/* ----------------------------- categories ----------------------------- */

const listCategories = async () => {
	const rows = await prisma.category.findMany({
		orderBy: { name: "asc" },
		select: {
			id: true,
			name: true,
			slug: true,
			description: true,
			icon: true,
			isActive: true,
			_count: { select: { locations: true } },
		},
	});

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		slug: row.slug,
		description: row.description,
		icon: row.icon,
		isActive: row.isActive,
		locationCount: row._count.locations,
	}));
};

const createCategory = async (
	actorId: string,
	payload: { name: string; slug?: string; description?: string; icon?: string },
) => {
	const slug = (payload.slug ?? slugify(payload.name)).slice(0, 80);

	const existing = await prisma.category.findUnique({ where: { slug } });
	if (existing) {
		throw new AppError(httpStatus.CONFLICT, "A category with that slug exists");
	}

	const created = await prisma.category.create({
		data: {
			name: payload.name,
			slug,
			description: payload.description ?? null,
			icon: payload.icon ?? null,
		},
	});

	await audit("CATEGORY_CREATED", "Category", created.id, actorId, {
		name: created.name,
		slug: created.slug,
	});

	return created;
};

const updateCategory = async (
	actorId: string,
	categoryId: string,
	payload: {
		name?: string;
		description?: string;
		icon?: string;
		isActive?: boolean;
	},
) => {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { id: true },
	});
	if (!category) throw new AppError(httpStatus.NOT_FOUND, "Category not found");

	const updated = await prisma.category.update({
		where: { id: categoryId },
		data: {
			name: payload.name,
			description: payload.description,
			icon: payload.icon,
			isActive: payload.isActive,
		},
	});

	await audit("CATEGORY_UPDATED", "Category", categoryId, actorId, {
		...payload,
	});

	return updated;
};

/** Categories still referenced by locations are deactivated, never deleted. */
const deleteCategory = async (actorId: string, categoryId: string) => {
	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { id: true, name: true, _count: { select: { locations: true } } },
	});
	if (!category) throw new AppError(httpStatus.NOT_FOUND, "Category not found");

	const inUse = category._count.locations > 0;

	if (inUse) {
		await prisma.category.update({
			where: { id: categoryId },
			data: { isActive: false },
		});
	} else {
		await prisma.category.delete({ where: { id: categoryId } });
	}

	await audit("CATEGORY_REMOVED", "Category", categoryId, actorId, {
		name: category.name,
		deactivated: inUse,
	});

	return { id: categoryId, deactivated: inUse };
};

/* ------------------------------ locations ------------------------------ */

const listLocations = async (
	query: {
		q?: string;
		status?: LocationStatus;
		categoryId?: string;
	} & IPagination,
) => {
	const where: Prisma.LocationWhereInput = { deletedAt: null };

	if (query.q) {
		where.OR = [
			{ name: { contains: query.q, mode: "insensitive" } },
			{ address: { contains: query.q, mode: "insensitive" } },
			{ city: { contains: query.q, mode: "insensitive" } },
		];
	}
	if (query.status) where.status = query.status;
	if (query.categoryId) where.categoryId = query.categoryId;

	const [data, total] = await Promise.all([
		prisma.location.findMany({
			where,
			select: {
				id: true,
				name: true,
				slug: true,
				address: true,
				city: true,
				status: true,
				latitude: true,
				longitude: true,
				createdAt: true,
				category: { select: { id: true, name: true, slug: true } },
				accessibility: true,
				_count: { select: { reports: true, reviews: true } },
			},
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(query),
		}),
		prisma.location.count({ where }),
	]);

	return { data, meta: buildMeta(total, query.page, query.limit) };
};

const updateLocation = async (
	actorId: string,
	locationId: string,
	payload: Record<string, unknown>,
) => {
	const location = await prisma.location.findFirst({
		where: { id: locationId, deletedAt: null },
		select: { id: true },
	});
	if (!location) throw new AppError(httpStatus.NOT_FOUND, "Location not found");

	const updated = await prisma.location.update({
		where: { id: locationId },
		data: payload as Prisma.LocationUncheckedUpdateInput,
	});

	await audit("LOCATION_UPDATED", "Location", locationId, actorId, payload);

	return updated;
};

const updateLocationAccessibility = async (
	actorId: string,
	locationId: string,
	payload: Record<string, unknown>,
) => {
	const location = await prisma.location.findFirst({
		where: { id: locationId, deletedAt: null },
		select: { id: true },
	});
	if (!location) throw new AppError(httpStatus.NOT_FOUND, "Location not found");

	const verifiedAt =
		payload.isVerified === true
			? new Date()
			: payload.isVerified === false
				? null
				: undefined;

	const profile = await prisma.accessibilityProfile.upsert({
		where: { locationId },
		update: {
			...(payload as Prisma.AccessibilityProfileUncheckedUpdateInput),
			verifiedAt,
		},
		create: {
			...(payload as Prisma.AccessibilityProfileUncheckedCreateInput),
			locationId,
			verifiedAt: verifiedAt ?? null,
		},
	});

	await audit(
		"ACCESSIBILITY_UPDATED",
		"Location",
		locationId,
		actorId,
		payload,
	);

	return profile;
};

/** Soft delete keeps historical reports and reviews intact. */
const archiveLocation = async (actorId: string, locationId: string) => {
	const location = await prisma.location.findFirst({
		where: { id: locationId, deletedAt: null },
		select: { id: true, name: true },
	});
	if (!location) throw new AppError(httpStatus.NOT_FOUND, "Location not found");

	await prisma.location.update({
		where: { id: locationId },
		data: { status: "ARCHIVED", deletedAt: new Date() },
	});

	await audit("LOCATION_ARCHIVED", "Location", locationId, actorId, {
		name: location.name,
	});

	return { id: locationId };
};

export const AdminManageService = {
	listUsers,
	updateUser,
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	listLocations,
	updateLocation,
	updateLocationAccessibility,
	archiveLocation,
};
