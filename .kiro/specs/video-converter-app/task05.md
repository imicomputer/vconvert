# Phase 5: Backend API Controllers

**Status**: ⬜ Pending  
**Effort**: 4 hours | **Tasks**: 4 tasks

---

## Phase Objective

Implement HTTP API endpoints (REST controllers) for video conversion workflow, hardware status reporting, and file downloads. This phase bridges the frontend to backend services.

## Phase Prerequisites

- Phases 1-4 completed
- All backend services implemented
- Express server running

---

## Tasks

### TASK-018: Implement HardwareController

**Objective**: Create API endpoint for exposing hardware accelerator status

**Acceptance Criteria**:
- [ ] GET /api/hardware-status endpoint created
- [ ] Returns {status: 'nvidia'|'amd'|'cpu', timestamp}

---

### TASK-019: Implement ConversionController

**Objective**: Create POST /api/convert endpoint for file upload and conversion requests

**Acceptance Criteria**:
- [ ] POST /api/convert accepts multipart file upload
- [ ] Validates file size ≤ 2GB (HTTP 413 if exceeded)
- [ ] Validates targetFormat is supported (HTTP 400 if invalid)
- [ ] Validates targetFormat ≠ input file extension
- [ ] Creates ConversionJob with unique jobId
- [ ] Starts async conversion (fire-and-forget)
- [ ] Returns {jobId} with HTTP 200
- [ ] Error handling with descriptive messages

---

### TASK-020: Implement Progress SSE Endpoint

**Objective**: Create GET /api/progress/:jobId endpoint for real-time progress streaming

**Acceptance Criteria**:
- [ ] Server-Sent Events streaming
- [ ] Sends progress events: {progress: 0-100, status, jobId}
- [ ] On completion: downloadUrl in response
- [ ] On error: errorMessage in response
- [ ] 404 if jobId invalid/expired

---

### TASK-021: Implement Download Endpoint & FileCleanupManager

**Objective**: Create GET /api/download/:jobId endpoint and file cleanup service

**Acceptance Criteria**:
- [ ] GET /api/download/:jobId returns converted file
- [ ] FileCleanupManager registers files with 10-min TTL
- [ ] Auto-deletes expired files
- [ ] resetTTL() on download extends retention
- [ ] Validates Property 5: TTL-Based File Deletion
- [ ] Validates Property 6: TTL Reset on Download

---

## Phase Completion Checklist

- [ ] All tasks completed
- [ ] All acceptance criteria verified
- [ ] All correctness properties validated (if applicable)
- [ ] Code follows SOLID principles
- [ ] No console errors or warnings

## Next Phase

After completing all tasks:
1. Update EXECUTION_PROGRESS.md: Mark this phase as ✅ completed with timestamp
2. Review next phase in task06.md
3. Continue execution or save and resume later

**Next Phase**: See EXECUTION_PROGRESS.md for next pending phase
