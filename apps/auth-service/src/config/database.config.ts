export interface DatabaseConfig {
  readonly url: string;
}

export const databaseConfig = (): { database: DatabaseConfig } => ({
  database: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://ente_auth:ente_auth_password@localhost:5433/ente_auth',
  },
});
