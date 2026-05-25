export interface CancelBookingCommand {
  readonly bookingId: string;
  readonly reason?: string;
}

export class CancelBookingUseCase {
  async execute(command: CancelBookingCommand): Promise<void> {
    void command;
  }
}
