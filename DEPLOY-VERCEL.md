# Deploy: Vercel (Frontend) + Tunnel (Backend)

This guide lets you deploy without adding a payment method. Use Vercel for the Nuxt 3 frontend and run the backend + DB locally via Docker Compose, exposing it to the internet via a secure tunnel.

Two tunnel choices:
- Cloudflare Tunnel (needs your own domain on Cloudflare; free; stable custom subdomain like api.yourdomain.com)
- Tailscale Funnel (no personal domain needed; gives a stable ts.net domain)

Backend is already patched to support env-driven CORS and cookie domain.

---

## Part A — Frontend on Vercel (no card)
1) Import GitHub repo `SadBoySoyBad/Booking-room-continue`
   - Project root: select the `front/` folder
   - Vercel auto-detects Nuxt 3
2) Add Environment Variables (Project → Settings → Environment Variables)
   - `NUXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api`
   - `NUXT_PUBLIC_AUTH_URL=https://<frontend-vercel>.vercel.app` (or your custom)
   - `NUXT_PUBLIC_GOOGLE_CLIENT_ID=<your Google client id>`
   - `NUXT_GOOGLE_CLIENT_SECRET=<your Google client secret>`
3) Deploy → You’ll get `https://<frontend-vercel>.vercel.app`

Note: Add your custom domain later if desired; update ENV accordingly.

---

## Part B — Backend + DB locally with Docker Compose
1) Ensure Docker is installed on your machine
2) In repo root:
   - Copy `env/.env.backend.local.example` to `.env` (or merge into your current `.env`)
   - Ensure values for `DB_USER/DB_PASSWORD/DB_NAME/JWT_SECRET` are set
3) Start stack:
   - `docker compose build`
   - `docker compose up -d`
4) Verify locally:
   - Backend health: `http://localhost:3001/api/healthz`
   - Frontend (local while testing): `http://localhost:3000`

---

## Part C — Choose your tunnel

### Option 1: Cloudflare Tunnel (needs your domain)
1) Install `cloudflared` and run `cloudflared login`
2) Create tunnel: `cloudflared tunnel create bookingroom`
3) Create config file (config.yml), map domain → local service:
```
tunnel: bookingroom
credentials-file: <path-to-credentials-json>

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```
4) In Cloudflare DNS, add CNAME for `api.yourdomain.com` to the tunnel (UI offers one-click)
5) Run tunnel: `cloudflared tunnel run bookingroom`
6) Update backend ENV (then restart backend container):
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://<frontend-vercel>.vercel.app` (and add any custom frontends to `CORS_ALLOWED_ORIGINS`)
   - `CORS_ALLOWED_ORIGINS=https://<frontend-vercel>.vercel.app`
   - `COOKIE_DOMAIN=.yourdomain.com` (only if you own the domain and need cross-subdomain)
   - `GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback`
7) Update Vercel ENV: `NUXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api`

### Option 2: Tailscale Funnel (no domain required)
1) Install Tailscale and sign in (free personal plan)
2) Enable HTTPS serving for local port 3001 (backend):
   - `tailscale serve https 3001` (or use the Admin Console ‘Serve’ feature)
   - You will get a stable `https://<yourname>.ts.net` domain for the machine
3) Update backend ENV (then restart backend container):
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://<frontend-vercel>.vercel.app`
   - `CORS_ALLOWED_ORIGINS=https://<frontend-vercel>.vercel.app`
   - Leave `COOKIE_DOMAIN` empty (ts.net single host is OK)
   - `GOOGLE_REDIRECT_URI=https://<yourname>.ts.net/api/auth/google/callback`
4) Update Vercel ENV: `NUXT_PUBLIC_API_BASE_URL=https://<yourname>.ts.net/api`

---

## Google OAuth settings
- Authorized JavaScript origins: your frontend domain (`https://<frontend-vercel>.vercel.app` or custom)
- Authorized redirect URI: your backend callback (`/api/auth/google/callback`) on the backend public domain (Cloudflare or Tailscale domain)

---

## Troubleshooting
- Cookies not set: ensure HTTPS, `NODE_ENV=production`, correct `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`; set `COOKIE_DOMAIN` only when you have a parent domain for multiple subdomains.
- DB init: first run loads schema from `db_init/init.sql` via compose; if not, load manually using a MySQL client into the `bookingruk_db` database.

