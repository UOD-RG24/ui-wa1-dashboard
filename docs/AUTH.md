# Authentication

How JWT and Microsoft auth work in the Multi Omics Dashboard.

## Architecture

The dashboard never talks to MongoDB or JWT signing secrets directly.

1. The browser calls same-origin paths under `/api/...`.
2. Next.js rewrites those requests to the Nest BFF (`DASHBOARD_BFF_URL`, default `http://127.0.0.1:3001` locally).
3. Nest proxies to `core-wa1-api` (`CORE_API_URL`) and adds `POST /auth/microsoft/exchange`.
4. Until Nest is deployed to Azure, production can rewrite `/api` straight to `core-wa1-api` (path-compatible). The frontend Microsoft flow falls back to core `/auth/microsoft/status|signup|signin` if exchange returns 404.
5. The dashboard stores the returned API `accessToken` (LocalJwt) in `localStorage` and sends it as:

```http
Authorization: Bearer <accessToken>
```

Relevant helpers:

- `frontend/app/lib/apiClient.ts` — authenticated `fetch`
- `frontend/app/lib/authStorage.ts` — token / user persistence
- `frontend/app/lib/api.ts` — auth and resource endpoints
- `frontend/app/lib/msal.ts` — browser MSAL (Entra access token)
- `frontend/app/components/auth/AuthGate.tsx` — session guard on `/`
- `backend/src/auth/auth.controller.ts` — Nest auth proxy + microsoft exchange

## Locked design

- **Nest = thin BFF** for API traffic. Browser does not call `core-wa1-api` by origin.
- **MSAL runs in the frontend** (SPA). Nest does **not** own Microsoft redirect login.
- **Entra Client ID / Tenant ID / API scope** live only in frontend env (`NEXT_PUBLIC_AZURE_AD_*`).
- Nest env is only `CORE_API_URL`, `FRONTEND_URL`, `PORT`.

## Auth modes

### JWT email/password

| Action | Method | Path |
|--------|--------|------|
| Sign up | `POST` | `/auth/jwt/signup` |
| Sign in | `POST` | `/auth/jwt/signin` |
| Status | `GET` | `/auth/status` |
| Sign out | `POST` | `/auth/signout` |

Sign-in response includes `accessToken` and a `user` object.

### Microsoft / Entra (SPA MSAL + token exchange)

1. Browser MSAL login → Microsoft access token (API scope).
2. `POST /auth/microsoft/exchange` with `Authorization: Bearer <entra>` (Nest BFF), **or** fallback:
   - `GET /auth/microsoft/status`
   - `POST /auth/microsoft/signup` if not registered
   - `POST /auth/microsoft/signin`
3. Store returned **LocalJwt** `accessToken`. Use that for all datasets/experiments calls — never the Entra token.

## Session lifecycle

1. User signs up/in with JWT **or** Microsoft.
2. Dashboard stores `accessToken` (and user snapshot) in `localStorage`.
3. Protected pages load inside `AuthGate`, which calls `GET /auth/status`.
4. If status fails or token is missing → redirect to `/login` and clear storage.
5. Sign-out calls `POST /auth/signout` (API revokes the token JTI), then clears local storage and redirects to `/login`.
6. Any authenticated `401` also clears the session and sends the user to `/login`.

## Environment / config

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Usually `/api` (same-origin) |
| `DASHBOARD_BFF_URL` | Nest BFF origin locally (`http://127.0.0.1:3001`) |
| `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` | Entra SPA / app client ID |
| `NEXT_PUBLIC_AZURE_AD_TENANT_ID` | Entra tenant ID |
| `NEXT_PUBLIC_AZURE_AD_API_SCOPE` | API scope (must match core `AzureAd` audience) |

### Nest BFF (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `CORE_API_URL` | `core-wa1-api` origin (no trailing slash) |
| `FRONTEND_URL` | CORS origin (default `http://localhost:3000`) |
| `PORT` | Default `3001` |

### GitHub Actions (production build)

`NEXT_PUBLIC_*` is baked in at **build** time. Create repo secrets:

- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_TENANT_ID`
- `AZURE_AD_API_SCOPE`

Optional repo variable: `DASHBOARD_BFF_URL` (leave unset to use the production default → core API until Nest is hosted).

Settings → Secrets and variables → Actions.

## Entra Portal checklist (once)

Tenant hint: `gdkkaoutlook.onmicrosoft.com`. App hint: `rg24-rg1-a1` (or a separate SPA app).

1. Copy Application (client) ID and Directory (tenant) ID.
2. Under **Expose an API**, note Application ID URI + scope (e.g. `api://{id}/access_as_user`).
3. SPA platform redirect URIs: `http://localhost:3000` and the production dashboard origin.
4. If SPA Client ID ≠ API app, authorize the SPA under Expose an API / API permissions + admin consent.
5. Put values in `frontend/.env.local` and the three GitHub secrets above.

## How teammates use it locally

```bash
# root of ui-wa1-dashboard
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# fill NEXT_PUBLIC_AZURE_AD_* in frontend/.env.local
npm install
npm run dev
```

1. Open `/login`.
2. JWT: sign up / sign in with email and password.
3. Microsoft: button enables when Azure AD env vars are set; completes MSAL then token exchange.
4. Datasets and experiments are per user. Use **Sign-Out** when finished.

## Troubleshooting

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| Microsoft button disabled / “not configured” | Missing `NEXT_PUBLIC_AZURE_AD_*` | Fill `.env.local` and restart Next |
| MSAL popup errors | Redirect URI / SPA platform missing | Add `http://localhost:3000` in Entra |
| Exchange / microsoft 401 | Wrong API scope or API `AzureAd` mismatch | Align scope with core App Service `AzureAd` |
| Signup conflict | Email already registered | Sign in instead |
| Immediate redirect to login | Missing/expired/revoked LocalJwt | Sign in again |
| Network / rewrite errors | Nest down or wrong `DASHBOARD_BFF_URL` | Start Nest (`npm run start:dev` in `backend`) |
| CORS errors | Calling Azure host from the browser | Use `/api` rewrite only |

## Related

- Dataset and experiment notes: [`INTEGRATION.md`](./INTEGRATION.md)
- API samples: `core-wa1-api/Http/auth.http`
