import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Consumer } from 'kafkajs';
import type { Logger } from '@ente-doctor/common';
import { EventTopics, type NotificationRequestedEvent } from '@ente-doctor/event-bus';
import { KAFKA_CLIENT_RETRY, type KafkaConfig } from '../../config/kafka.config';
import { NOTIFICATION_LOGGER } from '../../domain/use-cases/ports';
import type { EmailTemplate } from '../../domain/use-cases/ports';
import { SendEmailUseCase } from '../../domain/use-cases/send-email.use-case';
import { SEND_EMAIL_USE_CASE } from '../../domain/use-cases/use-case-tokens';
import { KafkaDltProducer } from './kafka-dlt.producer';
import { PermanentMailError, TransientMailError } from './smtp-errors';

const MAX_PROCESSING_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 300;
const VALID_TEMPLATES = new Set<string>(['otp', 'welcome', 'appointment-reminder']);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class NotificationKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;

  constructor(
    private readonly config: ConfigService,
    @Inject(SEND_EMAIL_USE_CASE) private readonly sendEmail: SendEmailUseCase,
    private readonly dltProducer: KafkaDltProducer,
    @Inject(NOTIFICATION_LOGGER) private readonly logger: Logger,
  ) {
    const kafkaCfg = this.config.get<KafkaConfig>('kafka')!;
    const kafka = new Kafka({
      clientId: kafkaCfg.clientId,
      brokers: kafkaCfg.brokers,
      // Network-level retry — not message processing retry
      retry: KAFKA_CLIENT_RETRY,
    });
    this.consumer = kafka.consumer({ groupId: kafkaCfg.groupId });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: EventTopics.notificationRequested,
      fromBeginning: false,
    });

    await this.consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        const raw = message.value?.toString();
        if (!raw) {
          await this.commitOffset(topic, partition, message.offset);
          return;
        }

        let event: NotificationRequestedEvent;
        try {
          event = JSON.parse(raw) as NotificationRequestedEvent;
        } catch {
          this.logger.error(
            `[NotificationKafkaConsumer] unparseable message at offset ${message.offset} — skipping to DLT`,
          );
          await this.commitOffset(topic, partition, message.offset);
          return;
        }

        const { channel, recipient, template, data } = event.payload;

        // Non-email channels are silently acked — other adapters will handle them
        if (channel !== 'email') {
          await this.commitOffset(topic, partition, message.offset);
          return;
        }

        // Unknown template is a permanent config error, route straight to DLT
        if (!VALID_TEMPLATES.has(template)) {
          this.logger.error(
            `[NotificationKafkaConsumer] unknown template "${template}" — routing to DLT`,
          );
          await this.dltProducer.sendToDlt(
            event,
            `Unknown template: ${template}`,
            0,
          );
          await this.commitOffset(topic, partition, message.offset);
          return;
        }

        await this.processWithRetry(
          event,
          { to: recipient, template: template as EmailTemplate, data },
          topic,
          partition,
          message.offset,
        );
      },
    });

    this.logger.info(
      `[NotificationKafkaConsumer] subscribed to "${EventTopics.notificationRequested}"`,
    );
  }

  private async processWithRetry(
    event: NotificationRequestedEvent,
    command: { to: string; template: EmailTemplate; data: Record<string, string> },
    topic: string,
    partition: number,
    offset: string,
  ): Promise<void> {
    for (let attempt = 1; attempt <= MAX_PROCESSING_ATTEMPTS; attempt++) {
      try {
        await this.sendEmail.execute(command);
        await this.commitOffset(topic, partition, offset);
        return;
      } catch (err) {
        if (err instanceof PermanentMailError) {
          this.logger.error(
            `[NotificationKafkaConsumer] permanent error for "${command.to}" (attempt ${attempt}): ${err.message} [${err.code}] — routing to DLT`,
          );
          await this.dltProducer.sendToDlt(event, err.message, attempt);
          await this.commitOffset(topic, partition, offset);
          return;
        }

        if (err instanceof TransientMailError) {
          if (attempt === MAX_PROCESSING_ATTEMPTS) {
            this.logger.error(
              `[NotificationKafkaConsumer] transient error exhausted ${MAX_PROCESSING_ATTEMPTS} attempts for "${command.to}": ${err.message} [${err.code}] — routing to DLT`,
            );
            await this.dltProducer.sendToDlt(event, err.message, attempt);
            await this.commitOffset(topic, partition, offset);
            return;
          }

          const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          this.logger.info(
            `[NotificationKafkaConsumer] transient error attempt ${attempt}/${MAX_PROCESSING_ATTEMPTS} for "${command.to}" — retrying in ${backoff}ms: ${err.message}`,
          );
          await sleep(backoff);
          continue;
        }

        // Unexpected error type — treat as transient to avoid data loss
        this.logger.error(
          `[NotificationKafkaConsumer] unexpected error type on attempt ${attempt}: ${String(err)}`,
        );
        if (attempt === MAX_PROCESSING_ATTEMPTS) {
          await this.dltProducer.sendToDlt(event, String(err), attempt);
          await this.commitOffset(topic, partition, offset);
          return;
        }
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  private async commitOffset(
    topic: string,
    partition: number,
    offset: string,
  ): Promise<void> {
    await this.consumer.commitOffsets([
      { topic, partition, offset: (BigInt(offset) + 1n).toString() },
    ]);
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    this.logger.info('[NotificationKafkaConsumer] disconnected');
  }
}
