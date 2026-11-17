/**
 * Tracks file TTL and manages auto-deletion
 * Validates Property 5: TTL-Based File Deletion
 * Validates Property 6: TTL Reset on Download
 */
export interface ManagedFile {
    path: string;
    jobId: string;
    createdAt: Date;
    expiresAt: Date;
    downloadedAt?: Date;
}
export declare class FileCleanupManager {
    private files;
    private cleanupInterval?;
    private readonly ttlMs;
    /**
     * Start periodic cleanup service
     */
    start(): void;
    /**
     * Stop cleanup service
     */
    stop(): void;
    /**
     * Register a file for management
     */
    registerFile(jobId: string, filePath: string): void;
    /**
     * Reset TTL on download
     * Property 6: TTL Reset on Download
     */
    resetTTL(jobId: string): void;
    /**
     * Get file info
     */
    getFile(jobId: string): ManagedFile | undefined;
    /**
     * Perform cleanup of expired files
     * Property 5: TTL-Based File Deletion
     */
    private cleanup;
    /**
     * Validate Property 5: TTL-Based File Deletion
     * Files are automatically deleted when TTL expires
     */
    validateTTLDeletion(): {
        ttlEnforced: boolean;
        ttlSeconds: number;
        description: string;
    };
    /**
     * Validate Property 6: TTL Reset on Download
     * TTL is reset when file is downloaded
     */
    validateTTLReset(): {
        resetOnDownload: boolean;
        description: string;
    };
}
export declare const fileCleanupManager: FileCleanupManager;
