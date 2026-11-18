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

Create a local `.env` if you need to override supported settings. For Compose, copy `.env.example` to `.env`; Compose reads it for variable substitution and passes supported application settings into the container. Do not commit `.env`.

```dotenv
NODE_ENV=production
CONTAINER_NAME=vconvert
PORT=3000
PUBLISH_PORT=3000
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE_BYTES=2147483648
FILE_TTL_SECONDS=600
HARDWARE_DETECTION_TIMEOUT_MS=5000
MEDIA_PROBE_TIMEOUT_MS=10000
FILE_CLEANUP_INTERVAL_MS=30000
AMD_VIDEO_GID=44
AMD_RENDER_GID=109
VAAPI_DEVICE=/dev/dri/renderD128
```

See the authoritative configuration table in [Architecture & Application Documentation](./ARCHITECTURE.md#4-configuration). `FFMPEG_PATH`, `FFMPEG_TIMEOUT_MS`, and `LOG_LEVEL` occur in `.env.example` but currently do not control runtime behavior. The FFmpeg executable name is hard-coded as `ffmpeg`; both `ffmpeg` and `ffprobe` must be on the process `PATH`.

## Docker Compose and Coolify

The repository provides a multi-stage production `Dockerfile` and three self-contained Compose file choices. The default `compose.yaml` runs on CPU and persists uploads and converted files in the named `uploads` volume:

```bash
cp .env.example .env
docker compose up --build -d
docker compose logs -f
```

Open `http://localhost:${PUBLISH_PORT:-3000}`. `PORT` controls the port inside the container and `PUBLISH_PORT` the host-published port. The named volume is mounted at `UPLOAD_DIR` (default `/tmp/uploads`). Manage the volume separately when planning backups or removal; removing it deletes uploaded and converted media.

Set `CONTAINER_NAME` to choose the Docker container's explicit name, for example `CONTAINER_NAME=vconvert-prod`. In Coolify, add `CONTAINER_NAME` in the resource's environment variables. The default is `vconvert`. Explicit names must be unique across the Docker host and can prevent scaling the service to multiple replicas; use a unique name for each deployment when deploying multiple instances.

For GPU acceleration, use the relevant Compose file instead of the default:

```bash
# NVIDIA host with NVIDIA Container Toolkit installed and configured:
docker compose -f compose.nvidia.yaml up --build -d

# AMD host with /dev/kfd and /dev/dri available:
docker compose -f compose.amd.yaml up --build -d
```

The NVIDIA file requests all NVIDIA GPUs using the Compose device reservation API; the host needs a compatible NVIDIA driver and NVIDIA Container Toolkit. The AMD file maps `/dev/kfd` and `/dev/dri` into the container for VAAPI and adds the `video` and `render` supplemental groups. Set `AMD_VIDEO_GID` and `AMD_RENDER_GID` to the corresponding group IDs on the host if they differ from the defaults; set `VAAPI_DEVICE` if the host's render node is not `/dev/dri/renderD128`. The image includes FFmpeg and Mesa VAAPI drivers. GPU encoding still depends on host devices/drivers and the FFmpeg encoders available in the image; check `/api/hardware-status` and logs after deployment. CPU encoding remains available as a fallback.

### Coolify Git Repository resource

1. In Coolify, create a **Docker Compose** resource from a Git Repository and select the GitHub App/repository and branch.
2. Set the Compose file path to `compose.yaml` for CPU, `compose.nvidia.yaml` for NVIDIA, or `compose.amd.yaml` for AMD. Each file defines its own service and named volume so it can be selected as the Compose file directly.
3. Add the required variables in the Coolify resource's environment settings. Set at least `PORT=3000` and `UPLOAD_DIR=/tmp/uploads`; optionally set `CONTAINER_NAME`, `PUBLISH_PORT`, file-size/retention values, and AMD host group IDs as needed. Do not add a separate `env_file` path: Coolify injects these environment variables during Compose deployment.
4. Configure the domain/proxy to route to service `vconvert` on the container port set by `PORT` (default `3000`). If using Coolify's managed proxy, follow the instance's Compose port-publishing guidance and avoid publishing a conflicting host port.
5. Deploy and verify `/health` and `/api/hardware-status`. GPU variants require the matching GPU driver/runtime and device access on the Coolify host; selecting a GPU Compose file alone cannot install host drivers.

For AMD, device permissions and host driver compatibility vary by distribution. If device access or hardware encoding is unavailable, inspect the container logs and group IDs, and verify that the host FFmpeg/driver stack supports VAAPI. These Compose configurations do not add authentication or rate limiting; place the app behind appropriate access controls before exposing it publicly.

### Deployment Docker Compose dan Coolify (Bahasa Indonesia)

`compose.yaml` adalah konfigurasi bawaan untuk CPU dan menyimpan berkas pada named volume `uploads`. Jalankan `docker compose up --build -d`. Untuk GPU, gunakan `compose.nvidia.yaml` pada host yang sudah memiliki NVIDIA Container Toolkit, atau `compose.amd.yaml` pada host AMD yang menyediakan `/dev/kfd` dan `/dev/dri`. Setiap file Compose GPU dapat dipilih langsung tanpa `extends` atau file Compose tambahan. Sesuaikan `AMD_VIDEO_GID` serta `AMD_RENDER_GID` dengan group ID host jika diperlukan, dan `VAAPI_DEVICE` jika lokasi render node berbeda dari `/dev/dri/renderD128`.

Di Coolify, buat resource **Docker Compose** dari Git Repository melalui GitHub App, lalu pilih file Compose yang sesuai di pengaturan resource. Setiap file GPU mendefinisikan service serta volume sendiri dan dapat dipilih langsung. Atur environment variable pada UI Coolify, minimal `PORT` dan `UPLOAD_DIR=/tmp/uploads`; atur `CONTAINER_NAME` jika ingin nama container tertentu. Nama container harus unik pada host dan dapat menghalangi scaling ke beberapa replika. Arahkan domain ke service `vconvert` pada port internal `PORT`. Pastikan driver/runtime GPU dan akses perangkat sudah disiapkan pada host Coolify; berkas Compose tidak memasang driver pada host. Verifikasi deployment melalui `/health` dan `/api/hardware-status`.

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
- The repository includes Docker Compose files for CPU, NVIDIA, and AMD GPU deployments. It does not include Kubernetes manifests or reverse-proxy configuration; configure access controls and storage operations in the target environment.
- The configured graceful shutdown waits for a fixed period; validate shutdown behavior in the target environment before relying on it for long-running conversions.

## GitHub contribution workflow

1. Fork the repository or branch from its current default branch.
2. Keep the pull request focused and update relevant `docs/` pages for externally visible changes.
3. Do not commit credentials, `.env`, private media, generated `dist/`, `node_modules/`, or upload/output data.
4. Run `npm run build` and report its result. Do not report `npm test` as a passing suite until actual tests are added.
5. Include steps to reproduce and verify the change; add screenshots for interface changes.
6. Link the relevant issue and request review through the repository's normal GitHub process.

Package metadata declares MIT licensing; check repository license information and third-party notices when redistributing.
