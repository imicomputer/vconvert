import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
/**
 * Strategy for WMV format using WMV2 codec
 * WMV is a Windows Media Video format with good compression and quality balance
 */
export declare class WmvStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    getOutputFormat(): string;
    getSupportedCodecs(): string[];
}
