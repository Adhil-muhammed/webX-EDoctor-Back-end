export interface AuthServiceProps {
  readonly id: string;
  readonly createdAt: Date;
}

export class AuthServiceEntity {
  constructor(private readonly props: AuthServiceProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
