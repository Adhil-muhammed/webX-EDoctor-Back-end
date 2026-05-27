export class PermanentMailError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'PermanentMailError';
  }
}

export class TransientMailError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'TransientMailError';
  }
}

// SMTP error codes that can never be resolved by retrying the same message.
// EAUTH     — authentication failure (wrong credentials)
// EENVELOPE — bad envelope (invalid from/to address syntax)
// ENORECIPIENTS — no valid recipients
const PERMANENT_CODES = new Set(['EAUTH', 'EENVELOPE', 'ENORECIPIENTS']);

interface SmtpErrorLike {
  code?: string;
  responseCode?: number;
  message?: string;
}

export function classifySmtpError(
  err: unknown,
): PermanentMailError | TransientMailError {
  const cast = err as SmtpErrorLike;
  const code = cast.code ?? '';
  const message = err instanceof Error ? err.message : String(err);

  // SMTP 5xx permanent failures (e.g. 550 user not found, 535 auth failure)
  const isPermanentResponseCode =
    typeof cast.responseCode === 'number' && cast.responseCode >= 500;

  if (PERMANENT_CODES.has(code) || isPermanentResponseCode) {
    return new PermanentMailError(message, code);
  }

  return new TransientMailError(message, code);
}
