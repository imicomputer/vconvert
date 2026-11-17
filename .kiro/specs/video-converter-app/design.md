# Technical Design Document

## Video Converter Web Application

---

## Overview

The Video Converter Web Application is a full-stack, GPU-accelerated video transcoding platform built with Node.js/Express on the backend and vanilla HTML5/Tailwind CSS on the frontend. The system automatically detects available GPU accelerators (NVIDIA NVENC, AMD VAAPI/AMF) at startup and intelligently falls back to CPU encoding if GPUs are unavailable. The architecture emphasizes SOLID principles with clear service separation, dependency injection, strategy patterns for extensible encoding support, and real-time progress tracking via Server-Sent Events.

**Key Features:**
- Automatic GPU detection with CPU fallback on encoding failures
- Real-time progress streaming via Server-Sent Events (SSE)
- Support for 8 video formats (MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP)
- Automatic odd-dimension padding for YUV 4:2:0 compatibility
- Special H.263 codec handling for 3GP format with QCIF resolution
- TTL-based automatic file cleanup (10-minute retention)
- Graceful GPU failure recovery with automatic fallback to CPU
- Dark mode responsive UI with smooth CSS animations
- Comprehensive event logging and monitoring

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Frontend)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   HTML5 UI Layer (Tailwind)              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Step 1:      │  │ Step 2:      │  │ Step 3:      │  │   │
│  │  │ Upload Zone  │  │ Format Sel.  │  │ Progress Bar │  │   │
│  │  │ (Drag-Drop)  │  │ (Dropdown)   │  │ (Real-time)  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                          │   │
│  │  Hardware Badge │ Notification Area (Success/Error)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▲                                     │
│                            │                                     │
│         Frontend Classes    │    HTTP + SSE                      │
│    ┌────────────────────────┼────────────────────────────────┐   │
│    │ • ApiClient            │    • Dark Mode Theme           │   │
│    │ • DropzoneHandler      │    • Animations (Fade, Bounce) │   │
│    │ • ProgressUIController │    • State Management          │   │
│    │ • NotificationManager  │                                 │   │
│    │ • Main Orchestrator    │                                 │   │
│    └────────────────────────┼────────────────────────────────┘   │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    HTTP/REST + SSE
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Node.js/Express Backend (TypeScript)            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Controllers (Route Handlers)                  │ │
│  │  • ConversionController • HardwareController              │ │
│  │  - /api/convert         - /api/hardware-status            │ │
│  │  - /api/progress/:id    - /api/download/:id               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Services (Business Logic)                     │ │
│  │  ┌──────────────────┐      ┌──────────────────────────┐   │ │
│  │  │ HardwareDetector │      │ VideoConverterService    │   │ │
│  │  │ - detectGPU()    │      │ - convert(...)           │   │ │
│  │  │ - testNVIDIA()   │      │ - executeWithFallback()  │   │ │
│  │  │ - testAMD()      │      │ - spawnFFmpeg()          │   │ │
│  │  └──────────────────┘      └──────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌──────────────────┐      ┌──────────────────────────┐   │ │
│  │  │ MediaProbeService│      │ FileCleanupManager       │   │ │
│  │  │ - probeFile()    │      │ - registerForCleanup()   │   │ │
│  │  │ - parseProbe()   │      │ - checkAndDelete()       │   │ │
│  │  │ - extractCodecs  │      │ - resetTTL()             │   │ │
│  │  └──────────────────┘      └──────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Strategy Pattern (Open/Closed Principle)           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ EncodingStrategy (Interface)                         │  │ │
│  │  │ - buildFFmpegCommand(input, output, metadata, hw)   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │           │                                                 │ │
│  │    ┌──────┼──────┬──────────┬───────────┬──────┬────────┐   │ │
│  │    ▼      ▼      ▼          ▼           ▼      ▼        ▼   │ │
│  │  Mp4Mkv Webm   Avi      Flv       Wmv    3Gp          │   │ │
│  │  Strategy Strategy Strategy Strategy Strategy Strategy │   │ │
│  │  (Flex HW)  (VP9)   (MPEG4) (MPEG2) (WMV2) (H.263)    │   │ │
│  │                                                         │   │ │
│  │  ┌──────────────────────────────────────────────────┐  │   │ │
│  │  │ StrategyRegistry (Factory Pattern)               │  │   │ │
│  │  │ - getStrategy(format, hardwareType)              │  │   │ │
│  │  └──────────────────────────────────────────────────┘  │   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              FFmpeg Process Manager                    │ │
│  │  - spawn FFmpeg with strategy-built command           │ │
│  │  - parse progress from pipe:1 (frame output)          │ │
│  │  - handle errors & timeout                            │ │
│  │  - communicate via SSE callbacks                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                             │
                    File System Operations
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
    ┌────────┐         ┌──────────┐         ┌──────────┐
    │ Uploads│         │Converted │         │  FFmpeg  │
    │/temp/  │         │  Files   │         │  Spawn   │
    │{jobId} │         │ /temp/   │         │ Process  │
    └────────┘         └──────────┘         └──────────┘
