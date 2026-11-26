/**
 * Development seed for the Map Explorer.
 *
 * Idempotent (upserts by slug). Creates demo categories and approved locations
 * around Dhaka with a deliberate mix of accessibility data:
 *   - verified profiles
 *   - unverified profiles
 *   - locations with NO accessibility profile (unknown — must never be
 *     reported as accessible)
 *   - one PENDING location that must not appear in public results
 *
 * Cleanup:  npx tsx prisma/seed-map-demo.ts --clean
 * Run:      npx tsx prisma/seed-map-demo.ts
 */
import { prisma } from "../src/lib/prisma";

const DEMO_PREFIX = "demo-";

const categories = [
	{ name: "Public Building", slug: "public-building", icon: "building" },
	{ name: "Park", slug: "park", icon: "trees" },
	{ name: "Educational Institution", slug: "education", icon: "graduation-cap" },
	{ name: "Transportation Facility", slug: "transport", icon: "bus" },
	{ name: "Government Office", slug: "government", icon: "landmark" },
	{ name: "Community Center", slug: "community", icon: "users" },
];

type SeedProfile = {
	accessibilityScore: number;
	isVerified: boolean;
	wheelchairAccessible?: boolean;
	rampAvailable?: boolean;
	elevatorAvailable?: boolean;
	accessibleRestroom?: boolean;
	accessibleParking?: boolean;
	stepFreeEntrance?: boolean;
	tactilePaving?: boolean;
	brailleSignage?: boolean;
	hearingLoop?: boolean;
	additionalInformation?: string;
};

interface SeedLocation {
	slug: string;
	name: string;
	description: string;
	address: string;
	city: string;
	latitude: number;
	longitude: number;
	categorySlug: string;
	status?: "APPROVED" | "PENDING";
	profile?: SeedProfile | null;
}

const locations: SeedLocation[] = [
	{
		slug: "demo-ramna-park",
		name: "Ramna Park",
		description:
			"Large public park with paved, mostly flat walkways and shaded seating areas.",
		address: "Ramna, Dhaka 1000",
		city: "Dhaka",
		latitude: 23.7338,
		longitude: 90.4016,
		categorySlug: "park",
		profile: {
			accessibilityScore: 82,
			isVerified: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			accessibleRestroom: true,
			accessibleParking: true,
			stepFreeEntrance: true,
			tactilePaving: true,
			additionalInformation:
				"Main entrances are step-free. Some lakeside paths are gravel.",
		},
	},
	{
		slug: "demo-national-museum",
		name: "Bangladesh National Museum",
		description:
			"National museum with lift access to all exhibition floors and accessible washrooms.",
		address: "Shahbagh, Dhaka 1000",
		city: "Dhaka",
		latitude: 23.7379,
		longitude: 90.3945,
		categorySlug: "public-building",
		profile: {
			accessibilityScore: 91,
			isVerified: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			elevatorAvailable: true,
			accessibleRestroom: true,
			accessibleParking: true,
			stepFreeEntrance: true,
			brailleSignage: true,
			additionalInformation:
				"Wheelchairs are available at the front desk on request.",
		},
	},
	{
		slug: "demo-du-library",
		name: "Dhaka University Library",
		description:
			"University library with a ramped entrance; some reading rooms are on upper floors.",
		address: "University of Dhaka, Dhaka 1000",
		city: "Dhaka",
		latitude: 23.7324,
		longitude: 90.3958,
		categorySlug: "education",
		profile: {
			accessibilityScore: 64,
			isVerified: false,
			wheelchairAccessible: true,
			rampAvailable: true,
			stepFreeEntrance: true,
			additionalInformation:
				"Reports of an out-of-service lift on the east wing.",
		},
	},
	{
		slug: "demo-kamalapur-station",
		name: "Kamalapur Railway Station",
		description:
			"Main railway station with accessible platforms and a dedicated assistance desk.",
		address: "Kamalapur, Dhaka 1222",
		city: "Dhaka",
		latitude: 23.7298,
		longitude: 90.4265,
		categorySlug: "transport",
		profile: {
			accessibilityScore: 76,
			isVerified: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			accessibleRestroom: true,
			stepFreeEntrance: true,
			hearingLoop: true,
			additionalInformation:
				"Request platform assistance at the main concourse desk.",
		},
	},
	{
		slug: "demo-farmgate-terminal",
		name: "Farmgate Bus Terminal",
		description:
			"Busy intercity bus terminal. Accessibility is improving but surfaces remain uneven.",
		address: "Farmgate, Dhaka 1215",
		city: "Dhaka",
		latitude: 23.7583,
		longitude: 90.3896,
		categorySlug: "transport",
		profile: {
			accessibilityScore: 45,
			isVerified: false,
			rampAvailable: true,
			accessibleRestroom: false,
			additionalInformation:
				"Boarding areas are crowded at peak hours; no accessible restroom found.",
		},
	},
	{
		slug: "demo-shilpakala-academy",
		name: "Bangladesh Shilpakala Academy",
		description:
			"Arts complex with step-free galleries, an accessible auditorium and tactile signage.",
		address: "Segunbagicha, Dhaka 1000",
		city: "Dhaka",
		latitude: 23.7378,
		longitude: 90.4081,
		categorySlug: "public-building",
		profile: {
			accessibilityScore: 88,
			isVerified: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			elevatorAvailable: true,
			accessibleRestroom: true,
			stepFreeEntrance: true,
			tactilePaving: true,
			brailleSignage: true,
		},
	},
	{
		slug: "demo-dhanmondi-community",
		name: "Dhanmondi Community Centre",
		description:
			"Neighbourhood community centre hosting social and educational programmes.",
		address: "Dhanmondi, Dhaka 1209",
		city: "Dhaka",
		latitude: 23.7465,
		longitude: 90.3760,
		categorySlug: "community",
		profile: null,
	},
	{
		slug: "demo-gulshan-society-park",
		name: "Gulshan Society Park",
		description: "Small neighbourhood park with shaded walkways.",
		address: "Gulshan 2, Dhaka 1212",
		city: "Dhaka",
		latitude: 23.7936,
		longitude: 90.4143,
		categorySlug: "park",
		profile: null,
	},
	{
		slug: "demo-suhrawardy-hospital",
		name: "Shaheed Suhrawardy Medical College Hospital",
		description:
			"Public hospital with an accessible emergency entrance and lift access to wards.",
		address: "Sher-e-Bangla Nagar, Dhaka 1207",
		city: "Dhaka",
		latitude: 23.7739,
		longitude: 90.3810,
		categorySlug: "public-building",
		profile: {
			accessibilityScore: 70,
			isVerified: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			elevatorAvailable: true,
			accessibleRestroom: true,
			accessibleParking: true,
			stepFreeEntrance: true,
		},
	},
	{
		slug: "demo-dncc-office",
		name: "Dhaka North City Corporation Office",
		description:
			"Municipal services office. Counter access requires assistance at the side entrance.",
		address: "Gulshan 2, Dhaka 1212",
		city: "Dhaka",
		latitude: 23.7895,
		longitude: 90.4115,
		categorySlug: "government",
		profile: {
			accessibilityScore: 58,
			isVerified: false,
			rampAvailable: true,
			elevatorAvailable: false,
			stepFreeEntrance: true,
			additionalInformation:
				"Elevator reported out of order in the current quarter.",
		},
	},
	{
		slug: "demo-uttara-community",
		name: "Uttara Sector 7 Community Centre",
		description: "Local community venue for workshops and meetings.",
		address: "Uttara Sector 7, Dhaka 1230",
		city: "Dhaka",
		latitude: 23.8687,
		longitude: 90.3946,
		categorySlug: "community",
		profile: null,
	},
	{
		slug: "demo-national-zoo",
		name: "Bangladesh National Zoo",
		description:
			"Large zoo with a disabled-access shuttle route and accessible washrooms.",
		address: "Mirpur, Dhaka 1216",
		city: "Dhaka",
		latitude: 23.8126,
		longitude: 90.3455,
		categorySlug: "park",
		profile: {
			accessibilityScore: 74,
			isVerified: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			accessibleRestroom: true,
			accessibleParking: true,
			stepFreeEntrance: true,
			additionalInformation:
				"Ask for the accessible shuttle at the main gate.",
		},
	},
	{
		slug: "demo-dhanmondi-lake-path",
		name: "Dhanmondi Lake Accessible Path (pending review)",
		description: "Approval-pending path submission — must not appear in public map data.",
		address: "Dhanmondi, Dhaka 1209",
		city: "Dhaka",
		latitude: 23.7461,
		longitude: 90.3763,
		categorySlug: "park",
		status: "PENDING",
		profile: null,
	},
];

