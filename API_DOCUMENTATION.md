# Video Converter Web Application - API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:3000/api`  
**Authentication**: None (public API)

---

## Overview

The Video Converter API provides endpoints for:
- Hardware acceleration status detection
- Video file conversion with multiple format support
- Real-time progress tracking via Server-Sent Events (SSE)
- Converted file downloads

---

## API Endpoints

### 1. GET /api/hardware-status

Returns current hardware acceleration status.

**Request**:
```bash
GET /api/hardware-status HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```json
{
  "status": "nvidia",
  "nvidia": true,
  "amd": false,
  "timestamp": "2026-11-17T10:55:31.166Z"
}
```

**Status Values**:
- `"nvidia"` - NVIDIA NVENC GPU acceleration available
- `"amd"` - AMD VAAPI/AMF GPU acceleration available
- `"cpu"` - CPU encoding (fallback when no GPU available)

**Use Case**: Display hardware badge on frontend, determine optimal encoding settings

---

### 2. POST /api/convert

Submit a video file for conversion to target format.

**Request**:
```bash
POST /api/convert HTTP/1.1
Host: localhost:3000
Content-Type: multipart/form-data

file: <binary video file>
format: "mp4"
```

**Form Parameters**:
- `file` (required): Video file (max 2GB)
- `format` (required): Target format - one of: `mp4`, `mkv`, `webm`, `avi`, `mov`, `flv`, `wmv`, `3gp`

**Response** (200 OK):
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "format": "mp4",
  "status": "started",
  "inputFile": "video.mkv",
  "outputFile": "video.mp4",
  "timestamp": "2026-11-17T10:56:00.000Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "NO_FILE",
  "message": "No file provided in request",
  "code": "NO_FILE"
}
```

**Error Codes**:
- `NO_FILE` - File not provided
- `NO_FORMAT` - Format not specified
- `INVALID_FORMAT` - Format not supported
- `SAME_FORMAT` - Input and output format are identical
- `FILE_TOO_LARGE` - File exceeds 2GB limit
- `INVALID_VIDEO` - File is not a valid video
- `CONVERSION_FAILED` - Encoding process failed

**Retry Logic**: On error, client can:
1. Fix the error (e.g., choose different format)
2. Resubmit the same file
3. Use the `jobId` to check progress on new attempt

---

### 3. GET /api/progress/:jobId

Stream real-time conversion progress via Server-Sent Events.

**Request**:
```javascript
const eventSource = new EventSource(`/api/progress/${jobId}`);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Progress: ${progress.percent}%`);
};

eventSource.onerror = () => {
  console.error('Connection lost');
  eventSource.close();
};
```

**Response** (200 OK with SSE stream):
```
data: {"jobId":"550e8400...","percent":0,"status":"Preparing conversion...","timestamp":"2026-11-17T10:56:01.000Z"}

data: {"jobId":"550e8400...","percent":15,"status":"Encoding video...","timestamp":"2026-11-17T10:56:05.000Z"}

data: {"jobId":"550e8400...","percent":50,"status":"Encoding video...","timestamp":"2026-11-17T10:56:15.000Z"}

data: {"jobId":"550e8400...","percent":100,"status":"Conversion complete!","timestamp":"2026-11-17T10:56:45.000Z"}
```

**Progress Object**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "percent": 50,
  "status": "Encoding video...",
  "timestamp": "2026-11-17T10:56:15.000Z"
}
```

**Progress Characteristics**:
- `percent`: 0-99 (clamped, never reaches 100 until download completes)
- Updates throttled to 500ms minimum
- Never decreases (monotonic)
- Connection closes when conversion completes

**Connection Handling**:
- Keep connection open while conversion is active
- Automatic reconnection recommended on disconnect
- 30-second timeout if no progress updates

---

### 4. GET /api/download/:jobId

Download the converted video file.

**Request**:
```bash
GET /api/download/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:3000
```

**Response** (200 OK):
```
Content-Type: video/mp4 (or appropriate format MIME type)
Content-Disposition: attachment; filename="video.mp4"
Content-Length: 12345678

<binary video file>
```

**Effect**: 
- Downloads converted video file
- Resets file TTL (extends retention by 10 minutes)
- File garbage-collected after TTL expires

**Error Response** (404 Not Found):
```json
{
  "error": "JOB_NOT_FOUND",
  "message": "Conversion job not found",
  "code": "JOB_NOT_FOUND"
}
```

**MIME Types by Format**:
- MP4: `video/mp4`
- MKV: `video/x-matroska`
- WebM: `video/webm`
- AVI: `video/x-msvideo`
- MOV: `video/quicktime`
- FLV: `video/x-flv`
- WMV: `video/x-ms-wmv`
- 3GP: `video/3gpp`

---

## Supported Formats

| Format | Extension | Codec | GPU Support | Quality | Use Case |
|--------|-----------|-------|-------------|---------|----------|
| MP4 | .mp4 | H.264 | ✅ NVIDIA/AMD | High | Universal, web, mobile |
| MKV | .mkv | H.264 | ✅ NVIDIA/AMD | High | Streaming, archival |
| WebM | .webm | VP9 | ✅ Hardware | High | Web, modern browsers |
| AVI | .avi | MPEG-4 | ❌ CPU only | Medium | Legacy, Windows |
| MOV | .mov | H.264 | ✅ NVIDIA/AMD | High | Apple ecosystem |
| FLV | .flv | MPEG-2 | ❌ CPU only | Low | Legacy, Flash |
| WMV | .wmv | WMV2 | ❌ CPU only | Medium | Legacy, Windows Media |
| 3GP | .3gp | H.263 | ❌ CPU only | Low | Mobile phones, 352x288 QCIF |