```

### Data Flow Architecture

**Conversion Request Flow:**
1. User selects file → DropzoneHandler emits fileDropped event
2. Frontend validates file (size, extension) → transitions to Step 2
3. User selects target format → Frontend validates format ≠ input
4. User clicks Convert → ProgressUIController.updateProgress(0%)
5. ApiClient.submitConversion(file, targetFormat) → POST /api/convert
6. Backend saves file → creates ConversionJob → returns jobId
7. Frontend connects SSE → ApiClient.streamProgress(jobId)
8. VideoConverterService.convert() orchestrates:
   - MediaProbeService.probeFile() → metadata
   - Strategy selection via StrategyRegistry
   - FFmpeg spawn with progress monitoring
   - GPU fallback on failure
   - FileCleanupManager registration
9. Progress events stream every 1 second (progress: 0-100%)
10. On completion: ProgressUIController.showSuccess(downloadUrl)

**Hardware Detection Flow:**
1. Application startup → HardwareDetector.detectAvailableAccelerators()
2. Test NVIDIA (5s timeout): dummy 1-frame encode with h264_nvenc
3. If NVIDIA fails → Test AMD: dummy 1-frame encode with h264_vaapi
4. If both fail → Use CPU: libx264 (always available)
5. Cache result in memory
6. GET /api/hardware-status returns cached value (no re-test)
7. During conversion: if GPU fails → retry with next accelerator

---

## Components and Interfaces

### Backend Components

#### 1. HardwareDetector Service

**Purpose:** Detect available GPU accelerators at startup

**Interface:**
```typescript
class HardwareDetector {
  detectAvailableAccelerators(): Promise<HardwareStatus>
  getStatus(): HardwareStatus
  private testNvidiaNVENC(): Promise<boolean>
  private testAmdVAAMF(): Promise<boolean>
}
```

**Key Methods:**
- `detectAvailableAccelerators()`: Main entry point, runs detection sequence, caches result
- `testNvidiaNVENC()`: Spawn dummy FFmpeg encode with h264_nvenc, 5s timeout
- `testAmdVAAMF()`: Spawn dummy FFmpeg encode with h264_vaapi, 5s timeout

**Behavior:**
- Tests in order: NVIDIA → AMD → CPU fallback
- Returns `{nvidia: bool, amd: bool, activeAccelerator: 'nvidia'|'amd'|'cpu'}`
- Caches result, no re-testing on subsequent calls
- Logs all detection results

---

#### 2. MediaProbeService

**Purpose:** Extract video metadata using FFprobe

**Interface:**
```typescript
class MediaProbeService {
  probeFile(filePath: string): Promise<MediaMetadata>
  private parseProbeOutput(probeData: any): MediaMetadata
  private parseFrameRate(rateStr: string): number
}
```

**Output:**
```typescript
interface MediaMetadata {
  duration: number;        // seconds
  width: number;
  height: number;
  videoCodec: string;
  audioCodec?: string;
  bitrate: number;         // bits/second
  frameRate: number;
  totalFrames: number;     // duration * frameRate (for progress calculation)
}
```

**Behavior:**
- Spawns ffprobe with `-print_format json` flag
- Parses JSON output to extract video/audio stream info
- Calculates totalFrames for progress tracking
- 10-second timeout per probe

---

#### 3. VideoConverterService

**Purpose:** Orchestrate transcoding workflow with GPU fallback

**Interface:**
```typescript
class VideoConverterService {
  convert(jobId, inputPath, outputPath, targetFormat, onProgress): Promise<void>
  private executeConversionWithFallback(...): Promise<void>
  private spawnFFmpegProcess(...): Promise<void>
  getJobState(jobId): ConversionJob
}
```

**Orchestration:**
- Probes input file for metadata
- Gets cached hardware status
- Selects strategy via StrategyRegistry
- Spawns FFmpeg with progress monitoring
- On GPU failure: retries with AMD, then CPU
- Emits progress events via callback every 1 second
- On completion: registers output file for TTL cleanup

**Error Handling:**
- Try/catch for each FFmpeg spawn
- GPU failure triggers automatic fallback
- Progress reset to 0% on retry with new accelerator
- Final failure throws descriptive error

---

#### 4. FileCleanupManager Service

**Purpose:** Manage file lifecycle with TTL-based deletion

**Interface:**
```typescript
class FileCleanupManager {
  registerFileForCleanup(filePath: string, ttlSeconds: number): void
  resetTTL(filePath: string, ttlSeconds: number): void
  private checkAndDeleteExpired(): void
  shutdown(): void
}
```

**Behavior:**
- Maintains Map of files with expiration timestamps
- Runs cleanup check every 30 seconds
- Deletes expired files from storage
- Logs all deletions with timestamp
- resetTTL() called on download to extend retention

**Lifecycle:**
- Input file: registered at upload, 10-min TTL
- Output file: registered at completion, 10-min TTL
- On download: resetTTL() → 10 more minutes from download time
- Auto-delete after TTL expires

---

#### 5. EncodingStrategy Interface & Implementations

**Interface:**
```typescript
interface EncodingStrategy {
  buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    metadata: MediaMetadata,
    hardwareType: 'nvidia' | 'amd' | 'cpu'
  ): string[];
  
  getOutputFormat(): string;
  getSupportedCodecs(): string[];
}
```

**Concrete Implementations:**

**Mp4MovMkvStrategy:** .mp4, .mov, .mkv
- NVIDIA: `h264_nvenc -cq 23 -preset p4`
- AMD: `h264_vaapi -qp 23`
- CPU: `libx264 -crf 23 -preset fast`
- Audio: `-c:a aac -b:a 128k`
- Video filter: `pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p`

**WebmStrategy:** .webm (VP9)
- Always CPU: `libvpx-vp9 -crf 23 -preset fast`
- Audio: `-c:a libopus -b:a 128k`
- Video filter: padding + format yuv420p

**ThreeGpStrategy:** .3gp (Special H.263 handling)
- Always CPU: `h263` (GPUs don't support H.263)
- Scale to QCIF: `-vf scale=352:288`
- Audio: `-c:a aac -ar 8000 -ac 1 -b:a 12.2k`
- No hardware acceleration

**AviStrategy, FlvStrategy, WmvStrategy:** Similar pattern with format-specific codecs

---

#### 6. StrategyRegistry (Factory)

**Interface:**
```typescript
class StrategyRegistry {
  getStrategy(
    targetFormat: string,
    hardwareType: 'nvidia' | 'amd' | 'cpu'
  ): EncodingStrategy
}
```

**Behavior:**
- Maps format + hardware to concrete strategy
- Returns appropriate strategy instance
- Enables adding new formats without modifying existing strategies (Open/Closed Principle)

---

### Frontend Components

#### 1. ThemeManager Class

**Responsibility:** Manage application theme state (light/dark) and persistence

**Interface:**
```typescript
class ThemeManager {
  constructor()
  getCurrentTheme(): 'light' | 'dark'
  toggleTheme(): void
  setTheme(theme: 'light' | 'dark'): void
  onThemeChange(callback: (theme: 'light' | 'dark') => void): void
  private applyTheme(theme: string): void
  private persistTheme(theme: string): void
  private initializeFromStorage(): void
}
```

**Behavior:**
- On initialization: read localStorage key 'theme-preference'
- If no preference stored: default to 'dark'
- If preference exists: apply stored theme before UI renders (prevent FOUC)
- applyTheme(): set `data-theme` attribute on `<html>` element
- persistTheme(): save preference to localStorage
- toggleTheme(): switch between 'light' and 'dark', persist, emit change callback
- setTheme(): force specific theme, persist, emit change callback
- onThemeChange(): register callback for theme change events (for UI elements to update)

**SOLID Principle:** Single Responsibility — only manages theme state and persistence, does not handle UI rendering

---

#### 2. ApiClient Class

**Responsibility:** Centralize all backend API communication

**Interface:**
```typescript
class ApiClient {
  submitConversion(file: File, targetFormat: string): Promise<{jobId: string}>
  streamProgress(jobId: string): EventSource
  getHardwareStatus(): Promise<{status: string}>
  downloadFile(jobId: string, filename: string): Promise<void>
}
```

**Methods:**
- `submitConversion()`: POST multipart to /api/convert
- `streamProgress()`: Open EventSource to /api/progress/:jobId
- `getHardwareStatus()`: GET /api/hardware-status
- `downloadFile()`: Create temp link and trigger browser download

---

#### 3. DropzoneHandler Class

**Responsibility:** Handle file drag-drop, file input interactions, and input format tracking

**Interface:**
```typescript
class DropzoneHandler {
  constructor(element: HTMLElement, logger: Logger)
  on(event: 'fileDropped'|'highlight'|'unhighlight'|'formatChange', callback): void
  getSelectedFile(): File | null
  getInputFormat(): string | null
  reset(): void
  private initializeEventListeners(): void
  private handleFileSelection(file: File): void
  private extractFileExtension(filename: string): string
}
```

**Events:**
- `fileDropped`: emitted with File object
- `highlight`: emitted on dragover
- `unhighlight`: emitted on dragleave/drop
- `formatChange`: emitted when file selection changes, provides input file extension

**Validation:**
- File size limit: 2GB
- Extract file extension from filename (case-insensitive)
- If invalid: emits fileDropped with null

**Format Tracking:**
- Store selected file and its extension internally
- Emit `formatChange` event with extracted extension when file is selected
- Provide getInputFormat() method to retrieve current input format for format filtering

---

#### 4. FormatSelector Class

**Responsibility:** Manage format dropdown with dynamic filtering based on input format

**Interface:**
```typescript
class FormatSelector {
  constructor(dropdownSelector: string, logger: Logger)
  on(event: 'formatSelected'|'formatChanged', callback): void
  getSelectedFormat(): string | null
  setSelectedFormat(format: string | null): void
  updateAvailableFormats(inputFormat: string | null): void
  reset(): void
  private filterFormats(inputFormat: string | null): void
  private renderFormatOptions(availableFormats: string[]): void
  private disableFormat(format: string): void
  private enableFormat(format: string): void
}
```

**Supported Formats:**
```typescript
const SUPPORTED_FORMATS = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', '3gp']
```

**Behavior:**
- On initialization: render all format options from SUPPORTED_FORMATS
- `updateAvailableFormats(inputFormat)`: 
  - If inputFormat provided: disable matching format option
  - If inputFormat is null: enable all formats
  - If currentSelectedFormat matches inputFormat: clear selection
  - Emit `formatChanged` event
- `filterFormats(inputFormat)`:
  - Return array of formats excluding inputFormat
  - Apply visual styling to disabled format: opacity 0.5, strikethrough text
  - Display helper text "(Same as input format)" next to disabled format
- `setSelectedFormat()`: update dropdown value and emit event
- `getSelectedFormat()`: return current selection (null if none selected)
- `reset()`: clear selection, show all formats again
- `disableFormat()`: mark format option as disabled with visual indication
- `enableFormat()`: re-enable format option

**Visual Indication:**
- Disabled format options: opacity 50%, strikethrough text, gray text color
- Helper text: "(Same as input format)" displayed in gray next to disabled format
- Selected format: standard dropdown highlight
- All transitions: smooth CSS (200ms)

---

#### 3. ProgressUIController Class

**Responsibility:** Display and manage progress bar UI

**Interface:**
```typescript
class ProgressUIController {
  constructor(
    progressBarSelector: string,
    progressTextSelector: string,
    downloadButtonSelector: string,
    statusTextSelector: string,
    logger: Logger
  )
  updateProgress(percentage: number): void
  showSuccess(downloadUrl: string, filename: string): void
  showError(errorMessage: string): void
  reset(): void
}
```

**Behavior:**
- Throttle progress updates to max 1 per 500ms
- Smooth CSS transition on width change (0.3s)
- Clamp percentage to 0-99% (kept at 99% until actual completion)
- Show download button at 100% progress
- Enable download button click handler
- Color changes: normal (emerald) → error (red)

---

#### 5. NotificationManager Class

**Responsibility:** Display animated notifications

**Interface:**
```typescript
class NotificationManager {
  constructor(containerSelector: string, logger: Logger)
  showSuccess(message: string, duration?: number): void
  showError(message: string, autoClose?: boolean): void
  private show(message: string, type: 'success'|'error', duration?: void): void
}
```

**Behavior:**
- Success: emerald background, fade-in animation, auto-dismiss (5s default)
- Error: red background, shake animation, persists until dismissed
- Icon animation: bounce (success), shake (error)
- Dismiss button always visible
- Respect current theme (light/dark) for background and text contrast

---

#### 6. Main Orchestrator (VideoConverterApp)

**Responsibility:** Coordinate all frontend components and state management

**State Management:**
- selectedFile: File | null
- inputFormat: string | null (extracted from selectedFile)
- selectedFormat: string | null
- currentJobId: string | null
- eventSource: EventSource | null
- currentTheme: 'light' | 'dark'

**Event Handling:**
- Initialize on DOMContentLoaded
- Initialize ThemeManager first (before rendering UI to prevent FOUC)
- Register listeners for all component events
- On file selection: extract inputFormat, call formatSelector.updateAvailableFormats(inputFormat)
- On format selection: validate selectedFormat !== inputFormat
- Transition between steps (1→2→3) with fade animations
- Update hardware badge on load and apply current theme styling
- Stream progress, handle completion/error
- Subscribe to theme changes and update relevant UI elements in real-time

---

## Frontend Theme System

### CSS Variables Architecture

**Light Theme (default when no preference)**
```css
:root {
  /* Background Colors */
  --bg-primary: #f9fafb;      /* Page background */
  --bg-secondary: #ffffff;     /* Cards, containers */
  --bg-tertiary: #f3f4f6;      /* Alternate sections */
  
  /* Text Colors */
  --text-primary: #111827;     /* Headings, primary text */
  --text-secondary: #4b5563;   /* Secondary text, labels */
  --text-muted: #9ca3af;       /* Muted text */
  
  /* Border & Divider Colors */
  --border-color: #e5e7eb;     /* Borders, dividers */
  --border-light: #f3f4f6;     /* Light borders */
  
  /* Component Colors */
  --input-bg: #ffffff;
  --input-border: #d1d5db;
  --input-focus: #3b82f6;      /* Blue focus ring */
  --button-hover: #f3f4f6;     /* Button hover background */
  
  /* Hardware Badge Colors (Theme-adjusted) */
  --badge-nvidia: #10b981;     /* Emerald for NVIDIA (same as dark) */
  --badge-amd: #ef4444;        /* Red for AMD (adjusted from dark) */
  --badge-cpu: #9ca3af;        /* Gray for CPU (adjusted from dark) */
  --badge-bg: #f3f4f6;         /* Badge background light */
  
  /* Progress Bar */
  --progress-fill: #10b981;    /* Emerald progress */
  --progress-bg: #e5e7eb;      /* Progress background */
  
  /* Notification Colors */
  --notification-success-bg: #d1fae5;
  --notification-success-text: #065f46;
  --notification-error-bg: #fee2e2;
  --notification-error-text: #991b1b;
  
  /* Shadow */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

html[data-theme="dark"] {
  /* Background Colors */
  --bg-primary: #030712;       /* Page background */
  --bg-secondary: #111827;     /* Cards, containers */
  --bg-tertiary: #1f2937;      /* Alternate sections */
  
  /* Text Colors */
  --text-primary: #ffffff;     /* Headings, primary text */
  --text-secondary: #d1d5db;   /* Secondary text, labels */
  --text-muted: #9ca3af;       /* Muted text */
  
  /* Border & Divider Colors */
  --border-color: #374151;     /* Borders, dividers */
  --border-light: #1f2937;     /* Light borders */
  
  /* Component Colors */
  --input-bg: #1f2937;
  --input-border: #4b5563;
  --input-focus: #3b82f6;      /* Blue focus ring */
  --button-hover: #1f2937;     /* Button hover background */
  
  /* Hardware Badge Colors */
  --badge-nvidia: #10b981;     /* Emerald for NVIDIA */
  --badge-amd: #ef4444;        /* Red for AMD */
  --badge-cpu: #6b7280;        /* Gray for CPU */
  --badge-bg: #1f2937;         /* Badge background dark */
  
  /* Progress Bar */
  --progress-fill: #10b981;    /* Emerald progress */
  --progress-bg: #374151;      /* Progress background */
  
  /* Notification Colors */
  --notification-success-bg: #064e3b;
  --notification-success-text: #d1fae5;
  --notification-error-bg: #7f1d1d;
  --notification-error-text: #fee2e2;
  
  /* Shadow */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
}
```

### Theme Transition Animation

```css
/* Smooth transition on all color properties */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Page-level transition to prevent jarring flashes */
html {
  transition: background-color 0.3s ease;
}
```

### Component Styling Examples

**Using CSS Variables (NOT hardcoded Tailwind classes):**

```css
/* Page Background */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Cards/Containers */
.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

/* Input Fields */
input, select {
  background-color: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
}

input:focus {
  border-color: var(--input-focus);
  outline: none;
}

/* Progress Bar */
.progress-bar {
  background-color: var(--progress-bg);
}

.progress-fill {
  background-color: var(--progress-fill);
}

/* Hardware Badge */
.hardware-badge {
  background-color: var(--badge-bg);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
}

.badge-nvidia { color: var(--badge-nvidia); }
.badge-amd { color: var(--badge-amd); }
.badge-cpu { color: var(--badge-cpu); }

/* Notifications */
.notification {
  padding: 1rem;
  border-radius: 0.5rem;
  animation: fadeIn 0.3s ease;
}

.notification-success {
  background-color: var(--notification-success-bg);
  color: var(--notification-success-text);
}

.notification-error {
  background-color: var(--notification-error-bg);
  color: var(--notification-error-text);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Theme Toggle Button

**Location:** Header/Navbar

**Implementation:**
```html
<button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">
  <svg class="sun-icon" width="20" height="20" viewBox="0 0 20 20">
    <!-- Sun icon for light theme -->
  </svg>
  <svg class="moon-icon" width="20" height="20" viewBox="0 0 20 20">
    <!-- Moon icon for dark theme -->
  </svg>
</button>
```

**Styling:**
```css
.theme-toggle {
  background-color: var(--button-hover);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.theme-toggle:hover {
  background-color: var(--border-color);
}

/* Show/hide icons based on theme */
.theme-toggle .sun-icon {
  display: none;
}

html[data-theme="dark"] .theme-toggle .moon-icon {
  display: none;
}

html[data-theme="dark"] .theme-toggle .sun-icon {
  display: inline;
}
```

---

## Dynamic Format Filtering

### Format Selection Workflow

**Step 1: File Selection**
1. User drags/selects file via DropzoneHandler
2. DropzoneHandler extracts file extension (case-insensitive)
3. DropzoneHandler emits `formatChange` event with extension
4. Main orchestrator receives event, stores inputFormat
5. Main orchestrator calls `formatSelector.updateAvailableFormats(inputFormat)`

**Step 2: Format Display**
1. FormatSelector receives inputFormat
2. FormatSelector marks matching format as disabled (opacity 0.5, strikethrough)
3. FormatSelector displays helper text "(Same as input format)"
4. If selectedFormat was the input format: clear selection
5. FormatSelector emits `formatChanged` event to main orchestrator

**Step 3: Validation**
1. Main orchestrator validates: selectedFormat !== inputFormat
2. If valid: enable Convert button
3. If invalid: disable Convert button with tooltip "Select different format"

**Step 4: File Change (User returns to Step 1)**
1. User clicks back button or file input changes
2. New file extension extracted
3. FormatSelector.updateAvailableFormats(newExtension) called
4. Previously hidden format re-enabled
5. New matching format disabled
6. Selected format cleared if it now matches input

### Visual States

| State | Styling | Interaction |
|-------|---------|-------------|
| Available | Normal text, full opacity | Selectable |
| Disabled (same as input) | Gray text, opacity 50%, strikethrough | Non-selectable, tooltip appears |
| Selected | Highlighted background, bold text | Clickable to select |
| Hover | Background highlight, opacity 100% | Cursor pointer |



---

## Data Models

### Backend Data Models

```typescript
// Core entities
interface MediaMetadata {
  duration: number;         // seconds
  width: number;
  height: number;
  videoCodec: string;
  audioCodec?: string;
  bitrate: number;          // bits per second
  frameRate: number;
  totalFrames: number;      // duration * frameRate
}

interface ConversionJob {
  jobId: string;
  inputFilePath: string;
  outputFilePath: string;
  targetFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;         // 0-100
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface HardwareStatus {
  nvidia: boolean;
  amd: boolean;
  activeAccelerator: 'nvidia' | 'amd' | 'cpu';
  detectionTime: Date;
}

interface ConversionProgress {
  jobId: string;
  progress?: number;        // 0-100
  status: 'processing' | 'done' | 'error';
  downloadUrl?: string;
  errorMessage?: string;
  statusMessage?: string;
}

// Enums
enum SupportedFormat {
  MP4 = 'mp4',
  MKV = 'mkv',
  WEBM = 'webm',
  AVI = 'avi',
  MOV = 'mov',
  FLV = 'flv',
  WMV = 'wmv',
  ThreeGP = '3gp'
}

type HardwareType = 'nvidia' | 'amd' | 'cpu';

// API Types
interface ConversionResponse {
  jobId: string;
}

interface HardwareStatusResponse {
  status: HardwareType;
  timestamp: string; // ISO8601
}

interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  timestamp: string;
}
```

### Frontend Data Models

```typescript
// API Responses
interface ConversionResponse {
  jobId: string;
}

interface ProgressEvent {
  progress?: number;        // 0-100
  status: 'processing' | 'done' | 'error';
  jobId: string;
  downloadUrl?: string;
  errorMessage?: string;
  statusMessage?: string;
}

interface HardwareStatusResponse {
  status: 'nvidia' | 'amd' | 'cpu';
  timestamp: string;
}

// UI State
interface ConversionState {
  selectedFile: File | null;
  inputFormat: string | null;     // File extension (extracted from filename)
  selectedFormat: string | null;
  currentJobId: string | null;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  currentTheme: 'light' | 'dark';  // Current active theme
}

// Theme State
interface ThemeState {
  current: 'light' | 'dark';
  storedPreference?: 'light' | 'dark';  // Value from localStorage
}
```
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hardware Detection Consistency

For any application startup, hardware detection SHALL execute exactly once and return consistent status on repeated queries without re-testing.

**Validates: Requirements 1.1, 1.7, 8.5**

### Property 2: Padding Filter Correctness

For any video with odd dimensions, applying the padding filter `pad=ceil(iw/2)*2:ceil(ih/2)*2` SHALL always produce even dimensions.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 3: 3GP Resolution Enforcement

For any video converted to 3GP format, the output SHALL always have exactly 352x288 resolution (QCIF standard).

**Validates: Requirements 7.2, 7.3**

### Property 4: GPU Fallback Monotonicity

For any conversion that fails on GPU encoding, retrying with a fallback accelerator SHALL not decrease the final progress percentage reported to the user.

**Validates: Requirements 5.3**

### Property 5: TTL-Based File Deletion

For any file registered with FileCleanupManager with a TTL of X seconds, if no reset occurs, the file SHALL be deleted from storage exactly once within (X, X+30) seconds.

**Validates: Requirements 12.3**

### Property 6: TTL Reset on Download

For any file downloaded by the user, calling resetTTL() with the same TTL value SHALL result in the file remaining accessible for an additional X seconds from reset time.

**Validates: Requirements 12.4**

### Property 7: Progress Monotonicity

For any conversion job, the progress percentage reported via SSE events SHALL be monotonically non-decreasing (0% → 45% → 45% → 88% → 100%, never backwards).

**Validates: Requirements 10.3**

### Property 8: Strategy Pattern Extensibility

For any new video format, a developer SHALL be able to add support by implementing EncodingStrategy without modifying existing strategy classes.

**Validates: Requirements 17.9**

### Property 9: Dependency Injection Decoupling

For any service receiving dependencies via constructor injection, replacing a dependency with a mock implementation SHALL not require modifying the service's internal code.

**Validates: Requirements 18**

### Property 10: Theme Persistence and Initialization

For any browser session, if a user sets theme preference to 'light' or 'dark', closing and reopening the application SHALL restore the same theme without displaying unstyled content.

**Validates: Requirements 25.1, 25.2, 25.3**

### Property 11: Format Filtering Correctness

For any input file format, the format selector SHALL never display the matching format as selectable, and all other supported formats SHALL remain available for selection.

**Validates: Requirements 20.2, 20.3, 20.4**

### Property 12: Dynamic Format Availability

For any file selection change in Step 1, updating to a new file with a different extension SHALL re-enable the previously hidden format and hide the new input format in the dropdown.

**Validates: Requirements 20.2, 20.3**

### Property 13: Theme Consistency Across Components

For any active theme ('light' or 'dark'), all UI components (progress bar, notifications, badges, inputs) SHALL use colors from the corresponding CSS variable set, ensuring visual consistency.

**Validates: Requirements 25.1, 25.2, 25.3, 25.4**

---

## Error Handling

### Backend Error Responses

**Format:**
```json
{
  "error": "<error_type>",
  "message": "<user_friendly_message>",
  "code": "<error_code>",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Error Categories:**

| Code | HTTP | Description | Recovery |
|------|------|-------------|----------|
| `INVALID_FORMAT` | 400 | Format not in supported list | Show error, retry |
| `SAME_FORMAT` | 400 | Input and output formats identical | Show error, select different format |
| `FILE_TOO_LARGE` | 413 | Exceeds 2GB limit | Show error, upload smaller file |
| `UNSUPPORTED_CODEC` | 400 | Input uses unsupported video codec | Show error, try different file |
| `GPU_UNAVAILABLE` | 500 | GPU test failed, CPU will be used | Automatic fallback (transparent) |
| `ENCODING_FAILED` | 500 | FFmpeg encoding returned error | Auto-retry with fallback accelerator |
| `JOB_EXPIRED` | 404 | Job ID invalid or TTL expired | Show error, restart conversion |
| `FILE_NOT_FOUND` | 404 | Output file not found or deleted | Show error, retry conversion |

### GPU Fallback Behavior

**Fallback Sequence:**
1. Try primary accelerator (NVIDIA, AMD, or CPU)
2. If timeout or error → try next in sequence: NVIDIA → AMD → CPU
3. On fallback: reset progress to 0%, emit status message "Retrying with {accelerator}..."
4. If CPU fails: throw final error with all attempted accelerators

**Error Scenarios:**
- GPU unavailable during startup: transparently use CPU
- GPU fails mid-conversion: automatic fallback (user informed via status message)
- All accelerators fail: return error to user with retry option

### Frontend Error Handling

**Validation:**
- File size > 2GB: reject before upload
- Format == input format: reject in dropdown
- Missing file/format: prevent convert button click

**Retry Logic:**
- On API error: show notification with error message
- User can retry from current step (no progress loss)
- Download errors: trigger automatic retry with exponential backoff

---

## Testing Strategy

**Backend Tests:**
- HardwareDetector: detection logic, timeout handling, fallback sequence
- MediaProbeService: FFprobe JSON parsing, metadata extraction
- FileCleanupManager: TTL expiration, file deletion, TTL reset
- EncodingStrategy implementations: FFmpeg command building for each format/hardware
- Validation functions: input validation, filename sanitization

**Frontend Tests:**
- DropzoneHandler: drag-drop events, file validation, event emission
- ProgressUIController: progress updates, percentage clamping, state transitions
- NotificationManager: notification creation, auto-dismiss timing
- ApiClient: HTTP error handling, response parsing, SSE setup

### Integration Testing

- Full conversion workflow: upload → probe → encode → cleanup
- GPU fallback on encoding failure
- SSE stream connection and message delivery
- File cleanup TTL expiry and deletion
- Hardware detection at startup

---

End of Technical Design Document
