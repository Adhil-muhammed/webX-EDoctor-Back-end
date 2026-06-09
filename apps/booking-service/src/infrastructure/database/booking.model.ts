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
