import { registerAs } from '@nestjs/config';

export interface MailConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly pass: string;
  readonly fromName: string;
  readonly fromAddress: string;
}

export const mailConfig = registerAs(
  'mail',
  (): MailConfig => ({
    host: process.env['MAIL_HOST'] ?? 'smtp.gmail.com',
    port: Number(process.env['MAIL_PORT'] ?? 465),
    secure: (process.env['MAIL_SECURE'] ?? 'true') === 'true',
    user: process.env['MAIL_USER'] ?? '',
    pass: process.env['MAIL_PASS'] ?? '',
    fromName: process.env['MAIL_FROM_NAME'] ?? 'Ente Doctor',
    fromAddress: process.env['MAIL_FROM_ADDRESS'] ?? '',
  }),
);
