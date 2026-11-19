# API Reference

**Base URL (local):** `http://localhost:3000/api`  
**Authentication:** none  
**Content types:** JSON responses; multipart form data for conversion; SSE for progress.

## Development Swagger UI

When `NODE_ENV=development`, Swagger UI is available at:

- UI: `http://localhost:3000/api-docs/`
- OpenAPI JSON: `http://localhost:3000/api-docs/openapi.json`

Start the development server with `npm run dev`. Swagger routes are not mounted in production environments.

## Endpoints

### `GET /health`

Health endpoint outside the `/api` prefix.

**Success `200`:**

```json
{ "status": "ok" }
```

### `GET /api/hardware-status`

Returns the hardware accelerator selected during server startup.

**Success `200`:**

```json
{
  "status": "nvidia",
  "nvidia": true,
  "amd": false,
  "timestamp": "2026-11-17T10:55:31.166Z"
}
```

`status` is `nvidia`, `amd`, or `cpu`. NVIDIA is probed first; AMD is checked only if NVIDIA is unavailable. CPU is the fallback.

### `POST /api/convert?targetFormat={format}`

Uploads one video and starts an asynchronous conversion.

- **Body:** `multipart/form-data`
- **File field:** `file` (required)
- **Query:** `targetFormat` (required; one of `mp4`, `mkv`, `webm`, `avi`, `mov`, `flv`, `wmv`, `3gp`)
- **Default maximum:** 2 GiB (`MAX_FILE_SIZE_BYTES`)

The browser client also appends `targetFormat` as a multipart field, but the server reads it from the **query string**.

```bash
curl -X POST \
  'http://localhost:3000/api/convert?targetFormat=mp4' \
  -F 'file=@./input.mkv'
```

**Accepted `200`:**

```json
{ "jobId": "550e8400-e29b-41d4-a716-446655440000" }
```

The job initially probes the file and then encodes it. A response means the job was started, not that conversion completed.

**Application validation errors:** `400` for missing file, missing format, unsupported target format, or same source/target extension. An upload exceeding `MAX_FILE_SIZE_BYTES` is rejected before job creation with HTTP `413` and error code `FILE_TOO_LARGE`. Media probing happens asynchronously after the job ID is returned; unreadable media is reported as a failed job in the SSE stream, not as a request-level validation response.

Application error body:

```json
{
  "error": "MISSING_FORMAT",
  "message": "targetFormat query parameter required",
  "code": "MISSING_FORMAT",
  "timestamp": "2026-11-17T10:56:00.000Z"
}
```

### `GET /api/progress/{jobId}`

Opens an SSE stream. Use `EventSource` in browsers or an SSE-compatible client. The server sends an initial state, then polls the job every 500 ms.

```javascript
const source = new EventSource(`/api/progress/${jobId}`);
source.onmessage = ({ data }) => {
  const job = JSON.parse(data);
  console.log(job.status, job.progress);
  if (job.status === 'done' || job.status === 'error') source.close();
};
```

Example event data:

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "progress": 42,
  "status": "processing",
  "currentFrame": 1260,
  "totalFrames": 3000
}
```

While a job is active, `status` is `processing`. On completion, the terminal event uses `status: "done"` and includes `downloadUrl`, such as `/api/download/{jobId}`. On failure, it uses `status: "error"` and may include `errorMessage`. Job state is in memory; an unknown or restarted-server job returns a `JOB_NOT_FOUND` error.

### `GET /api/download/{jobId}`

Downloads the output for a completed job. The response is an attachment using the uploaded file's original basename and the target extension (for example, `sample.mp4`). This request resets the output's TTL.

- `404 JOB_NOT_FOUND`: the job ID is unknown.
- `400 JOB_NOT_READY`: the job has not completed.
- `404 FILE_NOT_FOUND`: the completed output is no longer available to the cleanup manager.

## Error format

Application errors are JSON:

```json
{
  "error": "JOB_NOT_FOUND",
  "message": "Job not found: ...",
  "code": "JOB_NOT_FOUND",
  "timestamp": "..."
}
```

The `error` and `code` fields contain the same code. Generic server errors use `INTERNAL_SERVER_ERROR`; in development mode the message may include an underlying error, while other modes return a generic message. Errors raised by upload middleware may follow the generic handler.

## Lifecycle and operational notes

- No API authentication, authorization, rate limiting, or public cancel endpoint is implemented.
- CORS currently allows all origins.
- Job data and output tracking are in process memory; server restarts invalidate job lookup.
- Only completed output files are registered with the TTL cleanup manager. Input upload files are not explicitly removed by the conversion flow.
- Configure storage limits and network access at the deployment boundary. See [Development & Deployment](./DEVELOPMENT_AND_DEPLOYMENT.md).
