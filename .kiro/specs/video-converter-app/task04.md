# Phase 4: Backend Video Converter Service

**Status**: ⬜ Pending  
**Effort**: 3 hours | **Tasks**: 1 task

---

## Phase Objective

Implement the core VideoConverterService that orchestrates the complete transcoding workflow, including GPU fallback mechanics, FFmpeg process management, and progress tracking.

## Phase Prerequisites

- Phases 1-3 completed
- All encoding strategies implemented
- HardwareDetector and MediaProbeService working

---

## Tasks

### TASK-017: Implement VideoConverterService

**Objective**: Create orchestrator service for video transcoding with GPU fallback and SSE progress tracking

**Acceptance Criteria**:
- [ ] VideoConverterService class in src/services/VideoConverterService.ts
- [ ] convert(jobId, inputPath, outputPath, targetFormat, onProgress) method
- [ ] Probes input file for metadata
- [ ] Selects strategy based on format and hardware
- [ ] Spawns FFmpeg and monitors progress
- [ ] Calculates progress percentage from frame count
- [ ] GPU fallback on encoder failure
- [ ] Progress never decreases (monotonic)
- [ ] Validates Property 4: GPU Fallback Monotonicity
- [ ] Validates Property 7: Progress Monotonicity

**Implementation Steps**:
1. Create src/services/VideoConverterService.ts
2. Inject HardwareDetector, MediaProbeService, StrategyRegistry
3. Implement convert() orchestration
4. Implement FFmpeg process spawning
5. Parse progress from FFmpeg output
6. Implement GPU fallback logic
7. Emit progress events via callback

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
2. Review next phase in task05.md
3. Continue execution or save and resume later

**Next Phase**: See EXECUTION_PROGRESS.md for next pending phase
