import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { HardwareController } from '../controllers/HardwareController.js';
import { ConversionController } from '../controllers/ConversionController.js';
import { ProgressController } from '../controllers/ProgressController.js';
import { DownloadController } from '../controllers/DownloadController.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: config.uploadDir,
  limits: {
    fileSize: config.maxFileSize
  }
});

/**
 * Hardware Status API
 */
router.get('/hardware-status', HardwareController.getStatus);

/**
 * Conversion API
 */
router.post('/convert', upload.single('file'), ConversionController.startConversion);

/**
 * Progress SSE API
 */
router.get('/progress/:jobId', ProgressController.streamProgress);

/**
 * Download API
 */
router.get('/download/:jobId', DownloadController.downloadFile);

export default router;
