export interface ProviderServiceProps {
  readonly id: string;
  readonly createdAt: Date;
}

export class ProviderServiceEntity {
  constructor(private readonly props: ProviderServiceProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
