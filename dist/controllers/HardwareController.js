import { logger } from '../utils/logger.js';
import { getHardwareDetector } from '../utils/container.js';
import { AppError } from '../utils/errors.js';
/**
 * HardwareController: Exposes hardware accelerator status via API
 */
export class HardwareController {
    /**
     * GET /api/hardware-status
     * Returns current hardware accelerator status
     */
    static async getStatus(req, res) {
        try {
            logger.debug('[HardwareController] GET /api/hardware-status');
            const hardwareDetector = getHardwareDetector();
            const status = hardwareDetector.getStatus();
            res.json({
                status: status.activeAccelerator,
                nvidia: status.nvidia,
                amd: status.amd,
                timestamp: status.detectionTime.toISOString()
            });
        }
        catch (error) {
            logger.error(`[HardwareController] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            const appError = error instanceof AppError ? error :
                new AppError('Failed to get hardware status', 'HARDWARE_ERROR', 500);
            res.status(appError.statusCode).json(appError.toJSON());
        }
    }
}
//# sourceMappingURL=HardwareController.js.map