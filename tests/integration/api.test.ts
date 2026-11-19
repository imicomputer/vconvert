import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';

const uploadDir = await mkdtemp(path.join(tmpdir(), 'vconvert-api-'));
process.env.UPLOAD_DIR = uploadDir;
process.env.MAX_FILE_SIZE_BYTES = '128';
process.env.FILE_CLEANUP_INTERVAL_MS = '60000';

const [{ default: app }, { container }, { StrategyRegistry }, { fileCleanupManager }] = await Promise.all([
  import('../../src/app.js'),
  import('../../src/utils/container.js'),
  import('../../src/strategies/StrategyRegistry.js'),
  import('../../src/services/FileCleanupManager.js')
]);

interface TestJob {
  jobId: string;
  inputPath: string;
  outputPath: string;
  targetFormat: string;
  status: string;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  startTime: Date;
  endTime: Date;
}

const jobs = new Map<string, TestJob>();
const converter = {
  convert(jobId: string, inputPath: string, outputPath: string, targetFormat: string, onProgress: (job: TestJob) => void) {
    const job: TestJob = {
      jobId, inputPath, outputPath, targetFormat, status: 'completed',
      progress: 100, currentFrame: 10, totalFrames: 10,
      startTime: new Date(), endTime: new Date()
    };
    writeFileSync(outputPath, 'converted-video');
    jobs.set(jobId, job);
    onProgress(job);
    return Promise.resolve(job);
  },
  getJobStatus(jobId: string) {
    return jobs.get(jobId);
  }
};

let server: Server;
let baseUrl: string;

before(async () => {
  container.clear();
  container.register('hardwareDetector', {
    getStatus: () => ({ activeAccelerator: 'cpu', nvidia: false, amd: false, detectionTime: new Date() })
  });
  container.register('strategyRegistry', new StrategyRegistry());
  container.register('videoConverterService', converter);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  fileCleanupManager.stop();
  await rm(uploadDir, { recursive: true, force: true });
});

async function submitUpload(targetFormat?: string, filename = 'sample.mkv', contents = 'video') {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'video/x-matroska' }), filename);
  const query = targetFormat ? `?targetFormat=${encodeURIComponent(targetFormat)}` : '';
  return fetch(`${baseUrl}/api/convert${query}`, { method: 'POST', body: form });
}

test('health and hardware endpoints respond with deployment-ready status', async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });

  const hardware = await fetch(`${baseUrl}/api/hardware-status`);
  const first = await hardware.json() as { status: string };
  const second = await (await fetch(`${baseUrl}/api/hardware-status`)).json() as { status: string };
  assert.equal(hardware.status, 200);
  assert.equal(first.status, 'cpu');
  assert.equal(second.status, first.status);
});

test('conversion endpoint rejects missing upload, format, unsupported format, and same format', async () => {
  const noFile = await fetch(`${baseUrl}/api/convert?targetFormat=mp4`, { method: 'POST' });
  assert.equal(noFile.status, 400);
  assert.equal((await noFile.json() as { error: string }).error, 'NO_FILE');

  const noFormat = await submitUpload();
  assert.equal(noFormat.status, 400);
  assert.equal((await noFormat.json() as { error: string }).error, 'MISSING_FORMAT');

  const unsupported = await submitUpload('unsupported');
  assert.equal(unsupported.status, 400);
  assert.equal((await unsupported.json() as { error: string }).error, 'UNSUPPORTED_FORMAT');

  const sameFormat = await submitUpload('mkv');
  assert.equal(sameFormat.status, 400);
  assert.equal((await sameFormat.json() as { error: string }).error, 'SAME_FORMAT');
});

test('conversion endpoint enforces the configured upload-size limit', async () => {
  const oversized = await submitUpload('mp4', 'large.mkv', 'x'.repeat(1024));
  assert.equal(oversized.status, 413);
});

test('conversion rejects a non-video file with the requirement error', async () => {
  const response = await submitUpload('mp4', 'notes.txt', 'not a video');
  assert.equal(response.status, 400);
  assert.equal((await response.json() as { error: string }).error, 'UNSUPPORTED_FILE_TYPE');
});

test('SSE completion event uses the required terminal status and download URL', async () => {
  const accepted = await submitUpload('mp4');
  assert.equal(accepted.status, 200);
  const { jobId } = await accepted.json() as { jobId: string };
  assert.ok(jobId);

  const progressResponse = await fetch(`${baseUrl}/api/progress/${jobId}`);
  assert.equal(progressResponse.status, 200);
  assert.match(progressResponse.headers.get('content-type') ?? '', /text\/event-stream/);
  const events = (await progressResponse.text())
    .split('\n\n')
    .filter((event) => event.startsWith('data: '))
    .map((event) => JSON.parse(event.slice(6)) as { status: string; downloadUrl?: string });
  const finalEvent = events.at(-1);
  assert.equal(finalEvent?.downloadUrl, `/api/download/${jobId}`);
  assert.equal(finalEvent?.status, 'done');
});

test('completed conversion downloads with the input filename and resets TTL', async () => {
  const accepted = await submitUpload('mp4');
  assert.equal(accepted.status, 200);
  const { jobId } = await accepted.json() as { jobId: string };
  const trackedFile = fileCleanupManager.getFile(jobId);
  assert.ok(trackedFile);
  const previousExpiry = trackedFile.expiresAt.getTime();
  const download = await fetch(`${baseUrl}/api/download/${jobId}`);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), 'converted-video');
  assert.ok(trackedFile.expiresAt.getTime() > previousExpiry);
  assert.match(download.headers.get('content-disposition') ?? '', /filename="sample\.mp4"/);
});

test('progress and download endpoints reject unknown jobs', async () => {
  assert.equal((await fetch(`${baseUrl}/api/progress/missing-job`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/api/download/missing-job`)).status, 404);
});