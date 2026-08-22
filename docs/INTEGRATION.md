# API integration

How the Multi Omics Dashboard talks to `core-wa1-api`.

## Proxy

Browsers call same-origin `/api/*`. Next.js rewrites those paths to `API_UPSTREAM_URL` (default deployed API: `https://rg24-rg1-wa1-api.azurewebsites.net`).

| Env var | Role |
|---------|------|
| `NEXT_PUBLIC_API_BASE_URL` | Client base path (use `/api`) |
| `API_UPSTREAM_URL` | Upstream ASP.NET Core API origin |

See `frontend/next.config.ts` and `docs/AUTH.md`.

## Surfaces wired today

| Area | Behaviour |
|------|-----------|
| Auth | JWT signup / signin / status / signout — see [AUTH.md](./AUTH.md) |
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
- Microsoft / Entra sign-in

## Frontend helpers

- `frontend/app/lib/api.ts` — endpoint wrappers
- `frontend/app/lib/apiTypes.ts` — response shapes
- `frontend/app/lib/mappers.ts` — API → dashboard view models
- `frontend/app/page.tsx` — loads lists and wires create / upload / ops

## Teammate checklist

1. Run `core-wa1-api` locally **or** point `API_UPSTREAM_URL` at the Azure app.
2. In `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=/api
API_UPSTREAM_URL=https://rg24-rg1-wa1-api.azurewebsites.net
```

3. `cd frontend && npm install && npm run dev`
4. Sign up / sign in on `/login`, then use **Upload dataset** and **New experiment** in the sidebar.
