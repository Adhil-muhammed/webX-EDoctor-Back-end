# Ente Doctor Backend

Ente Doctor is a healthcare platform backend organized as a pnpm monorepo with deployable NestJS-style services and shared internal packages.

## Workspace Layout

```text
apps/
  api-gateway/
  auth-service/
  provider-service/
  booking-service/
  search-service/
  notification-service/
packages/
  common/
  contracts/
  event-bus/
```

## Local Development

```bash
pnpm install
pnpm docker:up
pnpm dev
```

## Useful Commands

```bash
pnpm build
pnpm lint
pnpm test
pnpm docker:down
```

## Internal Package References

Workspace packages are referenced through the pnpm `workspace:*` protocol. For example, `apps/booking-service/package.json` depends on:

```json
{
  "@ente-doctor/common": "workspace:*",
  "@ente-doctor/contracts": "workspace:*",
  "@ente-doctor/event-bus": "workspace:*"
}
```
