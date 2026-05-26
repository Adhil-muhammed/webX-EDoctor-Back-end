---
name: add-kafka-event
description: Workflow for adding a new Kafka event to the Ente Doctor system. Use when the user asks to publish a new event, add a Kafka topic, create an event payload type, or wire a new event consumer in any service. Touches both packages/event-bus and the consuming service.
paths:
  - "packages/event-bus/src/**/*.ts"
  - "apps/**/src/entrypoints/event-consumers/**/*.ts"
---

# Add Kafka Event

A step-by-step workflow for introducing a new Kafka event across the monorepo. This touches the shared `@ente-doctor/event-bus` package and the consuming service's entrypoint layer.

## When to Use

- User asks to emit a new domain event from a service.
- User asks to add a consumer for a new topic.
- User asks to add a new Kafka message type.

## Pre-Flight Questions

Ask the user before starting if any of the following are unclear:

1. What is the business event name (e.g., `AppointmentCancelled`, `ProviderAvailable`)?
2. Which service **publishes** it?
3. Which service(s) **consume** it?
4. What data goes in the payload?

## Step-by-Step Instructions

### Step 1 — Register the Topic in `@ente-doctor/event-bus`

File: `packages/event-bus/src/index.ts`

- Add the new topic to `EventTopics` as a new key with a dot-separated lowercase string value.
  ```typescript
  export const EventTopics = {
    // ... existing topics ...
    appointmentCancelled: 'appointment.cancelled',
  } as const;
  ```
- The topic string must be dot-separated lowercase. Never use underscores or camelCase.

### Step 2 — Define the Payload Interface

File: `packages/event-bus/src/index.ts` (same file, below `EventTopics`)

- Add `export interface <EventName>Payload { readonly <field>: <type>; ... }`.
- All fields must be `readonly` and serializable to JSON (strings, numbers, ISO date strings — no `Date` objects).
- Add a typed event alias: `export type <EventName>Event = DomainEvent<<EventName>Payload>`.

### Step 3 — Build `@ente-doctor/event-bus`

Run `pnpm --filter @ente-doctor/event-bus build` to emit updated declaration files before the consuming service can use the new types.

### Step 4 — Create the Consumer in the Consuming Service

File: `apps/<consuming-service>/src/entrypoints/event-consumers/<topic-slug>.consumer.ts`

- Class name: `<EventName>Consumer`.
- Define a handler method that accepts a `DomainEvent<<EventName>Payload>` parameter.
- Delegate business logic to an injected use case. The consumer must contain zero business rules.
- Use `EventTopics.<key>` to reference the topic — never the literal string.

```typescript
import { EventTopics, type <EventName>Event } from '@ente-doctor/event-bus';

export class <EventName>Consumer {
  async handle(event: <EventName>Event): Promise<void> {
    // delegate to a use case
    void event;
  }
}
```

### Step 5 — Wire the Publisher (if a service needs to emit this event)

- In the publishing service, the infrastructure adapter or use case must wrap the payload in a `DomainEvent<T>` envelope:
  ```typescript
  const event: <EventName>Event = {
    id: crypto.randomUUID(),
    topic: EventTopics.<key>,
    occurredAt: new Date().toISOString(),
    payload: { ... },
  };
  ```
- Kafka producer wiring will be addressed separately when a real producer adapter is added to `infrastructure/external-services/`.

### Step 6 — Module Wiring

- Only after the consumer handler is fully implemented (not a stub), add it to `providers` in the consuming service's `app.ts`.
- Do not register stub consumers in the `@Module`.

## Constraints

- The `@ente-doctor/event-bus` package must stay zero-dependency. Never add a runtime import to it.
- Never hardcode topic strings anywhere except `EventTopics` in `packages/event-bus/src/index.ts`.
- Run `pnpm --filter @ente-doctor/event-bus lint` and `pnpm --filter @ente-doctor/<consuming-service> lint` after completing all steps.
