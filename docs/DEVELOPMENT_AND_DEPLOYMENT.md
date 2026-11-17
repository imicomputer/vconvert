# Development & Deployment Guide

## Prerequisites

- Node.js 20+ and npm.
- FFmpeg and FFprobe installed on the server and available on `PATH`.
- A writable upload/output directory with enough free space.
- A modern browser for UI verification. The page currently fetches Tailwind CSS from a CDN.

GPU support is optional. For NVIDIA or AMD acceleration, install compatible drivers and an FFmpeg build that includes the matching encoder. Verify the host's FFmpeg build independently; the application falls back to CPU if detection/encoding does not succeed.

## Local setup

```bash
git clone https://github.com/imicomputer/vconvert.git
cd vconvert
npm ci

ffmpeg -version
ffprobe -version

mkdir -p /tmp/uploads
npm run dev
```

Visit `http://localhost:3000`. To build and run the compiled server:

```bash
npm run build
npm start
```

The build writes TypeScript output to `dist/`. `npm run dev` uses `tsx watch` to run the sources.

## Environment configuration

Create a local `.env` if you need to override supported settings. Do not commit this file.

```dotenv
NODE_ENV=development
PORT=3000
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE_BYTES=2147483648
FILE_TTL_SECONDS=600
HARDWARE_DETECTION_TIMEOUT_MS=5000
MEDIA_PROBE_TIMEOUT_MS=10000
FILE_CLEANUP_INTERVAL_MS=30000
```

See the authoritative configuration table in [Architecture & Application Documentation](./ARCHITECTURE.md#4-configuration). `FFMPEG_PATH`, `FFMPEG_TIMEOUT_MS`, and `LOG_LEVEL` occur in `.env.example` but currently do not control runtime behavior. The FFmpeg executable name is hard-coded as `ffmpeg`; both `ffmpeg` and `ffprobe` must be on the process `PATH`.

## Validation commands

```bash
npm run build
npm test
```

`npm run build` runs the TypeScript compiler. `npm test` is currently a placeholder that prints `Tests not yet implemented`; its successful exit status is not evidence that tests passed. See [Test Plan & Results](./TEST_RESULTS.md).

## Operational guidance

- Ensure `UPLOAD_DIR` exists and is writable before starting the server.
- Keep the directory on a filesystem with adequate free space and monitor it. Completed outputs expire, but source uploads currently are not automatically removed by the conversion flow.
- Restrict network access: the API has no authentication/rate limit and CORS is permissive.
- Use an HTTPS reverse proxy and add authentication, request/concurrency limits, and suitable storage retention before any untrusted/public deployment.
- Avoid multiple application instances unless a shared job store and shared output storage are added; current job and cleanup state is process-local.
- The repository does not include a Dockerfile, Compose configuration, Kubernetes manifests, or CI workflow. Container/orchestrator deployment must be designed and tested by the operator rather than copied from older guides.
- The configured graceful shutdown waits for a fixed period; validate shutdown behavior in the target environment before relying on it for long-running conversions.

## GitHub contribution workflow

1. Fork the repository or branch from its current default branch.
2. Keep the pull request focused and update relevant `docs/` pages for externally visible changes.
3. Do not commit credentials, `.env`, private media, generated `dist/`, `node_modules/`, or upload/output data.
4. Run `npm run build` and report its result. Do not report `npm test` as a passing suite until actual tests are added.
5. Include steps to reproduce and verify the change; add screenshots for interface changes.
6. Link the relevant issue and request review through the repository's normal GitHub process.

Package metadata declares MIT licensing; check repository license information and third-party notices when redistributing.
