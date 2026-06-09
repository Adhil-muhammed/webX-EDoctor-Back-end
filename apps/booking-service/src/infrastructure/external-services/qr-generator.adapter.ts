export class QrGeneratorAdapter {
  async createBookingQrCode(bookingId: string): Promise<string> {
    return `booking:${bookingId}`;
  }
}
