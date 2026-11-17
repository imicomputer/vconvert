import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
/**
 * Strategy for 3GP format using H.263 codec
 * 3GP is a mobile video format with strict resolution enforcement (QCIF: 352x288)
 * This strategy validates Property 3: 3GP Resolution Enforcement
 */
export declare class ThreeGpStrategy extends BaseEncodingStrategy {
    private readonly qcifWidth;
    private readonly qcifHeight;
    buildFFmpegCommand(inputPath: string, outputPath: string, metadata: MediaMetadata, hardwareType: HardwareType): string[];
    getOutputFormat(): string;
    getSupportedCodecs(): string[];
    /**
     * Validates that 3GP encoding uses QCIF resolution (Property 3 validation)
     */
    validateResolutionEnforcement(): {
        width: number;
        height: number;
        enforced: boolean;
    };
}
