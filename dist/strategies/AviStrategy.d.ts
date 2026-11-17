import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
/**
 * Strategy for AVI format using MPEG4 codec
 * AVI is legacy but still widely used; MPEG4 provides good compatibility
 */
export declare class AviStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    getOutputFormat(): string;
    getSupportedCodecs(): string[];
}
