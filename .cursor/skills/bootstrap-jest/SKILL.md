---
name: bootstrap-jest
description: Workflow for setting up Jest and ts-jest in a service or package that currently has an echo stub as its test script. Use when the user asks to add tests, set up testing, or configure Jest for any @ente-doctor app or package.
paths:
  - "apps/**/package.json"
  - "packages/**/package.json"
  - "**/*.spec.ts"
  - "**/jest.config.ts"
---

# Bootstrap Jest

A step-by-step workflow for introducing Jest into a service or package that currently has a placeholder `test` script (`echo "No tests configured..."`). Follow every step in order.

## When to Use

- User asks to add tests to a specific service or package.
- User asks to configure Jest, set up `ts-jest`, or write the first `.spec.ts` file.
- The current `test` script in a `package.json` is an `echo` stub.

## Pre-Flight Question

Ask the user: which service or package are we setting up? (e.g., `booking-service`, `common`). All commands below use `<target>` as a placeholder.

## Step 1 — Install Jest Dev Dependencies

Run from the repo root (do **not** install at root level):

```bash
pnpm --filter @ente-doctor/<target> add -D jest @types/jest ts-jest
```

This installs into `apps/<target>/package.json` or `packages/<target>/package.json` — never into the root.

## Step 2 — Create `jest.config.ts` in the Package Root

Create `apps/<target>/jest.config.ts` (or `packages/<target>/jest.config.ts`):

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

## Step 3 — Update `package.json` test Script

Replace the echo stub in `apps/<target>/package.json`:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:cov": "jest --coverage"
```

## Step 4 — Verify the Config Compiles

```bash
pnpm --filter @ente-doctor/<target> build
```

The `jest.config.ts` must not cause TypeScript errors.

## Step 5 — Write the First `.spec.ts`

Co-locate the spec file next to the class under test. Example for `CreateBookingUseCase`:

`apps/booking-service/src/domain/use-cases/create-booking.use-case.spec.ts`:

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

## Step 6 — Run Tests

```bash
pnpm --filter @ente-doctor/<target> test
```

All tests must pass before committing.

## Constraints

- **Never** place spec files in a `test/` or `__tests__/` folder. Always co-locate beside the source file.
- **Never** mock `@ente-doctor/common`, `@ente-doctor/contracts`, or `@ente-doctor/event-bus`. Import them directly.
- **Never** use `Test.createTestingModule` in unit tests. That is reserved for integration/e2e suites.
- `**/*.spec.ts` is already excluded from the TypeScript build by each service's `tsconfig.json`. Do not change that.
- Framework choice is Jest + ts-jest only. Vitest, Mocha, AVA are forbidden.
