import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { ApiClient } from '../../public/js/classes/ApiClient.js';
import { DropzoneHandler } from '../../public/js/classes/DropzoneHandler.js';
import { FormatSelector } from '../../public/js/classes/FormatSelector.js';
import { NotificationManager } from '../../public/js/classes/NotificationManager.js';
import { ProgressUIController } from '../../public/js/classes/ProgressUIController.js';
import { ThemeManager } from '../../public/js/classes/ThemeManager.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/'
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent
});

function setBody(markup: string): void {
  document.body.innerHTML = markup;
}

test('dropzone accepts video files and emits file metadata', () => {
  setBody('<div id="dropzone"></div><input id="file" type="file">');
  const dropzone = document.querySelector<HTMLElement>('#dropzone')!;
  const input = document.querySelector<HTMLInputElement>('#file')!;
  const handler = new DropzoneHandler(dropzone, input);
  const file = new window.File(['video'], 'sample.MP4', { type: 'video/mp4' });
  let selected: { file: File; format: string } | undefined;
  handler.on('fileDropped', (data) => {
    selected = data;
  });
  handler.init();

  const event = new window.Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
  dropzone.dispatchEvent(event);

  assert.equal(selected?.file.name, 'sample.MP4');
  assert.equal(selected?.format, 'mp4');
  assert.equal(event.defaultPrevented, true);
});

test('dropzone rejects unsupported and oversized files', () => {
  setBody('<div id="dropzone"></div><input id="file" type="file">');
  const handler = new DropzoneHandler(
    document.querySelector('#dropzone'),
    document.querySelector('#file')
  );
  const errors: string[] = [];
  handler.on('error', (data) => errors.push(data.message));

  handler.handleFileSelected(new window.File(['x'], 'notes.txt', { type: 'text/plain' }));
  handler.handleFileSelected({
    name: 'large.mp4', size: 2 * 1024 * 1024 * 1024 + 1, type: 'video/mp4'
  });

  assert.match(errors[0], /Unsupported file format/);
  assert.match(errors[1], /exceeds/);
  assert.equal(handler.getSelectedFile(), null);
});

test('format selector disables the input format and rejects same-format output', () => {
  setBody(['mp4', 'mkv', 'webm'].map((format) =>
    `<label><input type="radio" name="format" value="${format}"></label>`
  ).join(''));
  const selector = new FormatSelector();
  selector.setInputFormat('mp4');

  assert.deepEqual(selector.getAvailableFormats().map((format) => format.value), [
    'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', '3gp'
  ]);
  assert.equal(document.querySelector<HTMLInputElement>('input[value="mp4"]')?.disabled, true);
  assert.equal(selector.selectFormat('mp4'), false);
  assert.equal(selector.selectFormat('webm'), true);
  assert.equal(selector.getSelectedFormat(), 'webm');
});

test('progress controller clamps updates, preserves monotonicity, and exposes success/error states', () => {
  setBody('<div id="bar"></div><span id="percent"></span><p id="status"></p><section id="download" class="hidden"><button id="download-btn"></button></section>');
  const bar = document.querySelector<HTMLElement>('#bar')!;
  const percent = document.querySelector<HTMLElement>('#percent')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const download = document.querySelector<HTMLElement>('#download')!;
  const controller = new ProgressUIController(bar, percent, status, download);

  controller.updateProgress(140);
  controller.updateProgress(30);
  assert.equal(percent.textContent, '99%');
  assert.equal(controller.getMonotonicProgress(), 99);

  controller.showSuccess('/download/job', 'sample.mp4');
  assert.equal(percent.textContent, '100%');
  assert.equal(download.classList.contains('hidden'), false);
  assert.equal(status.textContent, '✅ Conversion complete!');

  controller.showError('conversion failed');
  assert.equal(percent.textContent, '0%');
  assert.match(status.textContent ?? '', /conversion failed/);
  assert.equal(bar.classList.contains('shake-animation'), true);
});

test('notification manager inserts and dismisses notifications', () => {
  setBody('<div id="notifications"></div>');
  const manager = new NotificationManager(document.querySelector('#notifications'));
  manager.showSuccess('Conversion completed');
  manager.showError('Conversion failed');

  assert.equal(manager.getCount(), 2);
  assert.equal(document.querySelectorAll('.notification').length, 2);
  assert.equal(document.querySelector('.notification.success .notification-content')?.textContent, 'Conversion completed');

  document.querySelector<HTMLButtonElement>('.notification-close')?.click();
  assert.equal(document.querySelector('.notification')?.classList.contains('fade-out'), true);
});

test('theme manager defaults to dark and persists toggles', () => {
  localStorage.clear();
  setBody('<button id="theme-toggle"></button>');
  const manager = new ThemeManager();
  manager.init();
  assert.equal(manager.getTheme(), 'dark');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');

  document.querySelector<HTMLButtonElement>('#theme-toggle')?.click();
  assert.equal(localStorage.getItem(manager.storageKey), 'light');
  assert.equal(manager.isDarkMode(), false);
});

test('API client handles hardware status and conversion errors', async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) {
      return new Response(JSON.stringify({ status: 'cpu' }), { status: 200 });
    }
    return new Response(JSON.stringify({ message: 'Unsupported format' }), { status: 400 });
  };

  try {
    const client = new ApiClient();
    assert.deepEqual(await client.getHardwareStatus(), { status: 'cpu' });
    await assert.rejects(
      client.submitConversion(new window.File(['video'], 'input.mkv', { type: 'video/x-matroska' }), 'bad'),
      /Unsupported format/
    );
    assert.match(calls[1].url, /targetFormat=bad/);
    assert.equal(calls[1].init?.method, 'POST');
    assert.ok(calls[1].init?.body instanceof FormData);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API client closes SSE streams on terminal progress events', () => {
  class FakeEventSource {
    static current: FakeEventSource;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    closed = false;

    constructor(public url: string) {
      FakeEventSource.current = this;
    }

    close(): void {
      this.closed = true;
    }
  }

  const originalEventSource = globalThis.EventSource;
  Object.assign(globalThis, { EventSource: FakeEventSource });
  try {
    const client = new ApiClient();
    const received: string[] = [];
    const source = client.streamProgress(
      'job-123',
      () => received.push('progress'),
      () => received.push('complete'),
      () => received.push('error')
    ) as unknown as FakeEventSource;

    source.onmessage?.({ data: JSON.stringify({ status: 'processing' }) } as MessageEvent);
    source.onmessage?.({ data: JSON.stringify({ status: 'completed' }) } as MessageEvent);

    assert.deepEqual(received, ['progress', 'complete']);
    assert.equal(source.closed, true);
    assert.match(source.url, /progress\/job-123/);
  } finally {
    Object.assign(globalThis, { EventSource: originalEventSource });
  }
});