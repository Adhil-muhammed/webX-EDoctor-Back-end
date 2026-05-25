import { Controller, Post } from '@nestjs/common';

@Controller('bookings')
export class BookingController {
  @Post()
  createBooking(): { status: 'accepted' } {
    return { status: 'accepted' };
  }
}
