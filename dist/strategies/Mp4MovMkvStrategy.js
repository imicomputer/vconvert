import { BaseEncodingStrategy } from './EncodingStrategy.js';
/**
 * Strategy for MP4, MOV, MKV formats using H.264 codec
 * Supports NVIDIA NVENC, AMD VAAPI, and CPU encoding with hardware-aware quality presets
 */
export class Mp4MovMkvStrategy extends BaseEncodingStrategy {
    constructor(format) {
        super();
        this.format = format;
    }
    buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType) {
        const cmd = this.buildBaseCommand(inputPath, outputPath);
        // Add video filter with padding
        cmd.push('-vf', this.getVideoFilterWithPadding());
        // Add hardware-specific video codec and settings
        switch (hardwareType) {
            case 'nvidia':
                cmd.push('-c:v', 'h264_nvenc', '-cq', '23', '-preset', 'p4', '-rc', 'vbr');
                break;
            case 'amd':
                cmd.push('-c:v', 'h264_vaapi', '-qp', '23', '-rc_mode', 'vbr');
                break;
            case 'cpu':
            default:
                cmd.push('-c:v', 'libx264', '-crf', '23', '-preset', 'fast');
                break;
        }
        // Add audio codec (AAC for all formats)
        cmd.push('-c:a', 'aac', '-b:a', '128k');
        // Format-specific options
        if (this.format === 'mp4') {
            cmd.push('-movflags', 'faststart');
        }
        else if (this.format === 'mkv') {
            cmd.push('-f', 'matroska');
        }
        cmd.push(outputPath);
        return cmd;
    }
    getOutputFormat() {
        return this.format;
    }
    getSupportedCodecs() {
        return ['h264_nvenc', 'h264_vaapi', 'libx264', 'h264'];
    }
}
//# sourceMappingURL=Mp4MovMkvStrategy.js.map