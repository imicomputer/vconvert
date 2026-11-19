import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const ffmpegAvailable = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
let mediaDirectory: string;
let inputPath: string;

test.beforeAll(() => {
  test.skip(!ffmpegAvailable, 'FFmpeg is required to generate the E2E video input.');
  mediaDirectory = mkdtempSync(path.join(tmpdir(), 'vconvert-e2e-'));
  inputPath = path.join(mediaDirectory, 'sample.mkv');
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x240:r=10',
    '-t', '1', '-an', '-c:v', 'libx264', '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p', inputPath
  ]);
});

test.afterAll(() => {
  if (mediaDirectory) rmSync(mediaDirectory, { recursive: true, force: true });
});

test('loads dark UI, reports hardware, and remains usable on mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#hardware-text')).not.toHaveText('Detecting...');
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
});

test('rejects unsupported file types with user-facing feedback', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({
    name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a video')
  });
  await expect(page.locator('.notification.error')).toContainText('Unsupported file format');
  await expect(page.locator('#step1-upload')).toBeVisible();
});

test('converts a generated clip, exposes download, and resets for another file', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles(inputPath);
  await expect(page.locator('#step2-format')).toBeVisible();
  await page.locator('#step2-format input[name="format"][value="mp4"]').check();
  await page.locator('#format-next').click();

  await expect(page.locator('#download-section')).not.toHaveClass(/hidden/, { timeout: 45000 });
  await expect(page.locator('#progress-percent')).toHaveText('100%');
  await expect(page.locator('.notification.success .notification-content').last())
    .toContainText('Conversion completed');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-btn').click();
  const download = await downloadPromise;
  expect.soft(download.suggestedFilename()).toBe('sample.mp4');

  const outputPath = path.join(mediaDirectory, 'downloaded.mp4');
  await download.saveAs(outputPath);
  const metadata = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=format_name,duration', '-of', 'json', outputPath
  ], { encoding: 'utf8' })) as { format: { format_name: string; duration: string } };
  expect(metadata.format.format_name).toContain('mp4');
  expect(Number(metadata.format.duration)).toBeGreaterThan(0);

  await page.locator('#convert-again-btn').click();
  await expect(page.locator('#step1-upload')).toBeVisible();
  await expect(page.locator('#file-info')).toHaveClass(/hidden/);
});