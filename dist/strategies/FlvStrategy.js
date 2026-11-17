import { BaseEncodingStrategy } from './EncodingStrategy.js';
/**
 * Strategy for FLV format using MPEG2 codec
 * FLV is primarily a Flash video format with MPEG2 video codec support
 */
export class FlvStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType) {
        const cmd = this.buildBaseCommand(inputPath, outputPath);
        // Add video filter with padding
        cmd.push('-vf', this.getVideoFilterWithPadding());
        // MPEG2 codec (CPU only)
        cmd.push('-c:v', 'mpeg2video', '-q:v', '5');
        // MP3 audio codec (standard for FLV)
        cmd.push('-c:a', 'libmp3lame', '-b:a', '128k');
        // FLV format container
        cmd.push('-f', 'flv');
        cmd.push(outputPath);
        return cmd;
    }
    getOutputFormat() {
        return 'flv';
    }
    getSupportedCodecs() {
        return ['mpeg2video', 'mpeg2', 'h263', 'h263p'];
    }
}
//# sourceMappingURL=FlvStrategy.js.map