import { InvalidEmailError } from './auth.errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthUserProps {
  readonly id: string;
  readonly email: string;
  readonly phone?: string;
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
}

export class AuthUser {
  private constructor(private readonly props: AuthUserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  static create(id: string, email: string): AuthUser {
    if (!EMAIL_REGEX.test(email)) {
      throw new InvalidEmailError(email);
    }
    return new AuthUser({ id, email, createdAt: new Date() });
  }

  static reconstitute(props: AuthUserProps): AuthUser {
    return new AuthUser(props);
  }

  recordLogin(): AuthUser {
    return new AuthUser({ ...this.props, lastLoginAt: new Date() });
  }
}
