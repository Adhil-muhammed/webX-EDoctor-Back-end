import { createHash, randomUUID } from 'node:crypto';
import type { Logger } from '@ente-doctor/common';
import {
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from '../entities/auth.errors';
import { RefreshToken } from '../entities/refresh-token.entity';
import type {
  AuthUserRepository,
  OtpHasher,
  OtpStore,
  RefreshTokenRepository,
  TokenIssuer,
} from './ports';

export interface VerifyOtpCommand {
  readonly email: string;
  readonly code: string;
}

export interface VerifyOtpResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

const MAX_ATTEMPTS = 5;
const REFRESH_TOKEN_TTL_DAYS = 30;

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export class VerifyOtpUseCase {
  constructor(
    private readonly userRepo: AuthUserRepository,
    private readonly otpStore: OtpStore,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenIssuer: TokenIssuer,
    private readonly hasher: OtpHasher,
    private readonly logger: Logger,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<VerifyOtpResult> {
    const { email, code } = command;

    const challenge = await this.otpStore.get(email);
    if (!challenge || challenge.isExpired()) {
      throw new OtpExpiredError();
    }

    if (challenge.hasExceededAttempts(MAX_ATTEMPTS)) {
      await this.otpStore.delete(email);
      throw new OtpMaxAttemptsError();
    }

    const isCorrect = await this.hasher.compare(code, challenge.hashedCode);
    if (!isCorrect) {
      const updated = challenge.incrementAttempts();
      await this.otpStore.update(email, updated);
      this.logger.info('OTP attempt failed', {
        email,
        attempts: updated.attempts,
      });
      throw new OtpInvalidError();
    }

    await this.otpStore.delete(email);

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new OtpExpiredError();
    }

    const updatedUser = user.recordLogin();
    await this.userRepo.save(updatedUser);

    const rawRefreshToken = this.tokenIssuer.issueRefreshTokenString();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    const refreshToken = RefreshToken.create(
      randomUUID(),
      user.id,
      tokenHash,
      REFRESH_TOKEN_TTL_DAYS,
    );
    await this.refreshTokenRepo.save(refreshToken);

    const accessToken = this.tokenIssuer.issueAccessToken(user.id, user.email);

    this.logger.info('OTP verified, tokens issued', { userId: user.id });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
