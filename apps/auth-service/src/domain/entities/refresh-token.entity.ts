export interface RefreshTokenProps {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt?: Date;
}

export class RefreshToken {
  private constructor(private readonly props: RefreshTokenProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  static create(
    id: string,
    userId: string,
    tokenHash: string,
    ttlDays: number,
  ): RefreshToken {
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    return new RefreshToken({ id, userId, tokenHash, expiresAt });
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  isValid(): boolean {
    return !this.props.revokedAt && new Date() < this.props.expiresAt;
  }

  revoke(): RefreshToken {
    return new RefreshToken({ ...this.props, revokedAt: new Date() });
  }
}
