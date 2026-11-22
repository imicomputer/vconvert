# Test Plan & Results

**Verification date:** 2026-11-22
**Scope:** Current repository checkout  
**Status:** This record combines checks from the 2026-11-19 and 2026-11-22 verification runs. The unit suite was rerun during sync recovery: 15 tests passed.

## 1. Executed checks

| Check | Command | Result |
|---|---|---|
| TypeScript compilation | `npm run build` | **Previously passed** in the recorded verification runs; the sync-recovery run was blocked because `swagger-ui-express` is not installed in the current workspace |
| Runtime/tool availability | `node --version`, `npm --version`, `ffmpeg -version`, `ffprobe -version` | **Passed in this environment** — Node v26.10.0, npm 11.19.1, FFmpeg 6.1.1, FFprobe 6.1.1 |
| Local API conversion smoke test | `npm run dev`, `curl`, FFmpeg-generated 1-second test clip, `ffprobe` | **Passed** — `/health` and the UI/config static files returned HTTP 200; an MKV upload was accepted for MP4 conversion; SSE reported `completed`; download returned HTTP 200 with `converted.mp4`; FFprobe read the output as a 1-second MP4 container |
| Frontend API base | Import `public/js/config.js` with Node | **Passed** — defaults to same-origin `/api` when no bundler environment override is present |
| Local failed-job SSE | Submit generated invalid media to local API, then read the SSE event | **Passed** — event includes safe `PROBE_FAILED` code/message and does not expose the server upload path |
| NVIDIA Compose runtime smoke test | Start isolated NVIDIA Compose service; query health/hardware; submit generated clip | **Passed** — `/health` returned `200`, hardware status was `nvidia`, and SSE reported conversion `completed` |
| Provided remote deployment (read-only probe) | `curl` `/health` and `/api/hardware-status`; no upload submitted | **Observed** — health returned `200`; hardware status was `cpu`, so GPU access in that deployment is not confirmed |
| Compose variants and overrides | `docker compose -f <file> config --quiet`; custom `UPLOAD_DIR`, `PUBLISH_PORT`, and `PORT` on all three files; empty `UPLOAD_DIR` on CPU config | **Passed** — all variants parsed; custom upload path resolved to both the container environment and volume target; `PUBLISH_PORT=8080` mapped to container port `3000`; empty upload path fell back to `/tmp/uploads` |
| Production image build | `docker compose -f compose.yaml build` | **Passed** — Docker build completed, including `npm run build` in the Node 20 build stage |
| Container API conversion smoke test | Temporary Docker container, `curl`, generated 1-second MKV, SSE, download, `ffprobe` | **Passed on CPU** — `/health` and `/api/hardware-status` responded; status was `cpu`; conversion completed over SSE; download succeeded; FFprobe identified an MP4 container with duration 1.045 seconds |
| Backend unit tests | `npm run test:unit` | **Passed in sync-recovery run** — 15 tests, including all eight strategies, hardware priority/timeouts, FFprobe parse/error/timeout, GPU-to-CPU fallback, and cleanup TTL/reset |
| Frontend DOM tests | `npm run test:frontend` | **Passed** — 8 jsdom tests for dropzone, file validation, format filtering, progress, notifications, theme persistence, API errors, and SSE completion |
| API integration tests | `npm run test:integration` | **Passed** — 7 tests, including HTTP 413/`FILE_TOO_LARGE`, unsupported input rejection, SSE terminal status, download filename, and TTL reset |
| Browser E2E | `npm run test:e2e` in Playwright 1.65.1 image with FFmpeg installed | **Passed** — 3 tests for dark/mobile UI, unsupported-file feedback, conversion, media probing, original download filename, and reset flow |
| Compose deployment checks | `npm run test:deployment` | **Passed** — all three Compose variants parsed; custom upload path and port mapping verified; empty upload path falls back to `/tmp/uploads` |

These checks verify the repository and the Docker/NVIDIA runtime available on this verification host. They do not prove that the provided Coolify host exposes its GPU to the running application.

## 2. Automated Test Coverage

The repository now has Node's built-in test runner via `tsx`, jsdom frontend tests, Playwright browser tests, and Compose configuration checks. Core suites do not require a physical GPU. Playwright requires Chromium, FFmpeg, and FFprobe; Compose checks require Docker Compose and Python 3. Test media is generated in temporary directories and is not committed.

`npm test` runs unit, frontend DOM, and API integration tests. `npm run test:e2e` and `npm run test:deployment` run separately because they require browser/system tools or Docker.

## 3. Requirement Fixes Verified

The following previously failing assertions now pass:

| Requirement | Verified behavior |
|---|---|---|
| Upload size limit | Oversized uploads return HTTP 413 with `FILE_TOO_LARGE`; converter is not called |
| Requirement 31: unsupported file type | Unrecognized input extensions return HTTP 400 with `UNSUPPORTED_FILE_TYPE` before job creation |
| Requirement 10: successful terminal SSE event | Completed jobs emit `status: "done"`; failed jobs map to `status: "error"` |
| Requirement 22: downloaded filename | Download preserves the uploaded basename and uses the selected output extension |

Unit (15), frontend DOM (8), API integration (7), browser E2E (3), and deployment checks pass. The download test also verifies file content and TTL reset.

Use generated small test media or fixtures with redistribution rights. Do not commit private user videos or secrets.

## 4. Manual smoke test

The smoke tests exercised health, static file serving, conversion requests, SSE completion, output download, and output probing. The 2026-11-19 CPU container smoke test initially retried a connection reset while startup hardware detection was running, then passed. The 2026-11-22 NVIDIA smoke test used an isolated Compose project; its service and named test volume were removed after verification. Tests used temporary generated media and temporary containers/directories.

The following checks remain **not executed**: GPU-to-CPU fallback after a real encoding failure, full 10-minute TTL expiry, cleanup after server restart, load/performance profiling, and graceful shutdown with active real conversions. The provided Coolify deployment's exact conversion failure remains unverified because its runtime logs and failing job ID were not available. Current code does not automatically remove source uploads; test operators must clean them up.

Do not interpret the placeholder `npm test` exit status as evidence that an automated test suite passed.
