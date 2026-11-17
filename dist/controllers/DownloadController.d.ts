import { Request, Response } from 'express';
/**
 * DownloadController: Handles file download and cleanup integration
 */
export declare class DownloadController {
    /**
     * GET /api/download/:jobId
     * Downloads converted file and resets TTL
     */
    static downloadFile(req: Request, res: Response): Promise<void>;
}
