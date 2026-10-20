# Dashboard backend scaffold

Nest application scaffold. [app.service.ts](src/app.service.ts) currently returns Hello World; this backend does not implement the authenticated dataset/experiment API or the complete preprocessing workflow. Those operations belong to the separate .NET core API and local runner.

## Local development

From this directory:

```sh
npm install
npm run start:dev
```

Port defaults to **3001**, overridden by `PORT`. `FRONTEND_URL` controls the CORS origin and defaults to `http://localhost:3000`. See [main.ts](src/main.ts). `npm run build` builds it and `npm run start:prod` serves the build; `npm test` runs the scaffold tests.

The root dashboard script can start both projects; see [dashboard README](../README.md).

- [Actual code ownership](../../docs/engineering/code-map.md)
- [Implemented architecture](../../docs/engineering/architecture.md)
- [API/cloud setup](../../docs/azure/setup.md)
- [Complete Azure demonstration](../../docs/demo-runbook.md)
