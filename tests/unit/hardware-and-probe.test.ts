import assert from 'node:assert/strict';
import test from 'node:test';
import type { spawn } from 'node:child_process';
import { config } from '../../src/config.js';
import { HardwareDetector } from '../../src/services/HardwareDetector.js';
import { MediaProbeService } from '../../src/services/MediaProbeService.js';
import { asSpawnProcess, createFakeChildProcess } from '../helpers/fakeChildProcess.js';

test('hardware detection tests NVIDIA first and falls back to AMD', async () => {
  const commands: string[][] = [];
  const detector = new HardwareDetector(asSpawnProcess((command, args) => {
    commands.push([String(command), ...(args as string[])]);
    const process = createFakeChildProcess();
    queueMicrotask(() => process.emit('exit', commands.length === 1 ? 1 : 0));
    return process;
  }));

  const status = await detector.detectAvailableAccelerators();
  assert.equal(status.activeAccelerator, 'amd');
  assert.equal(status.nvidia, false);
  assert.equal(status.amd, true);
  assert.match(commands[0][commands[0].indexOf('-c:v') + 1], /nvenc/);
  assert.ok(commands[1].includes('h264_vaapi'));
});

test('hardware detection selects CPU when both GPU probes fail', async () => {
  let callCount = 0;
  const detector = new HardwareDetector(asSpawnProcess(() => {
    callCount += 1;
    const process = createFakeChildProcess();
    queueMicrotask(() => process.emit('exit', 1));
    return process;
  }));

  const status = await detector.detectAvailableAccelerators();
  assert.equal(status.activeAccelerator, 'cpu');
  assert.equal(callCount, 2);
  assert.equal(detector.getStatus().activeAccelerator, 'cpu');
});

test('hardware detection falls back to CPU when both accelerator probes time out', async (context) => {
  const previousTimeout = config.hardwareDetectionTimeout;
  config.hardwareDetectionTimeout = 5;
  context.after(() => {
    config.hardwareDetectionTimeout = previousTimeout;
  });
  let callCount = 0;
  const detector = new HardwareDetector(asSpawnProcess(() => {
    callCount += 1;
    return createFakeChildProcess();
  }));

  const status = await detector.detectAvailableAccelerators();
  assert.equal(status.activeAccelerator, 'cpu');
  assert.equal(callCount, 2);
});

test('media probe parses video metadata and optional audio', async () => {
  const output = JSON.stringify({
    format: { duration: '2', bit_rate: '2000' },
    streams: [{
      codec_type: 'video', codec_name: 'h264', width: 640, height: 360,
      r_frame_rate: '24/1'
    }]
  });
  const service = new MediaProbeService(asSpawnProcess(() => {
    const process = createFakeChildProcess();
    queueMicrotask(() => {
      process.stdout.emit('data', output);
      process.emit('exit', 0);
    });
    return process;
  }));

  assert.deepEqual(await service.probeFile('input.mp4'), {
    duration: 2,
    width: 640,
    height: 360,
    videoCodec: 'h264',
    audioCodec: null,
    bitrate: 2000,
    frameRate: 24,
    totalFrames: 48
  });
});

test('media probe rejects files without a video stream', async () => {
  const service = new MediaProbeService(asSpawnProcess(() => {
    const process = createFakeChildProcess();
    queueMicrotask(() => {
      process.stdout.emit('data', JSON.stringify({ format: { duration: '2' }, streams: [] }));
      process.emit('exit', 0);
    });
    return process;
  }));

  await assert.rejects(service.probeFile('audio.mp3'), /No video stream found/);
});

test('media probe reports a missing FFprobe process', async () => {
  const service = new MediaProbeService(asSpawnProcess(() => {
    const process = createFakeChildProcess();
    queueMicrotask(() => process.emit('error', new Error('binary not found')));
    return process;
  }));

  await assert.rejects(service.probeFile('input.mp4'), /FFprobe execution failed: binary not found/);
});

test('media probe timeout terminates the child process', async (context) => {
  const previousTimeout = config.mediaProbeTimeout;
  config.mediaProbeTimeout = 5;
  context.after(() => {
    config.mediaProbeTimeout = previousTimeout;
  });

  let process: ReturnType<typeof createFakeChildProcess> | undefined;
  const service = new MediaProbeService(asSpawnProcess(() => {
    process = createFakeChildProcess();
    return process;
  }));

  await assert.rejects(service.probeFile('slow.mp4'), /timeout/i);
  assert.equal(process?.killed, true);
});

test('process runner type remains compatible with child_process.spawn', () => {
  const runner: typeof spawn = asSpawnProcess(() => createFakeChildProcess());
  assert.equal(typeof runner, 'function');
});