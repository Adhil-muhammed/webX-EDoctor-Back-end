import { ApiProperty } from '@nestjs/swagger';
import type { VerifyOtpDto as IVerifyOtpDto } from '@ente-doctor/contracts';

export class VerifyOtpDto implements IVerifyOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address the OTP was sent to' })
  readonly email!: string;

  @ApiProperty({ example: '483920', description: '6-digit OTP code' })
  readonly code!: string;
}
