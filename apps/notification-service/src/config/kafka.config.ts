import { registerAs } from '@nestjs/config';

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
