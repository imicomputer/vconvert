import { BaseEncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { MediaMetadata } from '../services/MediaProbeService.js';

/**
 * Strategy for FLV format using MPEG2 codec
 * FLV is primarily a Flash video format with MPEG2 video codec support
 */
export class FlvStrategy extends BaseEncodingStrategy {
  buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    metadata: MediaMetadata,
    hardwareType: HardwareType
  ): string[] {
    const cmd = this.buildBaseCommand(inputPath, outputPath);

    // Add video filter with padding
    cmd.push('-vf', this.getVideoFilterWithPadding());

    // MPEG2 codec (CPU only)
    cmd.push(
      '-c:v', 'mpeg2video',
      '-q:v', '5'
    );

    // MP3 audio codec (standard for FLV)
    cmd.push(
      '-c:a', 'libmp3lame',
      '-b:a', '128k'
    );

    // FLV format container
    cmd.push('-f', 'flv');

    cmd.push(outputPath);
    return cmd;
  }

  getOutputFormat(): string {
    return 'flv';
  }

  getSupportedCodecs(): string[] {
    return ['mpeg2video', 'mpeg2', 'h263', 'h263p'];
  }
}
