# Ente Doctor Backend — Developer Instruction Guide

> This guide is the authoritative reference for all development, code generation, testing, and contribution work inside this repository. All instructions are prescriptive. Follow them exactly.

---

## Repository Summary

- **Language:** TypeScript 5.7+, targeting ES2023 with `NodeNext` module resolution.
- **Runtime:** Node.js 22 (Alpine). No `.nvmrc` is committed; use Node 22 as the canonical version.
- **Framework:** NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/microservices`, `@nestjs/platform-express`).
- **Monorepo Orchestration:** `pnpm` workspaces (`pnpm@10.0.0`). There is **no Nx, Turborepo, or Lerna**. All cross-workspace orchestration is handled through `pnpm --filter` and `pnpm -r`.
- **Package manager:** pnpm 10 only. Never use `npm` or `yarn` inside this repository.
- **Messaging:** Apache Kafka via `kafkajs` (Apache Kafka `apache/kafka` in local Docker). No gRPC or proto files exist.
- **Databases:** PostgreSQL 16 — one isolated instance per domain service (5 total), provisioned by Docker Compose on ports 5433–5437.
- **Caching / Session:** Redis 7 on port 6379.
- **Local Infrastructure:** All managed via `docker-compose.yml` at the repository root.
- **Internal packages:** `@ente-doctor/common`, `@ente-doctor/contracts`, `@ente-doctor/event-bus` — referenced via `workspace:*` protocol.
- **TypeScript compiler flags enforced:** `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `experimentalDecorators`, `emitDecoratorMetadata`.

---

## Build & Validation Commands

### Initial Setup

Must run this exact sequence immediately after a fresh clone:

```bash
pnpm install
pnpm docker:up
```

Wait for all Docker healthchecks to pass before starting services. Verify with:

```bash
pnpm docker:logs
```

### Compile and Build

**Full workspace build (all apps and packages):**

```bash
pnpm build
```

This runs `tsc` for every package under `@ente-doctor/*` using `pnpm -r`.

**Build a single app or package:**

```bash
pnpm --filter @ente-doctor/booking-service build
pnpm --filter @ente-doctor/common build
```

**Type-check without emitting (lint mode for packages):**

```bash
pnpm --filter @ente-doctor/common lint
```

Packages use `tsc --noEmit` as their `lint` script, not eslint.

**Clean all build artifacts:**

```bash
pnpm clean
```

**Clean a single service:**

```bash
pnpm --filter @ente-doctor/booking-service clean
```

### Local Development

**Run all services in parallel (watch mode via `tsx watch`):**

```bash
pnpm dev
```

This starts `api-gateway` and all `*-service` apps simultaneously. Each app reloads on source changes.

**Run a single service in watch mode:**

```bash
pnpm --filter @ente-doctor/booking-service start:dev
```

**Run a built service (production mode):**

```bash
pnpm --filter @ente-doctor/booking-service start
```

### Testing

**No test suite is implemented yet.** All `test` scripts are placeholder `echo` stubs. Running `pnpm test` emits informational messages only — it does not fail.

When tests are eventually added, the convention for running them will be:

```bash
# Full workspace
pnpm test

# Single service
pnpm --filter @ente-doctor/booking-service test
```

The test framework to adopt is **Jest with `ts-jest`**. Refer to the Testing Conventions section for the expected setup shape.

### Quality and Formatting

**Lint the full workspace (ESLint + type-checking):**

```bash
pnpm lint
```

**Lint a single service:**

```bash
pnpm --filter @ente-doctor/api-gateway lint
```

Must run `pnpm lint` and resolve all errors before committing any change. Warnings on `@typescript-eslint/no-floating-promises` and `@typescript-eslint/no-unsafe-argument` must be addressed or explicitly suppressed with a justifying comment.

There is **no pre-commit hook** (no Husky, no lint-staged). Manual lint execution is mandatory.

---

## Project Structure

