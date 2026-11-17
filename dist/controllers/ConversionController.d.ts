import { Request, Response } from 'express';
/**
 * ConversionController: Handles video conversion requests
 */
export declare class ConversionController {
    /**
     * POST /api/convert
     * Accepts file upload and starts conversion
     */
    static startConversion(req: Request, res: Response): Promise<void>;
}
