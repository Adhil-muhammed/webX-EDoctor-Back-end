import { randomUUID } from 'node:crypto';
import type { Logger } from '@ente-doctor/common';
import { AuthUser } from '../entities/auth-user.entity';
import { OtpChallenge } from '../entities/otp-challenge.entity';
import type {
  AuthUserRepository,
  NotificationPublisher,
  OtpHasher,
  OtpStore,
} from './ports';

export interface RequestOtpCommand {
  readonly email: string;
}

export interface RequestOtpResult {
  readonly expiresInSeconds: number;
}

const OTP_TTL_SECONDS = 600;
const OTP_DIGITS = 6;

function generateOtpCode(): string {
  const value = Math.floor(Math.random() * 10 ** OTP_DIGITS);
  return value.toString().padStart(OTP_DIGITS, '0');
}

export class RequestOtpUseCase {
  constructor(
    private readonly userRepo: AuthUserRepository,
    private readonly otpStore: OtpStore,
    private readonly notificationPublisher: NotificationPublisher,
    private readonly hasher: OtpHasher,
    private readonly logger: Logger,
  ) {}

  async execute(command: RequestOtpCommand): Promise<RequestOtpResult> {
    const { email } = command;

    let user = await this.userRepo.findByEmail(email);
    if (!user) {
      user = AuthUser.create(randomUUID(), email);
      await this.userRepo.save(user);
      this.logger.info('New auth user created', { userId: user.id, email });
    }

    const code = generateOtpCode();
    const hashedCode = await this.hasher.hash(code);
    const challenge = OtpChallenge.create(hashedCode, OTP_TTL_SECONDS);

    await this.otpStore.set(email, challenge);

    await this.notificationPublisher.requestOtpEmail(email, code);

    this.logger.info('OTP challenge stored and notification dispatched', {
      email,
    });

    return { expiresInSeconds: OTP_TTL_SECONDS };
  }
}
