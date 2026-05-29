import { ApiProperty } from '@nestjs/swagger';
import type { RefreshTokenDto as IRefreshTokenDto } from '@ente-doctor/contracts';

export class RefreshTokenDto implements IRefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh token issued on login' })
  readonly refreshToken!: string;
}
