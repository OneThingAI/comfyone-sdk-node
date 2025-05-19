export class APIError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class AuthenticationError extends APIError {
  constructor(code: number, message: string) {
    super(code, message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
} 