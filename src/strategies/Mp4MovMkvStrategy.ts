import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';
import { config } from '../config.js';

/**
 * Strategy for MP4, MOV, MKV formats using H.264 codec
 * Supports NVIDIA NVENC, AMD VAAPI, and CPU encoding with hardware-aware quality presets
 */
export class Mp4MovMkvStrategy extends BaseEncodingStrategy {
  private format: 'mp4' | 'mov' | 'mkv';

  constructor(format: 'mp4' | 'mov' | 'mkv') {
    super();
    this.format = format;
  }

  buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    metadata: MediaMetadata,
    hardwareType: HardwareType
  ): string[] {
    const cmd = hardwareType === 'amd'
      ? ['-vaapi_device', config.vaapiDevice, ...this.buildBaseCommand(inputPath, outputPath)]
      : this.buildBaseCommand(inputPath, outputPath);

    const videoFilter = hardwareType === 'amd'
      ? 'pad=ceil(iw/2)*2:ceil(ih/2)*2,format=nv12,hwupload'
      : this.getVideoFilterWithPadding();
    cmd.push('-vf', videoFilter);

    // Add hardware-specific video codec and settings
    switch (hardwareType) {
      case 'nvidia':
        cmd.push(
          '-c:v', 'h264_nvenc',
          '-cq', '23',
          '-preset', 'p4',
          '-rc', 'vbr'
        );
        break;
      case 'amd':
        cmd.push(
          '-c:v', 'h264_vaapi',
          '-qp', '23',
          '-rc_mode', 'vbr'
        );
        break;
      case 'cpu':
      default:
        cmd.push(
          '-c:v', 'libx264',
          '-crf', '23',
          '-preset', 'fast'
        );
        break;
    }

    // Add audio codec (AAC for all formats)
    cmd.push(
      '-c:a', 'aac',
      '-b:a', '128k'
    );

    // Format-specific options
    if (this.format === 'mp4') {
      cmd.push('-movflags', 'faststart');
    } else if (this.format === 'mkv') {
      cmd.push('-f', 'matroska');
    }

    cmd.push(outputPath);
    return cmd;
  }

  getOutputFormat(): string {
    return this.format;
  }

  getSupportedCodecs(): string[] {
    return ['h264_nvenc', 'h264_vaapi', 'libx264', 'h264'];
  }
}
