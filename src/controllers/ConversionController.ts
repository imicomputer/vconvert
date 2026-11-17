import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { getVideoConverterService, getStrategyRegistry } from '../utils/container.js';
import { AppError } from '../utils/errors.js';
import { fileCleanupManager } from '../services/FileCleanupManager.js';

/**
 * ConversionController: Handles video conversion requests
 */
export class ConversionController {
  /**
   * POST /api/convert
   * Accepts file upload and starts conversion
   */
  static async startConversion(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('[ConversionController] POST /api/convert');

      // Validate file exists
      if (!req.file) {
        throw new AppError('No file uploaded', 'NO_FILE', 400);
      }

      // Validate targetFormat query parameter
      const targetFormat = req.query.targetFormat as string;
      if (!targetFormat) {
        throw new AppError('targetFormat query parameter required', 'MISSING_FORMAT', 400);
      }

      // Validate file size
      if (req.file.size > config.maxFileSize) {
        throw new AppError(
          `File size ${req.file.size} exceeds maximum ${config.maxFileSize}`,
          'FILE_TOO_LARGE',
          413
        );
      }

      // Validate target format is supported
      const strategyRegistry = getStrategyRegistry();
      if (!strategyRegistry.isFormatSupported(targetFormat)) {
        throw new AppError(
          `Format not supported: ${targetFormat}. Supported: ${strategyRegistry.getSupportedFormats().join(', ')}`,
          'UNSUPPORTED_FORMAT',
          400
        );
      }

      // Extract input format from uploaded filename
      const inputFilename = req.file.originalname;
      const inputExtMatch = inputFilename.match(/\.([^.]+)$/);
      const inputFormat = inputExtMatch ? inputExtMatch[1].toLowerCase() : '';

      // Validate target format != input format
      if (inputFormat.toLowerCase() === targetFormat.toLowerCase()) {
        throw new AppError(
          `Target format must differ from input format (${inputFormat})`,
          'SAME_FORMAT',
          400
        );
      }

      // Create unique job ID
      const jobId = uuidv4();
      const inputPath = req.file.path;
      const outputPath = `${config.uploadDir}/${jobId}.${targetFormat}`;

      logger.info(`[ConversionController] Starting conversion: ${jobId}`);
      logger.debug(`[ConversionController] Input: ${inputPath} → Output: ${outputPath}`);

      // Start async conversion (fire-and-forget)
      const converterService = getVideoConverterService();
      converterService.convert(jobId, inputPath, outputPath, targetFormat, (job) => {
        if (job.status === 'completed') {
          fileCleanupManager.registerFile(jobId, outputPath);
        }
        logger.debug(`[ConversionController] Job ${jobId} progress: ${job.progress}%`);
      }).catch((error) => {
        logger.error(`[ConversionController] Conversion failed for ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });

      // Return job ID immediately
      res.json({ jobId });
    } catch (error) {
      logger.error(`[ConversionController] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const appError = error instanceof AppError ? error : 
        new AppError('Conversion start failed', 'CONVERSION_ERROR', 500);
      res.status(appError.statusCode).json(appError.toJSON());
    }
  }
}
