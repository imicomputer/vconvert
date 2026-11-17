import { logger } from '../utils/logger.js';
import { getVideoConverterService } from '../utils/container.js';
import { AppError } from '../utils/errors.js';
/**
 * ProgressController: Streams conversion progress via Server-Sent Events (SSE)
 */
export class ProgressController {
    /**
     * GET /api/progress/:jobId
     * Streams real-time progress via SSE
     */
    static async streamProgress(req, res) {
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
                status: job.status,
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
                const event = {
                    jobId,
                    progress: currentJob.progress,
                    status: currentJob.status,
                    currentFrame: currentJob.currentFrame,
                    totalFrames: currentJob.totalFrames
                };
                // Add completion info
                if (currentJob.status === 'completed') {
                    event.downloadUrl = `/api/download/${jobId}`;
                    clearInterval(pollInterval);
                }
                else if (currentJob.status === 'failed') {
                    event.errorMessage = currentJob.error;
                    clearInterval(pollInterval);
                }
                res.write(`data: ${JSON.stringify(event)}\n\n`);
                // Close on completion or error
                if (currentJob.status === 'completed' || currentJob.status === 'failed') {
                    setTimeout(() => res.end(), 500);
                }
            }, 500);
            // Cleanup on client disconnect
            req.on('close', () => {
                clearInterval(pollInterval);
                res.end();
            });
        }
        catch (error) {
            logger.error(`[ProgressController] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            const appError = error instanceof AppError ? error :
                new AppError('Failed to get progress', 'PROGRESS_ERROR', 500);
            res.setHeader('Content-Type', 'application/json');
            res.status(appError.statusCode).json(appError.toJSON());
        }
    }
}
//# sourceMappingURL=ProgressController.js.map