export interface ApiGatewayProps {
  readonly id: string;
  readonly createdAt: Date;
}

export class ApiGatewayEntity {
  constructor(private readonly props: ApiGatewayProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
