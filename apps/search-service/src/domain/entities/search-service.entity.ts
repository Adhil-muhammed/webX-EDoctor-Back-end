export interface SearchServiceProps {
  readonly id: string;
  readonly createdAt: Date;
}

export class SearchServiceEntity {
  constructor(private readonly props: SearchServiceProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
