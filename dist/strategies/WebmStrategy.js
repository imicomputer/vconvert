import { BaseEncodingStrategy } from './EncodingStrategy.js';
/**
 * Strategy for WebM format using VP9 codec
 * Note: VP9 encoding requires CPU (no GPU acceleration available in common FFmpeg builds)
 */
export class WebmStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType) {
        const cmd = this.buildBaseCommand(inputPath, outputPath);
        // Add video filter with padding
        cmd.push('-vf', this.getVideoFilterWithPadding());
        // VP9 codec (CPU only - no GPU acceleration for WebM)
        cmd.push('-c:v', 'libvpx-vp9', '-crf', '23', '-preset', 'fast', '-b:v', '0' // VBR mode
        );
        // Opus audio codec
        cmd.push('-c:a', 'libopus', '-b:a', '128k');
        cmd.push(outputPath);
        return cmd;
    }
    getOutputFormat() {
        return 'webm';
    }
    getSupportedCodecs() {
        return ['libvpx-vp9', 'vp9'];
    }
}
//# sourceMappingURL=WebmStrategy.js.map