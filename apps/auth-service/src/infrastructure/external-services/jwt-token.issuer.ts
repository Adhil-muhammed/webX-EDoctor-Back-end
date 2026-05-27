import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenIssuer } from '../../domain/use-cases/ports';

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(private readonly jwtService: JwtService) {}

  issueAccessToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  issueRefreshTokenString(): string {
    return randomBytes(48).toString('base64url');
  }
}
