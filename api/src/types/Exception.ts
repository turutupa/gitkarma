export class HttpException extends Error {
  statusCode: number;
  name: string;
  constructor(statusCode, message, name?: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = name || "";
    Error.captureStackTrace(this, this.constructor);
  }
}
