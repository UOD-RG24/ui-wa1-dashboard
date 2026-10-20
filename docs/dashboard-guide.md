# Multi Omics Dashboard guide

The dashboard is the authenticated entry point for the fixed mRNA + CNA + AJCC digital-twin pipeline. Live core API records are the default. The earlier fixture experience remains available only at `/?mode=demo`, carries a persistent **Demo data** banner, and never mixes fixture and live records.

The production execution path is Next.js → `core-wa1-api` → a manually triggered Azure Container Apps Job. The Nest project is a retained scaffold and is outside the runtime and production startup path.

## Routes and authentication

| Route | Behaviour |
| --- | --- |
| `/` | Authenticated live experiments, datasets, pipeline runs and run-scoped twins |
| `/?mode=demo` | Isolated, non-persistent fixtures; it cannot start a live pipeline |
| `/login` | Microsoft Entra sign-in in deployed environments; local credentials only in explicit development mode |
| `/api/auth/[...nextauth]` | Auth.js handlers |
| `/api/core/...` | Explicit allowlisted server-side proxy routes to `core-wa1-api` |

Microsoft access tokens are exchanged through the core API's Microsoft status/sign-up/sign-in endpoints. The returned core API token is stored only inside the encrypted HTTP-only Auth.js JWT cookie and is decoded only by server route handlers. It is not added to the browser session object or returned to client code.

Local email/password is available only when `NODE_ENV` is not `production` and `ALLOW_LOCAL_AUTH=true`. Every `/api/core` route independently requires a valid Auth.js token; the page redirect in `proxy.ts` is an additional user-experience guard, not the authorization boundary.

## Run a live pipeline

1. Sign in and select an owned experiment, or create one from the experiment panel.
2. Fill the three input slots: mRNA, CNA and clinical. Each slot can select an existing owned dataset or stream a new multipart CSV/TSV upload through the dashboard server to the core API.
3. Review validation. Inputs must be active, owner-scoped, SHA-256 recorded CSV/TSV datasets whose `omicsType` matches the slot.
4. Review the read-only `pipeline-recipe/1.0` recipe and confirm the files contain de-identified research data.
5. Start the pipeline. The dashboard supplies an idempotency key and the immutable `tcga-mrna-cna-ajcc/1.0` request.
6. Keep the page open or return later. The dashboard polls only while the run is `queued`, `running`, or `cancellationRequested`.
7. Cancel at a safe boundary, resume a retryable failed/cancelled run, or use **Verify immutable replay** on a successful run. Inputs and recipe remain unchanged on retry; changed inputs require a new run.

The required file contract is:

- mRNA and CNA: CSV/TSV wide matrices with `patient_id` and TCGA-compatible identifiers;
- clinical: exactly `patient_id,ajccPathologicStage,partition`;
- `partition`: `train` or `heldout`, one assignment per retained patient, with both groups non-empty;
- mRNA scale: `LOG2-VALUE`; CNA scale: `discreteCopyNumber`.

Invalid ownership, roles, formats and hashes fail at run acceptance. Matrix/clinical parsing fails in the Uploads/early preprocessing boundary. Scientific feasibility failures remain attached to FA5 or FA4 with a safe error and optional trace ID.

## Status and results

The live stage list is fixed and ordered:

1. Uploads
2. FA3
3. FA2
4. FA1
5. FA5
6. FA4
7. FA6
8. Handoff Import
9. Design Matrices
10. SGCCA
11. Final Matrices
12. Digital Twins
13. Live Verification

Training/Evaluation are not displayed as completed stages because predictive ML training and evaluation are outside this accepted pipeline.

After success, the dashboard calls the run-scoped twins endpoint. The core API reads only twin IDs and relationship IDs recorded by that run and verifies them live in Azure Digital Twins. The graph shows actual twin properties, selected feature values and recorded relationships. The fixture-only risk signal, training weight and gene-focus claims never appear in live mode.

## Demo mode

Open `/?mode=demo` to show the original fixture experiments, dataset previews, illustrative graph and profile. The banner remains visible while fixtures are active and links back to live mode. Demo mode does not call the live list endpoints and live mode does not import `dashboard.json` records into its lists.

The dormant overview, patient, omics, cluster and agent prototype components are still not reachable. They are not accepted live features.

## Server API allowlist

The dashboard exposes only these core operations:

- dataset list and multipart create;
- experiment list and create;
- authenticated profile status;
- run list, start, get, cancel and retry;
- run-scoped live twin results.

There is no generic proxy and no caller-supplied upstream URL. Dataset request bodies are forwarded as streams without converting the file to an in-memory `FormData` object in the Next route handler.

## Configuration

Copy [`frontend/.env.example`](../frontend/.env.example) to a private local environment file. Required deployed settings are:

```text
AUTH_SECRET
AUTH_MICROSOFT_ENTRA_ID_ID
AUTH_MICROSOFT_ENTRA_ID_SECRET
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
AUTH_MICROSOFT_ENTRA_ID_SCOPE
CORE_API_BASE_URL
```

The Entra scope must produce an access token accepted by the core API. Set `AUTH_MICROSOFT_ENTRA_ID_SCOPE` to `openid profile email api://<core-api-app-client-id>/access_as_user`, using the API registration's actual application ID URI. Add the deployed Auth.js callback URL (`/api/auth/callback/microsoft-entra-id`) to the dashboard Entra application. Use HTTPS for `CORE_API_BASE_URL` in production.

For local JWT development:

```sh
cd frontend
ALLOW_LOCAL_AUTH=true \
AUTH_SECRET='replace-with-a-long-random-secret' \
CORE_API_BASE_URL='https://localhost:7110' \
npm run dev
```

## Checks

From `frontend/`:

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The component suite covers authentication-mode visibility, demo isolation and the three validated slots. Playwright starts a self-contained mock core API and covers local JWT sign-in, selection, confirmation, successful polling, live graph rendering, sign-out and demo/live isolation.

## Source map

| Area | Source |
| --- | --- |
| Auth.js and Microsoft/core exchange | `frontend/auth.ts` |
| Page redirect guard | `frontend/proxy.ts` |
| Core token decode and upstream forwarding | `frontend/app/lib/coreApi.server.ts` |
| Allowlisted routes | `frontend/app/api/core/` |
| Live/fixture mode selection | `frontend/app/page.tsx` |
| Three-slot run workflow and live graph | `frontend/app/views/live/LiveExperimentPage.tsx` |
| Live dataset/profile views | `frontend/app/views/live/` |
| Isolated fixture views | `frontend/app/views/ExperimentPage.tsx`, `DatasetsPage.tsx`, `ProfilePage.tsx` |
| Component and browser tests | `frontend/tests/` |

## Release boundary

This release is for authenticated researchers working with de-identified TCGA-style data. It is not approved for identifiable clinical data. Private ingress and service-to-service authentication for the FA/intermediate services remain a production clinical-use gate. The dashboard never receives Blob paths, worker credentials, storage connection details or raw matrix contents from the run API.
