import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { OtpHasher } from '../../domain/use-cases/ports';

const BCRYPT_ROUNDS = 8;

@Injectable()
export class BcryptHasher implements OtpHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
