# Functional Specification (FSD)

**Product:** VConvert  
**Version:** Describes the current repository implementation  
**Last verified:** 2026-11-17

## 1. Actors

- **User:** interacts with the application through a modern browser.
- **Operator:** runs the Node.js server and supplies FFmpeg/FFprobe and writable storage.

## 2. User workflow

1. User opens the application page.
2. The page requests hardware status and displays the detected accelerator badge.
3. User chooses a video using drag-and-drop or the file picker.
4. The interface checks the file size and likely video type, then identifies the source extension.
5. User chooses an output format other than the source extension.
6. The browser uploads the file and requested target format to the API.
7. The server probes the uploaded media, selects the format strategy, and starts FFmpeg.
8. The browser listens to the job's SSE progress endpoint.
9. On completion, the user downloads the output. The completed output is registered for TTL cleanup; each download resets its expiration time.
10. The user may return to the initial step to convert another file.

## 3. Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | The application shall serve its static web interface and expose `GET /health`. |
| FR-02 | The interface shall allow selecting or dropping one video file. |
| FR-03 | The client shall reject files over the configured client limit and files that do not appear to be video. The server shall enforce its upload limit and validate that FFprobe can read a video stream. |
| FR-04 | The API shall accept one multipart file field named `file` and a `targetFormat` query parameter. |
| FR-05 | The server shall accept only registered target formats and reject an identical source extension and target format. |
| FR-06 | The server shall return a job ID after accepting a conversion request. |
| FR-07 | The server shall probe input media and encode using the strategy registered for the selected output format. |
| FR-08 | The server shall attempt the detected GPU encoder for strategies that use it and retry with CPU encoding when a GPU encoding attempt fails. CPU-only format strategies remain CPU-based. |
| FR-09 | The API shall expose the current hardware status (`nvidia`, `amd`, or `cpu`). |
| FR-10 | The API shall stream current job status, percentage, and frame counts over SSE and include a download URL on completion. |
| FR-11 | The API shall allow downloading a completed output associated with a known job ID. |
| FR-12 | Completed output files shall be expired by the cleanup service after the configured TTL. Downloading an output resets its TTL. |
| FR-13 | The interface shall provide progress, status, completion, and error feedback, and a theme toggle. |

## 4. Formats

The strategy registry supports these **output** extensions:

| Output | Video/audio details visible in strategy | Acceleration behavior |
|---|---|---|
| MP4 | H.264 / AAC | NVENC, VAAPI, or CPU |
| MOV | H.264 / AAC | NVENC, VAAPI, or CPU |
| MKV | H.264 / AAC | NVENC, VAAPI, or CPU |
| WebM | VP9 / Opus | CPU |
| AVI | MPEG-4 / MP3 | CPU |
| FLV | MPEG-2 video / MP3 | CPU |
| WMV | WMV2 / WMA2 | CPU |
| 3GP | H.263 / mono AAC; scaled to 352×288 | CPU |

Input validation in the browser recognizes common video MIME types/extensions, including MPEG and OGG, but those extensions are not output strategies. Actual decodability is determined by FFprobe, not by the filename alone.

## 5. State and progress

Jobs move through `pending`, `probing`, `encoding`, then either `completed` or `failed`. The SSE response includes `jobId`, `progress`, `status`, `currentFrame`, and `totalFrames`. On completion it also includes `downloadUrl`; on failure it may include `errorMessage`.

The job registry and output-file registry are in-memory. There is no public job-cancel endpoint. Closing the browser disconnects its progress stream but does not cancel the conversion.

## 6. Error behavior

The API uses JSON errors with `error`, `message`, `code`, and `timestamp` for application validation failures. Examples include missing file, missing format, unsupported format, same source and target format, unknown job, and download before completion. Media probing is asynchronous: an unreadable input can receive a job ID and later fail through the SSE job status. Upload middleware errors may be handled by the general server error handler rather than the structured validation response.

The user interface should keep the selected output format distinct from the source format and explain upload, conversion, network, or download failures in plain language.

## 7. Quality requirements

- **Compatibility:** serve the UI to modern browsers that implement ES modules, `fetch`, and `EventSource`.
- **Capacity:** honor the configured maximum request file size; operators must provision disk and compute resources for concurrent requests.
- **Reliability:** expose a simple health endpoint and return conversion failures through the job progress stream.
- **Maintainability:** keep format-specific command construction in encoding strategies and API behavior in controllers/routes.
- **Privacy and security:** conversion is performed on the server. Current code has no authentication, authorization, rate limiting, or origin restriction; use only in a controlled environment until those are added.
- **Testability:** add real automated tests before relying on behavior changes; the current `npm test` script is not a test runner.

## 8. Acceptance checks

- A supported, readable sample video can be submitted with a different supported target format.
- Missing or unsupported request parameters are rejected; unreadable media reaches a terminal failed job state.
- Progress reaches a terminal completed/failed state.
- A completed output is downloadable before expiration and becomes unavailable after TTL cleanup.
- The server builds successfully and configured tests, once implemented, execute assertions.
