// kernel 对外只抛这一种错误：code 稳定、可被 agent 按值分支，hint 告诉对方下一步做什么。
export class KinetoError extends Error {
  readonly code: string;
  readonly hint: string | undefined;
  readonly details: unknown;

  constructor(code: string, message: string, options: { hint?: string; details?: unknown; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "KinetoError";
    this.code = code;
    this.hint = options.hint;
    this.details = options.details;
  }
}

export const isNodeError = (err: unknown, code: string): boolean =>
  err instanceof Error && (err as NodeJS.ErrnoException).code === code;
