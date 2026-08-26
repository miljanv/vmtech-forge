export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(options: {
    code: string;
    status?: number;
    message: string;
    userMessage: string;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status ?? 400;
    this.userMessage = options.userMessage;
    this.details = options.details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super({
      code: "UNAUTHORIZED",
      status: 401,
      message,
      userMessage: "Morate biti prijavljeni da biste nastavili.",
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden.") {
    super({
      code: "FORBIDDEN",
      status: 403,
      message,
      userMessage: "Nemate dozvolu za ovu akciju.",
    });
  }
}

export class NotFoundError extends AppError {
  constructor(userMessage = "Traženi zapis nije pronađen.") {
    super({
      code: "NOT_FOUND",
      status: 404,
      message: "Resource not found.",
      userMessage,
    });
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super({
      code: "RATE_LIMITED",
      status: 429,
      message: "Rate limited.",
      userMessage: "Previše zahteva. Sačekajte trenutak i pokušajte ponovo.",
    });
  }
}

export function toUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  return "Došlo je do greške. Pokušajte ponovo.";
}

export function toJobErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (error instanceof Error && error.message.trim()) {
    return redactSecrets(error.message).slice(0, 400);
  }
  return "Generisanje nije uspelo. Detalji su sačuvani u dnevniku.";
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(sk_|pk_|tr_|whsec_|AKIA)[A-Za-z0-9_-]+/g, "$1[REDACTED]")
    .replace(/(api[_-]?key|secret|password|token)=([^&\s]+)/gi, "$1=[REDACTED]");
}
