import type { BookingModel } from './booking.model';

export class BookingRepository {
  async findById(id: string): Promise<BookingModel | null> {
    void id;
    return null;
  }
}
