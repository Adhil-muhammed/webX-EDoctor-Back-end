import { ApiProperty } from '@nestjs/swagger';
import type { RequestOtpDto as IRequestOtpDto } from '@ente-doctor/contracts';

export class RequestOtpDto implements IRequestOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send the OTP to' })
  readonly email!: string;
}
