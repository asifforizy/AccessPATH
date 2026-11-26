/**
 * Large-scale demo dataset for AccessPath.
 *
 * Creates (default):
 *   - 4 demo accounts, one per role (password: AccessPath#2026)
 *   - 1,200 community users
 *   - 10,000 locations across 6 categories around Dhaka
 *   - ~7,000 accessibility profiles (mix of verified / unverified)
 *   - 50,000 accessibility + barrier reports (GPS jittered around locations)
 *   - 100,000 reviews (unique user/location pairs)
 *
 * Usage:
 *   npx tsx prisma/seed-large.ts            # generate
 *   npx tsx prisma/seed-large.ts --reset    # delete seeded rows first
 *   npx tsx prisma/seed-large.ts --scale=0.1  # 10% of the volume
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import type {
	ContributionStatus,
	LocationStatus,
	ReportStatus,
	ReportType,
	UserRole,
	UserStatus,
} from "../prisma/generated/prisma/enums";

const SEED_PREFIX = "seed-";
const BATCH = 2_000;
const DEMO_PASSWORD = "AccessPath#2026";

const scaleArg = process.argv.find((arg) => arg.startsWith("--scale="));
const SCALE = scaleArg ? Number(scaleArg.split("=")[1]) : 1;

const TARGETS = {
	locations: Math.round(10_000 * SCALE),
	reports: Math.round(50_000 * SCALE),
	reviews: Math.round(100_000 * SCALE),
	communityUsers: Math.round(1_200 * SCALE),
	profiles: Math.round(7_000 * SCALE),
};

const CATEGORIES = [
	{ name: "Public Building", slug: "public-building", icon: "building" },
	{ name: "Park", slug: "park", icon: "trees" },
	{ name: "Educational Institution", slug: "education", icon: "graduation-cap" },
	{ name: "Transportation Facility", slug: "transport", icon: "bus" },
	{ name: "Government Office", slug: "government", icon: "landmark" },
	{ name: "Community Center", slug: "community", icon: "users" },
] as const;

const BARRIER_TYPES: ReportType[] = [
	"BROKEN_FOOTPATH",
	"MISSING_RAMP",
	"BLOCKED_SIDEWALK",
	"BROKEN_ELEVATOR",
	"UNSAFE_CROSSING",
];

const ALL_REPORT_TYPES: ReportType[] = [
	...BARRIER_TYPES,
	"ACCESSIBILITY_ISSUE",
	"INCORRECT_INFORMATION",
	"LOCATION_CLOSED",
	"MISSING_FEATURE",
	"OTHER",
];

const BARRIER_TEXT: Record<string, string[]> = {
	BROKEN_FOOTPATH: [
		"Pavement is cracked and uneven near the entrance.",
		"Large pothole in the footpath makes wheelchair passage difficult.",
	],
	MISSING_RAMP: [
		"No ramp at the main entrance; a step blocks wheelchair access.",
		"Ramp was removed during renovation and has not been replaced.",
	],
	BLOCKED_SIDEWALK: [
		"Sidewalk is blocked by parked vehicles and construction material.",
		"Street vendors occupy the whole footpath at peak hours.",
	],
	BROKEN_ELEVATOR: [
		"Elevator has been out of service for over two weeks.",
		"Lift doors do not close; staff say repairs are pending.",
	],
	UNSAFE_CROSSING: [
		"No signal or tactile paving at the crossing; fast traffic.",
		"Crossing has a high kerb with no dropped kerb on either side.",
	],
	OTHER: ["Accessibility concern reported by the community."],
};

const REVIEW_COMMENTS = [
	"Step-free access worked well for my wheelchair.",
	"Ramp was usable but the surface is a bit rough.",
	"Staff helped me find the accessible entrance.",
	"Lift was working on my visit.",
	"Accessible restroom was clean and unlocked.",
	"Path was partly blocked by parked cars.",
	"Could not enter without help; no ramp visible.",
	"Good tactile paving near the entrance.",
];

/* ------------------------------ helpers ------------------------------ */

const randomFloat = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(values: readonly T[]): T =>
	values[Math.floor(Math.random() * values.length)] as T;
const chance = (probability: number) => Math.random() < probability;

const dhakaPoint = () => ({
	latitude: Number(randomFloat(23.68, 23.9).toFixed(6)),
	longitude: Number(randomFloat(90.32, 90.5).toFixed(6)),
});

const jitter = (value: number) => Number((value + randomFloat(-0.0009, 0.0009)).toFixed(6));

const chunks = <T>(items: T[], size = BATCH): T[][] => {
	const result: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		result.push(items.slice(index, index + size));
	}
	return result;
};

const placeNames = [
	"Community Hub",
	"Public Library",
	"Central Park",
	"Transit Plaza",
	"Civic Centre",
	"Health Clinic",
	"Museum Wing",
	"Learning Campus",
	"Bus Terminal",
	"Government Annex",
	"Riverside Garden",
	"Sports Complex",
	"Market Square",
	"City Hall",
	"Family Centre",
];

