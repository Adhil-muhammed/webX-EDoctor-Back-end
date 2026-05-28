-- auth-service initial schema
-- Tables derived from AuthUserPostgresRepository and RefreshTokenPostgresRepository.
-- OTP challenges are stored in Redis and require no SQL table.

CREATE TABLE IF NOT EXISTS auth_users (
  id            UUID        PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
