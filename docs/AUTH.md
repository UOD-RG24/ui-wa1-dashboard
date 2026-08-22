# Authentication

How JWT auth works in the Multi Omics Dashboard, and how teammates should use it.

## Architecture

The dashboard never talks to MongoDB or JWT signing secrets directly.

1. The browser calls same-origin paths under `/api/...`.
2. Next.js rewrites those requests to `core-wa1-api` (see `frontend/next.config.ts` and `API_UPSTREAM_URL`).
3. The API issues and validates JWTs.
4. The dashboard stores the returned `accessToken` in `localStorage` and sends it as:

```http
Authorization: Bearer <accessToken>
```

Relevant frontend helpers:

- `frontend/app/lib/apiClient.ts` — authenticated `fetch`
- `frontend/app/lib/authStorage.ts` — token / user persistence
- `frontend/app/lib/api.ts` — auth endpoints
- `frontend/app/components/auth/AuthGate.tsx` — session guard on `/`

## Auth mode (current)

**JWT email/password only.**

| Action | Method | Path |
|--------|--------|------|
| Sign up | `POST` | `/auth/jwt/signup` |
| Sign in | `POST` | `/auth/jwt/signin` |
| Status | `GET` | `/auth/status` |
| Sign out | `POST` | `/auth/signout` |

Sign-in response includes `accessToken` and a `user` object (`id`, `firstName`, `lastName`, `email`, `role`, …).

Microsoft/Entra endpoints exist on `core-wa1-api` but are **not wired** in the dashboard. The login Microsoft button is disabled.

## Session lifecycle

1. User signs up (optional) then signs in.
2. Dashboard stores `accessToken` (and user snapshot) in `localStorage`.
3. Protected pages load inside `AuthGate`, which calls `GET /auth/status`.
4. If status fails or token is missing → redirect to `/login` and clear storage.
5. Sign-out calls `POST /auth/signout` (API revokes the token JTI), then clears local storage and redirects to `/login`.
6. Any authenticated `401` also clears the session and sends the user to `/login`.

## How teammates use it

### In the UI

1. Open the deployed dashboard, or run locally:

```bash
cd frontend
npm install
npm run dev
```

2. Open the login page.
3. Choose **Sign up** once with first name, last name, email, and password (min 8 characters).
4. Sign in with the same email/password.
5. You land on the dashboard. Datasets and experiments are **per user** (scoped by API `userId`).
6. Use **Sign-Out** when finished. Do not share tokens.

### API-only testing (no UI)

Use the `.http` samples in `core-wa1-api/Http/`:

1. Set `@host` to the Azure API base URL (or local HTTPS port).
2. Run signup, then signin.
3. Copy `accessToken` into subsequent dataset/experiment requests as:

```http
Authorization: Bearer {{signin.response.body.$.accessToken}}
```

## Environment / config

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Browser | Usually `/api` (same-origin) |
| `API_UPSTREAM_URL` | Next server | Upstream `core-wa1-api` base URL (no trailing slash) |

Example:

```env
NEXT_PUBLIC_API_BASE_URL=/api
API_UPSTREAM_URL=https://rg24-rg1-wa1-api.azurewebsites.net
```

Copy `frontend/.env.local.example` to `frontend/.env.local` when present, then restart `npm run dev` after changing rewrite env vars.

## Troubleshooting

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| Signup returns conflict | Email already registered | Sign in instead, or use another email |
| Sign-in unauthorized | Wrong password or Microsoft-only account | Check password; create a JWT account via signup |
| Immediate redirect to login | Missing/expired/revoked token | Sign in again |
| Network / rewrite errors | Upstream URL wrong or API down | Check `API_UPSTREAM_URL` and Azure app health |
| CORS errors in browser | Calling Azure host directly from the browser | Use `/api` rewrite (same-origin) instead of the raw Azure URL |

## Related

- Dataset and experiment integration notes: [`INTEGRATION.md`](./INTEGRATION.md) (added once those screens are wired)
- API samples: `core-wa1-api/Http/auth.http`
