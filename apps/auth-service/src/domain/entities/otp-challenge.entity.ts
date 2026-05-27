export interface OtpChallengeProps {
  readonly hashedCode: string;
  readonly attempts: number;
  readonly expiresAt: Date;
}

export class OtpChallenge {
  private constructor(private readonly props: OtpChallengeProps) {}

  get hashedCode(): string {
    return this.props.hashedCode;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  static create(hashedCode: string, ttlSeconds: number): OtpChallenge {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return new OtpChallenge({ hashedCode, attempts: 0, expiresAt });
  }

  static reconstitute(props: OtpChallengeProps): OtpChallenge {
    return new OtpChallenge(props);
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  hasExceededAttempts(max: number): boolean {
    return this.props.attempts >= max;
  }

  incrementAttempts(): OtpChallenge {
    return new OtpChallenge({
      ...this.props,
      attempts: this.props.attempts + 1,
    });
  }
}
