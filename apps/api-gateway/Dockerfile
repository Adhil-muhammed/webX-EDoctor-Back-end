FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api-gateway/package.json apps/api-gateway/package.json
COPY packages/common/package.json packages/common/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/event-bus/package.json packages/event-bus/package.json
RUN pnpm install --filter @ente-doctor/api-gateway... --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @ente-doctor/api-gateway build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /workspace ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@ente-doctor/api-gateway", "start"]
