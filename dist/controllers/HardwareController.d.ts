import { Request, Response } from 'express';
/**
 * HardwareController: Exposes hardware accelerator status via API
 */
export declare class HardwareController {
    /**
     * GET /api/hardware-status
     * Returns current hardware accelerator status
     */
    static getStatus(req: Request, res: Response): Promise<void>;
}
