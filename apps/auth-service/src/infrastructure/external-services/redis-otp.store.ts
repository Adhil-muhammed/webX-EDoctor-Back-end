import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { OtpChallenge } from '../../domain/entities/otp-challenge.entity';
import type { OtpStore } from '../../domain/use-cases/ports';

interface StoredOtp {
  readonly hashedCode: string;
  readonly attempts: number;
  readonly expiresAt: string;
}

@Injectable()
export class RedisOtpStore implements OtpStore, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('redis.url');
    if (!url) throw new Error('redis.url config is required');
    this.redis = new Redis(url);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private key(email: string): string {
    return `otp:${email}`;
  }

  private serialize(challenge: OtpChallenge): string {
    const value: StoredOtp = {
      hashedCode: challenge.hashedCode,
      attempts: challenge.attempts,
      expiresAt: challenge.expiresAt.toISOString(),
    };
    return JSON.stringify(value);
  }

  async set(email: string, challenge: OtpChallenge): Promise<void> {
    const ttlMs = challenge.expiresAt.getTime() - Date.now();
    const ttlSecs = Math.max(1, Math.ceil(ttlMs / 1000));
    await this.redis.set(
      this.key(email),
      this.serialize(challenge),
      'EX',
      ttlSecs,
    );
  }

  async get(email: string): Promise<OtpChallenge | null> {
    const raw = await this.redis.get(this.key(email));
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredOtp;
    return OtpChallenge.reconstitute({
      hashedCode: stored.hashedCode,
      attempts: stored.attempts,
      expiresAt: new Date(stored.expiresAt),
    });
  }

  async delete(email: string): Promise<void> {
    await this.redis.del(this.key(email));
  }

  async update(email: string, challenge: OtpChallenge): Promise<void> {
    const ttl = await this.redis.ttl(this.key(email));
    const remainingSecs = ttl > 0 ? ttl : 1;
    await this.redis.set(
      this.key(email),
      this.serialize(challenge),
      'EX',
      remainingSecs,
    );
  }
}
