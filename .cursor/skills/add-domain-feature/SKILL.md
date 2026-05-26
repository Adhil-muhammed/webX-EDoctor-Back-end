---
name: add-domain-feature
description: End-to-end workflow for adding a new domain feature to any Ente Doctor service. Use when the user asks to implement a new business capability, add an aggregate, create a new use case, or wire a new HTTP endpoint. Covers entity → use case → repository interface → infrastructure implementation → controller → module registration.
paths:
  - "apps/**/src/**/*.ts"
---

# Add Domain Feature

A complete, ordered workflow for adding a new domain feature to any service in this hexagonal monorepo. Reference implementation: `booking-service`. Refer to `references/booking-service-example.md` for the canonical file shapes.

## When to Use

- User asks to implement a new business capability in an existing service.
- User asks to add an aggregate, entity, or value object.
- User asks to add a use case, an HTTP endpoint, or a Kafka consumer backed by business logic.

## Pre-Flight Checks

Before writing a single line, confirm:

1. Which service owns this feature (`apps/<service>`)?
2. What is the aggregate root name (e.g., `Booking`, `Provider`, `Appointment`)?
3. What is the use case name (e.g., `CreateBooking`, `CancelAppointment`)?
4. Does an HTTP controller or Kafka consumer trigger it?
5. Ask the user if any of the above are unclear before proceeding.

## Step-by-Step Instructions

### Step 1 — Domain Entity (`domain/entities/`)

- Create `<aggregate>.entity.ts`.
- Define a `<Aggregate>Props` interface with all fields `readonly`.
- Define the class with `private readonly props: <Aggregate>Props`.
- Expose only what callers need through public getters.
- If the aggregate has a status enum, define it as `export type <Aggregate>Status = '...' | '...'` in the same file.
- **Never** add NestJS decorators, ORM annotations, or I/O calls here.

### Step 2 — Repository Interface (`domain/use-cases/` or alongside the entity)

- Create `<aggregate>.repository.ts` *inside* `domain/` (not infrastructure). This is the **port**.
- Define `export interface I<Aggregate>Repository { findById(id: string): Promise<<Aggregate> | null>; save(entity: <Aggregate>): Promise<void>; }`.
- The interface name must start with `I` when it is a port interface. The concrete class in infrastructure uses the name without `I`.

### Step 3 — Use Case (`domain/use-cases/`)

- Create `<action>-<aggregate>.use-case.ts`.
- Define `export interface <Action><Aggregate>Command { ... }` above the class.
- Define `export class <Action><Aggregate>UseCase { constructor(private readonly repo: I<Aggregate>Repository) {} async execute(command: <Action><Aggregate>Command): Promise<void> { ... } }`.
- Inject the repository through the constructor as the **interface type**. Never instantiate infrastructure classes.
- Never import `@nestjs/*` here.

### Step 4 — Infrastructure Model (`infrastructure/database/`)

- Create `<aggregate>.model.ts`.
- Define `export interface <Aggregate>Model { readonly id: string; ... readonly createdAt: Date; readonly updatedAt: Date; }`.
- Models **may** import the entity's type/enum for reuse (e.g., `import type { <Aggregate>Status } from '../../domain/entities/<aggregate>.entity'`). The reverse is forbidden.

### Step 5 — Infrastructure Repository (`infrastructure/database/`)

- Create `<aggregate>.repository.ts`.
- Define `export class <Aggregate>Repository implements I<Aggregate>Repository { ... }`.
- The `implements` clause is **mandatory**.
- Stub methods with `void id; return null;` until a real ORM is added. Never return invented data.

### Step 6 — HTTP Controller (`entrypoints/http/`) — if an HTTP trigger is needed

- Create `<aggregate>.controller.ts`.
- Annotate with `@Controller('<plural-path>')`.
- Inject the use case class (not the repository) in the constructor.
- Map the request body to a `<Action><Aggregate>Command` immediately.
- Return a `BookingDto`-shaped object from `@ente-doctor/contracts` or a typed response interface.
- Use `localization` from `@ente-doctor/contracts` for any user-facing messages.

### Step 7 — Module Wiring (`app.ts`)

- **Only after Steps 1–6 are complete and non-stub**, add the repository, use case, and controller as `providers` and register the controller in `controllers` inside the inline `@Module` in `src/app.ts`.
- Pattern: `providers: [<Aggregate>Repository, { provide: I<Aggregate>RepositoryToken, useClass: <Aggregate>Repository }, <Action><Aggregate>UseCase]`.
- If a DI token is needed for the interface, define `export const I<Aggregate>RepositoryToken = Symbol('I<Aggregate>Repository')` in the domain file.
- **Never** register classes that still have stub bodies.

## Constraints (Non-Negotiable)

- All files follow `kebab-case` naming matching their exported class.
- Domain files must pass `pnpm --filter @ente-doctor/<service> lint` with zero errors.
- Run `pnpm --filter @ente-doctor/<service> build` after wiring to confirm no type errors.
- Cross-service imports are forbidden. If the feature needs data from another service, use `@ente-doctor/contracts` ref types.
