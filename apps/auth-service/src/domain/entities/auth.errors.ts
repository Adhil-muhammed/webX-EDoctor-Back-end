import { DomainError } from '@ente-doctor/common';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email address: ${email}`, 'AUTH_INVALID_EMAIL');
  }
}

export class OtpExpiredError extends DomainError {
  constructor() {
    super('OTP has expired. Please request a new one.', 'AUTH_OTP_EXPIRED');
  }
}

export class OtpInvalidError extends DomainError {
  constructor() {
    super('OTP is incorrect.', 'AUTH_OTP_INVALID');
  }
}

export class OtpMaxAttemptsError extends DomainError {
  constructor() {
    super(
      'Maximum OTP attempts exceeded. Please request a new OTP.',
      'AUTH_OTP_MAX_ATTEMPTS',
    );
  }
}

export class RefreshTokenExpiredError extends DomainError {
  constructor() {
    super('Refresh token has expired.', 'AUTH_REFRESH_TOKEN_EXPIRED');
  }
}

export class RefreshTokenRevokedError extends DomainError {
  constructor() {
    super('Refresh token has been revoked.', 'AUTH_REFRESH_TOKEN_REVOKED');
  }
}
