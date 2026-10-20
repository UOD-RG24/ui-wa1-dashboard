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

Configure the existing workspace according to the [auth docs](./docs/AUTH.md) and the hosted pipeline with [`frontend/.env.example`](./frontend/.env.example).

## Hosted pipeline

The fixed 13-stage Azure pipeline is available at `/pipeline` on the same dashboard deployment. It uses Auth.js and the .NET core API, with a separate `/pipeline/login` sign-in and an isolated `/pipeline?mode=demo` fixture preview. The existing workspace at `/` remains available. See the [hosted pipeline guide](./docs/dashboard-guide.md) for configuration, reviewer checks and replay behavior.
