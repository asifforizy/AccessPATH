# AccessPath database design

PostgreSQL via Prisma 7. Schema is split per model under
`accesspath-backend/prisma/schema/*.prisma`; migrations live in
`accesspath-backend/prisma/migrations`.

## Entity overview

```
User ──┬── Location (createdBy)
       ├── AccessibilityReport (reporter)
       ├── Review (author) ── ReviewHelpful
       ├── Favorite
       ├── SavedRoute
       ├── Contribution (submitter / reviewer)
       ├── Notification
       ├── UserPreference (1:1)
       └── AuditLog (actor)

Category (hierarchical) ── Location ──┬── AccessibilityProfile (1:1)
                                      ├── AccessibilityHistory
                                      ├── LocationPhoto
                                      ├── AccessibilityReport ── ReportPhoto
                                      ├── Review
                                      ├── Favorite
                                      └── Contribution
```

## Core models

### User
`id` (uuid) · `name` · `email` (unique) · `password?` · `image?` · `emailVerifiedAt?` ·
`role` (`ADMIN|MODERATOR|CONTRIBUTOR|USER`) · `status` (`ACTIVE|INACTIVE|SUSPENDED|DELETED`) ·
`createdAt` · `deletedAt?`
Indexes: `(role, status)`, `(createdAt)`.

### Location
`id` · `name` · `slug` (unique) · `description?` · `address` · `city` · `state?` ·
`country` · `postalCode?` · `latitude` · `longitude` · `phone?` · `website?` ·
`status` (`PENDING|APPROVED|REJECTED|ARCHIVED`) · `categoryId` · `createdById?` ·
`createdAt` · `updatedAt` · `deletedAt?`
Indexes: `(name)`, `(address)`, `(categoryId, status)`, `(city, country)`,
`(latitude, longitude)`, `(createdById)` + trigram GIN on `name`, `address`, `city`
(`pg_trgm`, `migration 20261201000000`).

### AccessibilityProfile (1:1 with Location)
`wheelchairAccessible` · `rampAvailable` · `elevatorAvailable` · `accessibleRestroom` ·
`accessibleParking` · `stepFreeEntrance` · **`doorAccessibility`** · `tactilePaving` ·
`brailleSignage` · `hearingLoop` · `additionalInformation?` · `accessibilityScore` (0–100) ·
`isVerified` · `verifiedAt?` · `updatedAt`
Indexes: `(accessibilityScore)`, `(isVerified)`.

> `doorAccessibility` was added in `20261201000000_accessibility_routes_and_search`.

### AccessibilityReport (barrier report)
`id` · `type` (`BROKEN_FOOTPATH|MISSING_RAMP|BLOCKED_SIDEWALK|BROKEN_ELEVATOR|
UNSAFE_CROSSING|ACCESSIBILITY_ISSUE|INCORRECT_INFORMATION|LOCATION_CLOSED|MISSING_FEATURE|OTHER`) ·
`description` · `status` (`PENDING|UNDER_REVIEW|RESOLVED|REJECTED`) ·
**`latitude?` / `longitude?`** (barrier GPS; falls back to the location pin) ·
`locationId` · `reporterId` · `reviewedAt?` · timestamps · `attachments[]`
Indexes: `(locationId, status)`, `(reporterId)`, `(latitude, longitude)`, `(type, status)`.

### Contribution
`type` (`LOCATION_CREATE|LOCATION_UPDATE|ACCESSIBILITY_UPDATE`) ·
`status` (`PENDING|APPROVED|REJECTED`) · `title?` · `description?` · `proposedData`
(JSON) · `locationId?` · `submittedById` · `reviewedById?` · `reviewNote?` · `reviewedAt?`

Approving a `LOCATION_CREATE` contribution creates the `Location` (slug generated),
an `AccessibilityProfile` from `proposedData.features`, and a primary `LocationPhoto`
from `proposedData.photoUrl`.

### Review / ReviewHelpful
`Review`: `rating` 1–5, `comment?`, `userId`, `locationId`, unique `(userId, locationId)`,
index `(locationId, rating)`.
`ReviewHelpful`: one vote per `(userId, reviewId)`.

### SavedRoute
`originLatitude/Longitude`, `destinationLatitude/Longitude`, `travelMode`,
`distanceMeters`, `durationSeconds`, `routeData` (JSON: `waypoints`, `accessibilityScore`,
`breakdown`, `warnings`, `support`), `accessibilityRequirements` (JSON), `userId`.
Used by `/routes/:id/barriers` to sample the saved corridor.

### Supporting models
`Category` (self-referencing hierarchy, `isActive`), `LocationPhoto`
(`isPrimary`, `uploadedById`), `ReportPhoto`, `Favorite` (unique `userId+locationId`),
`UserPreference` (travel mode, needs, language, notifications), `Notification`
(type, message, `isRead`), `AuditLog` (`action`, `entityType`, `entityId`, `actorId`,
`metadata`), `AccessibilityHistory`, `OAuthAccount`.

## Enums

`UserRole`, `UserStatus`, `LocationStatus`, `ReportType`, `ReportStatus`,
`ContributionType`, `ContributionStatus`, `TravelMode`.

## Migrations

| Migration | Contents |
| --- | --- |
| `20261122131607_v1` | Initial schema |
| `20261122133907_v2` | Follow-up schema changes |
| `20261201000000_accessibility_routes_and_search` | `doorAccessibility`, barrier `ReportType` values, report `latitude/longitude`, search/geo indexes, `pg_trgm` |

Apply with `npx prisma migrate deploy`; regenerate the client with `npx prisma generate`.

## Dataset & seeding

| Table | Rows after `prisma/seed-large.ts` |
| --- | --- |
| User | 1,206 (4 demo roles + 1,200 community) |
| Location | ~10,013 (≈90% approved) |
| AccessibilityProfile | 7,000 |
| AccessibilityReport | 50,000 (85% barrier categories, GPS jittered) |
| Review | 100,000 (unique user/location pairs) |
| Contribution | 40 (for the contributor dashboard) |

## Performance notes

- All list endpoints paginate server-side (`page`/`limit`, max 100) and return `meta`.
- Geo queries use bounding-box indexes on `(latitude, longitude)`; exact distances use
  Haversine in application code, so no PostGIS extension is required.
- Text search uses `contains` (case-insensitive) backed by trigram GIN indexes.
- `places/search?sort=nearest` sorts in application code over a capped candidate set
  (300 rows) — a PostGIS `ST_Distance` index would be the upgrade path for much larger
  datasets.
