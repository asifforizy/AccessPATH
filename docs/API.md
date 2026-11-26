# AccessPath API reference

Base URL: `http://localhost:5000/api/v1` (web app proxies geo reads through
`/api/geo/*` so httpOnly cookies stay server-side).

All responses use one envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "…",
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 123, "totalPages": 7 }
}
```

Authentication: JWT in the `accessToken` httpOnly cookie (or `Authorization: Bearer …`).
Errors: `403` (role), `401` (session), `400` (validation, message names the field),
`404`, `409` (conflict).

## Auth — `/auth`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/register` | Creates a pending user + emails an OTP |
| POST | `/verify-email` | Verifies the OTP |
| POST | `/login` | Sets `accessToken` / `refreshToken` cookies |
| POST | `/google` | Google ID-token sign-in |
| POST | `/refresh-token` | Rotates tokens |
| POST | `/forgot-password`, `/reset-password` | Password reset |
| POST | `/logout` | Clears cookies |
| GET | `/me` | Current session user |

## Users — `/users` (auth)

`GET /me` · `PATCH /me` · `PATCH /me/avatar` · `DELETE /me` · `GET /me/contributions` ·
`GET /me/reports` · `GET /me/activity`

## Locations & places

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/locations` | any role | Directory: `q`, `city`, `categoryId`, `page`, `limit` |
| GET | `/locations/cities` | any role | City facets |
| GET | `/locations/:locationId` | any role | Detail (accessibility, photos, reviews, rating) |
| GET | `/places/search` | any role | `query`/`q`, `category` (id or slug), `sort=nearest\|score\|recently_verified`, `latitude`, `longitude`, pagination |
| GET | `/places/nearby` | any role | `latitude`, `longitude` (required), `radius` ≤ 50 000, `limit` |
| GET | `/places/categories` | any role | Active categories + counts |
| GET | `/places/:placeId` | any role | Full detail |

Accessibility filters on search/nearby/explore: `wheelchairAccess`, `rampAvailable`,
`elevatorAvailable`, `accessibleRestroom`, `accessibleParking`, `stepFreeEntrance`,
`verifiedOnly` (all `true|false`). Filters are applied in SQL — a location without an
accessibility profile can never match them.

## Maps — `/maps`

`GET /maps/explore?north&south&east&west&zoom` → GeoJSON `FeatureCollection` of approved
locations, with `categoryGroup`, `verification` (`verified|unverified|unknown`),
`features` and counts. Supports the same accessibility filters + `limit` (≤ 1000).

## Reports — `/reports` (auth)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/reports` | Filters: `status`, `type`, `locationId` |
| POST | `/reports` | `locationId`, `type`, `description`, `latitude?`, `longitude?`, `attachments[]` |
| GET | `/reports/my-reports`, `/reports/nearby` | Own / geo-filtered |
| GET | `/reports/:reportId` | Owner or staff |
| PATCH | `/reports/:reportId` | Reporter or staff (staff may set `status`) |
| DELETE | `/reports/:reportId` | Reporter or staff |
| GET | `/reports/:reportId/history`, `/verification` | Audit trail |
| POST | `/reports/:reportId/attachments` | Add photos |

Barrier types: `BROKEN_FOOTPATH`, `MISSING_RAMP`, `BLOCKED_SIDEWALK`, `BROKEN_ELEVATOR`,
`UNSAFE_CROSSING` (+ `ACCESSIBILITY_ISSUE`, `INCORRECT_INFORMATION`, `LOCATION_CLOSED`,
`MISSING_FEATURE`, `OTHER`).

## Contributions — `/contributions` (auth)

`GET /` · `POST /` (`type`, `title?`, `description?`, `proposedData`, `locationId?`) ·
`GET /my-contributions` · `GET /statistics` · `GET /:id` · `PATCH /:id` ·
`DELETE /:id` · `GET /:id/history`

