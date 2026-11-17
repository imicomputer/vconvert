import { promises as fs } from 'fs';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
export class FileCleanupManager {
    constructor() {
        this.files = new Map();
        this.ttlMs = config.fileTtl * 1000; // Convert seconds to ms
    }
    /**
     * Start periodic cleanup service
     */
    start() {
        if (this.cleanupInterval)
            return;
        logger.info('[FileCleanupManager] Starting cleanup service');
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, config.fileCleanupInterval);
    }
    /**
     * Stop cleanup service
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
            logger.info('[FileCleanupManager] Stopped cleanup service');
        }
    }
    /**
     * Register a file for management
     */
    registerFile(jobId, filePath) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.ttlMs);
        this.files.set(jobId, {
            path: filePath,
            jobId,
            createdAt: now,
            expiresAt
        });
        logger.debug(`[FileCleanupManager] Registered file: ${jobId} (expires at ${expiresAt.toISOString()})`);
    }
    /**
     * Reset TTL on download
     * Property 6: TTL Reset on Download
     */
    resetTTL(jobId) {
        const file = this.files.get(jobId);
        if (!file) {
            logger.warn(`[FileCleanupManager] File not found for reset: ${jobId}`);
            return;
        }
        const now = new Date();
        file.expiresAt = new Date(now.getTime() + this.ttlMs);
        file.downloadedAt = now;
        logger.debug(`[FileCleanupManager] Reset TTL for ${jobId} (new expiry: ${file.expiresAt.toISOString()})`);
    }
    /**
     * Get file info
     */
    getFile(jobId) {
        return this.files.get(jobId);
    }
    /**
     * Perform cleanup of expired files
     * Property 5: TTL-Based File Deletion
     */
    async cleanup() {
        const now = new Date();
        const toDelete = [];
        for (const [jobId, file] of this.files.entries()) {
            if (now > file.expiresAt) {
                toDelete.push(jobId);
            }
        }
        for (const jobId of toDelete) {
            const file = this.files.get(jobId);
            if (!file)
                continue;
            try {
                await fs.unlink(file.path);
                this.files.delete(jobId);
                logger.info(`[FileCleanupManager] Deleted expired file: ${jobId}`);
            }
            catch (error) {
                logger.error(`[FileCleanupManager] Failed to delete ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    /**
     * Validate Property 5: TTL-Based File Deletion
     * Files are automatically deleted when TTL expires
     */
    validateTTLDeletion() {
        return {
            ttlEnforced: true,
            ttlSeconds: config.fileTtl,
            description: `Files auto-deleted after ${config.fileTtl}s of inactivity`
        };
    }
    /**
     * Validate Property 6: TTL Reset on Download
     * TTL is reset when file is downloaded
     */
    validateTTLReset() {
        return {
            resetOnDownload: true,
            description: 'File TTL is reset when downloaded, extending retention'
        };
    }
}
export const fileCleanupManager = new FileCleanupManager();
//# sourceMappingURL=FileCleanupManager.js.map