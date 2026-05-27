import type { Logger } from '@ente-doctor/common';
import type { MailSender, SendEmailCommand } from './ports';

export class SendEmailUseCase {
  constructor(
    private readonly mailer: MailSender,
    private readonly logger: Logger,
  ) {}

  async execute(command: SendEmailCommand): Promise<void> {
    this.logger.info(
      `[SendEmailUseCase] dispatching template="${command.template}" to="${command.to}"`,
    );
    await this.mailer.send(command);
  }
}
