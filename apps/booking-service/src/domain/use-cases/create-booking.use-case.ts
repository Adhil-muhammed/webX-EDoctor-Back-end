export interface CreateBookingCommand {
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: Date;
}

export class CreateBookingUseCase {
  async execute(command: CreateBookingCommand): Promise<void> {
    void command;
  }
}
