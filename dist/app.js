import express from 'express';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';
import apiRoutes from './routes/api.js';
import { config } from './config.js';
import { openApiDocument } from './swagger.js';
const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
// Request logging
app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
});
// API Routes
app.use('/api', apiRoutes);
// Swagger is available only in development environments.
if (config.nodeEnv === 'development') {
    app.get('/api-docs/openapi.json', (req, res) => {
        res.json(openApiDocument);
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
        customSiteTitle: 'Video Converter API Documentation'
    }));
}
// Static files
app.use(express.static('public'));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route not found: ${req.method} ${req.path}`,
        code: 'NOT_FOUND'
    });
});
// Error handler
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        const appError = new AppError('Uploaded file exceeds the maximum allowed size', 'FILE_TOO_LARGE', 413);
        res.status(appError.statusCode).json(appError.toJSON());
        return;
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json(err.toJSON());
    }
    else {
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});
export default app;
//# sourceMappingURL=app.js.map