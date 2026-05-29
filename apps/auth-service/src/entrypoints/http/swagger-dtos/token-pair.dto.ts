import { ApiProperty } from '@nestjs/swagger';
import type { TokenPairDto as ITokenPairDto } from '@ente-doctor/contracts';

export class TokenPairDto implements ITokenPairDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Short-lived JWT access token' })
  readonly accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Long-lived refresh token' })
  readonly refreshToken!: string;
}
