import type { ReactNode } from "react";

export interface IMe {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerifiedAt: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  preference: Record<string, unknown> | null;
  _count: {
    createdLocations: number;
    reports: number;
    reviews: number;
    favorites: number;
    savedRoutes: number;
    contributions: number;
  };
}

// Adjust to match your Prisma models
export interface IRecentItem {
  id: string;
  createdAt: string;
  status?: string;
  type?: string;
  title?: string | null;
  description?: string | null;
  location?: { id: string; name: string; slug: string } | null;
}

export interface UserAvatarProps {
  name: string;
  image: string | null;
  size?: number;
}

export interface ProfileCardProps {
  title: string;
  href?: string;
  children: ReactNode;
}

export interface ProfileHeaderProps {
  user: IMe;
  activeTab: string;
}

export interface ProfileOverviewProps {
  user: IMe;
  contributions: IRecentItem[];
  reports: IRecentItem[];
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ILocationRef {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  country?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface IPhoto {
  id: string;
  url: string;
  publicId?: string | null;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface IAccessibilityProfile {
  id?: string;
  locationId?: string;
  accessibilityScore?: number;
  isVerified?: boolean;
  wheelchairAccessible?: boolean;
  rampAvailable?: boolean;
  elevatorAvailable?: boolean;
  accessibleRestroom?: boolean;
  accessibleParking?: boolean;
  stepFreeEntrance?: boolean;
  tactilePaving?: boolean;
  brailleSignage?: boolean;
  hearingLoop?: boolean;
  notes?: string | null;
  [key: string]: unknown;
}

export interface IReport {
  id: string;
  locationId: string;
  reporterId: string;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
  location?: ILocationRef | null;
  reporter?: { id: string; name: string; image?: string | null } | null;
  attachments?: IPhoto[];
}

export interface IContribution {
  id: string;
  type: string;
  status: string;
  title?: string | null;
  description?: string | null;
  proposedData: Record<string, unknown>;
  locationId?: string | null;
  submittedById: string;
  reviewedById?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  location?: ILocationRef | null;
  submittedBy?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
}

export interface IReview {
  id: string;
  rating: number;
  comment?: string | null;
  userId: string;
  locationId: string;
  createdAt: string;
  updatedAt?: string;
  user?: { id: string; name: string; image?: string | null } | null;
  location?: ILocationRef | null;
  _count?: { helpfulVotes: number };
}

export interface IFavorite {
  id: string;
  userId: string;
  locationId: string;
  createdAt: string;
  location?: {
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    country?: string | null;
    category?: { id: string; name: string; slug?: string } | null;
    accessibility?: IAccessibilityProfile | null;
    photos?: IPhoto[];
  } | null;
}

export interface INotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface IUserPreference {
  id?: string;
  userId?: string;
  travelMode?: string;
  accessibilityNeeds?: Record<string, unknown>;
  preferredLanguage?: string;
  notificationEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    image?: string | null;
  } | null;
}

export interface IAdminSettings {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  defaultPageSize: number;
  maxUploadSizeMb: number;
  features: Record<string, boolean>;
  updatedAt?: string;
}

export interface IAdminStats {
  users: number;
  locations: number;
  reports: number;
  contributions: number;
  reviews: number;
  favorites: number;
  categories: number;
  notifications: number;
  auditLogs: number;
  pending: {
    locations: number;
    reports: number;
    contributions: number;
    total: number;
  };
}

export interface IRoutePlan {
  routeId: string | null;
  origin?: { name?: string; latitude: number; longitude: number };
  destination?: { name?: string; latitude: number; longitude: number };
  travelMode: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText?: string;
  durationText?: string;
  isSaved?: boolean;
  accessibilityScore?: number;
  steps?: unknown[];
  [key: string]: unknown;
}

export interface IRecommendationResult {
  travelMode?: string;
  matchedNeeds?: string[];
  data: Array<{
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    category?: { id: string; name: string; slug?: string } | null;
    accessibility?: IAccessibilityProfile | null;
    photos?: IPhoto[];
  }>;
}

export interface ILocationCard {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  latitude?: number;
  longitude?: number;
  category?: { id: string; name: string; slug: string } | null;
  accessibility?: IAccessibilityProfile | null;
  photos?: IPhoto[];
  _count?: { reviews: number; favorites: number; reports: number };
}

export interface IFeaturedLocation extends ILocationCard {
  averageRating: number | null;
  ratingCount: number;
}

export interface IPublicHomeStats {
  places: number;
  verifiedPlaces: number;
  reviews: number;
  cities: number;
  averageAccessibilityScore: number;
}

export interface IPublicCity {
  city: string;
  count: number;
}

export interface IPublicCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface IPublicHome {
  stats: IPublicHomeStats;
  cities: IPublicCity[];
  categories: IPublicCategory[];
  featured: IFeaturedLocation[];
}

export interface ILocationDetail extends ILocationCard {
  status: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  website?: string | null;
  photos: IPhoto[];
  reviews: IReview[];
  averageRating?: number | null;
  reviewCount?: number;
}

export type RouteWarningSeverity = "high" | "medium" | "low";

export interface IRouteWarning {
  code: string;
  severity: RouteWarningSeverity;
  message: string;
  distanceMeters?: number;
  barrierType?: string;
  locationId?: string;
}

export interface IRouteScoreBreakdown {
  distancePenalty: number;
  barrierPenalty: number;
  supportBonus: number;
  modeBonus: number;
  requirementPenalty: number;
  dataQualityPenalty: number;
}

export interface IRouteSupport {
  sampledLocations: number;
  verifiedRatio: number;
  stepFreeRatio: number;
  barriers: Record<string, number>;
  corridorRadiusMeters: number;
}

export interface IRouteOption {
  id: string;
  label: string;
  kind: string;
  recommended: boolean;
  travelMode: string;
  waypoints: Array<{ latitude: number; longitude: number; name?: string }>;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  accessibilityScore: number;
  grade: "A" | "B" | "C" | "D" | "E";
  detourPercent: number;
  breakdown: IRouteScoreBreakdown;
  warnings: IRouteWarning[];
  support: IRouteSupport;
}

export interface IRouteOptionSummary {
  id: string;
  label: string;
  kind: string;
  recommended: boolean;
  waypoints: Array<{ latitude: number; longitude: number; name?: string }>;
  detourPercent: number;
  breakdown: IRouteScoreBreakdown;
  support: IRouteSupport;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  accessibilityScore: number;
  grade: IRouteOption["grade"];
  warnings: IRouteWarning[];
}

export interface IPlanRouteResult {
  routeId: string | null;
  origin: { latitude: number; longitude: number; name?: string };
  destination: { latitude: number; longitude: number; name?: string };
  travelMode: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  waypoints: Array<{ latitude: number; longitude: number }>;
  accessibilityScore: number;
  grade: IRouteOption["grade"];
  accessibilityBreakdown: IRouteScoreBreakdown;
  warnings: IRouteWarning[];
  support: IRouteSupport;
  alternatives: IRouteOptionSummary[];
  isSaved: boolean;
}

export interface IAdminManagedUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MODERATOR" | "CONTRIBUTOR" | "USER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  emailVerifiedAt?: string | null;
  createdAt: string;
  _count: { reports: number; contributions: number; reviews: number };
}

export interface IAdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  locationCount: number;
}

export interface IAdminLocation {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  status: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  category?: { id: string; name: string; slug: string } | null;
  accessibility?: IAccessibilityProfile | null;
  _count: { reports: number; reviews: number };
}
