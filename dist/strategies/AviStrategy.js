import { BaseEncodingStrategy } from './EncodingStrategy.js';
/**
 * Strategy for AVI format using MPEG4 codec
 * AVI is legacy but still widely used; MPEG4 provides good compatibility
 */
export class AviStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType) {
        const cmd = this.buildBaseCommand(inputPath, outputPath);
        // Add video filter with padding
        cmd.push('-vf', this.getVideoFilterWithPadding());
        // MPEG4 codec (CPU only)
        cmd.push('-c:v', 'mpeg4', '-q:v', '5', '-vtag', 'DIVX');
        // MP3 audio codec (widely compatible with AVI)
        cmd.push('-c:a', 'libmp3lame', '-b:a', '192k');
        // AVI format container
        cmd.push('-f', 'avi');
        cmd.push(outputPath);
        return cmd;
    }
    getOutputFormat() {
        return 'avi';
    }
    getSupportedCodecs() {
        return ['mpeg4', 'msmpeg4v2', 'msmpeg4'];
    }
}
//# sourceMappingURL=AviStrategy.js.map