const clean = async () => {
	await prisma.location.deleteMany({ where: { slug: { startsWith: DEMO_PREFIX } } });
	await prisma.category.deleteMany({ where: { slug: { in: categories.map((c) => c.slug) } } });
	console.log("Demo locations and categories removed.");
};

const seed = async () => {
	const creator = await prisma.user.findFirst({ select: { id: true } });
	const categoryIdBySlug = new Map<string, string>();

	for (const category of categories) {
		const row = await prisma.category.upsert({
			where: { slug: category.slug },
			update: { name: category.name, icon: category.icon, isActive: true },
			create: {
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				description: `Demo category: ${category.name}`,
			},
			select: { id: true, slug: true },
		});
		categoryIdBySlug.set(row.slug, row.id);
	}

	for (const location of locations) {
		const categoryId = categoryIdBySlug.get(location.categorySlug);

		if (!categoryId) throw new Error(`Missing category ${location.categorySlug}`);

		const row = await prisma.location.upsert({
			where: { slug: location.slug },
			update: {
				name: location.name,
				description: location.description,
				address: location.address,
				city: location.city,
				latitude: location.latitude,
				longitude: location.longitude,
				status: location.status ?? "APPROVED",
				categoryId,
			},
			create: {
				name: location.name,
				slug: location.slug,
				description: location.description,
				address: location.address,
				city: location.city,
				country: "Bangladesh",
				latitude: location.latitude,
				longitude: location.longitude,
				status: location.status ?? "APPROVED",
				categoryId,
				createdById: creator?.id,
			},
			select: { id: true },
		});

		if (location.profile) {
			const profile = location.profile;

			await prisma.accessibilityProfile.upsert({
				where: { locationId: row.id },
				update: {
					...profile,
					verifiedAt: profile.isVerified ? new Date() : null,
				},
				create: {
					locationId: row.id,
					...profile,
					verifiedAt: profile.isVerified ? new Date() : null,
				},
			});
		}
	}

	const [places, profiles] = await Promise.all([
		prisma.location.count({ where: { slug: { startsWith: DEMO_PREFIX } } }),
		prisma.accessibilityProfile.count({
			where: { location: { slug: { startsWith: DEMO_PREFIX } } },
		}),
	]);

	console.log(
		`Seeded ${categories.length} categories, ${places} demo locations (${profiles} with accessibility profiles).`,
	);
};

const main = async () => {
	if (process.argv.includes("--clean")) {
		await clean();
	} else {
		await seed();
	}

	await prisma.$disconnect();
};

main().catch(async (error) => {
	console.error(error);
	await prisma.$disconnect();
	process.exit(1);
});
