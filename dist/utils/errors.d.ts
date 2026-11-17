export declare class AppError extends Error {
    message: string;
    code: string;
    statusCode: number;
    timestamp: Date;
    constructor(message: string, code: string, statusCode?: number, timestamp?: Date);
    toJSON(): {
        error: string;
        message: string;
        code: string;
        timestamp: string;
    };
}
