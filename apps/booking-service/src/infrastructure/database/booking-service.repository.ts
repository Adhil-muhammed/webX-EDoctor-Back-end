import type { BookingServiceModel } from './booking-service.model';

export class BookingServiceRepository {
  async findById(id: string): Promise<BookingServiceModel | null> {
    void id;
    return null;
  }
}