`LOCATION_CREATE` payload (`proposedData`): `name`, `address`, `city`, `country`,
`categoryId`, `latitude`, `longitude`, optional `state`, `postalCode`, `phone`,
`website`, `description`, `features{}`, `accessibilityScore`, `photoUrl`.

## Moderation — `/moderation` (ADMIN, MODERATOR)

`GET /queue` · `GET /locations|reports|contributions|feedback` · `GET /history` ·
`GET /statistics` · `GET /:submissionId` ·
`POST /:submissionId/approve|reject|request-changes|verify|flag`

Nobody can act on their own submission (`403`).

## Routes — `/routes` (auth)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/plan` | `origin`, `destination`, `travelMode`, `accessibilityRequirements?`, `save`, `name?` → best corridor + ranked `alternatives` |
| POST | `/alternatives` | All ranked corridors |
| POST | `/validate` | Distance / duration only |
| POST | `/score` | **Area** accessibility score around a destination |
| GET | `/preferences`, `PUT /preferences` | Travel mode + needs |
| GET | `/:routeId` | Saved route (owner/admin) |
| GET | `/:routeId/barriers` | Barriers along the saved corridor |
| GET | `/:routeId/accessibility` | Accessibility profile around destination |
| POST | `/:routeId/feedback` | Rating 1–5 + comment |

`accessibilityRequirements`: `avoidStairs`, `requireElevator`, `requireRestroom`,
`requireParking`, `avoidUnsafeCrossings`.

## Favorites, feedback, uploads, notifications, preferences

- `GET/POST /favorites`, `GET /favorites/check/:locationId`,
  `DELETE /favorites/:favoriteId`, `DELETE /favorites/locations/:locationId`
- `GET/POST /feedback`, `GET /feedback/locations/:locationId`,
  `GET|PATCH|DELETE /feedback/:feedbackId`, `POST /feedback/:feedbackId/helpful`,
  `POST /feedback/:feedbackId/reviews`, `POST /feedback/:feedbackId/flag`
- `POST /uploads/images`, `POST /uploads/images/multiple`,
  `POST /uploads/presigned-url`, `GET|PATCH|DELETE /uploads/:mediaId`
- `GET /notifications`, `/unread-count`, `PATCH /read-all`, `PATCH /:id/read`,
  `DELETE /:id`, `DELETE /`
- `GET /preferences`, `PUT /preferences`, `GET/PUT /preferences/accessibility`,
  `GET /preferences/recommendations`

## Analytics — `/analytics` (ADMIN, MODERATOR)

`GET /overview` · `/locations` · `/reports` · `/contributions` · `/users` ·
`/moderation` · `/trends/monthly?months=12` · `/barriers/top-areas?limit=10` ·
`/categories/distribution` · `/accessibility/distribution` · `/heatmap?limit=500`

## Admin — `/admin` (ADMIN)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health`, `/version` | Public service info |
| GET | `/stats`, `/audit-logs`, `/settings` | Dashboard |
| PUT | `/settings`, `POST /cache/clear` | Configuration |
| GET | `/users` | `q`, `role`, `status`, pagination |
| PATCH | `/users/:userId` | `role`, `status` (cannot change self) |
| GET | `/categories` | All categories + location counts |
| POST | `/categories` | `name`, `description?`, `icon?` |
| PATCH | `/categories/:categoryId` | Rename / `isActive` |
| DELETE | `/categories/:categoryId` | Deletes, or deactivates when in use |
| GET | `/locations` | `q`, `status`, `categoryId`, pagination |
| PATCH | `/locations/:locationId` | Name, address, coordinates, category, status, contact |
| PUT | `/locations/:locationId/accessibility` | All feature flags, score, `isVerified`, notes |
| DELETE | `/locations/:locationId` | Soft delete + archive |

## Web-app-only routes

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/geo/[...path]` | Cookie-forwarding read proxy for `maps/*`, `places/*` |
| POST | `/api/uploads` | Multipart image upload (≤ 8 MB, jpeg/png/webp/gif) → `{ url }` |
