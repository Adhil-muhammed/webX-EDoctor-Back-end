#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-ente-doctor-backend}"

APPS=(
  "api-gateway"
  "auth-service"
  "provider-service"
  "booking-service"
  "search-service"
  "notification-service"
)

PACKAGES=(
  "common"
  "contracts"
  "event-bus"
)

declare -A APP_PORTS=(
  ["api-gateway"]="3000"
  ["auth-service"]="3001"
  ["provider-service"]="3002"
  ["booking-service"]="3003"
  ["search-service"]="3004"
  ["notification-service"]="3005"
)

declare -A APP_DESCRIPTIONS=(
  ["api-gateway"]="Central entry point for routing, SSL termination, and global rate limits."
  ["auth-service"]="Phone and OTP authentication service."
  ["provider-service"]="Doctor profiles, master slots, clinic data, and QR generation service."
  ["booking-service"]="Live appointments, slot blocking, and cancellation service."
  ["search-service"]="Hyperlocal and specialty search service."
  ["notification-service"]="WhatsApp and SMS asynchronous worker service."
)

slug_to_pascal() {
  local slug="$1"
  local result=""
  local part

  IFS='-' read -ra parts <<< "$slug"
  for part in "${parts[@]}"; do
    result+="${part^}"
  done

  printf '%s' "$result"
}

slug_to_camel() {
  local pascal
  pascal="$(slug_to_pascal "$1")"
  printf '%s%s' "$(tr '[:upper:]' '[:lower:]' <<< "${pascal:0:1}")" "${pascal:1}"
}

mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

mkdir -p apps packages

cat > package.json <<'EOF'
{
  "name": "ente-doctor-backend",
  "version": "0.1.0",
  "description": "Ente Doctor healthcare platform backend monorepo.",
  "private": true,
  "license": "UNLICENSED",
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "corepack pnpm -r --filter @ente-doctor/* build",
    "dev": "corepack pnpm --parallel --filter @ente-doctor/api-gateway --filter @ente-doctor/*-service start:dev",
    "lint": "corepack pnpm -r --filter @ente-doctor/* lint",
    "test": "corepack pnpm -r --filter @ente-doctor/* test",
    "clean": "corepack pnpm -r --filter @ente-doctor/* clean",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "prettier": "^3.4.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
EOF

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "baseUrl": ".",
    "paths": {
      "@ente-doctor/common": ["packages/common/src"],
      "@ente-doctor/common/*": ["packages/common/src/*"],
      "@ente-doctor/contracts": ["packages/contracts/src"],
      "@ente-doctor/contracts/*": ["packages/contracts/src/*"],
      "@ente-doctor/event-bus": ["packages/event-bus/src"],
      "@ente-doctor/event-bus/*": ["packages/event-bus/src/*"]
    },
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "dist"]
}
EOF

cat > docker-compose.yml <<'EOF'
name: ente-doctor-local

