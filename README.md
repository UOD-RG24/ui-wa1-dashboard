# Multi Omics Dashboard

Authenticated Next.js control surface for the hosted mRNA + CNA + AJCC preprocessing, integration and digital-twin pipeline. Live core API data is the default; isolated fixtures remain at `/?mode=demo`.

From this repository:

```sh
npm install
npm install --prefix frontend
npm run dev
```

The production and default development path starts only Next.js on port 3000. Configure Auth.js and the core API with [`frontend/.env.example`](frontend/.env.example). `npm run build` and `npm start` build/serve only the frontend.

The Nest project is a retained sandbox and is not installed, built or started by production workflows. Its explicit diagnostic commands are `dev:nest-sandbox`, `build:nest-sandbox` and `start:nest-sandbox`; it is not a pipeline backend.

Read the [dashboard guide](docs/dashboard-guide.md) for authentication, the select-or-upload workflow, run monitoring, demo isolation, configuration and tests. Read frontend [AGENTS.md](frontend/AGENTS.md) and the installed framework documentation before frontend code changes.

- [Biological project overview](../docs/project-overview.md)
- [Implemented architecture](../docs/engineering/architecture.md)
- [Dashboard/cloud resources](../docs/azure/setup.md)
- [Working end-to-end demo](../docs/demo-runbook.md)
