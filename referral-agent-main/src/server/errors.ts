export class ServiceError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
    this.name = 'ServiceError';
  }
}

export function safeError(error: unknown): { status: number; body: { error: string } } {
  return error instanceof ServiceError
    ? { status: error.status, body: { error: error.code } }
    : { status: 500, body: { error: 'internal_error' } };
}
