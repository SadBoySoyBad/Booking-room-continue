# Deploy the existing Vercel projects

Verified projects in Potter's projects (`potters-projects-d4f2f738`):

- `booking-room-continue`: root `front`, Nuxt frontend
- `booking-room-continue-backend`: root `back`, Express API
- Both connect to `SadBoySoyBad/Booking-room-continue`.
- `booking-room-v1` and `booking-room-v1-tz3u` belong to the older repository.

Production backend runs application commit `9e1e926`; frontend remains on `9b31775`, both from `codex/restore-booking-system` (verified 16 September 2026, Asia/Bangkok). Public readiness, guest booking, browser admin approval, settings persistence and concurrent booking checks passed. The owner completed real Google sign-in and their confirmed account now has the admin role. Calendar consent and live event create/approve/cancel/reapprove/delete checks passed on production; six simultaneous approvals created exactly one real Google event. QA data was cleaned up. Microsoft is deferred at the owner's request. The branch has not been merged into `main`; future deployments must use the repaired source. See TEST-REPORT.md for evidence and verification limits.

Previously, the backend returned FUNCTION_INVOCATION_FAILED. Owner-supplied logs identified `querySrv ENOTFOUND _mongodb._tcp.booking.vs1tbkz.mongodb.net`, followed by process exit 1. Independent SRV checks returned NXDOMAIN.

## 0. Current Atlas connection

The owner created a new Booking cluster at `booking.7uebkhr.mongodb.net`. Credentials are stored in ignored local environment files and Vercel's encrypted environment. Database `booking` was initialized with collections/indexes and four rooms. Both Docker and Vercel production use this cluster. Temporary verification records were removed after testing.

Vercel now uses the database-specific URI with `/booking` and `MONGODB_DB=booking`. The owner configured the Atlas access list; real Vercel requests verified connectivity. Environment updates were applied through the authenticated Vercel CLI and new production deployments. Do not upload environment files to GitHub.

The following notes describe the earlier investigation of the old hostname; the new cluster starts with new data.

### Earlier cluster investigation

Open the existing Atlas project and inspect the Booking cluster:

- **Paused:** resume the existing cluster, wait until it is available, then retry DNS and backend readiness.
- **Active:** use Connect → Drivers to compare the current hostname with `booking.vs1tbkz.mongodb.net`. Correct the backend project's `MONGODB_URI` if it contains an old hostname.
- **Missing:** check the correct Atlas organization/project and available backups before creating any replacement. A new empty database does not restore existing bookings.

Atlas documents missing SRV records for paused/deleted clusters in its [connection troubleshooting guide](https://www.mongodb.com/docs/atlas/troubleshoot-connection/). A DNS error alone does not prove which cluster state applies or that the password is wrong. Changing CORS or redeploying the same invalid hostname cannot repair it.

After the connection is restored, configure the intended backend environment locally and run `npm run db:check` from `back`. It only checks DNS, connectivity and collection counts; it does not seed, modify indexes or print credentials. For Vercel environment changes, create a new deployment to apply them. Keep the existing database name unless a deliberate data migration is required.

## 1. Backend project

Use Node 22.x. Root Directory: `back`.
`back/vercel.json` builds `app.js` as one Express function, routing all paths to it.
The old `api/` forwarding files are compatibility wrappers; the explicit configuration routes requests directly to Express.

Required Production and Preview environment:

```dotenv
NODE_ENV=production
MONGODB_URI=<your Atlas URI>
MONGODB_DB=booking
JWT_SECRET=<your strong secret>
FRONTEND_URL=https://booking-room-continue.vercel.app
CORS_ALLOWED_ORIGINS=https://booking-room-continue.vercel.app
GOOGLE_CLIENT_ID=<Google client id>
GOOGLE_CLIENT_SECRET=<Google client secret>
GOOGLE_REDIRECT_URI=https://booking-room-continue.vercel.app/api/auth/google/callback
MICROSOFT_CLIENT_ID=<Microsoft application id, if enabled>
MICROSOFT_CLIENT_SECRET=<Microsoft application secret, if enabled>
MICROSOFT_REDIRECT_URI=https://booking-room-continue.vercel.app/api/auth/microsoft/callback
GOOGLE_CALENDAR_ENABLED=false
```

Leave COOKIE_DOMAIN unset for the same-origin proxy. Add specific approved preview origins if needed; arbitrary `*.vercel.app` origins are not trusted.
Atlas must permit the deployment's connection and use a database account with the required privileges. Mongo transactions require a replica set (Atlas provides this). Do not point these settings at the old MariaDB instance.

Before switching production, run `npm run db:init` from `back` against the intended Mongo database using your normal environment configuration. This explicit maintenance command seeds rooms only when empty, removes optional null identifiers, removes the old unique display-name index, and creates the schema indexes. Back up the existing database first. Never run it against an uncertain database name.

## 2. Frontend project

Root Directory: `front`, framework: Nuxt, Node: 22.x.

```dotenv
NUXT_PUBLIC_API_BASE_URL=/api
NUXT_BACKEND_URL=https://booking-room-continue-backend.vercel.app
NUXT_PUBLIC_AUTH_URL=
```

`NUXT_BACKEND_URL` is server-only. Browsers call their own `/api`, and Nitro proxies to Express. This avoids relying on third-party cookies between two Vercel domains.

Clear any old `NUXT_PUBLIC_AUTH_URL` pointing directly at the backend. An empty value starts OAuth through the frontend, matching the callback's cookie origin.

Do not put JWT_SECRET or OAuth client secrets into NUXT_PUBLIC_* variables. The frontend no longer needs OAuth client secrets at all.

## 3. Provider configuration

Register the frontend-origin callback URLs shown above in Google Cloud / Microsoft Entra. OAuth starts and returns through the same frontend `/api` proxy so the state cookie is available on callback. The proxy must preserve redirects (`redirect: 'manual'`) and all Set-Cookie headers.

Microsoft accounts are identified by their provider subject ID. They do not automatically claim existing accounts by matching email, and cross-provider accounts are not automatically merged. For a Microsoft administrator, sign in to create the provider account first, then grant that exact account its role using an existing administrator. A pre-provisioned email-only account can be claimed using verified Google sign-in.

For local development, register `http://localhost:3000/api/auth/google/callback` in the Google OAuth client's Authorized redirect URIs, and `http://localhost:3000/api/auth/microsoft/callback` as the appropriate web redirect URI in Entra. The current Google client returned `redirect_uri_mismatch` for the localhost URL during verification; Microsoft credentials are currently absent from the local environment. Do not change the layout or add a fake sign-in to work around provider configuration.

To enable Google Calendar, enable the Google Calendar API, set GOOGLE_CALENDAR_ENABLED=true, and sign in again to grant the calendar.events scope. Calendar integration is optional; booking succeeds independently if the provider is unavailable. Email reminders use Google Calendar, not an SMTP worker.

## 4. Verification after deployment

1. Backend `/api/healthz`: 200.
2. Backend `/api/readyz`: 200 with status ready (actually pings Mongo).
3. Frontend `/api/rooms`: JSON with stable room IDs.
4. Guest login, booking, confirmation, history and logout.
5. Google/Microsoft login on the frontend origin; refresh the page and verify session persistence.
6. Admin requests, approve/reject, account/room management, settings and analytics.
7. Two overlapping concurrent bookings: one success and one 409 conflict.
8. Confirm logs contain no unhandled exceptions.

Frontend and backend should be deployed together because the API contract and authentication settings have changed. Do not reuse the old SQL deployment guides.
