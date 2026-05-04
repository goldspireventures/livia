export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export class AppError extends Error {
  code: AppErrorCode;
  status: number;

  constructor(code: AppErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function badRequest(message: string) {
  return new AppError("BAD_REQUEST", message, 400);
}

export function unauthorized(message = "Unauthorized") {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Forbidden") {
  return new AppError("FORBIDDEN", message, 403);
}

export function notFound(message = "Not found") {
  return new AppError("NOT_FOUND", message, 404);
}

export function conflict(message = "Conflict") {
  return new AppError("CONFLICT", message, 409);
}

