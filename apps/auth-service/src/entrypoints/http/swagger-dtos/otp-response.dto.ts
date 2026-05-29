import { ApiProperty } from '@nestjs/swagger';
import type { OtpResponseDto as IOtpResponseDto } from '@ente-doctor/contracts';

export class OtpResponseDto implements IOtpResponseDto {
  @ApiProperty({ example: 300, description: 'Number of seconds until the OTP expires' })
  readonly expiresInSeconds!: number;
}
