# Phase 2: Backend Hardware & Codec Detection

**Status**: ⬜ Pending  
**Effort**: 3 hours | **Tasks**: 3 tasks

---

## Phase Objective

Implement hardware detection infrastructure for GPU accelerators (NVIDIA NVENC, AMD VAAPI/AMF) and CPU fallback mechanism. This phase provides the foundation for intelligent encoder selection used by all subsequent encoding phases.

## Phase Prerequisites

- Phase 1 completed: Backend Infrastructure Setup
- Node.js project with dependencies installed
- TypeScript compilation working
- Express app running

---

## Tasks

### TASK-006: Implement HardwareDetector Service

**Objective**: Create service for detecting available GPU accelerators at application startup

**Acceptance Criteria**:
- [ ] HardwareDetector class created in src/services/HardwareDetector.ts
- [ ] detectAvailableAccelerators() method implemented with 5s timeout per test
- [ ] NVIDIA NVENC detection working (dummy 1-frame encode test)
- [ ] AMD VAAPI/AMF detection working (dummy 1-frame encode test)
- [ ] CPU fallback working (always available)
- [ ] Result cached in memory (no re-testing on subsequent calls)
- [ ] getStatus() returns cached HardwareStatus object
- [ ] All detection runs at startup, not on-demand
- [ ] Validates Property 1: Hardware Detection Consistency

**Implementation Steps**:
1. Create src/services/HardwareDetector.ts
2. Implement detectAvailableAccelerators() - test NVIDIA → AMD → CPU
3. Each test: spawn ffmpeg, set 5s timeout, check exit code
4. Cache result in private field
5. Export HardwareStatus interface with {nvidia, amd, activeAccelerator}
6. Log detection results

---

### TASK-007: Implement MediaProbeService

**Objective**: Create service for extracting video metadata using FFprobe

**Acceptance Criteria**:
- [ ] MediaProbeService class created in src/services/MediaProbeService.ts
- [ ] probeFile(filePath) method spawns ffprobe with -print_format json
- [ ] Parses JSON output to extract duration, width, height, codecs, bitrate, frameRate
- [ ] Calculates totalFrames = duration * frameRate for progress tracking
- [ ] 10-second timeout per probe operation
- [ ] Error handling for corrupted files or missing ffprobe
- [ ] Returns MediaMetadata interface

**Implementation Steps**:
1. Create src/services/MediaProbeService.ts
2. Implement probeFile() using child_process.spawn
3. Parse JSON output from ffprobe
4. Calculate totalFrames
5. Handle errors gracefully (throw AppError)
6. Export MediaMetadata interface

---

### TASK-008: Initialize Hardware Detection at Application Startup

**Objective**: Integrate hardware detection into application startup sequence

**Acceptance Criteria**:
- [ ] HardwareDetector instantiated at server startup
- [ ] detectAvailableAccelerators() called once during startup
- [ ] Result logged with detected accelerators
- [ ] Services registered in dependency injection container
- [ ] No blocking of server startup if detection fails

**Implementation Steps**:
1. Create src/utils/container.ts for DI container
2. In src/index.ts: instantiate HardwareDetector
3. Call detectAvailableAccelerators() and log result
4. Register services as singletons in container
5. Make container available to route handlers

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
2. Review next phase in task03.md
3. Continue execution or save and resume later

**Next Phase**: See EXECUTION_PROGRESS.md for next pending phase
