import { registerAs } from '@nestjs/config';
import type { RetryOptions } from 'kafkajs';

export const KAFKA_CLIENT_RETRY: RetryOptions = {
  retries: 5,
  initialRetryTime: 1000,
  factor: 2,
  maxRetryTime: 30_000,
};

export interface KafkaConfig {
  readonly brokers: string[];
  readonly clientId: string;
  readonly groupId: string;
  readonly dltGroupId: string;
}

export const kafkaConfig = registerAs(
  'kafka',
  (): KafkaConfig => ({
    brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9094').split(','),
    clientId: 'notification-service',
    groupId: 'notification-service-group',
    dltGroupId: 'notification-dlt-group',
  }),
);
