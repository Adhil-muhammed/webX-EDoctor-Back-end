import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleLogger, type Logger } from '@ente-doctor/common';
import { mailConfig } from './config/mail.config';
import { kafkaConfig } from './config/kafka.config';
import { SendEmailUseCase } from './domain/use-cases/send-email.use-case';
import {
  MAIL_SENDER,
  NOTIFICATION_LOGGER,
  type MailSender,
} from './domain/use-cases/ports';
import { SEND_EMAIL_USE_CASE } from './domain/use-cases/use-case-tokens';
import { NotificationServiceHealthController } from './entrypoints/http/notification-service.controller';
import { NodemailerAdapter } from './infrastructure/external-services/nodemailer.adapter';
import { KafkaDltProducer } from './infrastructure/external-services/kafka-dlt.producer';
import { NotificationKafkaConsumer } from './infrastructure/external-services/notification-kafka.consumer';
import { DltKafkaConsumer } from './infrastructure/external-services/dlt-kafka.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [mailConfig, kafkaConfig] }),
  ],
  controllers: [
    NotificationServiceHealthController,
  ],
  providers: [
    // ── Infrastructure — NestJS resolves these by class metadata ──────────
    NodemailerAdapter,
    KafkaDltProducer,
    NotificationKafkaConsumer,
    DltKafkaConsumer,
    { provide: NOTIFICATION_LOGGER, useValue: new ConsoleLogger() },

    // ── Port-token aliases (useExisting avoids double instantiation) ──────
    { provide: MAIL_SENDER, useExisting: NodemailerAdapter },

    // ── Use cases — domain classes stay NestJS-free; factories are trivial ─
    {
      provide: SEND_EMAIL_USE_CASE,
      inject: [MAIL_SENDER, NOTIFICATION_LOGGER],
      useFactory: (mailer: MailSender, logger: Logger) =>
        new SendEmailUseCase(mailer, logger),
    },
  ],
})
class NotificationServiceModule {}

export function createNotificationServiceModule(): typeof NotificationServiceModule {
  return NotificationServiceModule;
}