services:
  auth-postgres:
    image: postgres:16-alpine
    container_name: ente-auth-postgres
    environment:
      POSTGRES_USER: ente_auth
      POSTGRES_PASSWORD: ente_auth_password
      POSTGRES_DB: ente_auth
    ports:
      - "5433:5432"
    volumes:
      - auth_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ente_auth -d ente_auth"]
      interval: 10s
      timeout: 5s
      retries: 5

  provider-postgres:
    image: postgres:16-alpine
    container_name: ente-provider-postgres
    environment:
      POSTGRES_USER: ente_provider
      POSTGRES_PASSWORD: ente_provider_password
      POSTGRES_DB: ente_provider
    ports:
      - "5434:5432"
    volumes:
      - provider_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ente_provider -d ente_provider"]
      interval: 10s
      timeout: 5s
      retries: 5

  booking-postgres:
    image: postgres:16-alpine
    container_name: ente-booking-postgres
    environment:
      POSTGRES_USER: ente_booking
      POSTGRES_PASSWORD: ente_booking_password
      POSTGRES_DB: ente_booking
    ports:
      - "5435:5432"
    volumes:
      - booking_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ente_booking -d ente_booking"]
      interval: 10s
      timeout: 5s
      retries: 5

  search-postgres:
    image: postgres:16-alpine
    container_name: ente-search-postgres
    environment:
      POSTGRES_USER: ente_search
      POSTGRES_PASSWORD: ente_search_password
      POSTGRES_DB: ente_search
    ports:
      - "5436:5432"
    volumes:
      - search_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ente_search -d ente_search"]
      interval: 10s
      timeout: 5s
      retries: 5

  notification-postgres:
    image: postgres:16-alpine
    container_name: ente-notification-postgres
    environment:
      POSTGRES_USER: ente_notification
      POSTGRES_PASSWORD: ente_notification_password
      POSTGRES_DB: ente_notification
    ports:
      - "5437:5432"
    volumes:
      - notification_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ente_notification -d ente_notification"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ente-redis
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka:
    image: bitnami/kafka:3.7
    container_name: ente-kafka
    environment:
      KAFKA_CFG_NODE_ID: 1
      KAFKA_CFG_PROCESS_ROLES: broker,controller
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,EXTERNAL://localhost:9094
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CFG_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR: 1
      ALLOW_PLAINTEXT_LISTENER: "yes"
    ports:
      - "9094:9094"
    volumes:
      - kafka_data:/bitnami/kafka
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list >/dev/null 2>&1"]
      interval: 10s
      timeout: 10s
      retries: 10

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: ente-kafka-ui
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    ports:
      - "8080:8080"

volumes:
  auth_postgres_data:
  provider_postgres_data:
  booking_postgres_data:
  search_postgres_data:
  notification_postgres_data:
  redis_data:
  kafka_data:
EOF

cat > README.md <<'EOF'
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
EOF

cat > .gitignore <<'EOF'
# ─── Dependencies ──────────────────────────────────────────────────────────────
node_modules/
.pnp
.pnp.js

# ─── Build Outputs ──────────────────────────────────────────────────────────────
dist/
build/
*.tsbuildinfo
.tsbuildinfo

# ─── TypeScript Declaration Caches ─────────────────────────────────────────────
*.d.ts.map

# ─── pnpm ───────────────────────────────────────────────────────────────────────
.pnpm-store/
.pnpm-debug.log*

# ─── Logs ───────────────────────────────────────────────────────────────────────
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pnpm-debug.log*

# ─── Environment Files ──────────────────────────────────────────────────────────
.env
.env.*
!.env.example
!.env.*.example

# ─── Test Coverage ──────────────────────────────────────────────────────────────
coverage/
.nyc_output/
lcov.info
*.lcov

# ─── Prisma ─────────────────────────────────────────────────────────────────────
apps/*/src/infrastructure/database/generated/
packages/*/generated/

# ─── Docker ─────────────────────────────────────────────────────────────────────
docker-compose.override.yml
docker-compose.local.yml

# ─── OS Artefacts ───────────────────────────────────────────────────────────────
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
Thumbs.db
ehthumbs.db
Desktop.ini

# ─── Editor / IDE ───────────────────────────────────────────────────────────────
.vscode/
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/launch.json
.idea/
*.swp
*.swo
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# ─── NestJS / Webpack ───────────────────────────────────────────────────────────
/nest-cli.json
/webpack-hmr.config.js

# ─── Turbo / Nx (future tooling) ────────────────────────────────────────────────
.turbo/
.nx/

# ─── Temporary Files ────────────────────────────────────────────────────────────
tmp/
temp/
*.tmp
*.temp
EOF

for app in "${APPS[@]}"; do
  pascal_name="$(slug_to_pascal "$app")"
  camel_name="$(slug_to_camel "$app")"
  port="${APP_PORTS[$app]}"
  description="${APP_DESCRIPTIONS[$app]}"
  app_dir="apps/$app"

  mkdir -p \
    "$app_dir/src/config" \
    "$app_dir/src/entrypoints/http" \
    "$app_dir/src/entrypoints/event-consumers" \
    "$app_dir/src/domain/entities" \
    "$app_dir/src/domain/use-cases" \
    "$app_dir/src/infrastructure/database" \
    "$app_dir/src/infrastructure/external-services"

  cat > "$app_dir/package.json" <<EOF
{
  "name": "@ente-doctor/$app",
  "version": "0.1.0",
  "description": "$description",
  "private": true,
  "type": "commonjs",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js",
    "start:dev": "tsx watch src/main.ts",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "echo \\"No tests configured for @ente-doctor/$app yet\\"",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@ente-doctor/common": "workspace:*",
    "@ente-doctor/contracts": "workspace:*",
    "@ente-doctor/event-bus": "workspace:*",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.3",
    "@nestjs/core": "^11.0.1",
    "@nestjs/microservices": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "kafkajs": "^2.2.4",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "rimraf": "^6.0.1"
  }
}
EOF

  cat > "$app_dir/tsconfig.json" <<EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
