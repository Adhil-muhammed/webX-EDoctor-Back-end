import type { AuthUser } from '../entities/auth-user.entity';
import type { OtpChallenge } from '../entities/otp-challenge.entity';
import type { RefreshToken } from '../entities/refresh-token.entity';

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  save(user: AuthUser): Promise<void>;
}

export interface OtpStore {
  set(email: string, challenge: OtpChallenge): Promise<void>;
  get(email: string): Promise<OtpChallenge | null>;
  delete(email: string): Promise<void>;
  update(email: string, challenge: OtpChallenge): Promise<void>;
}

export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
}

export interface TokenIssuer {
  issueAccessToken(userId: string, email: string): string;
  issueRefreshTokenString(): string;
}

export interface NotificationPublisher {
  requestOtpEmail(email: string, code: string): Promise<void>;
}

export interface OtpHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export const AUTH_USER_REPOSITORY = Symbol('AuthUserRepository');
export const OTP_STORE = Symbol('OtpStore');
export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');
export const TOKEN_ISSUER = Symbol('TokenIssuer');
export const NOTIFICATION_PUBLISHER = Symbol('NotificationPublisher');
export const OTP_HASHER = Symbol('OtpHasher');
export const AUTH_LOGGER = Symbol('AuthLogger');
