# Trip Companion / 與神同行

旅遊靈修 PWA，部署於 Railway，正式站台為 <https://trip.wechurch.online/>。

這個專案目前是 React/Vite 前端加 Express 後端，資料庫使用 PostgreSQL + Drizzle ORM。它支援旅程行程、每日靈修、日誌與照片、景點地圖、點名、成員管理、邀請碼、後台管理、Bible Library、R2 檔案上傳、Resend 郵件通知與 Google OAuth。

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query
- Backend: Express, TypeScript, express-session, connect-pg-simple
- Database: PostgreSQL, Drizzle ORM
- Storage: Cloudflare R2 compatible S3 API
- Auth: Email/password, Google OAuth
- Deployment: Railway with Nixpacks
- PWA: vite-plugin-pwa / Workbox

## Repository

```sh
git clone https://github.com/Saisong777/journey-journal.git
cd journey-journal
npm install
```

## Scripts

```sh
npm run dev       # Start the Express server and Vite middleware in development
npm run build     # Build frontend assets and bundled server output
npm run start     # Run the production server from dist/index.js
npm test          # Run Vitest
npm run lint      # Run ESLint
npm run smoke:prod # Check the live production URL without signing in
npm run release:check # Test, typecheck, build, and production smoke check
npm run db:push   # Push Drizzle schema to the configured database
npm run db:studio # Open Drizzle Studio
```

## Local Docker Demo Database

For safer local testing, use the included Docker PostgreSQL database instead of Railway production data.

```sh
npm run local:up
npm run local:wait
npm run db:push:local
npm run db:seed:demo
npm run dev:local
```

Open <http://127.0.0.1:5173> and sign in with:

- Admin: `admin@local.test` / `123456`
- Member: `member1@local.test` / `123456`
- Guide: `guide@local.test` / `123456`

These are local demo accounts created by `npm run db:seed:demo`; do not use them for production.

To wipe and rebuild the local database:

```sh
npm run db:reset:local
```

The local connection lives in `.env.local`, which is ignored by git. Keep `.env.local.example` updated when local development variables change.

## Environment Variables

Create a local `.env` from `.env.example` before running the app locally.

Required for the full app:

- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: stable secret for Express sessions and OAuth state.
- `APP_URL`: public app URL used for redirects and notifications.

Optional integrations:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: email notifications and password reset.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `VITE_R2_PUBLIC_URL`: photo/object uploads.

## Local Development Notes

The Railway production environment is already linked through the Railway CLI. Be careful with:

```sh
railway run npm run dev
railway run npm run db:push
```

Those commands can use production variables and may touch the production database. For safer development, prefer a separate local/staging PostgreSQL database and a local `.env`.

The server startup currently runs `runStartupMigration()` automatically. That is useful in deployment, but it means local development should be pointed at a disposable or staging database unless you explicitly intend to update production data.

## Railway Deployment

Railway reads `railway.json`:

- Build command: `npm run build`
- Start command: `npx drizzle-kit push --force || echo 'schema push skipped'; npm run start`
- Healthcheck: `/api/auth/session`

The production Railway context is:

- Project: `Life-Jourey`
- Environment: `production`
- Service: `journey-journal`
- Public URL: <https://trip.wechurch.online>

## Current Verification Baseline

Before deploying a release candidate:

```sh
npm test
npx tsc --noEmit
npm run build
npm run smoke:prod
```

`npm run smoke:prod` checks the public HTML shell, health endpoints, security headers, anonymous session response, and protected API behavior on <https://trip.wechurch.online>. To test another target, set `SMOKE_BASE_URL`.

```sh
SMOKE_BASE_URL=http://127.0.0.1:5000 npm run smoke:prod
```

`npm run lint` currently reports warnings from existing TypeScript/React style rules. Treat lint cleanup as a separate hardening task unless the change directly touches those files.
