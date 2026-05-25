import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingServiceHealthController } from './entrypoints/http/booking-service.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [BookingServiceHealthController],
})
class BookingServiceModule {}

export function createBookingServiceModule(): typeof BookingServiceModule {
  return BookingServiceModule;
}