---

## Request/Response Examples

### Example 1: Simple Conversion Workflow

**Step 1: Submit conversion**
```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@video.mkv" \
  -F "format=mp4"
```

Response:
```json
{
  "jobId": "abc123",
  "status": "started"
}
```

**Step 2: Stream progress**
```javascript
const sse = new EventSource(`http://localhost:3000/api/progress/abc123`);
sse.onmessage = (e) => {
  const {percent, status} = JSON.parse(e.data);
  console.log(`${percent}% - ${status}`);
};
```

**Step 3: Download converted file**
```bash
curl -O http://localhost:3000/api/download/abc123
# Saves as video.mp4
```

### Example 2: Error Handling

**Same format error**:
```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@video.mp4" \
  -F "format=mp4"
```

Response (400):
```json
{
  "error": "SAME_FORMAT",
  "message": "Output format cannot be same as input",
  "code": "SAME_FORMAT"
}
```

Client action: Present user with different format options, exclude input format.

**File too large**:
```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@video_3gb.mp4" \
  -F "format=mkv"
```

Response (400):
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "File size exceeds 2GB limit",
  "code": "FILE_TOO_LARGE"
}
```

---

## Rate Limiting & Throttling

- **File Upload**: No explicit limit (system-dependent)
- **Progress Updates**: Throttled to 500ms minimum
- **Download**: Bandwidth dependent
- **Concurrent Conversions**: Limited by system resources (typically 1-4 simultaneously)

---

## File Lifecycle

```
1. Upload
   └─ File stored in /uploads/{jobId}
   └─ TTL set to 10 minutes
   └─ Conversion starts immediately

2. Conversion (Active)
   └─ Progress streamed via SSE
   └─ Intermediate files stored
   └─ Progress throttled (500ms updates)

3. Ready for Download
   └─ Converted file ready
   └─ Available at /api/download/:jobId
   └─ TTL: 10 minutes from completion

4. Downloaded
   └─ TTL reset (extends to +10 minutes from download)
   └─ File stays available for additional downloads

5. Expired
   └─ Automatic deletion after 10 min of inactivity
   └─ Cleanup runs every 30 seconds
   └─ File removed from /uploads/
```

---

## Error Handling

All errors follow consistent JSON format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes**:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid input (missing file, unsupported format, etc.)
- `404 Not Found` - Job not found, file expired
- `500 Internal Server Error` - Server error during conversion

**Recommended Client Behavior**:
- Catch errors in try/catch
- Display user-friendly messages based on `error` code
- Offer retry for transient errors (500)
- Offer different options for input errors (400)

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| File upload | < 5s | For typical 100-500MB file |
| Conversion start | < 2s | Hardware detection + setup |
| Progress update latency | < 600ms | 500ms throttle + network |
| File download | Bandwidth-limited | Depends on file size and network |
| API response | < 100ms | Hardware status, error responses |

---

## Security Considerations

- **File Upload Limits**: 2GB maximum per file
- **File Types**: Video formats only (validated by FFmpeg probe)
- **File Storage**: Temporary `/uploads` directory with TTL cleanup
- **No Authentication**: Public API (add authentication layer if needed)
- **Input Validation**: All inputs validated before processing
- **Error Messages**: Avoid exposing system paths/internals in errors

---

## Integration Examples

### JavaScript/Fetch
```javascript
// Submit conversion
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('format', 'mp4');

const response = await fetch('/api/convert', {
  method: 'POST',
  body: formData
});

const {jobId} = await response.json();

// Monitor progress
const sse = new EventSource(`/api/progress/${jobId}`);
sse.onmessage = (e) => {
  const {percent} = JSON.parse(e.data);
  progressBar.value = percent;
};

// Download
location.href = `/api/download/${jobId}`;
```

### Python/Requests
```python
import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder

# Submit
m = MultipartEncoder(fields={
    'file': ('video.mkv', open('video.mkv', 'rb')),
    'format': 'mp4'
})
r = requests.post('http://localhost:3000/api/convert', data=m)
job_id = r.json()['jobId']

# Monitor (SSE)
r = requests.get(f'http://localhost:3000/api/progress/{job_id}', stream=True)
for line in r.iter_lines():
    if line:
        data = json.loads(line.split(': ')[1])
        print(f"Progress: {data['percent']}%")

# Download
r = requests.get(f'http://localhost:3000/api/download/{job_id}')
with open('output.mp4', 'wb') as f:
    f.write(r.content)
```

### cURL
```bash
# Submit
JOB_ID=$(curl -s -X POST -F "file=@video.mkv" -F "format=mp4" \
  http://localhost:3000/api/convert | jq -r '.jobId')

# Monitor
curl -N http://localhost:3000/api/progress/$JOB_ID

# Download
curl -O -J http://localhost:3000/api/download/$JOB_ID
```

---

## Changelog

### v1.0.0 (Release)
- Initial API release
- 4 core endpoints
- 8 format support
- GPU acceleration detection
- Real-time progress via SSE
- Automatic file cleanup

---

## Support

For issues or questions:
1. Check API logs: `docker logs video-converter`
2. Verify hardware status: `GET /api/hardware-status`
3. Check file formats: Supported formats listed above
4. Review error code: Match error code to description above

