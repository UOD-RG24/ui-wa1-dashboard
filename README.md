# Multi Omics Dashboard

Next.js frontend and NestJS stub backend for the RG24 WA1 workspace.

## Docs

- [Authentication](./docs/AUTH.md) — JWT setup and how teammates sign in
- [API integration](./docs/INTEGRATION.md) — datasets, experiments, and proxy wiring

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Configure API routing with `NEXT_PUBLIC_API_BASE_URL` and `API_UPSTREAM_URL` (see [auth docs](./docs/AUTH.md)).
