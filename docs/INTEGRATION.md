# API integration

How the Multi Omics Dashboard talks to `core-wa1-api` through the Nest BFF.

## Proxy

```
Browser → /api/* → Next rewrite (DASHBOARD_BFF_URL) → Nest BFF → CORE_API_URL (core-wa1-api)
```

Locally, `DASHBOARD_BFF_URL` defaults to `http://127.0.0.1:3001`.  
Until Nest is deployed, production may rewrite directly to `core-wa1-api` (same resource paths).

| Env var | Where | Role |
|---------|-------|------|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Client base path (`/api`) |
| `DASHBOARD_BFF_URL` | Next server | Nest BFF (or core API in production fallback) |
| `CORE_API_URL` | Nest | Upstream ASP.NET Core API |

See `frontend/next.config.ts`, `backend/.env.example`, and [AUTH.md](./AUTH.md).

## Surfaces wired today

| Area | Behaviour |
|------|-----------|
| Auth | JWT signup / signin / status / signout |
| Microsoft SSO | Browser MSAL → Nest exchange (or core microsoft endpoints) → LocalJwt |
| Profile | Name, email, role from `/auth/status` `user` |
| Datasets | List, detail metadata, multipart upload, rename, download, delete |
| Experiments | List, select, create; workflow panels from section statuses |

### Dataset endpoints

| Action | Method | Path |
|--------|--------|------|
| List | `GET` | `/datasets/get/list` |
| Get | `GET` | `/datasets/get/{id}` |
| Create | `POST` | `/datasets/create` (multipart: `Name`, `Description`, `OmicsType`, `File`) |
| Update | `PUT` | `/datasets/update/{id}` |
| Download | `GET` | `/datasets/download/{id}` |
| Delete | `DELETE` | `/datasets/delete/{id}` |

### Experiment endpoints

| Action | Method | Path |
|--------|--------|------|
| List | `GET` | `/experiments/get/list` |
| Get | `GET` | `/experiments/get/{id}` |
| Create | `POST` | `/experiments/create` |
| Soft delete | `DELETE` | `/experiments/delete/{id}` |

Workflow UI maps these section objects when present: `preprocessing`, `multiOmicsIntegration`, `training`, `evaluation`, `digitalTwin`.

## Still mock / local-only

- Omics layer matrix previews and heatmaps on the dataset page
- Digital twin React Flow graph (patient nodes)
- Experiment ↔ dataset linking (API has no `datasetId` yet; the select box is UI-only)

## Frontend helpers

- `frontend/app/lib/api.ts` — endpoint wrappers
- `frontend/app/lib/apiTypes.ts` — response shapes
- `frontend/app/lib/mappers.ts` — API → dashboard view models
- `frontend/app/lib/msal.ts` — Microsoft login token acquisition
- `frontend/app/page.tsx` — loads lists and wires create / upload / ops
- `backend/src/*` — Nest BFF controllers / `CoreApiService`

## Teammate checklist

1. Copy env examples and set `CORE_API_URL` + Azure AD public vars (see [AUTH.md](./AUTH.md)).
2. From repo root: `npm install && npm run dev` (starts Nest + Next).
3. Sign up / sign in on `/login` (JWT or Microsoft when configured), then use **Upload dataset** and **New experiment**.
