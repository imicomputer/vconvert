import dotenv from 'dotenv';
dotenv.config();
export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '2147483648'),
    fileTtl: parseInt(process.env.FILE_TTL_SECONDS || '600'),
    logLevel: process.env.LOG_LEVEL || 'info',
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    ffmpegTimeout: parseInt(process.env.FFMPEG_TIMEOUT_MS || '300000'),
    hardwareDetectionTimeout: parseInt(process.env.HARDWARE_DETECTION_TIMEOUT_MS || '5000'),
    mediaProbeTimeout: parseInt(process.env.MEDIA_PROBE_TIMEOUT_MS || '10000'),
    fileCleanupInterval: parseInt(process.env.FILE_CLEANUP_INTERVAL_MS || '30000')
};
console.log(`[CONFIG] Loaded environment: ${config.nodeEnv}`);
//# sourceMappingURL=config.js.map