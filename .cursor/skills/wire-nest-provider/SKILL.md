---
name: wire-nest-provider
description: Workflow for correctly wiring a completed use case, repository, or controller into the NestJS inline @Module in app.ts. Use when the user asks to register a provider, inject a dependency, add a controller to the module, or connect a use case to an HTTP route.
paths:
  - "apps/**/src/app.ts"
---

# Wire NestJS Provider

How to safely add a fully implemented class to the inline `@Module` in any service's `src/app.ts`. The module is the single wiring point — no `*.module.ts` files exist or are permitted.

## When to Use

- A use case, repository, or controller has been fully implemented and needs DI registration.
- User asks to "connect" or "register" a new class in Nest.
- User asks to make a new HTTP route available.

## Pre-Flight Gate

**Never wire a stub.** Before touching `app.ts`, verify:

- The class under consideration has a real implementation body (not `void id; return null;` or similar no-ops).
- If the class depends on other providers, those are also complete.
- The service builds cleanly: `pnpm --filter @ente-doctor/<service> build`.

If any dependency is still a stub, stop and implement it first.

## The Module Pattern

Every service's module lives inline in `src/app.ts` and follows this exact shape — read the canonical file before editing:

```
apps/<service>/src/app.ts  →  @apps/<service>/src/app.ts
```

Reference: [apps/booking-service/src/app.ts](../../apps/booking-service/src/app.ts)

The factory function `create<Service>Module()` returns the module class. `main.ts` calls it. Never move this to a `*.module.ts` file.

## Wiring a Repository + Use Case + Controller

Edit `src/app.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// 1. Import the health controller (already present)
import { BookingServiceHealthController } from './entrypoints/http/booking-service.controller';
// 2. Import the new classes
import { BookingRepository } from './infrastructure/database/booking.repository';
import { CreateBookingUseCase } from './domain/use-cases/create-booking.use-case';
import { BookingController } from './entrypoints/http/booking.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [BookingServiceHealthController, BookingController],  // add new controller here
  providers: [
    BookingRepository,
    CreateBookingUseCase,
    // If the use case depends on the repository via an interface token:
    // { provide: IBookingRepositoryToken, useClass: BookingRepository },
  ],
})
class BookingServiceModule {}

export function createBookingServiceModule(): typeof BookingServiceModule {
  return BookingServiceModule;
}
```

## Injecting the Repository into the Use Case

When the use case constructor receives the repository, Nest resolves it automatically if the concrete class (or token) is listed in `providers`. Make sure the constructor parameter type matches what is provided:

- If using **class injection** (simple): `constructor(private readonly repo: BookingRepository)` — list `BookingRepository` in `providers`.
- If using **interface/token injection** (clean architecture pattern): define `export const IBookingRepositoryToken = Symbol('IBookingRepository')` in the domain file, inject via `@Inject(IBookingRepositoryToken)` in the use case constructor, and add `{ provide: IBookingRepositoryToken, useClass: BookingRepository }` to `providers`.

## Verification

After editing `app.ts`, always verify:

```bash
pnpm --filter @ente-doctor/<service> build   # must succeed with 0 errors
pnpm --filter @ente-doctor/<service> start:dev  # must boot without DI errors
```
