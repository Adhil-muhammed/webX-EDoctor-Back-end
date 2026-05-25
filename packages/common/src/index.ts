export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>): void {
    console.info(message, context ?? {});
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(message, context ?? {});
  }
}

export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}
