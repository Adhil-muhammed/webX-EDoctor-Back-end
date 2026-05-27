export interface JwtConfig {
  readonly privateKey: string;
  readonly expirySeconds: number;
}

export const jwtConfig = (): { jwt: JwtConfig } => ({
  jwt: {
    privateKey:
      process.env.JWT_PRIVATE_KEY ?? 'dev-insecure-secret-change-in-prod',
    expirySeconds: parseInt(process.env.JWT_EXPIRY_SECONDS ?? '900', 10),
  },
});
