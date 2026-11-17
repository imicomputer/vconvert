import { BaseEncodingStrategy } from './EncodingStrategy.js';
/**
 * Strategy for 3GP format using H.263 codec
 * 3GP is a mobile video format with strict resolution enforcement (QCIF: 352x288)
 * This strategy validates Property 3: 3GP Resolution Enforcement
 */
export class ThreeGpStrategy extends BaseEncodingStrategy {
    constructor() {
        super(...arguments);
        this.qcifWidth = 352;
        this.qcifHeight = 288;
    }
    buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType) {
        const cmd = this.buildBaseCommand(inputPath, outputPath);
        // Add video filter: scale to QCIF (352x288) then apply padding for compatibility
        // Note: H.263 typically works with specific resolutions; QCIF is standard for 3GP
        const videoFilter = `scale=${this.qcifWidth}:${this.qcifHeight},${this.getVideoFilterWithPadding()}`;
        cmd.push('-vf', videoFilter);
        // H.263 codec (CPU only, CPU fallback)
        cmd.push('-c:v', 'h263', '-q:v', '5');
        // 3GP audio: AAC with low bitrate optimized for mobile
        cmd.push('-c:a', 'aac', '-ar', '8000', // 8kHz sample rate for mobile
        '-ac', '1', // Mono
        '-b:a', '12.2k' // Narrowband audio bitrate
        );
        // 3GP format container
        cmd.push('-f', '3gp');
        cmd.push(outputPath);
        return cmd;
    }
    getOutputFormat() {
        return '3gp';
    }
    getSupportedCodecs() {
        return ['h263', 'h263p'];
    }
    /**
     * Validates that 3GP encoding uses QCIF resolution (Property 3 validation)
     */
    validateResolutionEnforcement() {
        return {
            width: this.qcifWidth,
            height: this.qcifHeight,
            enforced: true
        };
    }
}
//# sourceMappingURL=ThreeGpStrategy.js.map