```
ente-doctor-backend/
├── apps/
│   ├── api-gateway/          # HTTP gateway, port 3000
│   ├── auth-service/         # Phone/OTP auth, port 3001
│   ├── provider-service/     # Doctor profiles & slots, port 3002
│   ├── booking-service/      # Appointments & cancellations, port 3003
│   ├── search-service/       # Hyperlocal/specialty search, port 3004
│   └── notification-service/ # WhatsApp/SMS async worker, port 3005
├── packages/
│   ├── common/               # Logger interface, DomainError
│   ├── contracts/            # Cross-service DTOs, refs, localization
│   └── event-bus/            # Kafka topic constants, event envelopes
├── docker-compose.yml        # Local infra only (Postgres ×5, Redis, Kafka, Kafka UI)
├── eslint.config.mjs         # ESLint flat config (typescript-eslint + prettier)
├── .prettierrc               # Prettier rules
├── tsconfig.json             # Root TypeScript config (all services extend this)
├── tsconfig.build.json       # Build config (excludes spec files)
├── pnpm-workspace.yaml       # Workspace package globs
├── package.json              # Root scripts (build, dev, lint, test, docker:*)
└── init-workspace.sh         # Scaffolding helper
```

### Inside Each App

Every service under `apps/` has an identical top-level layout:

```
apps/<service>/
├── Dockerfile                # Multi-stage, node:22-alpine, pnpm filtered install
├── package.json              # Service manifest (@ente-doctor/<service>)
├── tsconfig.json             # Extends ../../tsconfig.json
└── src/
    ├── main.ts               # Bootstrap: NestFactory.create + ConfigService port
    ├── app.ts                # Inline @Module class + createXModule() factory
    ├── config/
    │   └── database.config.ts # process.env.DATABASE_URL + per-service default
    ├── domain/
    │   ├── entities/          # Pure TypeScript classes/interfaces/types
    │   └── use-cases/         # Command interfaces + use case handler classes
    ├── entrypoints/
    │   ├── http/              # NestJS @Controller classes (HTTP adapters)
    │   └── event-consumers/   # Kafka consumer handler classes
    └── infrastructure/
        ├── database/          # Model interfaces + Repository classes
        └── external-services/ # Adapter classes for third-party integrations
```

### Archetypes

**Standard scaffold services** (`api-gateway`, `auth-service`, `provider-service`, `search-service`, `notification-service`):

- Contain a single `<service-name>.entity.ts`, a single use-case file, a single model + repository, a single HTTP health controller, and a single event consumer.
- Domain and infrastructure files are named after the service (`auth-service.entity.ts`, etc.).
- These are skeleton starting points. Business logic has not been implemented.

**Advanced domain service** (`booking-service`):

- Contains two entity files: `booking.entity.ts` (the `Booking` aggregate root with `BookingStatus`) and `booking-service.entity.ts` (scaffold entity).
- Contains three use-case files: `booking-service.use-case.ts`, `create-booking.use-case.ts`, `cancel-booking.use-case.ts`.
- Contains two repositories: `booking.repository.ts` and `booking-service.repository.ts`.
- Contains two HTTP controllers: `booking-service.controller.ts` (health, registered in module) and `booking.controller.ts` (`POST /bookings`, **not yet registered in the module**).
- Contains two event consumers: `booking-service.consumer.ts` and `provider-leave.consumer.ts`.
- Contains two adapters: `booking-service.adapter.ts` and `qr-generator.adapter.ts`.
- Use `booking-service` as the canonical architectural reference when generating new domain logic.

---

## System Architecture & Dependency Rules

The architecture enforces **Hexagonal Architecture (Ports & Adapters)** within each service. The domain is the innermost layer with no outward dependencies. All external concerns adapt inward through explicit interfaces.

### Layer Hierarchy

