export interface NotificationServiceProps {
  readonly id: string;
  readonly createdAt: Date;
}

export class NotificationServiceEntity {
  constructor(private readonly props: NotificationServiceProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
