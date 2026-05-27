import { createHash, randomUUID } from 'node:crypto';
import type { Logger } from '@ente-doctor/common';
import {
  RefreshTokenExpiredError,
  RefreshTokenRevokedError,
} from '../entities/auth.errors';
import { RefreshToken } from '../entities/refresh-token.entity';
import type {
  AuthUserRepository,
  RefreshTokenRepository,
  TokenIssuer,
} from './ports';

export interface RefreshTokenCommand {
  readonly refreshToken: string;
}

export interface RefreshTokenResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

const REFRESH_TOKEN_TTL_DAYS = 30;

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: AuthUserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenIssuer: TokenIssuer,
    private readonly logger: Logger,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const tokenHash = hashRefreshToken(command.refreshToken);

    const existing = await this.refreshTokenRepo.findByHash(tokenHash);
    if (!existing) {
      throw new RefreshTokenExpiredError();
    }

    if (existing.revokedAt) {
      throw new RefreshTokenRevokedError();
    }

    if (!existing.isValid()) {
      throw new RefreshTokenExpiredError();
    }

    await this.refreshTokenRepo.revoke(existing.id);

    const user = await this.userRepo.findById(existing.userId);
    if (!user) {
      throw new RefreshTokenExpiredError();
    }

    const rawRefreshToken = this.tokenIssuer.issueRefreshTokenString();
    const newTokenHash = hashRefreshToken(rawRefreshToken);

    const newRefreshToken = RefreshToken.create(
      randomUUID(),
      existing.userId,
      newTokenHash,
      REFRESH_TOKEN_TTL_DAYS,
    );
    await this.refreshTokenRepo.save(newRefreshToken);

    const accessToken = this.tokenIssuer.issueAccessToken(user.id, user.email);

    this.logger.info('Refresh token rotated', { userId: existing.userId });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
