# AGENTS.md

Single service: `accesspath-backend/` — Express 5 + TypeScript (ESM) + Prisma 7 + PostgreSQL + Redis. No frontend or README in the repo.

## Commands (run in `accesspath-backend/`)

- `npm install`
- `npx prisma generate` — required after a fresh clone or schema change. The generated client lives in `prisma/generated/` and is gitignored.
- `npm run dev` — `tsx watch src/server.ts`
- `npm run build` — `tsc`; emits `dist/src/server.js`, **not** `dist/server.js`
- `npm start` — currently points at `dist/server.js`, so it fails. Use `node dist/src/server.js` after building (or fix the script).
- `npm run lint:check` / `lint:fix` and `npm run format:check` / `format:fix` — Biome, scoped to `./src`
- No tests configured (`npm test` exits 1). Verify changes with `npx tsc --noEmit` and Biome.
- Prisma config is `prisma7.config.ts` (auto-loaded). Schema is multi-file under `prisma/schema/*.prisma`; add new models/enums as their own file there. Migrations go to `prisma/migrations/`.
- On Windows PowerShell, `npx` may be blocked by execution policy; run it as `cmd /c "npx ..."`.

## Architecture

- `src/server.ts` connects Prisma, then listens; `src/app.ts` wires middleware and mounts routes.
- Routes are mounted at `/api/v1/<module>` in `src/app.ts` (only `/api/v1/auth` today).
- Module convention: `src/modules/<name>/<name>.{route,controller,service,validation,interface}.ts`.
- Request flow: route → `validateRequest(zodSchema)` → controller (`catchAsync`) → service → `sendResponse`.
- `validateRequest` parses **only `req.body`** (not query or params).
- Errors: throw `AppError(statusCode, message)`. `globalErrorHandler` maps Prisma codes (`P2002`→409, `P2025`→404, `P2003`→400, …) and returns `{ success, statusCode, message, error }`.
- Import the Prisma client from `../../prisma/generated/prisma/client` and enums from `../../prisma/generated/prisma/enums` — never `@prisma/client`. The client is created once with the `PrismaPg` adapter in `src/lib/prisma.ts`.
- Read env vars through `src/config/index.ts` (`config.*`), not `process.env` directly. `.env` is gitignored; required keys are enumerated in that file (`DATABASE_URL`, `JWT_*`, `SMTP_*`, `REDIS_*`, `APP_URL`, `PORT`, `GOOGLE_CLIENT_ID`).

## Gotchas

- **Redis is not connected.** `redisClient.connect()` is commented out in `src/server.ts`, but `AuthService.registerUsers` calls `redisClient.set(...)`. Registration fails at runtime until Redis is re-enabled. `config.redis_user` reads `REDIS_USER`, which is missing from `.env`.
- `src/middleware/checkAuth.ts` (`auth(...roles)`) exists but is attached to no route yet. It reads the `accessToken` cookie or a Bearer token and populates `req.user`.
- Registration stores the pending user + hashed password in Redis (5 min TTL) and emails an OTP via Gmail SMTP. There is no verify-email route wired yet, although `UserEmailVerifyZodSchema` exists.
- Both `bcrypt` and `bcryptjs` are installed; code uses `bcryptjs`.
- `tsconfig.json` has `include` commented out and no `rootDir`, so `tsc` also compiles `prisma/generated` and `prisma7.config.ts` into `dist/`.
- Biome style: tabs and double quotes.
