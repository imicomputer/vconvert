export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public timestamp: Date = new Date()
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString()
    };
  }
}
