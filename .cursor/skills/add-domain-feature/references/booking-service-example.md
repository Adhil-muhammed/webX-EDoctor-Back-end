# Booking Service — Canonical File Shapes

These are the actual file shapes from `booking-service`. Use them as the reference implementation when creating a new domain feature.

## Entity — `apps/booking-service/src/domain/entities/booking.entity.ts`

```typescript
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
```

## Use Case — `apps/booking-service/src/domain/use-cases/create-booking.use-case.ts`

```typescript
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
```

## Infrastructure Model — `apps/booking-service/src/infrastructure/database/booking.model.ts`

```typescript
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
```

## Infrastructure Repository — `apps/booking-service/src/infrastructure/database/booking.repository.ts`

```typescript
import type { BookingModel } from './booking.model';

export class BookingRepository {
  async findById(id: string): Promise<BookingModel | null> {
    void id;
    return null;
  }
}
```

## HTTP Controller — `apps/booking-service/src/entrypoints/http/booking.controller.ts`

```typescript
import { Controller, Post } from '@nestjs/common';

@Controller('bookings')
export class BookingController {
  @Post()
  createBooking(): { status: 'accepted' } {
    return { status: 'accepted' };
  }
}
```

## Module — `apps/booking-service/src/app.ts` (note: BookingController is NOT yet registered — it is a stub)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingServiceHealthController } from './entrypoints/http/booking-service.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [BookingServiceHealthController],
})
class BookingServiceModule {}

export function createBookingServiceModule(): typeof BookingServiceModule {
  return BookingServiceModule;
}
```
