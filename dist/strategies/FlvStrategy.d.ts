import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
/**
 * Strategy for FLV format using MPEG2 codec
 * FLV is primarily a Flash video format with MPEG2 video codec support
 */
export declare class FlvStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    getOutputFormat(): string;
    getSupportedCodecs(): string[];
}
