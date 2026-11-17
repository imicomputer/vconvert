# Business Requirements Document (BRD)

**Product:** VConvert  
**Document status:** Baseline for the current repository implementation  
**Last verified:** 2026-11-17

## 1. Purpose

VConvert provides a simple web interface for converting a user-selected video into another supported container/codec combination. The application is intended to run on a server that has FFmpeg available, with optional GPU encoding when the host and FFmpeg build support it.

## 2. Business need

Users may have video files that cannot be played or shared conveniently in their current format. VConvert lets a user submit a video through a browser, choose a supported output format, monitor progress, and download the result without operating FFmpeg commands directly.

## 3. Goals and outcomes

- Provide a browser-accessible conversion workflow.
- Support common formats: MP4, MKV, WebM, AVI, MOV, FLV, WMV, and 3GP.
- Show conversion progress and a clear completion or failure state.
- Make converted output downloadable and remove it after a configurable retention period.
- Use an available supported hardware encoder when detected; retain CPU encoding as a fallback.

## 4. Stakeholders

| Stakeholder | Need |
|---|---|
| End user | Upload, convert, track, and retrieve a video through a browser |
| Application operator | Install FFmpeg, configure storage and limits, and monitor the server |
| Developer/contributor | Build and extend the web application and encoding strategies |

## 5. Scope

### In scope

- One video upload per conversion request.
- Server-side media probing and transcoding using FFprobe and FFmpeg.
- The eight output formats registered by the application.
- Hardware status reporting and CPU fallback after a hardware encoding failure.
- Server-Sent Events progress updates.
- Download endpoint and automatic expiration of completed output files.
- A static browser UI served by the application.

### Out of scope for the current implementation

- User accounts, authentication, authorization, or per-user job history.
- Batch conversion, a persistent job queue, job cancellation through the public API, or conversion scheduling.
- Durable job metadata or file storage across server restarts.
- A supported Docker/Kubernetes deployment definition in this repository.
- A production service-level objective or guaranteed conversion time.
- Automated regression tests; the configured test script is currently a placeholder.

## 6. Business rules

1. A conversion requires one uploaded file and a supported `targetFormat`.
2. The target format must differ from the source filename extension.
3. The default maximum upload size is 2 GiB and may be configured by the operator.
4. The source must contain a usable video stream and positive duration/dimensions for FFprobe to proceed.
5. A completed output is associated with its in-memory job ID and can be downloaded only while that job and managed output remain available.
6. Completed outputs expire after the configured TTL; downloading an output resets its TTL.
7. Jobs and cleanup state are in memory. Restarting the process loses job lookup state.
8. Hardware acceleration is optional and depends on host drivers and FFmpeg encoder support.

## 7. Success criteria

- A user can reach the interface and submit a supported video within configured limits.
- A valid request returns a job ID; the user can observe progress and download a completed output.
- An invalid request receives a useful error response.
- The server can build with the repository's TypeScript compiler.
- Documentation describes supported behavior and verification evidence without claiming unimplemented capabilities.

## 8. Risks and assumptions

- Conversion quality, performance, and available codecs depend on the FFmpeg binary installed by the operator.
- Uploads and output files consume server disk space. Current code expires managed output files, but does not remove uploaded source files after conversion.
- The API has no authentication or rate limiting and allows cross-origin requests. It must not be exposed as a public service without additional controls.
- Jobs are not persisted; users lose access to active/completed job IDs after a server restart.
- The current automated test command does not execute tests. See [Test Plan & Results](./TEST_RESULTS.md).
