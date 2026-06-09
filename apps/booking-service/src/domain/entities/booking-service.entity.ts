export interface BookingServiceProps {
  readonly id: string;
  readonly createdAt: Date;
}

export class BookingServiceEntity {
  constructor(private readonly props: BookingServiceProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
