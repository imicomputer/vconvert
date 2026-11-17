export class Logger {
    debug(message, context) {
        console.log(`[DEBUG] ${message}`, context || '');
    }
    info(message, context) {
        console.log(`[INFO] ${message}`, context || '');
    }
    warn(message, context) {
        console.warn(`[WARN] ${message}`, context || '');
    }
    error(message, context) {
        console.error(`[ERROR] ${message}`, context || '');
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map