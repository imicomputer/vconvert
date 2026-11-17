import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
/**
 * Strategy for WebM format using VP9 codec
 * Note: VP9 encoding requires CPU (no GPU acceleration available in common FFmpeg builds)
 */
export declare class WebmStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    getOutputFormat(): string;
    getSupportedCodecs(): string[];
}
