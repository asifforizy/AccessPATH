/**
 * Types shared by the map explorer and the places API.
 */

export type VerificationStatus = "verified" | "unverified" | "unknown";

export type CategoryGroup =
  | "BUILDING"
  | "PARK"
  | "EDUCATION"
  | "TRANSPORT"
  | "GOVERNMENT"
  | "COMMUNITY"
  | "OTHER";

/** Order used by the filter UI and the feature checklist. */
export const accessibilityFeatureKeys = [
  "wheelchairAccessible",
  "rampAvailable",
  "elevatorAvailable",
  "accessibleRestroom",
  "accessibleParking",
  "stepFreeEntrance",
  "tactilePaving",
  "brailleSignage",
  "hearingLoop",
] as const;

export type AccessibilityFeatureKey = (typeof accessibilityFeatureKeys)[number];

/** Features exposed in the map/filter UI (subset of the API payload). */
export const filterableFeatureKeys = [
  "wheelchairAccessible",
  "rampAvailable",
  "elevatorAvailable",
  "accessibleRestroom",
  "accessibleParking",
  "stepFreeEntrance",
] as const satisfies readonly AccessibilityFeatureKey[];

export type FilterableFeatureKey = (typeof filterableFeatureKeys)[number];

export type AccessibilityFlags = Record<AccessibilityFeatureKey, boolean>;

export interface IPlaceCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface IPlaceCard {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  category: IPlaceCategoryRef | null;
  categoryGroup: CategoryGroup;
  accessibilityScore: number | null;
  verification: VerificationStatus;
  verifiedAt: string | null;
  /** `null` means unknown accessibility — never treat as accessible. */
  features: AccessibilityFlags | null;
  photo: string | null;
  reviewCount: number;
}

export interface INearbyPlace extends IPlaceCard {
  distanceMeters: number;
}

export interface IPlaceGeoFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: IPlaceCard;
}

export interface IPlaceExploreMeta {
  returned: number;
  truncated: boolean;
  limit: number;
  bbox: IMapBounds;
  zoom: number | null;
}

export interface IPlaceFeatureCollection {
  type: "FeatureCollection";
  features: IPlaceGeoFeature[];
  meta: IPlaceExploreMeta;
}

export interface IPlaceCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface IPlaceSortMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort?: string;
  truncatedCandidates?: boolean;
}

export interface IPlaceDetail extends IPlaceCard {
  description: string | null;
  postalCode: string | null;
  phone: string | null;
  website: string | null;
  photos: Array<{ id: string; url: string; isPrimary?: boolean }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user?: { id: string; name: string; image?: string | null } | null;
  }>;
  averageRating: number | null;
  reviewCountTotal: number;
  accessibility:
    | ({
        accessibilityScore: number;
        isVerified: boolean;
        additionalInformation: string | null;
      } & Partial<AccessibilityFlags>)
    | null;
}

export type PlaceSort = "nearest" | "score" | "recently_verified";

export interface IPlaceFilters {
  category: string | null;
  features: FilterableFeatureKey[];
  verifiedOnly: boolean;
}

export const emptyPlaceFilters: IPlaceFilters = {
  category: null,
  features: [],
  verifiedOnly: false,
};

export const hasActiveFilters = (filters: IPlaceFilters) =>
  filters.category !== null ||
  filters.features.length > 0 ||
  filters.verifiedOnly;

export interface IMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
