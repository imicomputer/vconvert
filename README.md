# VConvert

VConvert is a browser-based video conversion application. An Express and TypeScript server accepts video uploads, probes media with FFprobe, converts with FFmpeg, streams job progress over Server-Sent Events (SSE), and makes completed files available for download. It supports CPU encoding and attempts NVIDIA NVENC or AMD VAAPI acceleration where available.

> **Project status:** Version 0.2.0 includes the TypeScript build, automated unit/frontend/integration suites, deployment validation, and development-only Swagger API documentation. Review [the verification report](./docs/TEST_RESULTS.md) and [known limitations](./docs/ARCHITECTURE.md#known-limitations) before production deployment.

## Features

- Convert between MP4, MKV, WebM, AVI, MOV, FLV, WMV, and 3GP.
- Upload using drag-and-drop or the file picker (2 GiB maximum by default).
- Track conversion progress in the browser in real time.
- Download converted output; output files are automatically cleaned up after their retention period.
- Detect available NVIDIA/AMD hardware at server startup and fall back to CPU when a GPU encode fails.
- Use the responsive web interface with a dark/light theme toggle.

## Requirements

- Node.js 20 or newer and npm.
- FFmpeg and FFprobe installed and available as `ffmpeg` and `ffprobe` on the server's `PATH`.
- A modern browser with JavaScript modules, `fetch`, and `EventSource` (SSE) support.
- Disk space for uploaded and converted media. The default upload size limit is 2 GiB per file.
- Internet access in the browser to load the Tailwind CSS CDN used by the current page.

GPU acceleration is optional. CPU encoding is used if no supported accelerator is detected or a GPU encode fails. The FFmpeg build and host drivers must support the relevant encoder for hardware acceleration to work.

## Quick start

```bash
git clone https://github.com/imicomputer/vconvert.git
cd vconvert
npm ci

# Install FFmpeg using your operating system's package manager, if needed.
ffmpeg -version
ffprobe -version

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Development Swagger UI is available at [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/), and the OpenAPI JSON is at [http://localhost:3000/api-docs/openapi.json](http://localhost:3000/api-docs/openapi.json). Swagger is not mounted in production.

For a compiled run instead:

```bash
npm run build
npm start
```

The server reads optional settings from a local `.env` file; see [`.env.example`](./.env.example) and [Development & Deployment](./docs/DEVELOPMENT_AND_DEPLOYMENT.md). Do not commit `.env` files, uploaded videos, or generated output.

### Docker Compose and Coolify

The repository includes a production Docker image and Compose configurations for CPU, NVIDIA, and AMD hosts. See [Docker Compose and Coolify deployment](./docs/DEVELOPMENT_AND_DEPLOYMENT.md#docker-compose-and-coolify) for setup, GPU host requirements, and Coolify Git Repository instructions.

```bash
docker compose up --build
```

This starts the CPU-compatible configuration by default at `http://localhost:3000`. To use a GPU, set the Coolify Compose file to `compose.nvidia.yaml` or `compose.amd.yaml`, or use the matching file with `docker compose -f` locally.

## Application usage

1. Open the application URL in your browser.
2. Select a video by dropping it into the upload area or using **Browse Files**. The browser accepts common video MIME types/extensions; the server verifies the media using FFprobe.
3. Choose an output format different from the input file's extension.
4. Start conversion and monitor progress. Keep the page open while the job runs.
5. Select **Download Converted File** when conversion completes. Output is deleted automatically after its configured retention interval; downloading resets that interval.

Supported output formats: `mp4`, `mkv`, `webm`, `avi`, `mov`, `flv`, `wmv`, `3gp`. Details and troubleshooting are in the [User Guide](./docs/USER_GUIDE.md).

## Development and GitHub contributions

```bash
npm ci
npm run dev       # Run the TypeScript server in watch mode
npm run build     # Compile TypeScript into dist/
npm start         # Run the compiled server
npm test          # Placeholder only; no automated tests are implemented
```

For contributions through GitHub:

1. Fork the repository or create a feature branch from the current default branch.
2. Keep changes focused; do not commit secrets, `.env`, `node_modules`, `dist`, uploads, or generated media.
3. Build with `npm run build` and report validation accurately. Until a real test suite exists, do not describe `npm test` as a passing test run.
4. Open a pull request with a concise summary, reproduction/verification steps, and screenshots for user-interface changes. Link related GitHub issues when applicable.
5. Do not include real user videos or credentials in issues, logs, screenshots, or pull requests.

The package metadata declares the MIT license. Check the repository's license information and applicable third-party notices before redistributing.

## Documentation

| Document | Contents |
|---|---|
| [Documentation index](./docs/README.md) | Guide to the project documentation |
| [BRD](./docs/BRD.md) | Business goals, scope, stakeholders, and acceptance criteria |
| [FSD](./docs/FSD.md) | Functional requirements and user-visible behavior |
| [Architecture](./docs/ARCHITECTURE.md) | Components, data flow, and implementation limitations |
| [API reference](./docs/API.md) | HTTP and SSE endpoints, request parameters, and response shapes |
| [User Guide](./docs/USER_GUIDE.md) | How to use the application and troubleshoot common problems |
| [Development & Deployment](./docs/DEVELOPMENT_AND_DEPLOYMENT.md) | Setup, configuration, operations, and GitHub workflow |
| [Test Results](./docs/TEST_RESULTS.md) | Actual validation results and a test plan |

## Ringkasan (Bahasa Indonesia)

VConvert adalah aplikasi konversi video berbasis browser. Server Express dan TypeScript menerima unggahan, memeriksa media dengan FFprobe, mengonversi video menggunakan FFmpeg, mengirim progres melalui Server-Sent Events (SSE), dan menyediakan hasil untuk diunduh. Format keluaran: MP4, MKV, WebM, AVI, MOV, FLV, WMV, dan 3GP.

> **Status proyek:** Build TypeScript telah diverifikasi. Pengujian otomatis belum tersedia; perintah `npm test` saat ini hanya menampilkan pesan placeholder. Lihat [hasil verifikasi](./docs/TEST_RESULTS.md) dan [batasan yang diketahui](./docs/ARCHITECTURE.md#known-limitations) sebelum menggunakan proyek di luar pengembangan lokal.

### Persyaratan

- Node.js versi 20 atau lebih baru dan npm.
- FFmpeg dan FFprobe terpasang dan tersedia pada `PATH` server dengan nama `ffmpeg` dan `ffprobe`.
- Browser modern yang mendukung JavaScript module, `fetch`, dan `EventSource` (SSE).
- Ruang disk yang cukup untuk video unggahan dan hasil konversi. Batas ukuran bawaan adalah 2 GiB per berkas.
- Koneksi internet pada browser untuk memuat Tailwind CSS CDN yang digunakan halaman saat ini.

GPU bersifat opsional. Jika akselerator tidak tersedia atau proses encoding GPU gagal, aplikasi menggunakan CPU. Dukungan hardware juga bergantung pada build FFmpeg dan driver pada server.

### Instalasi dan menjalankan

```bash
git clone https://github.com/imicomputer/vconvert.git
cd vconvert
npm ci

# Pasang FFmpeg melalui pengelola paket sistem operasi jika belum tersedia.
ffmpeg -version
ffprobe -version

npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk menjalankan hasil kompilasi:

```bash
npm run build
npm start
```

Pengaturan opsional dibaca dari berkas `.env` lokal. Lihat [`.env.example`](./.env.example) dan [Panduan Pengembangan & Deployment](./docs/DEVELOPMENT_AND_DEPLOYMENT.md). Jangan commit `.env`, video unggahan, atau hasil konversi.

### Cara menggunakan aplikasi

1. Buka URL aplikasi di browser.
2. Pilih video dengan menyeretnya ke area unggah atau menggunakan **Browse Files**. Server memeriksa media menggunakan FFprobe.
3. Pilih format keluaran yang berbeda dari ekstensi berkas input.
4. Mulai konversi dan pantau progres. Jangan tutup halaman selama pekerjaan berlangsung.
5. Pilih **Download Converted File** setelah konversi selesai. Berkas hasil dihapus otomatis setelah masa retensi; pengunduhan akan mengatur ulang masa retensi tersebut.

Panduan langkah demi langkah dan pemecahan masalah tersedia di [Panduan Pengguna](./docs/USER_GUIDE.md).

### Kontribusi melalui GitHub

1. Fork repository atau buat feature branch dari branch default terbaru.
2. Buat perubahan yang terfokus. Jangan commit secret, `.env`, `node_modules`, `dist`, unggahan, atau media hasil.
3. Jalankan `npm run build` dan laporkan hasil validasi dengan benar. Jangan menyebut `npm test` sebagai pengujian yang berhasil sebelum test suite tersedia.
4. Buat pull request dengan ringkasan, langkah reproduksi/verifikasi, dan screenshot untuk perubahan antarmuka. Tautkan issue GitHub terkait bila ada.
5. Jangan sertakan video pengguna atau kredensial asli di issue, log, screenshot, atau pull request.

Metadata paket mendeklarasikan lisensi MIT. Periksa informasi lisensi repository dan pemberitahuan lisensi pihak ketiga sebelum mendistribusikan ulang.

## Dokumentasi

Semua dokumentasi proyek tersedia di folder [`docs/`](./docs/README.md), termasuk BRD, FSD, arsitektur, API, panduan pengguna, panduan pengembangan/deployment, serta hasil dan rencana pengujian.
