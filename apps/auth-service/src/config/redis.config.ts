export interface RedisConfig {
  readonly url: string;
}

export const redisConfig = (): { redis: RedisConfig } => ({
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
});
