import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  EventTopics,
  type NotificationRequestedEvent,
} from '@ente-doctor/event-bus';
import type { NotificationPublisher } from '../../domain/use-cases/ports';

export const AUTH_KAFKA_CLIENT = 'AUTH_KAFKA_CLIENT';

@Injectable()
export class KafkaNotificationPublisher implements NotificationPublisher {
  constructor(
    @Inject(AUTH_KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async requestOtpEmail(email: string, code: string): Promise<void> {
    const event: NotificationRequestedEvent = {
      id: randomUUID(),
      topic: EventTopics.notificationRequested,
      occurredAt: new Date().toISOString(),
      payload: {
        channel: 'email',
        recipient: email,
        template: 'otp',
        data: { code },
      },
    };
    this.kafkaClient.emit(EventTopics.notificationRequested, event);
  }
}
