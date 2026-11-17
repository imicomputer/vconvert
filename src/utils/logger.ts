export class Logger {
  debug(message: string, context?: any) {
    console.log(`[DEBUG] ${message}`, context || '');
  }

  info(message: string, context?: any) {
    console.log(`[INFO] ${message}`, context || '');
  }

  warn(message: string, context?: any) {
    console.warn(`[WARN] ${message}`, context || '');
  }

  error(message: string, context?: any) {
    console.error(`[ERROR] ${message}`, context || '');
  }
}

export const logger = new Logger();