```
┌─────────────────────────────────────────────┐
│            entrypoints/http/                │  HTTP Controllers (NestJS @Controller)
│         entrypoints/event-consumers/        │  Kafka Consumers
├─────────────────────────────────────────────┤
│               domain/use-cases/             │  Command interfaces + Use case handlers
├─────────────────────────────────────────────┤
│               domain/entities/              │  Aggregate roots, value objects, enums
├─────────────────────────────────────────────┤
│            infrastructure/database/         │  Model interfaces + Repository impls
│         infrastructure/external-services/   │  Third-party adapter classes
├─────────────────────────────────────────────┤
│              packages/common                │  Logger, DomainError
│             packages/contracts              │  Shared DTOs, refs, localization
│             packages/event-bus              │  Event topics, event envelope types
└─────────────────────────────────────────────┘
```

### Inward Dependency Boundaries

**Permitted import paths:**

- `entrypoints/http/` → `domain/use-cases/`, `domain/entities/`, `@ente-doctor/contracts`
- `entrypoints/event-consumers/` → `domain/use-cases/`, `domain/entities/`, `@ente-doctor/event-bus`
- `domain/use-cases/` → `domain/entities/`, `@ente-doctor/common`, `@ente-doctor/contracts`
- `domain/entities/` → `@ente-doctor/common`, `@ente-doctor/contracts` (for shared value types only)
- `infrastructure/database/` → `domain/entities/` (to import entity types for model definition), `@ente-doctor/common`
- `infrastructure/external-services/` → `domain/entities/`, `@ente-doctor/contracts`, `@ente-doctor/event-bus`
- `config/` → no internal imports; reads only from `process.env`
- `app.ts` → `entrypoints/http/` (to register controllers in `@Module`), `config/`
- `main.ts` → `app.ts`, `@nestjs/core`, `@nestjs/config`

**Absolutely forbidden imports:**

- `domain/` must never import from `infrastructure/`, `entrypoints/`, or `app.ts`.
- `domain/entities/` must never import NestJS decorators (`@nestjs/common`, etc.).
- `domain/use-cases/` must never import NestJS decorators or infrastructure classes directly.
- `infrastructure/` must never import from `entrypoints/`.
- `packages/common` must never import from any `apps/` service.
- `packages/contracts` must never import from `packages/event-bus` or vice versa.
- `packages/event-bus` must never import application or domain service code.
- Cross-service imports between `apps/` are strictly forbidden. Services communicate only via Kafka events using types from `@ente-doctor/event-bus`.

### Core Code Generation Principles

- **Domain integrity:** Domain entities must be pure TypeScript classes with private `props` and public getter methods. No ORM decorators, no NestJS decorators, no I/O logic inside entities.
- **Use case isolation:** Every use case must accept a typed `Command` interface as its input and return `Promise<void>` or a typed result. Use cases must not import repositories directly — inject them via constructor parameters using interface types.
- **Repository abstraction:** Define a repository interface inside `domain/` (or `domain/use-cases/`) and implement it in `infrastructure/database/`. The use case depends on the interface, not the class.
- **Model vs Entity separation:** `infrastructure/database/*.model.ts` holds the persistence shape (including `createdAt`, `updatedAt`). `domain/entities/*.entity.ts` holds the business object. Import domain types into models; never the reverse direction (infra-to-domain import of types is the one permitted crossing — models may import entity types for type reuse).
- **Event publishing:** Must use `@ente-doctor/event-bus` constants (`EventTopics`) for all Kafka topic strings. Never hardcode a topic string inline.
- **Configuration:** All environment variables must be accessed through `ConfigService` from `@nestjs/config` inside NestJS providers. Access via `process.env` directly is only permitted in `config/*.config.ts` files.
- **Module registration:** Domain classes, repositories, and adapters are not registered in the Nest DI container yet. When wiring them up, add them as `providers` in `app.ts` — do not create separate `*.module.ts` files. The module is always inline in `app.ts`.

---

## Code Style & Guardrails

**TypeScript:**

