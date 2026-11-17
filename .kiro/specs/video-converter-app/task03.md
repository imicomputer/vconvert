# Phase 3: Backend Encoding Strategies

**Status**: ⬜ Pending  
**Effort**: 5 hours | **Tasks**: 7 tasks

---

## Phase Objective

Implement the Strategy Pattern for video encoding with format-specific encoder implementations. This phase creates the extensible encoding engine supporting all 8 video formats with hardware-aware codec selection.

## Phase Prerequisites

- Phase 1 & 2 completed
- HardwareDetector and MediaProbeService available
- Node.js TypeScript setup working

---

## Tasks

### TASK-009: Create EncodingStrategy Interface

**Objective**: Define the contract for all encoding strategy implementations

**Acceptance Criteria**:
- [ ] EncodingStrategy interface created in src/strategies/EncodingStrategy.ts
- [ ] Interface defines buildFFmpegCommand(inputPath, outputPath, metadata, hardwareType)
- [ ] Interface defines getOutputFormat() returning string
- [ ] Interface defines getSupportedCodecs() returning string array
- [ ] Abstract base class with shared padding logic
- [ ] Padding formula: pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p

**Implementation Steps**:
1. Create src/strategies/EncodingStrategy.ts
2. Define interface with 3 methods
3. Create abstract base class
4. Export from src/strategies/index.ts

---

### TASK-010: Implement Mp4MovMkvStrategy

**Objective**: Create strategy for .mp4, .mov, and .mkv formats with hardware-aware H.264 encoding

**Acceptance Criteria**:
- [ ] Mp4MovMkvStrategy class implements EncodingStrategy
- [ ] NVIDIA: h264_nvenc -cq 23 -preset p4
- [ ] AMD: h264_vaapi -qp 23
- [ ] CPU: libx264 -crf 23 -preset fast
- [ ] Audio: aac -b:a 128k
- [ ] Padding filter applied correctly
- [ ] Validates Property 2: Padding Filter Correctness

**Implementation Steps**:
1. Create src/strategies/Mp4MovMkvStrategy.ts
2. Implement buildFFmpegCommand with hardware detection
3. Add video and audio codec configuration
4. Include padding filter

---

### TASK-011: Implement WebmStrategy

**Objective**: Handle .webm format with VP9 codec (CPU only)

**Acceptance Criteria**:
- [ ] WebmStrategy class implements EncodingStrategy
- [ ] Always uses CPU: libvpx-vp9 -crf 23 -preset fast
- [ ] Audio: libopus -b:a 128k
- [ ] Padding filter applied

**Implementation Steps**:
1. Create src/strategies/WebmStrategy.ts
2. Implement for VP9 + Opus

---

### TASK-012, TASK-013, TASK-014: Implement AviStrategy, FlvStrategy, WmvStrategy

Similar structure for each format (AVI with MPEG4, FLV with MPEG2, WMV with WMV2)

---

### TASK-015: Implement ThreeGpStrategy

**Objective**: Create strategy for .3gp format with H.263 codec and QCIF resolution

**Acceptance Criteria**:
- [ ] Always CPU: h263 codec
- [ ] Scale to 352x288 QCIF
- [ ] Audio: aac -ar 8000 -ac 1 -b:a 12.2k
- [ ] Validates Property 3: 3GP Resolution Enforcement

---

### TASK-016: Implement StrategyRegistry Factory

**Objective**: Centralize strategy selection

**Acceptance Criteria**:
- [ ] StrategyRegistry class in src/strategies/StrategyRegistry.ts
- [ ] getStrategy(targetFormat, hardwareType) returns EncodingStrategy
- [ ] All 7 strategies registered
- [ ] Validates Property 8: Strategy Pattern Extensibility

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
2. Review next phase in task04.md
3. Continue execution or save and resume later

**Next Phase**: See EXECUTION_PROGRESS.md for next pending phase
