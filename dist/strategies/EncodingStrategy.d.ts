import { MediaMetadata } from '../services/MediaProbeService.js';
export type HardwareType = 'nvidia' | 'amd' | 'cpu';
/**
 * EncodingStrategy interface defining the contract for all format-specific encoders
 */
export interface EncodingStrategy {
    /**
     * Build FFmpeg command arguments for encoding
     */
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    /**
     * Get the output file format/extension
     */
    getOutputFormat(): string;
    /**
     * Get list of supported video codecs for this format
     */
    getSupportedCodecs(): string[];
}
/**
 * Abstract base class with shared padding logic
 */
export declare abstract class BaseEncodingStrategy implements EncodingStrategy {
    protected readonly paddingFilter = "pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p";
    abstract buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    abstract getOutputFormat(): string;
    abstract getSupportedCodecs(): string[];
    /**
     * Helper to build common FFmpeg command prefix
     */
    protected buildBaseCommand(inputPath: string, outputPath: string): string[];
    /**
     * Helper to add video filter with padding
     */
    protected getVideoFilterWithPadding(): string;
}
