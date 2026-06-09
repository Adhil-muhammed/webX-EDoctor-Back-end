import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import type { AuthUserRepository } from '../../domain/use-cases/ports';
import { PgPoolProvider } from './pg-pool.provider';

interface AuthUserRow {
  id: string;
  email: string;
  phone: string | null;
  created_at: Date;
  last_login_at: Date | null;
}

@Injectable()
export class AuthUserPostgresRepository implements AuthUserRepository {
  private readonly pool: Pool;

  constructor(pgPoolProvider: PgPoolProvider) {
    this.pool = pgPoolProvider.pool;
  }

  private mapRow(row: AuthUserRow): AuthUser {
    return AuthUser.reconstitute({
      id: row.id,
      email: row.email,
      phone: row.phone ?? undefined,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at ?? undefined,
    });
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.pool.query<AuthUserRow>(
      'SELECT id, email, phone, created_at, last_login_at FROM auth_users WHERE email = $1',
      [email],
    );
    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const result = await this.pool.query<AuthUserRow>(
      'SELECT id, email, phone, created_at, last_login_at FROM auth_users WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async save(user: AuthUser): Promise<void> {
    await this.pool.query(
      `INSERT INTO auth_users (id, email, phone, created_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         phone = EXCLUDED.phone,
         last_login_at = EXCLUDED.last_login_at`,
      [
        user.id,
        user.email,
        user.phone ?? null,
        user.createdAt,
        user.lastLoginAt ?? null,
      ],
    );
  }
}
