import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { AppError } from '../utils/errors.js';

export interface MediaMetadata {
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string | null;
  bitrate: number;
  frameRate: number;
  totalFrames: number;
}

export class MediaProbeService {
  async probeFile(filePath: string): Promise<MediaMetadata> {
    logger.debug(`Probing media file: ${filePath}`);

    return new Promise((resolve, reject) => {
      let jsonOutput = '';
      let errorOutput = '';
      let proc: ChildProcess | null = null;

      const timeout = setTimeout(() => {
        if (proc) {
          proc.kill();
        }
        reject(new AppError(`Media probe timeout after ${config.mediaProbeTimeout}ms for: ${filePath}`, 'PROBE_TIMEOUT', 500));
      }, config.mediaProbeTimeout || 10000);

      try {
        proc = spawn('ffprobe', [
          '-v', 'quiet',
          '-print_format', 'json',
          '-show_format',
          '-show_streams',
          filePath
        ]);

        proc.stdout?.on('data', (data) => {
          jsonOutput += data.toString();
        });

        proc.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        proc.on('error', (error) => {
          clearTimeout(timeout);
          reject(new AppError(`FFprobe execution failed: ${error.message}`, 'PROBE_EXEC_ERROR', 500));
        });

        proc.on('exit', (code) => {
          clearTimeout(timeout);

          if (code !== 0) {
            reject(new AppError(
              `FFprobe failed with code ${code}: ${errorOutput || 'Unknown error'}`,
              'PROBE_FAILED',
              400
            ));
            return;
          }

          try {
            const metadata = this.parseProbeOutput(jsonOutput, filePath);
            logger.debug(`Media probe successful: ${filePath} - ${metadata.width}x${metadata.height}, ${metadata.duration}s`);
            resolve(metadata);
          } catch (parseError) {
            reject(new AppError(
              `Failed to parse media metadata: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
              'PROBE_PARSE_ERROR',
              400
            ));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(new AppError(
          `Failed to spawn ffprobe: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'PROBE_SPAWN_ERROR',
          500
        ));
      }
    });
  }

  private parseProbeOutput(jsonStr: string, filePath: string): MediaMetadata {
    let probeData: any;
    try {
      probeData = JSON.parse(jsonStr);
    } catch (error) {
      throw new Error(`Invalid JSON from ffprobe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!probeData.format) {
      throw new Error('No format information in ffprobe output');
    }

    const format = probeData.format;
    const streams = probeData.streams || [];

    // Extract video stream
    const videoStream = streams.find((s: any) => s.codec_type === 'video');
    if (!videoStream) {
      throw new Error('No video stream found in media file');
    }

    // Extract audio stream (optional)
    const audioStream = streams.find((s: any) => s.codec_type === 'audio');

    // Parse duration
    const duration = parseFloat(format.duration || videoStream.duration || '0');
    if (duration <= 0) {
      throw new Error('Invalid or zero duration');
    }

    // Parse dimensions
    const width = videoStream.width;
    const height = videoStream.height;
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error('Invalid video dimensions');
    }

    // Parse codecs
    const videoCodec = videoStream.codec_name || 'unknown';
    const audioCodec = audioStream?.codec_name || null;

    // Parse bitrate
    const bitrate = parseInt(format.bit_rate || videoStream.bit_rate || '0');

    // Parse frame rate
    let frameRate = 24; // default fallback
    if (videoStream.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      if (den > 0) {
        frameRate = num / den;
      }
    } else if (videoStream.avg_frame_rate) {
      const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
      if (den > 0) {
        frameRate = num / den;
      }
    }

    // Calculate total frames
    const totalFrames = Math.ceil(duration * frameRate);

    return {
      duration,
      width,
      height,
      videoCodec,
      audioCodec,
      bitrate,
      frameRate,
      totalFrames
    };
  }
}

export const mediaProbeService = new MediaProbeService();
