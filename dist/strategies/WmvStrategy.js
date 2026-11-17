import { BaseEncodingStrategy } from './EncodingStrategy.js';
/**
 * Strategy for WMV format using WMV2 codec
 * WMV is a Windows Media Video format with good compression and quality balance
 */
export class WmvStrategy extends BaseEncodingStrategy {
    buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType) {
        const cmd = this.buildBaseCommand(inputPath, outputPath);
        // Add video filter with padding
        cmd.push('-vf', this.getVideoFilterWithPadding());
        // WMV2 codec (CPU only)
        cmd.push('-c:v', 'wmv2', '-q:v', '5');
        // WMA audio codec (Windows Media Audio)
        cmd.push('-c:a', 'wmav2', '-b:a', '128k');
        // ASF container format (used for WMV)
        cmd.push('-f', 'asf');
        cmd.push(outputPath);
        return cmd;
    }
    getOutputFormat() {
        return 'wmv';
    }
    getSupportedCodecs() {
        return ['wmv2', 'wmv1', 'vc1'];
    }
}
//# sourceMappingURL=WmvStrategy.js.map