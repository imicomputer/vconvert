import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';

/**
 * Strategy for WebM format using VP9 codec
 * Note: VP9 encoding requires CPU (no GPU acceleration available in common FFmpeg builds)
 */
export class WebmStrategy extends BaseEncodingStrategy {
  buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    metadata: MediaMetadata,
    hardwareType: HardwareType
  ): string[] {
    const cmd = this.buildBaseCommand(inputPath, outputPath);

    // Add video filter with padding
    cmd.push('-vf', this.getVideoFilterWithPadding());

    // VP9 codec (CPU only - no GPU acceleration for WebM)
    cmd.push(
      '-c:v', 'libvpx-vp9',
      '-crf', '23',
      '-preset', 'fast',
      '-b:v', '0' // VBR mode
    );

    // Opus audio codec
    cmd.push(
      '-c:a', 'libopus',
      '-b:a', '128k'
    );

    cmd.push(outputPath);
    return cmd;
  }

  getOutputFormat(): string {
    return 'webm';
  }

  getSupportedCodecs(): string[] {
    return ['libvpx-vp9', 'vp9'];
  }
}
