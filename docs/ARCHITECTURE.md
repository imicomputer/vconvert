# Architecture & Application Documentation

**Product:** VConvert  
**Last verified:** 2026-11-17

## 1. Technology and layout

- **Server:** Node.js, Express 4, TypeScript (strict compiler mode), ES modules.
- **Browser client:** static HTML, CSS, and JavaScript ES modules under `public/`.
- **Media tools:** FFmpeg for encoding and FFprobe for input inspection.
- **State:** process-local in-memory maps for jobs and managed output files; no database.
- **Build output:** TypeScript sources in `src/` compile to `dist/`; static files are served from `public/`.

```text
Browser
  ├─ GET /                  → public/index.html and browser modules
  ├─ GET /api/hardware-status
  ├─ POST /api/convert      → multipart upload + targetFormat query
  ├─ GET /api/progress/:id  → Server-Sent Events
  └─ GET /api/download/:id

Express routes/controllers
  ├─ upload middleware (Multer)
  ├─ media probe service (ffprobe)
  ├─ strategy registry → format-specific FFmpeg arguments
  ├─ converter service → ffmpeg process and progress parsing
  └─ file cleanup manager → completed output TTL
```

## 2. Responsibilities

| Component | Responsibility |
|---|---|
| `src/index.ts` | Initialize services, detect hardware, start the HTTP server, and register shutdown handlers |
| `src/app.ts` | Configure JSON/form parsing, permissive CORS, request logging, API/static routes, health check, and error handling |
| `src/routes/api.ts` | Define API routes and Multer upload limit/destination |
| `src/controllers/ConversionController.ts` | Validate conversion parameters, create a job ID, start background conversion, and register successful outputs for cleanup |
| `src/controllers/ProgressController.ts` | Send initial job state and poll/stream updates over SSE |
| `src/controllers/DownloadController.ts` | Check job/output state, reset output TTL, and return the converted file |
| `src/controllers/HardwareController.ts` | Return startup hardware detection result |
| `src/services/MediaProbeService.ts` | Invoke FFprobe and extract duration, dimensions, codecs, bitrate, and frame rate |
| `src/services/VideoConverterService.ts` | Maintain in-memory job state, invoke FFmpeg, parse frame progress, and retry failed GPU encoding on CPU |
| `src/services/HardwareDetector.ts` | Test for NVIDIA NVENC, then AMD VAAPI; otherwise select CPU |
| `src/services/FileCleanupManager.ts` | Periodically delete registered output files after TTL expiration |
| `src/strategies/` | Build target-specific FFmpeg arguments for each registered output format |
| `public/` | Browser user interface, API client, upload handling, progress display, theme, and notifications |

## 3. Conversion lifecycle

1. Multer stores the upload in `UPLOAD_DIR` (default `/tmp/uploads`) and enforces `MAX_FILE_SIZE_BYTES`.
2. The controller checks for a file and `targetFormat`, validates the format registry, and rejects an output extension equal to the input filename extension.
3. A UUID job ID is created and the request returns `{ "jobId": "..." }`.
4. The converter registers the job in memory, probes the input with FFprobe, selects the output strategy, and starts FFmpeg.
5. FFmpeg stderr output is parsed for frame counts. The converter updates in-memory progress, and the SSE controller polls that state every 500 ms.
6. On success, the job reaches `completed`; the controller registers its output file with the cleanup manager.
7. The download controller serves the output and resets its TTL. The cleanup timer periodically unlinks expired registered outputs.

Jobs, SSE state, and managed output records are not persisted. A process restart invalidates outstanding job IDs and the manager cannot resume cleanup of previously registered outputs.

## 4. Configuration

The server loads `.env` using `dotenv`. Values are parsed from the environment in `src/config.ts`.

| Variable | Default | Current behavior |
|---|---:|---|
| `NODE_ENV` | `development` | Controls whether generic 500 responses include the underlying error message |
| `PORT` | `3000` | HTTP listening port |
| `UPLOAD_DIR` | `/tmp/uploads` | Multer upload destination and converted output directory; ensure it exists and is writable |
| `MAX_FILE_SIZE_BYTES` | `2147483648` | Upload limit (2 GiB) |
| `FILE_TTL_SECONDS` | `600` | TTL for registered completed output files |
| `HARDWARE_DETECTION_TIMEOUT_MS` | `5000` | Timeout for each hardware encoder probe |
| `MEDIA_PROBE_TIMEOUT_MS` | `10000` | FFprobe timeout |
| `FILE_CLEANUP_INTERVAL_MS` | `30000` | Interval between output expiration scans |

The checked-in `.env.example` also contains `FFMPEG_PATH`, `FFMPEG_TIMEOUT_MS`, and `LOG_LEVEL`. These are parsed or documented in configuration but are **not currently applied** by the process-spawn or logger code; FFmpeg and FFprobe are invoked by their literal executable names on `PATH`, and conversion does not enforce `FFMPEG_TIMEOUT_MS`. Do not rely on these settings until implementation is wired to them.

The browser's `API_BASE_URL` defaults to `http://localhost:3000/api`. Its source supports `process.env.API_BASE_URL` when provided by a bundler/polyfill; a plain static browser does not expose Node's `process` global, so the default is used there.

## 5. Operational and security boundaries

- No authentication, authorization, API rate limit, or job ownership checks are implemented.
- CORS allows all origins. Do not expose the server directly to an untrusted network; use network restrictions and an appropriately configured HTTPS reverse proxy, and add authentication/rate limiting before public deployment.
- Uploads and converted outputs use server disk. The cleanup manager only tracks converted output files. Uploaded source files currently are not explicitly deleted by the conversion workflow.
- Jobs and file tracking are memory-only; multiple server instances do not share state.
- Concurrent conversions have no application-level queue or concurrency cap; size CPU, memory, GPU, and storage accordingly.
- Tailwind CSS is loaded from a CDN by the page, so the browser needs network access to that CDN unless the frontend is changed to serve a local copy.
- No Dockerfile, Compose file, Kubernetes manifests, reverse-proxy configuration, or CI pipeline is included in the repository.

## 6. Known limitations

- Automated tests are not implemented. `npm test` only echoes `Tests not yet implemented` and exits successfully.
- Existing root-level API/deployment/summary/user guides include claims that do not consistently match this code; use the current `docs/` pages and implementation as the source of truth.
- The default UI API address is localhost. For a remote deployment, configure/bundle the browser API address to the correct server origin; a server-side `.env` setting alone is not automatically substituted into static JavaScript.
- `FFMPEG_PATH`, `FFMPEG_TIMEOUT_MS`, and `LOG_LEVEL` do not currently control runtime behavior.
- Uploaded input files can accumulate in the upload directory; monitor and manage disk use until source-file cleanup is implemented.
