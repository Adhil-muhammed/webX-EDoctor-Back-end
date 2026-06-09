import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PgPool');

@Injectable()
export class PgPoolProvider implements OnModuleDestroy {
  readonly pool: Pool;

  constructor(config: ConfigService) {
    const url = config.get<string>('database.url');
    if (!url) throw new Error('database.url config is required');
    this.pool = new Pool({ connectionString: url });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
