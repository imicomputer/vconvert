import { HardwareDetector } from './HardwareDetector.js';
import { MediaProbeService } from './MediaProbeService.js';
import { StrategyRegistry } from '../strategies/StrategyRegistry.js';
/**
 * Job status for progress tracking
 */
export interface ConversionJob {
    jobId: string;
    inputPath: string;
    outputPath: string;
    targetFormat: string;
    status: 'pending' | 'probing' | 'encoding' | 'completed' | 'failed';
    progress: number;
    currentFrame: number;
    totalFrames: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
}
/**
 * Progress callback interface
 */
export type ProgressCallback = (job: ConversionJob) => void;
/**
 * VideoConverterService: Orchestrates complete transcoding workflow
 * Validates Property 4: GPU Fallback Monotonicity
 * Validates Property 7: Progress Monotonicity
 */
export declare class VideoConverterService {
    private hardwareDetector;
    private mediaProbeService;
    private strategyRegistry;
    private jobs;
    private processes;
    private lastProgress;
    constructor(hardwareDetector: HardwareDetector, mediaProbeService: MediaProbeService, strategyRegistry: StrategyRegistry);
    /**
     * Convert a video file to target format
     * Validates Property 4: GPU Fallback Monotonicity (fallback on error, no recovery)
     * Validates Property 7: Progress Monotonicity (progress only increases)
     */
    convert(jobId: string, inputPath: string, outputPath: string, targetFormat: string, onProgress: ProgressCallback): Promise<ConversionJob>;
    /**
     * Encode with GPU fallback mechanism
     * Property 4: GPU Fallback Monotonicity - If GPU fails, fall back to CPU (one-way only)
     */
    private encodeWithFallback;
    /**
     * Spawn FFmpeg process and monitor progress
     * Property 7: Progress Monotonicity - progress value only increases or stays same, never decreases
     */
    private spawnFFmpegProcess;
    /**
     * Get job status by ID
     */
    getJobStatus(jobId: string): ConversionJob | undefined;
    /**
     * Cancel a running job
     */
    cancelJob(jobId: string): boolean;
    /**
     * Validate Property 4: GPU Fallback Monotonicity
     * GPU fails → Falls back to CPU (one-way, no further retries)
     */
    validateGPUFallbackMonotonicity(): {
        monotonic: boolean;
        description: string;
    };
    /**
     * Validate Property 7: Progress Monotonicity
     * Progress value never decreases during encoding
     */
    validateProgressMonotonicity(): {
        monotonic: boolean;
        description: string;
    };
}
export declare const createVideoConverterService: (hardwareDetector: HardwareDetector, mediaProbeService: MediaProbeService, strategyRegistry: StrategyRegistry) => VideoConverterService;
