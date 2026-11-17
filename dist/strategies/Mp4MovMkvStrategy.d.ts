import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
/**
 * Strategy for MP4, MOV, MKV formats using H.264 codec
 * Supports NVIDIA NVENC, AMD VAAPI, and CPU encoding with hardware-aware quality presets
 */
export declare class Mp4MovMkvStrategy extends BaseEncodingStrategy {
    private format;
    constructor(format: 'mp4' | 'mov' | 'mkv');
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    getOutputFormat(): string;
    getSupportedCodecs(): string[];
}
