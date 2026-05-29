import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Partitioners, type Producer } from 'kafkajs';
import type { Logger } from '@ente-doctor/common';
import { EventTopics, type NotificationRequestedEvent } from '@ente-doctor/event-bus';
import { KAFKA_CLIENT_RETRY, type KafkaConfig } from '../../config/kafka.config';
import { NOTIFICATION_LOGGER } from '../../domain/use-cases/ports';

@Injectable()
export class KafkaDltProducer implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;

  constructor(
    private readonly config: ConfigService,
    @Inject(NOTIFICATION_LOGGER) private readonly logger: Logger,
  ) {
    const kafkaCfg = this.config.get<KafkaConfig>('kafka')!;
    const kafka = new Kafka({
      clientId: `${kafkaCfg.clientId}-dlt-producer`,
      brokers: kafkaCfg.brokers,
      retry: KAFKA_CLIENT_RETRY,
    });
    this.producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.info('[KafkaDltProducer] connected');
  }

  async sendToDlt(
    event: NotificationRequestedEvent,
    failureReason: string,
    retryCount: number,
  ): Promise<void> {
    await this.producer.send({
      topic: EventTopics.notificationRequestedDlt,
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event),
          headers: {
            'failure-reason': failureReason,
            'failed-at': new Date().toISOString(),
            'original-topic': EventTopics.notificationRequested,
            'retry-count': String(retryCount),
          },
        },
      ],
    });
    this.logger.info(
      `[KafkaDltProducer] event id="${event.id}" sent to DLT after ${retryCount} attempt(s): ${failureReason}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    this.logger.info('[KafkaDltProducer] disconnected');
  }
}
