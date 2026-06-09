import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { Logger } from '@ente-doctor/common';
import type { MailSender, SendEmailCommand } from '../../domain/use-cases/ports';
import type { MailConfig } from '../../config/mail.config';
import { NOTIFICATION_LOGGER } from '../../domain/use-cases/ports';
import { renderTemplate } from './templates/index';
import { classifySmtpError } from './smtp-errors';

@Injectable()
export class NodemailerAdapter implements MailSender, OnModuleDestroy {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(
    private readonly config: ConfigService,
    @Inject(NOTIFICATION_LOGGER) private readonly logger: Logger,
  ) {
    const mail = this.config.get<MailConfig>('mail')!;
    this.fromAddress = `"${mail.fromName}" <${mail.fromAddress}>`;

    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 5_000,
    });
  }

  async send(command: SendEmailCommand): Promise<void> {
    const { subject, html } = renderTemplate(command.template, command.data);

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: command.to,
        subject,
        html,
      });
      this.logger.info(
        `[NodemailerAdapter] sent template="${command.template}" to="${command.to}"`,
      );
    } catch (err) {
      // Classify before rethrowing so the Kafka consumer can route correctly
      throw classifySmtpError(err);
    }
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}
