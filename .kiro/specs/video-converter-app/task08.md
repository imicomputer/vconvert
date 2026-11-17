# Phase 8: Frontend File & Format Handling

**Status**: ⬜ Pending  
**Effort**: 3 hours | **Tasks**: 2 tasks

---

## Phase Objective

Implement file upload handling and dynamic format selection with filtering based on input format.

## Phase Prerequisites

- Phase 6-7 completed (HTML, theme setup)
- DropzoneHandler and FormatSelector stubs created

---

## Tasks

### TASK-026: Implement DropzoneHandler Class

**Objective**: Create file drag-drop and file input handling with format tracking

**Acceptance Criteria**:
- [ ] DropzoneHandler class in /public/js/classes/DropzoneHandler.js
- [ ] Accepts drag-drop files with visual highlight
- [ ] File size validation (reject > 2GB)
- [ ] Extracts file extension (case-insensitive)
- [ ] Emits events: fileDropped, highlight, unhighlight, formatChange
- [ ] getSelectedFile() and getInputFormat() accessors
- [ ] Validates Property 11: Format Filtering Correctness

---

### TASK-027: Implement FormatSelector Class

**Objective**: Create format dropdown with dynamic filtering

**Acceptance Criteria**:
- [ ] FormatSelector class in /public/js/classes/FormatSelector.js
- [ ] SUPPORTED_FORMATS: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', '3gp']
- [ ] updateAvailableFormats(inputFormat) disables matching format
- [ ] Disabled format: opacity 0.5, strikethrough, helper text "(Same as input format)"
- [ ] getSelectedFormat() and setSelectedFormat() methods
- [ ] Smooth transitions (200ms) for styling changes
- [ ] Validates Property 12: Dynamic Format Availability

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
2. Review next phase in task09.md
3. Continue execution or save and resume later

**Next Phase**: See EXECUTION_PROGRESS.md for next pending phase