- `strict` mode is on. No `any` typed variables. The ESLint rule `no-explicit-any` is set to `off` as an escape hatch but must not be abused.
- `noUncheckedIndexedAccess` is on. Always guard array and object index accesses.
- `noImplicitOverride` is on. Use the `override` keyword when overriding methods.
- All async functions that return `Promise` must be `await`ed or explicitly `.catch()`-ed. The `no-floating-promises` rule is active.
- Never use `as unknown as T` casts without a code comment explaining why.

**Naming:**

- Files: `kebab-case` matching the class they export (e.g., `create-booking.use-case.ts`, `booking.repository.ts`).
- Classes: `PascalCase` (e.g., `CreateBookingUseCase`, `BookingRepository`).
- Interfaces: `PascalCase` without an `I` prefix (e.g., `BookingProps`, not `IBookingProps`).
- Constants: `camelCase` for `const` objects (e.g., `EventTopics`, `databaseConfig`).
- Kafka topics: dot-separated lowercase strings defined only in `@ente-doctor/event-bus` (e.g., `'appointment.created'`).

**Banned patterns:**

- Never call `console.log` directly in service code. Use the `Logger` interface from `@ente-doctor/common`.
- Never use `eval()`.
- Never hardcode database URLs or secrets inline. Always use `process.env` only inside `config/*.config.ts`.
- Never import from `dist/` paths within the monorepo. Always use the `workspace:*` package alias or TypeScript path aliases.
- Never create `*.module.ts` files. Modules are inline in `app.ts`.
- Never register controllers, repositories, or use-case classes that are unimplemented stubs in the Nest `@Module` until their logic is complete.

**Dependencies:**

- Use `workspace:*` for all internal package references.
- Never pin a `devDependency` to a patch version manually. Let `pnpm add -D <pkg>` resolve the latest compatible version.
- Never add a third-party package for a need already satisfied by an internal package (`@ente-doctor/common` for logging/errors, `@ente-doctor/contracts` for DTOs, `@ente-doctor/event-bus` for Kafka topics).
- Install dependencies at the app level (`pnpm --filter @ente-doctor/<app> add <pkg>`), not at the root.
- Root `devDependencies` are limited to workspace-wide tooling: `typescript`, `prettier`, `@types/node`, `tsx`.

**Formatting:**

- Single quotes for strings.
- Trailing commas in all multi-line structures.
- These are enforced by `.prettierrc` and the `prettier/prettier` ESLint rule (error severity).
- Line endings are auto-normalized (`endOfLine: "auto"` in the ESLint Prettier rule).

---

## Commit Message Format

No commitlint or Husky configuration is currently active. Use the following Conventional Commits format as the mandated convention — it will be enforced by tooling when Husky is added:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: ticket reference]
```

**Accepted types:**

- `feat` — a new feature or new domain logic
- `fix` — a bug fix
- `refactor` — code restructuring without behavior change
- `chore` — build system, config, or dependency changes
- `docs` — documentation only
- `test` — adding or updating tests
- `ci` — changes to CI/CD pipeline configuration

**Scope:** Must match the affected package or app name without the `@ente-doctor/` prefix. Examples: `booking-service`, `auth-service`, `contracts`, `event-bus`, `common`.

**Rules:**

- Summary must be lowercase, imperative mood, no trailing period.
- Summary must be 72 characters or fewer.
- Body must wrap at 100 characters.
- Ticket references go in the footer: `Refs: #123` or `Closes: #456`.

**Example:**

```
feat(booking-service): wire CreateBookingUseCase into BookingController

Injects BookingRepository and CreateBookingUseCase as providers in
BookingServiceModule. Registers BookingController alongside the health
controller.

Refs: #88
```

---

## Testing Conventions

**Current state:** Zero test files exist. All `test` scripts are echo stubs. No Jest configuration is present.

**Planned framework (must follow when adding tests):**

- Test runner: **Jest**
- TypeScript transformer: **ts-jest**
- Assertion library: Jest's built-in `expect`
- Mocking: Jest's built-in `jest.fn()` and `jest.spyOn()`

**Jest config shape to adopt (per-service `jest.config.ts`):**

```typescript
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
```