const nameFor = (index: number) =>
	`${SEED_PREFIX}${pick(["North", "South", "East", "West", "Central", "Old", "New", "Upper"])} ${pick(placeNames)} ${index}`;

/* ------------------------------- reset ------------------------------- */

const reset = async () => {
	await prisma.review.deleteMany({
		where: { location: { slug: { startsWith: SEED_PREFIX } } },
	});
	await prisma.accessibilityReport.deleteMany({
		where: { reporter: { email: { endsWith: "@seed.accesspath.dev" } } },
	});
	await prisma.accessibilityProfile.deleteMany({
		where: { location: { slug: { startsWith: SEED_PREFIX } } },
	});
	await prisma.location.deleteMany({
		where: { slug: { startsWith: SEED_PREFIX } },
	});
	await prisma.user.deleteMany({
		where: { email: { endsWith: "@seed.accesspath.dev" } },
	});
	console.log("Seed data removed.");
};

/* -------------------------------- seed -------------------------------- */

const seed = async () => {
	const startedAt = Date.now();
	const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

	// 1) Demo accounts (one per role) + community users.
	const demoUsers: Array<{ name: string; email: string; role: UserRole }> = [
		{ name: "Admin Demo", email: "admin@accesspath.dev", role: "ADMIN" },
		{ name: "Moderator Demo", email: "moderator@accesspath.dev", role: "MODERATOR" },
		{ name: "Contributor Demo", email: "contributor@accesspath.dev", role: "CONTRIBUTOR" },
		{ name: "User Demo", email: "user@accesspath.dev", role: "USER" },
	];

	for (const demo of demoUsers) {
		await prisma.user.upsert({
			where: { email: demo.email },
			update: { role: demo.role, status: "ACTIVE" as UserStatus },
			create: {
				name: demo.name,
				email: demo.email,
				password: passwordHash,
				role: demo.role,
				status: "ACTIVE" as UserStatus,
				emailVerifiedAt: new Date(),
			},
		});
	}

	const communityUsers = Array.from({ length: TARGETS.communityUsers }, (_, index) => ({
		id: crypto.randomUUID(),
		name: `Community Member ${index + 1}`,
		email: `member${index + 1}@seed.accesspath.dev`,
		password: passwordHash,
		role: "USER" as UserRole,
		status: "ACTIVE" as UserStatus,
		emailVerifiedAt: new Date(),
	}));

	for (const batch of chunks(communityUsers)) {
		await prisma.user.createMany({ data: batch, skipDuplicates: true });
	}

	const userIds = [
		...(await prisma.user.findMany({
			where: { email: { endsWith: "@seed.accesspath.dev" } },
			select: { id: true },
		})),
	].map((row) => row.id);

	const creator = await prisma.user.findFirst({
		where: { role: "ADMIN" },
		select: { id: true },
	});

	console.log(
		`Users: ${demoUsers.length} demo + ${communityUsers.length} community (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
	);

	// 2) Categories.
	const categoryIds = new Map<string, string>();
	for (const category of CATEGORIES) {
		const row = await prisma.category.upsert({
			where: { slug: category.slug },
			update: { name: category.name, icon: category.icon, isActive: true },
			create: {
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				description: `${category.name} locations`,
			},
			select: { id: true, slug: true },
		});
		categoryIds.set(row.slug, row.id);
	}

	// 3) Locations.
	const locationRows: Array<Record<string, unknown>> = [];
	const locationMeta: Array<{ id: string; status: LocationStatus; point: ReturnType<typeof dhakaPoint> }> = [];

	for (let index = 0; index < TARGETS.locations; index += 1) {
		const point = dhakaPoint();
		const id = crypto.randomUUID();
		const status: LocationStatus = chance(0.9)
			? "APPROVED"
			: chance(0.6)
				? "PENDING"
				: "REJECTED";
		const category = pick(CATEGORIES);

		locationRows.push({
			id,
			name: nameFor(index),
			slug: `${SEED_PREFIX}place-${index}`,
			description: "Community-submitted accessible place with recorded accessibility features.",
			address: `${10 + (index % 90)} ${pick(["Road", "Avenue", "Street", "Lane"])} ${index % 40}, Dhaka`,
			city: "Dhaka",
			state: "Dhaka Division",
			country: "Bangladesh",
			postalCode: `12${(index % 90).toString().padStart(2, "0")}`,
			latitude: point.latitude,
			longitude: point.longitude,
			status,
			categoryId: categoryIds.get(category.slug),
			createdById: creator?.id ?? null,
		});

		locationMeta.push({ id, status, point });
	}

	for (const batch of chunks(locationRows)) {
		await prisma.location.createMany({ data: batch as never, skipDuplicates: true });
	}

	console.log(
		`Locations: ${locationRows.length} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
	);

	// 4) Accessibility profiles for ~70% of locations.
	const approvedLocations = locationMeta.filter((item) => item.status === "APPROVED");
	const profileRows = approvedLocations.slice(0, TARGETS.profiles).map((item) => ({
		locationId: item.id,
		wheelchairAccessible: chance(0.62),
		rampAvailable: chance(0.58),
		elevatorAvailable: chance(0.45),
		accessibleRestroom: chance(0.5),
		accessibleParking: chance(0.42),
		stepFreeEntrance: chance(0.6),
		doorAccessibility: chance(0.55),
		tactilePaving: chance(0.3),
		brailleSignage: chance(0.18),
		hearingLoop: chance(0.14),
		accessibilityScore: Math.round(randomFloat(20, 98)),
		isVerified: chance(0.45),
		verifiedAt: chance(0.45) ? new Date() : null,
		additionalInformation: chance(0.35)
			? "Community-verified accessibility details."
			: null,
	}));

	for (const batch of chunks(profileRows)) {
		await prisma.accessibilityProfile.createMany({ data: batch, skipDuplicates: true });
	}

	console.log(
		`Accessibility profiles: ${profileRows.length} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
	);

	// 5) Reports (barriers + other accessibility reports) with GPS.
	const reportStatuses: ReportStatus[] = [
		"PENDING",
		"PENDING",
		"UNDER_REVIEW",
		"RESOLVED",
		"RESOLVED",
		"RESOLVED",
		"REJECTED",
	];

	const reportRows = Array.from({ length: TARGETS.reports }, () => {
		const location = pick(approvedLocations);
		const type = chance(0.85) ? pick(BARRIER_TYPES) : pick(ALL_REPORT_TYPES);

		return {
			id: crypto.randomUUID(),
			type,
			description: pick(BARRIER_TEXT[type] ?? BARRIER_TEXT.OTHER ?? ["Accessibility concern."]),
			status: pick(reportStatuses),
			latitude: jitter(location.point.latitude),
			longitude: jitter(location.point.longitude),
			locationId: location.id,
			reporterId: pick(userIds),
			createdAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 86_400_000),
		};
	});

	for (const batch of chunks(reportRows)) {
		await prisma.accessibilityReport.createMany({ data: batch, skipDuplicates: true });
	}

	console.log(
		`Reports: ${reportRows.length} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
	);

	// 6) Reviews: unique (user, location) pairs.
	const seen = new Set<string>();
	const reviewRows: Array<{
		id: string;
		rating: number;
		comment: string | null;
		userId: string;
		locationId: string;
		createdAt: Date;
	}> = [];

	while (reviewRows.length < TARGETS.reviews) {
		const user = pick(userIds);
		const location = pick(approvedLocations);
		const key = `${user}:${location.id}`;
		if (seen.has(key)) continue;
		seen.add(key);

		const rating = pick([5, 5, 5, 4, 4, 4, 3, 3, 2, 1]);

		reviewRows.push({
			id: crypto.randomUUID(),
			rating,
			comment: chance(0.6) ? pick(REVIEW_COMMENTS) : null,
			userId: user,
			locationId: location.id,
			createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 86_400_000),
		});
	}

	for (const batch of chunks(reviewRows)) {
		await prisma.review.createMany({ data: batch, skipDuplicates: true });
	}

	console.log(
		`Reviews: ${reviewRows.length} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
	);

	// 7) Contributions for the contributor dashboard.
	const contributor = await prisma.user.findFirst({
		where: { email: "contributor@accesspath.dev" },
		select: { id: true },
	});

	if (contributor) {
		const contributionRows = Array.from({ length: Math.min(40, approvedLocations.length) }, (_, index) => {
			const location = approvedLocations[index] ?? approvedLocations[0];
			return {
				id: crypto.randomUUID(),
				type: (index % 3 === 0 ? "LOCATION_UPDATE" : "ACCESSIBILITY_UPDATE") as "LOCATION_UPDATE" | "ACCESSIBILITY_UPDATE",
				status: (index % 5 === 0 ? "PENDING" : "APPROVED") as ContributionStatus,
				title: `Update for ${location?.id.slice(0, 8)}`,
				description: "Seeded contribution for demo dashboards.",
				proposedData: { seeded: true },
				locationId: location?.id ?? null,
				submittedById: contributor.id,
				createdAt: new Date(Date.now() - index * 3_600_000),
			};
		});

		await prisma.contribution.createMany({ data: contributionRows, skipDuplicates: true });
	}

	const counts = {
		users: await prisma.user.count(),
		locations: await prisma.location.count(),
		reports: await prisma.accessibilityReport.count(),
		reviews: await prisma.review.count(),
	};
	console.log(
		`Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`,
		JSON.stringify(counts),
	);
};

const main = async () => {
	if (process.argv.includes("--reset")) {
		await reset();
	}

	await seed();
	await prisma.$disconnect();
};

main().catch(async (error) => {
	console.error(error);
	await prisma.$disconnect();
	process.exit(1);
});
