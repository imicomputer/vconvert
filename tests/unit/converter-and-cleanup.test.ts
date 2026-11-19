import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { spawn } from 'node:child_process';
import { FileCleanupManager } from '../../src/services/FileCleanupManager.js';
import type { HardwareDetector } from '../../src/services/HardwareDetector.js';
import type { MediaMetadata, MediaProbeService } from '../../src/services/MediaProbeService.js';
import { VideoConverterService } from '../../src/services/VideoConverterService.js';
import { StrategyRegistry } from '../../src/strategies/StrategyRegistry.js';
import { asSpawnProcess, createFakeChildProcess } from '../helpers/fakeChildProcess.js';

const metadata: MediaMetadata = {
  duration: 1, width: 320, height: 240, videoCodec: 'h264', audioCodec: 'aac',
  bitrate: 1000, frameRate: 10, totalFrames: 10
};

test('retries failed NVIDIA encoding with CPU and completes the job', async () => {
  const commands: string[][] = [];
  const hardware = { getStatus: () => ({ activeAccelerator: 'nvidia' }) } as HardwareDetector;
  const probe = { probeFile: async () => metadata } as unknown as MediaProbeService;
  const spawnProcess = asSpawnProcess((command, args) => {
    const ffmpegArgs = args as string[];
    commands.push(ffmpegArgs);
    const process = createFakeChildProcess();
    queueMicrotask(() => {
      if (ffmpegArgs.includes('h264_nvenc')) {
        process.stderr.emit('data', 'encoder failure');
        process.emit('exit', 1);
      } else {
        process.stderr.emit('data', 'frame=10 fps=10');
        process.emit('exit', 0);
      }
    });
    return process;
  });
  const converter = new VideoConverterService(hardware, probe, new StrategyRegistry(), spawnProcess);
  const updates: number[] = [];

  const job = await converter.convert('job-1', 'input.mp4', 'output.mkv', 'mkv', (state) => {
    updates.push(state.progress);
  });

  assert.equal(job.status, 'completed');
  assert.equal(job.progress, 100);
  assert.equal(commands.length, 2);
  assert.ok(commands[0].includes('h264_nvenc'));
  assert.ok(commands[1].includes('libx264'));
  assert.ok(updates.includes(100));
  assert.equal(converter.getJobStatus('job-1')?.status, 'completed');
});

test('marks a CPU conversion failed when FFmpeg exits unsuccessfully', async () => {
  const hardware = { getStatus: () => ({ activeAccelerator: 'cpu' }) } as HardwareDetector;
  const probe = { probeFile: async () => metadata } as unknown as MediaProbeService;
  const converter = new VideoConverterService(
    hardware,
    probe,
    new StrategyRegistry(),
    asSpawnProcess(() => {
      const process = createFakeChildProcess();
      queueMicrotask(() => {
        process.stderr.emit('data', 'invalid output');
        process.emit('exit', 1);
      });
      return process;
    })
  );
  const updates: string[] = [];

  await assert.rejects(
    converter.convert('job-fail', 'input.mp4', 'output.mp4', 'mp4', (job) => updates.push(job.status)),
    /FFmpeg failed with code 1/
  );
  assert.equal(converter.getJobStatus('job-fail')?.status, 'failed');
  assert.equal(updates.at(-1), 'failed');
});

test('cleanup manager resets TTL and deletes expired files', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vconvert-cleanup-'));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'expired.mp4');
  await writeFile(filePath, 'video');

  const manager = new FileCleanupManager();
  manager.registerFile('job-cleanup', filePath);
  const managedFile = manager.getFile('job-cleanup');
  assert.ok(managedFile);
  managedFile.expiresAt = new Date(Date.now() - 1000);
  const expiryBeforeReset = managedFile.expiresAt.getTime();

  manager.resetTTL('job-cleanup');
  assert.ok(managedFile.expiresAt.getTime() > expiryBeforeReset);
  assert.ok(managedFile.downloadedAt);

  managedFile.expiresAt = new Date(Date.now() - 1);
  const runCleanup = (manager as unknown as { cleanup(): Promise<void> }).cleanup;
  await runCleanup.call(manager);

  await assert.rejects(readFile(filePath));
  assert.equal(manager.getFile('job-cleanup'), undefined);
});