# Test Plan & Results

**Verification date:** 2026-11-19

**Scope:** Current repository checkout  
**Status:** Automated tests are implemented. Unit, frontend DOM, and Compose checks pass; API and one browser acceptance assertion expose current implementation gaps listed below.

## 1. Executed checks

| Check | Command | Result |
|---|---|---|
| TypeScript compilation | `npm run build` | **Passed** — `tsc` exited with code 0 |
| Runtime/tool availability | `node --version`, `npm --version`, `ffmpeg -version`, `ffprobe -version` | **Passed in this environment** — Node v26.10.0, npm 11.19.1, FFmpeg 6.1.1, FFprobe 6.1.1 |
| Local API conversion smoke test | `npm run dev`, `curl`, FFmpeg-generated 1-second test clip, `ffprobe` | **Passed** — `/health` and the UI/config static files returned HTTP 200; an MKV upload was accepted for MP4 conversion; SSE reported `completed`; download returned HTTP 200 with `converted.mp4`; FFprobe read the output as a 1-second MP4 container |
| Compose variants and overrides | `docker compose -f <file> config --quiet`; custom `UPLOAD_DIR`, `PUBLISH_PORT`, and `PORT` on all three files; empty `UPLOAD_DIR` on CPU config | **Passed** — all variants parsed; custom upload path resolved to both the container environment and volume target; `PUBLISH_PORT=8080` mapped to container port `3000`; empty upload path fell back to `/tmp/uploads` |
| Production image build | `docker compose -f compose.yaml build` | **Passed** — Docker build completed, including `npm run build` in the Node 20 build stage |
| Container API conversion smoke test | Temporary Docker container, `curl`, generated 1-second MKV, SSE, download, `ffprobe` | **Passed on CPU** — `/health` and `/api/hardware-status` responded; status was `cpu`; conversion completed over SSE; download succeeded; FFprobe identified an MP4 container with duration 1.045 seconds |
| Backend unit tests | `npm run test:unit` | **Passed** — 15 tests, including all eight strategies, hardware priority/timeouts, FFprobe parse/error/timeout, GPU-to-CPU fallback, and cleanup TTL/reset |
| Frontend DOM tests | `npm run test:frontend` | **Passed** — 8 jsdom tests for dropzone, file validation, format filtering, progress, notifications, theme persistence, API errors, and SSE completion |
| API integration tests | `npm run test:integration` | **Partial** — 3 passed; 4 requirement assertions fail against current behavior (see section 3) |
| Browser E2E | `npm run test:e2e` in Playwright 1.65.1 image with FFmpeg installed | **Partial** — dark/mobile and unsupported-file tests passed; conversion/download reaches completion but expected original output filename differs from actual filename |
| Compose deployment checks | `npm run test:deployment` | **Passed** — all three Compose variants parsed; custom upload path and port mapping verified; empty upload path falls back to `/tmp/uploads` |

The tool-version check only confirms availability on the verification host; it does not establish a minimum supported version or validate another deployment environment.

## 2. Automated Test Coverage

The repository now has Node's built-in test runner via `tsx`, jsdom frontend tests, Playwright browser tests, and Compose configuration checks. Core suites do not require a physical GPU. Playwright requires Chromium, FFmpeg, and FFprobe; Compose checks require Docker Compose and Python 3. Test media is generated in temporary directories and is not committed.

`npm test` runs unit, frontend DOM, and API integration tests. `npm run test:e2e` and `npm run test:deployment` run separately because they require browser/system tools or Docker.

## 3. Requirement Mismatches Found

The following assertions intentionally remain failing because behavior fixes were outside the approved scope:

| Requirement | Expected | Observed |
|---|---|---|
| Upload size limit (deployment/API contract) | HTTP 413 for a file exceeding the configured limit | HTTP 500 from the current Multer error path |
| Requirement 31: unsupported file type | Reject non-video file with HTTP 400 | `.txt` upload is accepted and starts a job |
| Requirement 10: successful terminal SSE event | `status: "done"` | `status: "completed"` |
| Requirement 22: downloaded filename | Original basename with target extension, e.g. `sample.mp4` | `converted.mp4` |

The unit and DOM tests pass independently. API integration has 3 passing and 4 failing tests; Playwright has 2 passing tests and one failing filename assertion. The download test also verifies file content and TTL reset before the filename assertion.

Use generated small test media or fixtures with redistribution rights. Do not commit private user videos or secrets.

## 4. Manual smoke test

The smoke tests exercised health, static file serving, one conversion request, SSE completion, output download, and output probing. The 2026-11-19 container smoke test initially retried a connection reset while startup hardware detection was still running, then passed. Tests used temporary generated media and temporary containers/directories.

The following checks remain **not executed**: physical GPU hardware fallback, full 10-minute TTL expiry, cleanup after server restart, load/performance profiling, and graceful shutdown with active real conversions. The 2026-11-19 hardware-status check used CPU fallback because no GPU was available to the test container. Current code does not automatically remove source uploads; test operators must clean them up.

Record a new dated entry in this report when these checks have actually been run. Do not turn the planned steps above into a pass claim.
