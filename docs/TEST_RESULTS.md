# Test Plan & Results

**Verification date:** 2026-11-19

**Scope:** Current repository checkout  
**Status:** Compose configuration, Docker image build, and CPU API smoke test verified; automated tests are not implemented.

## 1. Executed checks

| Check | Command | Result |
|---|---|---|
| TypeScript compilation | `npm run build` | **Passed** — `tsc` exited with code 0 |
| Configured test command | `npm test` | **Not a test run** — script prints `Tests not yet implemented` and exits with code 0; no assertions ran |
| Runtime/tool availability | `node --version`, `npm --version`, `ffmpeg -version`, `ffprobe -version` | **Passed in this environment** — Node v26.10.0, npm 11.19.1, FFmpeg 6.1.1, FFprobe 6.1.1 |
| Local API conversion smoke test | `npm run dev`, `curl`, FFmpeg-generated 1-second test clip, `ffprobe` | **Passed** — `/health` and the UI/config static files returned HTTP 200; an MKV upload was accepted for MP4 conversion; SSE reported `completed`; download returned HTTP 200 with `converted.mp4`; FFprobe read the output as a 1-second MP4 container |
| Compose variants and overrides | `docker compose -f <file> config --quiet`; custom `UPLOAD_DIR`, `PUBLISH_PORT`, and `PORT` on all three files; empty `UPLOAD_DIR` on CPU config | **Passed** — all variants parsed; custom upload path resolved to both the container environment and volume target; `PUBLISH_PORT=8080` mapped to container port `3000`; empty upload path fell back to `/tmp/uploads` |
| Production image build | `docker compose -f compose.yaml build` | **Passed** — Docker build completed, including `npm run build` in the Node 20 build stage |
| Configured test command in image | `docker run --rm vconvert-vconvert:latest npm test` | **Not a test run** — prints `Tests not yet implemented`; no assertions ran |
| Container API conversion smoke test | Temporary Docker container, `curl`, generated 1-second MKV, SSE, download, `ffprobe` | **Passed on CPU** — `/health` and `/api/hardware-status` responded; status was `cpu`; conversion completed over SSE; download succeeded; FFprobe identified an MP4 container with duration 1.045 seconds |

The tool-version check only confirms availability on the verification host; it does not establish a minimum supported version or validate another deployment environment.

## 2. Automated test coverage status

No test files matching common `*.test.*` or `*.spec.*` naming conventions were found under `src/`, `public/`, or the project specification directory. The package's `test` script is an echo placeholder. There is no automated coverage report, and no claim of a passing unit/integration suite is made here.

## 3. Recommended test plan

Implement tests before treating the following as regression-protected behavior:

| Area | Scenarios to cover |
|---|---|
| Conversion request validation | Missing upload, missing query parameter, unsupported output, same extension, maximum-size boundary |
| Media probing | Valid video, no video stream, invalid/empty input, probe timeout |
| Format strategies | Expected codec/container arguments and CPU/GPU selection for all eight formats |
| Converter | Job states, progress parsing, success/failure, GPU-to-CPU fallback, child-process errors |
| Progress API | Initial event, periodic update, completion/failure payload, unknown job, client disconnect |
| Download and cleanup | Download only completed jobs, correct extension, TTL reset, expiration, missing output |
| Frontend | File picker/drop, size/type validation, target format selection, SSE terminal states, download and errors |
| Operations | Health response, startup without GPU, startup failure without FFmpeg, shutdown with active conversions |

Use generated small test media or fixtures with redistribution rights. Do not commit private user videos or secrets.

## 4. Manual smoke test

The smoke tests exercised health, static file serving, one conversion request, SSE completion, output download, and output probing. The 2026-11-19 container smoke test initially retried a connection reset while startup hardware detection was still running, then passed. Tests used temporary generated media and temporary containers/directories.

The following checks remain **not executed**: browser interaction in a real browser, negative/error cases, physical GPU hardware fallback, TTL expiration/reset timing, and cleanup after server restart. The 2026-11-19 hardware-status check used CPU fallback because no GPU was available to the test container. Current code does not automatically remove source uploads; test operators must clean them up.

Record a new dated entry in this report when these checks have actually been run. Do not turn the planned steps above into a pass claim.
