# Backend on Vercel (Serverless)

This repo is prepared to deploy the Node/Express backend to Vercel without using your own server.

What changed
- Express is split into `back/app.js` (no `listen`) and `back/server.js` (local dev only).
- Sessions use `cookie-session` (stateless-friendly) instead of `express-session` store.
- Vercel functions forward requests to Express via `back/api/index.js` and `back/api/[...all].js`.

Deploy steps
1) Create a new Vercel project
   - Import this GitHub repo
   - Root Directory: `back`
   - Framework Preset: Other
2) Environment Variables (Production + Preview)
   - `NODE_ENV=production`
   - Database (from your provider): `DB_HOST`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `DB_SSL=false` (set `true` only if provider requires TLS)
   - `JWT_SECRET=<long random string>`
   - `FRONTEND_URL=https://booking-room-continue.vercel.app`
   - `CORS_ALLOWED_ORIGINS=https://booking-room-continue.vercel.app`
   - `COOKIE_DOMAIN=` (leave empty unless using a parent domain for multiple subdomains)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI=https://<backend-vercel>.vercel.app/api/auth/google/callback`
3) Deploy → Backend URL will be `https://<backend-vercel>.vercel.app`
4) Update the frontend project (Nuxt on Vercel)
   - `NUXT_PUBLIC_API_BASE_URL=https://<backend-vercel>.vercel.app/api`
   - Redeploy frontend
5) Google OAuth Console
   - Authorized origins: `https://booking-room-continue.vercel.app`
   - Redirect URI: `https://<backend-vercel>.vercel.app/api/auth/google/callback`

Local development
- Run `npm install` in `back/`
- `npm run dev` (nodemon) or `npm start` to test on `http://localhost:3001`

Files to know
- `back/app.js` — Express app
- `back/server.js` — local server runner
- `back/api/index.js`, `back/api/[...all].js` — Vercel entry points

