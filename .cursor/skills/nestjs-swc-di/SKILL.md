---
name: nestjs-swc-di
description: Migrate a NestJS service from manual useFactory providers and tsx/esbuild to class-based @Injectable() DI with SWC as the dev compiler. Use when adding SWC to a service, refactoring useFactory providers to @Injectable(), or setting up emitDecoratorMetadata for the first time.
disable-model-invocation: true
---

# NestJS SWC + Class-Based DI Migration

Use this skill when adding SWC to a service or converting `useFactory` providers to standard `@Injectable()` classes.

## Step 1 — Install SWC devDependencies

```bash
pnpm --filter @ente-doctor/<service> add -D @swc/core @swc-node/register nodemon
```

Never install at the workspace root.

## Step 2 — Create `apps/<service>/.swcrc`

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "jsc": {
    "parser": { "syntax": "typescript", "decorators": true, "dynamicImport": true },
    "target": "es2023",
    "transform": { "legacyDecorator": true, "decoratorMetadata": true }
  },
  "module": { "type": "commonjs" },
  "sourceMaps": "inline"
}
```

`decoratorMetadata: true` is mandatory — it enables NestJS constructor type inference.

## Step 3 — Update `start:dev` in `package.json`

```json
"start:dev": "nodemon --watch src --ext ts,json --exec node -r @swc-node/register src/main.ts"
```

## Step 4 — Classify every provider

| Provider type | Rule |
|---|---|
| Infrastructure class (repo, adapter, pool, hasher) | Add `@Injectable()`. Register bare class in `providers`. |
| Class that owns a connection (pool, redis) | Also implement `OnModuleDestroy`; close in `onModuleDestroy()`. |
| Port token (e.g. `AUTH_USER_REPOSITORY`) | `{ provide: TOKEN, useExisting: ConcreteClass }` — no double instantiation. |
| Domain use case | **No `@Injectable()`** (domain must stay NestJS-free). Use a trivial `useFactory`. |
| Logger | `{ provide: AUTH_LOGGER, useValue: new ConsoleLogger() }` — one instance per module. |
| Kafka client | `@Inject(STRING_TOKEN)` on the constructor param — metadata can't infer string tokens. |

## Step 5 — Eliminate closure dependencies in use cases

If a use case constructor currently receives a raw function (`hashFn`, `compareFn`):

1. Add a named port interface to `domain/use-cases/ports.ts`:
   ```typescript
   export interface OtpHasher {
     hash(plain: string): Promise<string>;
     compare(plain: string, hashed: string): Promise<boolean>;
   }
   export const OTP_HASHER = Symbol('OtpHasher');
   ```
2. Replace the function param in the use-case constructor with `hasher: OtpHasher`.
3. Create `infrastructure/external-services/<lib>-hasher.ts` with `@Injectable()`.
4. Register: `BcryptHasher`, then `{ provide: OTP_HASHER, useExisting: BcryptHasher }`.

## Step 6 — Structure `app.ts` providers in three sections

```typescript
providers: [
  // 1. Infra classes — resolved by SWC metadata
  PgPoolProvider, AuthUserPostgresRepository, BcryptHasher,
  { provide: AUTH_LOGGER, useValue: new ConsoleLogger() },

  // 2. Port-token aliases
  { provide: AUTH_USER_REPOSITORY, useExisting: AuthUserPostgresRepository },
  { provide: OTP_HASHER, useExisting: BcryptHasher },

  // 3. Use-case factories (trivial — no closures)
  {
    provide: REQUEST_OTP_USE_CASE,
    inject: [AUTH_USER_REPOSITORY, OTP_STORE, NOTIFICATION_PUBLISHER, OTP_HASHER, AUTH_LOGGER],
    useFactory: (repo, store, pub, hasher, log) =>
      new RequestOtpUseCase(repo, store, pub, hasher, log),
  },
]
```

## Step 7 — Verify

```bash
pnpm --filter @ente-doctor/<service> lint   # tsc --noEmit, must be zero errors
pnpm --filter @ente-doctor/<service> build  # full tsc output
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot read properties of undefined` on config access | `emitDecoratorMetadata` not active (still using `tsx`) | Confirm `.swcrc` has `decoratorMetadata: true` and `nodemon` uses `-r @swc-node/register` |
| `Class extends value undefined` | Shared package resolved to `src/` instead of `dist/` | Ensure shared packages are built; set `paths: {}` in service `tsconfig.json` if needed |
| `@Inject()` ignored on Kafka client | String token, no metadata emitted | Add `@Inject(AUTH_KAFKA_CLIENT)` explicitly to the constructor param |
| Double instantiation of repositories | Port token registered with `useClass` instead of `useExisting` | Change to `useExisting: ConcreteClass` |
