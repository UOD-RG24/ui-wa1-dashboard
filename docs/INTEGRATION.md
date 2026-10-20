# API integration

How the Multi Omics Dashboard talks to `core-wa1-api` through the Nest BFF.

## Proxy

```
Browser → /api/* → Next rewrite (DASHBOARD_BFF_URL) → Nest BFF → CORE_API_URL (core-wa1-api)
```

Locally, `DASHBOARD_BFF_URL` defaults to `http://127.0.0.1:3001`.
Until Nest is deployed, production may rewrite directly to `core-wa1-api` (same resource paths).

Nested experiment routes (multi-omics and digital twins, including `PATCH`) are forwarded by the Nest experiments catch-all.

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
| Experiments | List, select, create; multi-omics wizard |
| Digital twins | Feature extract → DTDL → generate twins → extract/generate relationships → live React Flow graph, inspect, PATCH, DELETE, export |

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
| Blob metadata | `GET` | `/experiments/get/{id}/blobs/get/{blobId}` |

The experiment document now includes `datasetIds` and `blobIds`. `blobIds` is written on experiment blob upload. **Create/update still do not accept `datasetIds`**, so the Experiment page dataset dropdown remains local-only.

### Digital twin endpoints

Prefix: `/experiments/get/{experimentId}/digital-twins/`

| Action | Method | Path |
|--------|--------|------|
| Extract features | `POST` / `GET` | `extract-features/{generate\|get}` |
| Patient DTDL | `POST` / `GET` / `DELETE` | `patient-dtdl/{generate\|get\|delete}` |
| Generate twins | `POST` | `patient-twins/generate` |
| List twins | `GET` | `patient-twins/get/all/{cache\|live}` |
| One twin | `GET` / `PATCH` / `DELETE` | `patient-twins/get/twin/{patientId}` (+ `/update`, `/delete`) |
| Delete all twins | `DELETE` | `patient-twins/delete-all` |
| Export twins | `POST` | `patient-twins/export/live` |
| Twin relationships | `GET` | `patient-twins/get/twin/{id}/relationships/{incoming\|outgoing\|all}` |
| Extract pairs | `POST` | `patient-relationships/extract` |
| Cached / live pairs | `GET` | `patient-relationships/get/{processedBlobId}/{cache\|live}` |
| Generate / delete named | `POST` / `DELETE` | `.../generate\|delete/{relationshipName}/max/{max}` |
| One relationship | `GET` / `PATCH` / `DELETE` | `patient-relationships/get/{sourceTwinId}/{relationshipId}` |
| Export relationships | `POST` | `patient-relationships/export/live` |

Digital-twin generate calls take `datasetId` in the JSON body (same pattern as multi-omics). Twins consume final-selected matrix blobs from the multi-omics step.

Core `89a7cb1` streams experiment blob uploads without double-buffering. Dashboard upload size limits were already raised. Large (~252MB) uploads still require that commit on the **deployed** Azure API.

## Still mock / local-only

- Omics layer matrix previews and heatmaps on the dataset page
- Experiment ↔ dataset linking cannot be persisted (create/update have no `datasetIds`)

## Frontend helpers

- `frontend/app/lib/api.ts` — auth / datasets / experiments wrappers
- `frontend/app/lib/multiOmicsApi.ts` — blobs + multi-omics
- `frontend/app/lib/digitalTwinsApi.ts` — digital twins
- `frontend/app/lib/apiTypes.ts` — response shapes
- `frontend/app/lib/mappers.ts` — API → dashboard view models
- `frontend/app/lib/msal.ts` — Microsoft login token acquisition
- `frontend/app/page.tsx` — loads lists and wires create / upload / ops
- `backend/src/*` — Nest BFF controllers / `CoreApiService`

## Teammate checklist

1. Copy env examples and set `CORE_API_URL` + Azure AD public vars (see [AUTH.md](./AUTH.md)).
2. From repo root: `npm install && npm run dev` (starts Nest + Next).
3. Sign up / sign in on `/login` (JWT or Microsoft when configured), then use **Upload dataset** and **New experiment**.
4. Run multi-omics through **final matrix**, then open **Twins** to generate the patient graph.
