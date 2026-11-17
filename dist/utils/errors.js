export class AppError extends Error {
    constructor(message, code, statusCode = 500, timestamp = new Date()) {
        super(message);
        this.message = message;
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = timestamp;
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
//# sourceMappingURL=errors.js.map