import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConsoleLogger, type Logger } from '@ente-doctor/common';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { redisConfig } from './config/redis.config';
import { RefreshTokenUseCase } from './domain/use-cases/refresh-token.use-case';
import { RequestOtpUseCase } from './domain/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './domain/use-cases/verify-otp.use-case';
import {
  AUTH_LOGGER,
  AUTH_USER_REPOSITORY,
  NOTIFICATION_PUBLISHER,
  OTP_HASHER,
  OTP_STORE,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_ISSUER,
  type AuthUserRepository,
  type NotificationPublisher,
  type OtpHasher,
  type OtpStore,
  type RefreshTokenRepository,
  type TokenIssuer,
} from './domain/use-cases/ports';
import {
  REFRESH_TOKEN_USE_CASE,
  REQUEST_OTP_USE_CASE,
  VERIFY_OTP_USE_CASE,
} from './domain/use-cases/use-case-tokens';
import { AuthServiceHealthController } from './entrypoints/http/auth-service.controller';
import { AuthController } from './entrypoints/http/auth.controller';
import { AuthUserPostgresRepository } from './infrastructure/database/auth-user.repository';
import { PgPoolProvider } from './infrastructure/database/pg-pool.provider';
import { RefreshTokenPostgresRepository } from './infrastructure/database/refresh-token.repository';
import { BcryptHasher } from './infrastructure/external-services/bcrypt-hasher';
import {
  AUTH_KAFKA_CLIENT,
  KafkaNotificationPublisher,
} from './infrastructure/external-services/kafka-notification.publisher';
import { JwtTokenIssuer } from './infrastructure/external-services/jwt-token.issuer';
import { RedisOtpStore } from './infrastructure/external-services/redis-otp.store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, jwtConfig],
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.privateKey'),
        signOptions: {
          expiresIn: config.get<number>('jwt.expirySeconds'),
        },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_KAFKA_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth-service',
              brokers: (
                config.get<string>('KAFKA_BROKERS') ?? 'localhost:9094'
              ).split(','),
            },
            producerOnlyMode: true,
          },
        }),
      },
    ]),
  ],
  controllers: [AuthServiceHealthController, AuthController],
  providers: [
    // ── Infrastructure — NestJS resolves these by class metadata ──────────
    PgPoolProvider,
    AuthUserPostgresRepository,
    RefreshTokenPostgresRepository,
    RedisOtpStore,
    JwtTokenIssuer,
    KafkaNotificationPublisher,
    BcryptHasher,
    { provide: AUTH_LOGGER, useValue: new ConsoleLogger() },

    // ── Port-token aliases (useExisting avoids double instantiation) ──────
    { provide: AUTH_USER_REPOSITORY, useExisting: AuthUserPostgresRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useExisting: RefreshTokenPostgresRepository,
    },
    { provide: OTP_STORE, useExisting: RedisOtpStore },
    { provide: TOKEN_ISSUER, useExisting: JwtTokenIssuer },
    { provide: NOTIFICATION_PUBLISHER, useExisting: KafkaNotificationPublisher },
    { provide: OTP_HASHER, useExisting: BcryptHasher },

    // ── Use Cases — domain classes stay NestJS-free; factories are trivial ─
    {
      provide: REQUEST_OTP_USE_CASE,
      inject: [
        AUTH_USER_REPOSITORY,
        OTP_STORE,
        NOTIFICATION_PUBLISHER,
        OTP_HASHER,
        AUTH_LOGGER,
      ],
      useFactory: (
        userRepo: AuthUserRepository,
        otpStore: OtpStore,
        publisher: NotificationPublisher,
        hasher: OtpHasher,
        logger: Logger,
      ) => new RequestOtpUseCase(userRepo, otpStore, publisher, hasher, logger),
    },
    {
      provide: VERIFY_OTP_USE_CASE,
      inject: [
        AUTH_USER_REPOSITORY,
        OTP_STORE,
        REFRESH_TOKEN_REPOSITORY,
        TOKEN_ISSUER,
        OTP_HASHER,
        AUTH_LOGGER,
      ],
      useFactory: (
        userRepo: AuthUserRepository,
        otpStore: OtpStore,
        refreshRepo: RefreshTokenRepository,
        tokenIssuer: TokenIssuer,
        hasher: OtpHasher,
        logger: Logger,
      ) =>
        new VerifyOtpUseCase(
          userRepo,
          otpStore,
          refreshRepo,
          tokenIssuer,
          hasher,
          logger,
        ),
    },
    {
      provide: REFRESH_TOKEN_USE_CASE,
      inject: [
        AUTH_USER_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        TOKEN_ISSUER,
        AUTH_LOGGER,
      ],
      useFactory: (
        userRepo: AuthUserRepository,
        refreshRepo: RefreshTokenRepository,
        tokenIssuer: TokenIssuer,
        logger: Logger,
      ) => new RefreshTokenUseCase(userRepo, refreshRepo, tokenIssuer, logger),
    },
  ],
})
class AuthServiceModule {}

export function createAuthServiceModule(): typeof AuthServiceModule {
  return AuthServiceModule;
}
