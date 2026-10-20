# Genome dashboard frontend

Next.js/React dashboard with the existing workspace at `/` and the authenticated hosted pipeline at `/pipeline`. Pipeline fixtures are isolated behind `/pipeline?mode=demo`.

## Local development

From this directory:

```sh
npm install
npm run lint
npm test
npm run dev
```

Copy [`.env.example`](.env.example) to a private local environment file. Default address: `http://localhost:3000`. `npm run build` creates the production build and `npm start` serves it. `npm run test:e2e` runs the Auth.js/pipeline acceptance flow against the bundled mock core API after Playwright Chromium is installed.

Start with [auth.ts](auth.ts), [app/api/core](app/api/core), [app/PipelineHome.tsx](app/PipelineHome.tsx), and [LiveExperimentPage](app/views/live/LiveExperimentPage.tsx). Follow [AGENTS.md](AGENTS.md) and the installed Next.js documentation before code changes. The hosted pipeline core API is the separate .NET service.

- [Dashboard behavior and source map](../docs/dashboard-guide.md)
- [Customer-facing biological overview](../../docs/project-overview.md)
- [Implemented architecture](../../docs/engineering/architecture.md)
- [Current API and data contracts](../../docs/engineering/data-and-api-contracts.md)
- [Azure dashboard and pipeline setup](../../docs/azure/setup.md)
- [Complete runnable demonstration](../../docs/demo-runbook.md)
