import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
});

export default app;
