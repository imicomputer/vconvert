import assert from 'node:assert/strict';
import test from 'node:test';
import { StrategyRegistry } from '../../src/strategies/StrategyRegistry.js';
import type { MediaMetadata } from '../../src/services/MediaProbeService.js';

const metadata: MediaMetadata = {
  duration: 2,
  width: 1919,
  height: 1079,
  videoCodec: 'h264',
  audioCodec: 'aac',
  bitrate: 500000,
  frameRate: 24,
  totalFrames: 48
};

function valueAfter(args: string[], flag: string): string | undefined {
  return args[args.indexOf(flag) + 1];
}

test('registers all eight supported output formats', () => {
  const registry = new StrategyRegistry();
  assert.deepEqual(registry.getSupportedFormats().sort(), [
    '3gp', 'avi', 'flv', 'mkv', 'mov', 'mp4', 'webm', 'wmv'
  ]);
});

test('builds format-specific commands and pads odd dimensions', () => {
  const registry = new StrategyRegistry();
  const expectedVideoCodecs: Record<string, string> = {
    mp4: 'h264_nvenc', mov: 'h264_nvenc', mkv: 'h264_nvenc',
    webm: 'libvpx-vp9', avi: 'mpeg4', flv: 'mpeg2video',
    wmv: 'wmv2', '3gp': 'h263'
  };

  for (const [format, videoCodec] of Object.entries(expectedVideoCodecs)) {
    const args = registry.getStrategy(format).buildFFmpegCommand(
      'input.mkv', `output.${format}`, metadata, 'nvidia'
    );
    assert.equal(valueAfter(args, '-c:v'), videoCodec, format);
    assert.ok(args.includes(`output.${format}`), format);
    assert.ok(valueAfter(args, '-vf')?.includes('pad=ceil(iw/2)*2:ceil(ih/2)*2'), format);
  }
});

test('uses the specified CPU and NVIDIA H.264 settings', () => {
  const strategy = new StrategyRegistry().getStrategy('mp4');
  const cpuArgs = strategy.buildFFmpegCommand('in.mkv', 'out.mp4', metadata, 'cpu');
  const nvidiaArgs = strategy.buildFFmpegCommand('in.mkv', 'out.mp4', metadata, 'nvidia');

  assert.deepEqual([
    valueAfter(cpuArgs, '-c:v'), valueAfter(cpuArgs, '-crf'), valueAfter(cpuArgs, '-preset')
  ], ['libx264', '23', 'fast']);
  assert.deepEqual([
    valueAfter(nvidiaArgs, '-c:v'), valueAfter(nvidiaArgs, '-cq'), valueAfter(nvidiaArgs, '-preset')
  ], ['h264_nvenc', '23', 'p4']);
});

test('configures 3GP QCIF dimensions and narrowband mono audio', () => {
  const args = new StrategyRegistry().getStrategy('3gp')
    .buildFFmpegCommand('in.mp4', 'out.3gp', metadata, 'cpu');

  assert.match(valueAfter(args, '-vf') ?? '', /scale=352:288/);
  assert.deepEqual([
    valueAfter(args, '-c:v'), valueAfter(args, '-c:a'),
    valueAfter(args, '-ar'), valueAfter(args, '-ac'), valueAfter(args, '-b:a')
  ], ['h263', 'aac', '8000', '1', '12.2k']);
});