import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import type { RefreshTokenRepository } from '../../domain/use-cases/ports';
import { PgPoolProvider } from './pg-pool.provider';

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class RefreshTokenPostgresRepository implements RefreshTokenRepository {
  private readonly pool: Pool;

  constructor(pgPoolProvider: PgPoolProvider) {
    this.pool = pgPoolProvider.pool;
  }

  async save(token: RefreshToken): Promise<void> {
    await this.pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        token.id,
        token.userId,
        token.tokenHash,
        token.expiresAt,
        token.revokedAt ?? null,
      ],
    );
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await this.pool.query<RefreshTokenRow>(
      'SELECT id, user_id, token_hash, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash],
    );
    const row = result.rows[0];
    if (!row) return null;
    return RefreshToken.reconstitute({
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at ?? undefined,
    });
  }

  async revoke(id: string): Promise<void> {
    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1',
      [id],
    );
  }
}
