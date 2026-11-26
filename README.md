# AccessPath — Urban Accessibility & Mobility Platform

AccessPath helps wheelchair users, elderly people and anyone with mobility challenges
discover accessible places and choose routes by **accessibility conditions**, not just
distance.

Two services in one repository:

| Service | Stack | Folder |
| --- | --- | --- |
| API | Express 5 · TypeScript · Prisma 7 · PostgreSQL · Redis | `accesspath-backend/` |
| Web app | Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui · MapLibre GL · Recharts | `accesspath-frontend/` |

---

## Feature map (against the project brief)

| Requirement | Status | Where |
| --- | --- | --- |
| Four roles (Admin, User, Contributor, Moderator) | ✅ | `prisma/schema/enum.prisma`, `middleware/checkAuth.ts` |
| Accessible location directory (name, description, address, GPS, category, score, features, photos, verification) | ✅ | `modules/locations`, `modules/places`, `/explore` |
| Accessibility attributes incl. door accessibility | ✅ | `AccessibilityProfile` (10 flags + score + verification) |
| Search: name/address, nearby, category, feature filters, distance/score sort, GPS | ✅ | `GET /places/search`, `GET /places/nearby` |
| Location details page | ✅ | `/explore/[locationId]` |
| Route discovery with accessibility scoring + warnings | ✅ | `modules/routes/routes.engine.ts`, `/routes` |
| Barrier reporting (5 categories, photo, GPS, reporter, status) | ✅ | `ReportType` enum, `POST /reports`, `/reports` |
| Community verification (reviews, votes, updates, moderator approval, history) | ✅ | `modules/feedback`, `modules/contributions`, `modules/moderation` |
| Analytics dashboard with interactive charts | ✅ | `modules/analytics`, `/analytics` (Recharts) |
| Map integration, clustering, geospatial filtering | ✅ | `components/map/*` (MapLibre + native clustering) |
| Admin: users, categories, locations, accessibility data | ✅ | `admin.manage.*`, `/admin/users`, `/admin/categories`, `/admin/locations` |
| Image upload | ✅ | `POST /api/uploads` → `public/uploads`, metadata via `uploads` API |
| Server-side pagination, debouncing | ✅ | list endpoints + `useDebouncedValue` |
| Security & data integrity | ✅ | ownership checks, role gates, no self-review, GPS validation |
| Large dataset (10k locations / 50k reports / 100k feedback) | ✅ | `prisma/seed-large.ts` |
| Bonus: dark mode, preferences, heatmap data, ranking, recommendations | ✅ | `/preferences`, `/analytics`, `/explore?sort=score` |
| Bonus not implemented: voice search, PDF export, offline mode, duplicate detection | ❌ | — |

See [`docs/route-scoring.md`](docs/route-scoring.md) for the route algorithm,
[`docs/API.md`](docs/API.md) for endpoints and [`docs/database.md`](docs/database.md)
for the data model.

---

## Quick start

### 1. API

```bash
cd accesspath-backend
npm install
npx prisma generate
npx prisma migrate deploy      # applies all migrations
npm run dev                    # http://localhost:5000
```

`.env` (see `src/config/index.ts` for the full list): `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `PORT`,
`APP_URL`, `SMTP_*`, `REDIS_*`.

### 2. Web app

```bash
cd accesspath-frontend
npm install
npm run dev                    # http://localhost:3000
```

`.env` needs `BACKEND_API_URL=http://localhost:5000` and, for Google sign-in,
`NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### 3. Demo data

```bash
cd accesspath-backend
npx tsx prisma/seed-map-demo.ts   # 13 hand-written Dhaka places (mixed verification)
npx tsx prisma/seed-large.ts      # 1,200 users · 10k locations · 50k reports · 100k reviews
```

`seed-large.ts` supports `--reset` (delete seeded rows) and `--scale=0.1` (10% volume).

### Demo credentials

Password for all four accounts: `AccessPath#2026`

| Role | Email |
| --- | --- |
| Admin | `admin@accesspath.dev` |
| Moderator | `moderator@accesspath.dev` |
| Contributor | `contributor@accesspath.dev` |
| User | `user@accesspath.dev` |

(Seeded community members use `member<N>@seed.accesspath.dev`, same password.)

---

## Application structure

### Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Auth |
| `/explore` | Accessible location directory + filters |
| `/explore/[locationId]` | Location details (accessibility, reviews, photos) |
| `/explore/map` (alias `/map`) | Interactive map explorer |
| `/routes` | Route planner with ranked accessible routes |
| `/reports` | Report barriers + track your reports |
| `/contribute` | Submit new locations / accessibility updates |
| `/favorites`, `/feedback`, `/uploads`, `/notifications`, `/preferences` | Community features |
| `/profile`, `/dashboard` | Personal overview |
| `/moderation` | Moderator queue (approve/reject/verify/flag) |
| `/analytics` | Platform analytics with charts |
| `/admin`, `/admin/users`, `/admin/categories`, `/admin/locations` | Admin |

### API modules

`auth · users · locations · maps · places · reports · contributions · moderation ·
feedback · favorites · routes · uploads · analytics · notifications · preferences · admin`

Every module follows `*.route.ts → *.controller.ts → *.service.ts` with Zod validation
and a single response envelope:

```json
{ "success": true, "statusCode": 200, "message": "…", "data": {}, "meta": { "page": 1, "limit": 20, "total": 123, "totalPages": 7 } }
```

---

## Security & data-integrity rules

- JWTs in httpOnly cookies; `auth(...roles)` guards every non-public route.
- Users can only edit/delete their own reports and contributions (staff excepted).
- **Nobody can approve or verify their own submission** — enforced in
  `assertNotSelfReview()` (moderators and admins included).
- GPS input is validated (`latitude` ±90, `longitude` ±180) at the schema level.
- Only `APPROVED` locations are public; unknown accessibility is never reported as
  accessible (feature filters run in SQL and `verification: "unknown"` is explicit).
- Favorites are keyed by `(userId, locationId)`; routes are private to their owner.
- Every admin/moderation mutation writes an `AuditLog` entry.

---

## Known limitations

- **No external routing provider is configured.** Route geometry uses deterministic
  candidate corridors around the straight line; scoring, barriers and warnings are
  computed from real data (see `docs/route-scoring.md` § Limitations).
- Uploads are stored on local disk (`public/uploads`) — swap for S3/Cloudinary for
  serverless hosting.
- Analytics settings (`/admin` settings) are held in process memory.
- Basemap uses OpenStreetMap raster tiles; set `NEXT_PUBLIC_MAP_STYLE_URL` for a
  production tile provider.
- **MapLibre worker**: Turbopack serves MapLibre's bundled worker chunk as HTML, which
  makes the worker fail and stops any GeoJSON (markers, clusters) from rendering.
  `scripts/copy-maplibre.mjs` (run by `predev`/`prebuild`) copies the self-contained
  worker to `public/vendor/`, and `src/lib/maplibre.ts` points MapLibre at it with
  `setWorkerUrl()`.
- Theme colours are declared in `oklch`; MapLibre's style parser only accepts legacy
  colour syntax, so `readMapPalette()` normalises tokens to hex/rgba before they are used
  in paint properties.