EOF

  cat > "$app_dir/Dockerfile" <<EOF
FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/$app/package.json apps/$app/package.json
COPY packages/common/package.json packages/common/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/event-bus/package.json packages/event-bus/package.json
RUN pnpm install --filter @ente-doctor/$app... --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @ente-doctor/$app build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /workspace ./
EXPOSE $port
CMD ["pnpm", "--filter", "@ente-doctor/$app", "start"]
EOF

  cat > "$app_dir/src/main.ts" <<EOF
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { create${pascal_name}Module } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(create${pascal_name}Module());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', $port);

  await app.listen(port);
}

void bootstrap();
EOF

  cat > "$app_dir/src/app.ts" <<EOF
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ${pascal_name}HealthController } from './entrypoints/http/${app}.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [${pascal_name}HealthController],
})
class ${pascal_name}Module {}

export function create${pascal_name}Module(): typeof ${pascal_name}Module {
  return ${pascal_name}Module;
}
EOF

  cat > "$app_dir/src/config/database.config.ts" <<EOF
export interface DatabaseConfig {
  readonly url: string;
}

export const databaseConfig = (): DatabaseConfig => ({
  url: process.env.DATABASE_URL ?? 'postgresql://localhost/$app',
});
EOF

  cat > "$app_dir/src/entrypoints/http/$app.controller.ts" <<EOF
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class ${pascal_name}HealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/$app',
      status: 'ok',
    };
  }
}
EOF

  cat > "$app_dir/src/entrypoints/event-consumers/$app.consumer.ts" <<EOF
export class ${pascal_name}Consumer {
  async handle(message: unknown): Promise<void> {
    void message;
  }
}
EOF

  cat > "$app_dir/src/domain/entities/$app.entity.ts" <<EOF
export interface ${pascal_name}Props {
  readonly id: string;
  readonly createdAt: Date;
}

export class ${pascal_name}Entity {
  constructor(private readonly props: ${pascal_name}Props) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
EOF

  cat > "$app_dir/src/domain/use-cases/${app}.use-case.ts" <<EOF
export class ${pascal_name}UseCase {
  async execute(): Promise<void> {
    return Promise.resolve();
  }
}
EOF

  cat > "$app_dir/src/infrastructure/database/$app.model.ts" <<EOF
export interface ${pascal_name}Model {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
EOF

  cat > "$app_dir/src/infrastructure/database/$app.repository.ts" <<EOF
import type { ${pascal_name}Model } from './$app.model';

export class ${pascal_name}Repository {
  async findById(id: string): Promise<${pascal_name}Model | null> {
    void id;
    return null;
  }
}
EOF

  cat > "$app_dir/src/infrastructure/external-services/${app}.adapter.ts" <<EOF
export class ${pascal_name}ExternalServiceAdapter {
  async ping(): Promise<boolean> {
    return true;
  }
}
EOF
done

cat > apps/booking-service/src/entrypoints/http/booking.controller.ts <<'EOF'
import { Controller, Post } from '@nestjs/common';

@Controller('bookings')
export class BookingController {
  @Post()
  createBooking(): { status: 'accepted' } {
    return { status: 'accepted' };
  }
}
EOF

cat > apps/booking-service/src/entrypoints/event-consumers/provider-leave.consumer.ts <<'EOF'
export class ProviderLeaveConsumer {
  async handleProviderLeave(message: unknown): Promise<void> {
    void message;
  }
}
EOF

cat > apps/booking-service/src/domain/entities/booking.entity.ts <<'EOF'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BookingProps {
  readonly id: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: Date;
  readonly status: BookingStatus;
}

export class Booking {
  constructor(private readonly props: BookingProps) {}

