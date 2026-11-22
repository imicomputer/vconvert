import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { getVideoConverterService } from '../utils/container.js';
import { AppError } from '../utils/errors.js';

function toEventStatus(status: string): 'processing' | 'done' | 'error' {
  if (status === 'completed') return 'done';
  if (status === 'failed') return 'error';
  return 'processing';
}

function getPublicErrorMessage(errorCode: string | undefined): string {
  const messages: Record<string, string> = {
    PROBE_FAILED: 'The uploaded file could not be read as a video.',
    PROBE_PARSE_ERROR: 'The uploaded file could not be read as a video.',
    PROBE_TIMEOUT: 'Video inspection timed out. Try another file or contact the operator.',
    PROBE_EXEC_ERROR: 'The server could not run FFprobe. Contact the operator.',
    PROBE_SPAWN_ERROR: 'The server could not run FFprobe. Contact the operator.',
    FFMPEG_FAILED: 'Video encoding failed. Try another output format or contact the operator.',
    FFMPEG_ERROR: 'The server could not run FFmpeg. Contact the operator.',
    FFMPEG_SPAWN_ERROR: 'The server could not run FFmpeg. Contact the operator.'
  };
  const message = messages[errorCode || ''] || 'Conversion failed. Contact the operator.';
  const code = errorCode || 'CONVERSION_FAILED';
  return `${message} Error code: ${code}.`;
}

/**
 * ProgressController: Streams conversion progress via Server-Sent Events (SSE)
 */
export class ProgressController {
  /**
   * GET /api/progress/:jobId
   * Streams real-time progress via SSE
   */
  static async streamProgress(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      logger.debug(`[ProgressController] GET /api/progress/${jobId}`);

      const converterService = getVideoConverterService();
      const job = converterService.getJobStatus(jobId);

      if (!job) {
        throw new AppError(`Job not found: ${jobId}`, 'JOB_NOT_FOUND', 404);
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial progress
      res.write(`data: ${JSON.stringify({
        jobId,
        progress: job.progress,
        status: toEventStatus(job.status),
        currentFrame: job.currentFrame,
        totalFrames: job.totalFrames
      })}\n\n`);

      // Poll for updates every 500ms
      const pollInterval = setInterval(() => {
        const currentJob = converterService.getJobStatus(jobId);
        if (!currentJob) {
          clearInterval(pollInterval);
          res.write('data: {"error": "Job lost"}\n\n');
          res.end();
          return;
        }

        const event: {
          jobId: string;
          progress: number;
          status: string;
          currentFrame: number;
          totalFrames: number;
          downloadUrl?: string;
          errorCode?: string;
          errorMessage?: string;
        } = {
          jobId,
          progress: currentJob.progress,
          status: toEventStatus(currentJob.status),
          currentFrame: currentJob.currentFrame,
          totalFrames: currentJob.totalFrames
        };

        // Add completion info
        if (currentJob.status === 'completed') {
          event.downloadUrl = `/api/download/${jobId}`;
          clearInterval(pollInterval);
        } else if (currentJob.status === 'failed') {
          event.errorCode = currentJob.errorCode || 'CONVERSION_FAILED';
          event.errorMessage = getPublicErrorMessage(event.errorCode);
          clearInterval(pollInterval);
        }

        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // Close on completion or error
        if (currentJob.status === 'completed' || currentJob.status === 'failed') {
          setTimeout(() => res.end(), 500);
        }
      }, 500);

      // Cleanup on client disconnect
      res.on('close', () => {
        clearInterval(pollInterval);
      });
    } catch (error) {
      logger.error(`[ProgressController] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const appError = error instanceof AppError ? error : 
        new AppError('Failed to get progress', 'PROGRESS_ERROR', 500);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(appError.statusCode).json(appError.toJSON());
    }
  }
}
