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
