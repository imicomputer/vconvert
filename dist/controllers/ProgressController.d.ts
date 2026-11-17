import { Request, Response } from 'express';
/**
 * ProgressController: Streams conversion progress via Server-Sent Events (SSE)
 */
export declare class ProgressController {
    /**
     * GET /api/progress/:jobId
     * Streams real-time progress via SSE
     */
    static streamProgress(req: Request, res: Response): Promise<void>;
}
