export type EmailTemplate = 'otp' | 'welcome' | 'appointment-reminder';

export interface SendEmailCommand {
  readonly to: string;
  readonly template: EmailTemplate;
  readonly data: Record<string, string>;
}

export interface MailSender {
  send(command: SendEmailCommand): Promise<void>;
}

export const MAIL_SENDER = Symbol('MailSender');
export const NOTIFICATION_LOGGER = Symbol('NotificationLogger');
