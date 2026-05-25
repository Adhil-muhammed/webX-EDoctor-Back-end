export const EventTopics = {
  appointmentCreated: 'appointment.created',
  slotBlocked: 'slot.blocked',
  providerLeaveCreated: 'provider.leave.created',
  notificationRequested: 'notification.requested',
} as const;

export type EventTopic = (typeof EventTopics)[keyof typeof EventTopics];

export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly topic: EventTopic;
  readonly occurredAt: string;
  readonly payload: TPayload;
}

export interface AppointmentCreatedPayload {
  readonly bookingId: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly startsAt: string;
}

export type AppointmentCreatedEvent = DomainEvent<AppointmentCreatedPayload>;
