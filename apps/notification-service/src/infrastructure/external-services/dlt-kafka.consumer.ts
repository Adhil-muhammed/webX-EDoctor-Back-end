import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Consumer } from 'kafkajs';
import type { Logger } from '@ente-doctor/common';
import { EventTopics } from '@ente-doctor/event-bus';
import type { KafkaConfig } from '../../config/kafka.config';
import { NOTIFICATION_LOGGER } from '../../domain/use-cases/ports';

@Injectable()
export class DltKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;

  constructor(
    private readonly config: ConfigService,
    @Inject(NOTIFICATION_LOGGER) private readonly logger: Logger,
  ) {
    const kafkaCfg = this.config.get<KafkaConfig>('kafka')!;
    const kafka = new Kafka({
      clientId: `${kafkaCfg.clientId}-dlt-consumer`,
      brokers: kafkaCfg.brokers,
      retry: { retries: 5, initialRetryTime: 300, factor: 2 },
    });
    this.consumer = kafka.consumer({ groupId: kafkaCfg.dltGroupId });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: EventTopics.notificationRequestedDlt,
      fromBeginning: true,
    });

    await this.consumer.run({
      // DLT is observe-only — autoCommit is safe here
      autoCommit: true,
      eachMessage: async ({ message }) => {
        const headers = message.headers ?? {};
        const failureReason = headers['failure-reason']?.toString() ?? 'unknown';
        const failedAt = headers['failed-at']?.toString() ?? 'unknown';
        const originalTopic = headers['original-topic']?.toString() ?? 'unknown';
        const retryCount = headers['retry-count']?.toString() ?? '0';
        const payload = message.value?.toString() ?? '{}';

        this.logger.error(
          `[DltKafkaConsumer] dead-letter received` +
            ` | topic="${originalTopic}"` +
            ` | failed-at="${failedAt}"` +
            ` | retries="${retryCount}"` +
            ` | reason="${failureReason}"` +
            ` | payload=${payload}`,
        );

        await this.triggerAlert({
          failureReason,
          failedAt,
          originalTopic,
          retryCount: Number(retryCount),
          payload,
        });

        await this.scheduleReplay({
          failureReason,
          originalTopic,
          payload,
        });
      },
    });

    this.logger.info(
      `[DltKafkaConsumer] subscribed to "${EventTopics.notificationRequestedDlt}"`,
    );
  }

  // Placeholder: wire to Slack / PagerDuty / SNS in production
  private async triggerAlert(context: {
    failureReason: string;
    failedAt: string;
    originalTopic: string;
    retryCount: number;
    payload: string;
  }): Promise<void> {
    void context;
    // TODO: POST to alerting webhook
  }

  // Placeholder: push to a replay queue or write to a replay table
  private async scheduleReplay(context: {
    failureReason: string;
    originalTopic: string;
    payload: string;
  }): Promise<void> {
    void context;
    // TODO: enqueue for manual replay
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    this.logger.info('[DltKafkaConsumer] disconnected');
  }
}