  get id(): string {
    return this.props.id;
  }

  get status(): BookingStatus {
    return this.props.status;
  }
}
EOF

cat > apps/booking-service/src/domain/use-cases/create-booking.use-case.ts <<'EOF'
export interface CreateBookingCommand {
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: Date;
}

export class CreateBookingUseCase {
  async execute(command: CreateBookingCommand): Promise<void> {
    void command;
  }
}
EOF

cat > apps/booking-service/src/domain/use-cases/cancel-booking.use-case.ts <<'EOF'
export interface CancelBookingCommand {
  readonly bookingId: string;
  readonly reason?: string;
}

export class CancelBookingUseCase {
  async execute(command: CancelBookingCommand): Promise<void> {
    void command;
  }
}
EOF

cat > apps/booking-service/src/infrastructure/database/booking.model.ts <<'EOF'
import type { BookingStatus } from '../../domain/entities/booking.entity';

export interface BookingModel {
  readonly id: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: Date;
  readonly status: BookingStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
EOF

cat > apps/booking-service/src/infrastructure/database/booking.repository.ts <<'EOF'
import type { BookingModel } from './booking.model';

export class BookingRepository {
  async findById(id: string): Promise<BookingModel | null> {
    void id;
    return null;
  }
}
EOF

cat > apps/booking-service/src/infrastructure/external-services/qr-generator.adapter.ts <<'EOF'
export class QrGeneratorAdapter {
  async createBookingQrCode(bookingId: string): Promise<string> {
    return `booking:${bookingId}`;
  }
}
EOF

for pkg in "${PACKAGES[@]}"; do
  pkg_dir="packages/$pkg"
  mkdir -p "$pkg_dir/src"

  cat > "$pkg_dir/package.json" <<EOF
{
  "name": "@ente-doctor/$pkg",
  "version": "0.1.0",
  "description": "Shared $pkg package for the Ente Doctor backend.",
  "private": true,
  "type": "commonjs",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "echo \\"No tests configured for @ente-doctor/$pkg yet\\"",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "rimraf": "^6.0.1"
  }
}
EOF

  cat > "$pkg_dir/tsconfig.json" <<EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
EOF
done

cat > packages/common/src/index.ts <<'EOF'
export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>): void {
    console.info(message, context ?? {});
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(message, context ?? {});
  }
}

export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}
EOF

cat > packages/contracts/src/index.ts <<'EOF'
export interface PatientRef {
  readonly id: string;
  readonly phoneNumber: string;
}

export interface ProviderRef {
  readonly id: string;
  readonly displayName: string;
  readonly specialty: string;
}

export interface BookingDto {
  readonly id: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: string;
  readonly status: 'pending' | 'confirmed' | 'cancelled';
}

export const localization = {
  en: {
    bookingCreated: 'Booking created successfully.',
    bookingCancelled: 'Booking cancelled successfully.',
  },
  ml: {
    bookingCreated: 'ബുക്കിംഗ് വിജയകരമായി സൃഷ്ടിച്ചു.',
    bookingCancelled: 'ബുക്കിംഗ് വിജയകരമായി റദ്ദാക്കി.',
  },
} as const;
EOF

cat > packages/event-bus/src/index.ts <<'EOF'
export const EventTopics = {
  appointmentCreated: 'appointment.created',
  slotBlocked: 'slot.blocked',
  providerLeaveCreated: 'provider.leave.created',
  notificationRequested: 'notification.requested',
} as const;

export type EventTopic = (typeof EventTopics)[keyof typeof EventTopics];

export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly topic: EventTopic;
  readonly occurredAt: string;
  readonly payload: TPayload;
}

export interface AppointmentCreatedPayload {
  readonly bookingId: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: string;
}

export type AppointmentCreatedEvent = DomainEvent<AppointmentCreatedPayload>;
EOF

printf 'Ente Doctor workspace scaffold generated at %s\n' "$(pwd)"