**Unit test file placement:** Co-locate spec files alongside the class under test:

- `src/domain/use-cases/create-booking.use-case.spec.ts`
- `src/infrastructure/database/booking.repository.spec.ts`

**Unit test anatomy (domain use case example):**

```typescript
import { CreateBookingUseCase } from './create-booking.use-case';

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;

  beforeEach(() => {
    useCase = new CreateBookingUseCase();
  });

  it('should execute without throwing for a valid command', async () => {
    const command = {
      patientId: 'patient-1',
      providerId: 'provider-1',
      startsAt: new Date(),
    };

    await expect(useCase.execute(command)).resolves.toBeUndefined();
  });
});
```

**Unit test anatomy (repository with injected dependency mock):**

```typescript
import { BookingRepository } from './booking.repository';

describe('BookingRepository', () => {
  let repo: BookingRepository;

  beforeEach(() => {
    repo = new BookingRepository();
  });

  it('should return null for an unknown id', async () => {
    const result = await repo.findById('non-existent-id');
    expect(result).toBeNull();
  });
});
```

**Never test NestJS module wiring in unit tests.** Use NestJS `Test.createTestingModule` only for integration/e2e tests.

**Never mock `@ente-doctor/common`, `@ente-doctor/contracts`, or `@ente-doctor/event-bus` packages.** Import them directly; they are lightweight and have no I/O.

---

## Common Internal Packages

Must prefer these internal packages over installing third-party equivalents.

**`@ente-doctor/common`** — [`packages/common/src/index.ts`](packages/common/src/index.ts)

- `Logger` — interface for structured logging (`info`, `error` methods accepting a message string and optional context record). Use this as the injection token for all loggers.
- `ConsoleLogger` — default implementation of `Logger` that delegates to `console.info` / `console.error`. Use as the concrete provider in non-production contexts.
- `DomainError` — base error class for all domain-level exceptions. Extends `Error` with a mandatory `code: string` field. All custom domain errors must extend `DomainError`.

**`@ente-doctor/contracts`** — [`packages/contracts/src/index.ts`](packages/contracts/src/index.ts)

- `PatientRef` — read-only cross-service reference for a patient (`id`, `phoneNumber`). Use when referencing a patient from outside the auth service.
- `ProviderRef` — read-only cross-service reference for a provider (`id`, `displayName`, `specialty`). Use when referencing a provider from outside the provider service.
- `BookingDto` — canonical wire-format DTO for a booking (`id`, `patientId`, `providerId`, `startsAt` as ISO string, `status` union). Use as the HTTP response shape for booking data.
- `localization` — `as const` object with `en` and `ml` keys for user-facing message strings. Supported locale keys: `bookingCreated`, `bookingCancelled`. Extend this object when adding new user-facing strings; never hardcode message strings in controllers.

**`@ente-doctor/event-bus`** — [`packages/event-bus/src/index.ts`](packages/event-bus/src/index.ts)

- `EventTopics` — `as const` map of all Kafka topic strings. Current topics: `appointment.created`, `slot.blocked`, `provider.leave.created`, `notification.requested`. Must be the only source of topic string values; never hardcode topic strings.
- `EventTopic` — union type derived from `EventTopics` values. Use as the type for `topic` fields.
- `DomainEvent<TPayload>` — generic event envelope with `id`, `topic`, `occurredAt` (ISO string), and `payload`. All Kafka messages must conform to this shape.
- `AppointmentCreatedPayload` — typed payload for the `appointment.created` event (`bookingId`, `patientId`, `providerId`, `startsAt`).
- `AppointmentCreatedEvent` — convenience alias for `DomainEvent<AppointmentCreatedPayload>`.

**Import these packages using their TypeScript path aliases (configured in root `tsconfig.json`):**

```typescript
import type { Logger, DomainError } from '@ente-doctor/common';
import type { BookingDto, PatientRef } from '@ente-doctor/contracts';
import { EventTopics, type DomainEvent } from '@ente-doctor/event-bus';
```
