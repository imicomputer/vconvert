import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { getVideoConverterService } from '../utils/container.js';
import { fileCleanupManager } from '../services/FileCleanupManager.js';
import { AppError } from '../utils/errors.js';
import { parse } from 'node:path';

/**
 * DownloadController: Handles file download and cleanup integration
 */
export class DownloadController {
  /**
   * GET /api/download/:jobId
   * Downloads converted file and resets TTL
   */
  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      logger.debug(`[DownloadController] GET /api/download/${jobId}`);

      // Check if job exists
      const converterService = getVideoConverterService();
      const job = converterService.getJobStatus(jobId);

      if (!job) {
        throw new AppError(`Job not found: ${jobId}`, 'JOB_NOT_FOUND', 404);
      }

      if (job.status !== 'completed') {
        throw new AppError(
          `Job not completed (status: ${job.status})`,
          'JOB_NOT_READY',
          400
        );
      }

      // Check if file exists in cleanup manager
      const managedFile = fileCleanupManager.getFile(jobId);
      if (!managedFile) {
        throw new AppError(`File not found: ${jobId}`, 'FILE_NOT_FOUND', 404);
      }

      // Reset TTL on download (Property 6)
      fileCleanupManager.resetTTL(jobId);
      logger.debug(`[DownloadController] TTL reset for ${jobId}`);

      // Send file
      const baseName = parse(job.originalFilename ?? '').name || 'converted';
      res.download(managedFile.path, `${baseName}.${job.targetFormat}`, (error) => {
        if (error) {
          logger.error(`[DownloadController] Download error for ${jobId}: ${error.message}`);
        } else {
          logger.info(`[DownloadController] Downloaded file: ${jobId}`);
        }
      });
    } catch (error) {
      logger.error(`[DownloadController] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const appError = error instanceof AppError ? error : 
        new AppError('Download failed', 'DOWNLOAD_ERROR', 500);
      res.status(appError.statusCode).json(appError.toJSON());
    }
  }
}
