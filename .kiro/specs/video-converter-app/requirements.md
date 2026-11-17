# Requirements Document

## Feature: Video Converter Web Application

## Introduction

The Video Converter Web Application is a full-stack web platform that enables users to convert video files across multiple popular formats (.mp4, .mkv, .webm, .avi, .mov, .flv, .wmv, .3gp) with automatic GPU acceleration detection and intelligent fallback to CPU processing. The system leverages FFmpeg on a Node.js backend with TypeScript/ES Modules architecture, implementing SOLID principles throughout, and provides a modern responsive frontend with real-time progress tracking and hardware status visualization.

## Glossary

- **System**: The Video Converter Web Application (backend + frontend combined)
- **Backend**: Node.js/Express/TypeScript server running FFmpeg
- **Frontend**: HTML5/Tailwind CSS/Vanilla JS client-side application
- **GPU Accelerator**: Hardware acceleration capability (NVIDIA NVENC, AMD VAAPI/AMF)
- **Encoder**: Software or hardware video codec implementation (h264_nvenc, libx264, etc.)
- **Codec**: Video/audio compression algorithm (h264, h265, vp8, vp9, av1, etc.)
- **FFmpeg**: Multimedia framework for encoding/decoding video and audio
- **NVENC**: NVIDIA's hardware video encoding technology (h264_nvenc)
- **VAAPI**: Video Acceleration API for AMD GPUs
- **AMF**: AMD Media Framework for hardware encoding
- **Padding**: Adding black pixels to video to achieve even dimensions (YUV 4:2:0 requirement)
- **Transcoding**: Process of decoding video and re-encoding to different format/codec
- **Job**: A single video conversion request identified by unique jobId
- **TTL**: Time To Live, duration before automatic file deletion
- **SSE**: Server-Sent Events for real-time progress streaming
- **Drag-Drop**: User interface pattern allowing file placement via mouse drag gesture
- **Hardware Badge**: UI indicator showing active hardware accelerator (GPU type or CPU)

## Requirements

### Requirement 1: GPU Hardware Auto-Detection at Startup

**User Story:** As a system administrator, I want the application to automatically detect available GPU accelerators at startup, so that video encoding uses the fastest available hardware without manual configuration.

#### Acceptance Criteria

1. WHEN the Backend starts, THE System SHALL execute hardware detection sequence to identify available accelerators
2. WHEN hardware detection is executed, THE System SHALL test NVIDIA NVENC availability first using dummy 1-frame encoding
3. IF NVIDIA NVENC is unavailable, THEN THE System SHALL test AMD VAAPI/AMF availability using dummy 1-frame encoding
4. IF both NVIDIA and AMD accelerators are unavailable, THEN THE System SHALL designate CPU (libx264) as the active encoder
5. WHEN dummy frame encoding succeeds, THE System SHALL record the accelerator type in application state
6. WHEN dummy frame encoding fails, THE System SHALL attempt the next accelerator in priority order
7. WHEN all accelerators have been tested, THE System SHALL expose hardware status via GET /api/hardware-status endpoint returning object with status field containing value 'nvidia', 'amd', or 'cpu'

### Requirement 2: NVIDIA NVENC Encoding Configuration

**User Story:** As a video encoder, I want NVIDIA GPU encoding to use optimal quality and speed settings, so that conversions complete quickly while maintaining acceptable quality.

#### Acceptance Criteria

1. WHEN NVIDIA NVENC is detected as available, THE Backend SHALL use encoder h264_nvenc with CQ (constant quality) rate control
2. WHEN NVIDIA NVENC encoding is configured, THE System SHALL set CQ value to 23 for balanced quality/file-size
3. WHEN NVIDIA NVENC encoding is configured, THE System SHALL set preset to 'p4' for fast encoding speed

### Requirement 3: AMD GPU Encoding Configuration

**User Story:** As a video encoder, I want AMD GPU encoding to use appropriate API and settings, so that conversions utilize available AMD hardware efficiently.

#### Acceptance Criteria

1. WHEN AMD VAAPI or AMF is detected as available, THE Backend SHALL attempt VAAPI encoding first
2. IF VAAPI encoding is unavailable, THEN THE System SHALL fall back to AMD Media Framework (AMF) encoding
3. WHEN AMD GPU encoding is active, THE System SHALL use appropriate codec-specific settings for quality and performance

### Requirement 4: CPU Fallback Encoding Configuration

**User Story:** As a system operator, I want CPU-based encoding to be available when no GPU accelerators are present, so that the system can still function on any hardware.

#### Acceptance Criteria

1. WHEN no GPU accelerators are detected, THE Backend SHALL designate CPU as the active encoder
2. WHEN CPU encoding is active, THE System SHALL use libx264 codec with CRF (constant rate factor) mode
3. WHEN CPU encoding is configured, THE System SHALL set CRF value to 23 for balanced quality/file-size
4. WHEN CPU encoding is configured, THE System SHALL set preset to 'fast' for reasonable encoding speed

### Requirement 5: Runtime GPU Fallback on Encoding Failure

**User Story:** As a system operator, I want video conversions to continue successfully even if GPU encoding fails mid-process, so that users always receive converted videos.

#### Acceptance Criteria

1. WHEN video conversion is in progress using GPU encoder, IF the GPU encoder returns error or produces invalid output, THEN THE System SHALL automatically terminate the GPU encoding process
2. WHEN GPU encoding fails during conversion, THE System SHALL restart the conversion using the next available accelerator (or CPU if no alternative GPU available)
3. WHEN GPU encoding fails and conversion is restarted, THE System SHALL update job progress to reflect restart (maintaining monotonic progress or resetting to 0% with status notification)
4. WHEN GPU encoding fails and CPU fallback completes successfully, THE System SHALL return converted video file to user with success status

### Requirement 6: Video Dimension Validation and Odd-Dimension Padding

**User Story:** As a video engineer, I want the system to handle videos with odd dimensions (e.g., 1909x695) without quality loss, so that all video files can be converted successfully.

#### Acceptance Criteria

1. WHEN a video file with odd dimensions (width or height not divisible by 2) is received, THE System SHALL NOT reject the video or attempt to resize it
2. WHEN a video with odd dimensions is encoded, THE System SHALL apply padding filter to achieve even dimensions
3. WHEN applying padding to odd dimensions, THE System SHALL use FFmpeg filter pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p to pad with black pixels
4. WHEN padding filter is applied, THE System SHALL ensure the result maintains YUV 4:2:0 color space compatibility for all output formats

### Requirement 7: 3GP Format Special Dimension Handling

**User Story:** As a video converter, I want 3GP files to conform to H.263 codec requirements, so that 3GP output works on all compatible devices.

#### Acceptance Criteria

1. WHEN target format is .3gp, THE System SHALL enforce H.263 video codec standard dimensions
2. WHEN converting to 3GP format, THE System SHALL set video resolution to 352x288 (QCIF H.263 standard)
3. WHEN video being converted to 3GP has different dimensions, THE System SHALL apply padding or scaling to achieve 352x288 resolution before encoding
4. WHEN converting to 3GP format, THE System SHALL encode audio using AAC codec with 8000 Hz sample rate and mono (1 channel)
5. WHEN converting to 3GP format, THE System SHALL set audio bitrate to 12.2 kbps for compatibility

### Requirement 8: Hardware Status API Endpoint

**User Story:** As a frontend client, I want to query hardware status to display current accelerator information, so that users understand which hardware is processing their videos.

#### Acceptance Criteria

1. THE Backend SHALL expose HTTP GET endpoint at path /api/hardware-status
2. WHEN GET /api/hardware-status is requested, THE Backend SHALL respond with HTTP 200 status code
3. WHEN GET /api/hardware-status responds successfully, THE Response SHALL contain JSON object with field 'status'
4. THE 'status' field SHALL contain one of three values: 'nvidia' (NVIDIA NVENC active), 'amd' (AMD VAAPI/AMF active), or 'cpu' (CPU libx264 active)
5. WHEN /api/hardware-status is called multiple times without hardware reinitialization, THE Response SHALL return same status value consistently

### Requirement 9: Video Conversion Request API Endpoint

**User Story:** As a frontend client, I want to submit video files for conversion and receive a job identifier, so that I can track the conversion progress.

#### Acceptance Criteria

1. THE Backend SHALL expose HTTP POST endpoint at path /api/convert
2. WHEN POST /api/convert request is submitted with multipart/form-data content, THE System SHALL accept file upload in 'file' form field
3. WHEN POST /api/convert request is submitted, THE System SHALL require 'targetFormat' parameter specifying output video format
4. WHEN targetFormat parameter is provided, THE targetFormat SHALL be one of: 'mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', '3gp'
5. WHEN input file is received and targetFormat matches input file extension, THE System SHALL reject conversion and return error response indicating same format not allowed
6. WHEN valid conversion request is received, THE System SHALL create new Job with unique jobId identifier
7. WHEN Job is created, THE System SHALL begin background transcoding process asynchronously
8. WHEN conversion request is processed successfully, THE Backend SHALL respond with HTTP 200 status code and JSON object containing 'jobId' field
9. WHEN conversion request is invalid (missing file, invalid format, etc.), THE Backend SHALL respond with HTTP 400 status code and descriptive error message

### Requirement 10: Real-Time Conversion Progress Streaming

**User Story:** As a frontend client, I want to receive real-time updates on video conversion progress, so that I can display accurate progress information to the user.

#### Acceptance Criteria

1. THE Backend SHALL expose HTTP GET endpoint at path /api/progress/:jobId for Server-Sent Events streaming
2. WHEN GET /api/progress/:jobId is requested with valid jobId, THE Backend SHALL establish SSE connection and begin streaming progress updates
3. WHEN transcoding is in progress, THE System SHALL stream progress event every 1 second (or more frequently if available) containing current percentage 0-100%
4. WHEN transcoding is in progress, THE Progress event SHALL contain 'progress' field (integer 0-100), 'status' field (string 'processing'), and 'jobId' field
5. WHEN transcoding completes successfully, THE System SHALL stream final event with progress: 100, status: 'done', and 'downloadUrl' field containing URL to download converted file
6. WHEN transcoding fails with error, THE System SHALL stream error event with status: 'error', 'errorMessage' field containing error description, and 'jobId' field
7. WHEN SSE stream ends (transcoding complete or failed), THE Backend SHALL close the connection gracefully
8. WHEN GET /api/progress/:jobId is requested with invalid/expired jobId, THE Backend SHALL respond with HTTP 404 status code

### Requirement 11: Converted File Download URL Generation

**User Story:** As a frontend client, I want to download the converted video file via a generated URL, so that users can access their converted files.

#### Acceptance Criteria

1. WHEN video conversion completes successfully, THE System SHALL generate temporary download URL
2. WHEN download URL is generated, THE URL SHALL be valid and publicly accessible for file retrieval
3. WHEN download URL is provided to frontend in progress event, THE Frontend SHALL enable Download button allowing user to retrieve converted file
4. WHEN download URL is accessed, THE Backend SHALL return the converted video file with appropriate Content-Type and Content-Disposition headers
5. WHEN download is complete, THE Backend SHALL schedule the converted file for automatic deletion after 10 minutes (TTL)

### Requirement 12: Automatic File Cleanup and TTL Management

**User Story:** As a system operator, I want uploaded and converted files to be automatically deleted after a period of time, so that server storage is managed efficiently.

#### Acceptance Criteria

1. WHEN a video file is uploaded for conversion, THE System SHALL assign TTL (Time To Live) of 10 minutes to the input file
2. WHEN converted output file is created, THE System SHALL assign TTL of 10 minutes to the output file
3. WHEN file TTL expires (10 minutes elapsed), THE FileCleanupManager SHALL automatically delete the file from server storage
4. WHEN file is downloaded by user, THE System SHALL reset the output file TTL to 10 minutes from download completion time
5. WHEN conversion Job completes (success or failure), THE System SHALL track both input and output files for cleanup
6. WHEN a file is deleted by FileCleanupManager, THE System SHALL log the deletion event with timestamp and file path

### Requirement 13: Single Responsibility - Hardware Detector Service

**User Story:** As a system architect, I want hardware detection logic isolated in a dedicated service, so that the codebase maintains clean separation of concerns.

#### Acceptance Criteria

1. THE Backend code SHALL implement HardwareDetector as independent class with single responsibility of detecting available GPU accelerators
2. WHEN HardwareDetector class is instantiated, THE Class SHALL expose public method detectAvailableAccelerators() returning Promise
3. WHEN detectAvailableAccelerators() is called, THE Method SHALL return object with properties: nvidia (boolean), amd (boolean), activeAccelerator (string: 'nvidia', 'amd', or 'cpu')
4. WHEN HardwareDetector executes, THE Class SHALL NOT handle transcoding, file operations, or API routing

### Requirement 14: Single Responsibility - Media Probe Service

**User Story:** As a system architect, I want video metadata extraction isolated in a dedicated service, so that probe operations are independently testable and maintainable.

#### Acceptance Criteria

1. THE Backend code SHALL implement MediaProbeService as independent class with single responsibility of extracting video metadata
2. WHEN MediaProbeService class is instantiated, THE Class SHALL expose public method probeFile(filePath: string) returning Promise<MediaMetadata>
3. WHEN probeFile() is called, THE Method SHALL execute FFmpeg probe to extract duration, resolution, codec, and bitrate information
4. WHEN MediaProbeService executes, THE Class SHALL NOT handle conversion, hardware detection, or file cleanup

### Requirement 15: Single Responsibility - Video Converter Service

**User Story:** As a system architect, I want video transcoding logic isolated in a dedicated service, so that encoding is testable independently and can be extended with new formats.

#### Acceptance Criteria

1. THE Backend code SHALL implement VideoConverterService as independent class with single responsibility of managing transcoding workflows
2. WHEN VideoConverterService class is instantiated, THE Class SHALL accept HardwareDetector and MediaProbeService instances as dependencies
3. WHEN VideoConverterService.convert(inputPath, outputPath, targetFormat) is called, THE Method SHALL coordinate hardware detection, file probing, and encoding execution
4. WHEN VideoConverterService executes, THE Class SHALL NOT handle HTTP routing, file cleanup, or frontend communication

### Requirement 16: Single Responsibility - File Cleanup Manager

**User Story:** As a system architect, I want file lifecycle management isolated in a dedicated service, so that cleanup operations are consistent and testable.

#### Acceptance Criteria

1. THE Backend code SHALL implement FileCleanupManager as independent class with single responsibility of managing file deletion based on TTL
2. WHEN FileCleanupManager class is instantiated, THE Class SHALL expose public method registerFileForCleanup(filePath: string, ttlSeconds: number)
3. WHEN registerFileForCleanup() is called, THE Method SHALL track file with expiration time (current time + ttlSeconds)
4. WHEN file TTL expires, THE FileCleanupManager SHALL automatically delete file from storage and log deletion
5. WHEN FileCleanupManager executes, THE Class SHALL NOT handle encoding, hardware detection, or API endpoints

### Requirement 17: Open/Closed Principle - Encoding Strategy Pattern

**User Story:** As a system architect, I want to add support for new video formats without modifying existing encoder classes, so that the system is extensible and maintainable.

#### Acceptance Criteria

1. THE Backend code SHALL implement EncodingStrategy interface defining contract for format-specific encoding
2. WHEN EncodingStrategy interface is defined, THE Interface SHALL include method buildFFmpegCommand(inputPath, outputPath, hardwareType) returning string array of FFmpeg arguments
3. THE Backend SHALL implement Mp4MovMkvStrategy class implementing EncodingStrategy for .mp4, .mov, and .mkv formats
4. THE Backend SHALL implement WebmStrategy class implementing EncodingStrategy for .webm format
5. THE Backend SHALL implement AviStrategy class implementing EncodingStrategy for .avi format
6. THE Backend SHALL implement FlvStrategy class implementing EncodingStrategy for .flv format
7. THE Backend SHALL implement WmvStrategy class implementing EncodingStrategy for .wmv format
8. THE Backend SHALL implement ThreeGpStrategy class implementing EncodingStrategy for .3gp format with H.263 and AAC settings
9. WHEN a new video format needs to be supported, THE Developer SHALL create new strategy class without modifying existing strategies

### Requirement 18: Dependency Injection for Backend Services

**User Story:** As a system architect, I want services to receive dependencies via constructor injection, so that classes are decoupled and testable.

#### Acceptance Criteria

1. WHEN VideoConverterService is instantiated, THE Service SHALL receive HardwareDetector instance as constructor parameter
2. WHEN VideoConverterService is instantiated, THE Service SHALL receive MediaProbeService instance as constructor parameter
3. WHEN VideoConverterService is instantiated, THE Service SHALL receive FileCleanupManager instance as constructor parameter
4. WHEN Express route handlers are defined, THE Route handlers SHALL receive VideoConverterService instance via dependency injection mechanism
5. WHEN dependencies are injected, THE Backend SHALL NOT instantiate dependencies within classes (no 'new' keyword for dependencies)

### Requirement 19: Frontend Upload and File Input Handling

**User Story:** As a user, I want to upload video files easily using drag-and-drop or file selection, so that the conversion process starts smoothly.

#### Acceptance Criteria

1. THE Frontend SHALL display upload area on Step 1 of conversion workflow
2. WHEN user drags video file over upload area, THE DropzoneHandler class SHALL detect drag event and highlight upload area
3. WHEN user drops video file on upload area, THE System SHALL accept the file and extract filename, file size, and file extension
4. WHEN user clicks file input button, THE Frontend SHALL open native file browser dialog allowing user to select video file
5. WHEN file is selected (drag-drop or file browser), THE Frontend SHALL display filename, file size (formatted as KB/MB), and file extension in UI
6. WHEN file is selected, THE Frontend SHALL validate file size does not exceed maximum upload limit and display validation error if exceeded

### Requirement 20: Frontend Format Selection

**User Story:** As a user, I want to select target video format from available options, so that I can convert to desired format.

#### Acceptance Criteria

1. WHEN Step 1 upload is complete, THE Frontend SHALL transition to Step 2 showing format selector
2. THE Frontend format selector dropdown SHALL display options: mp4, mkv, webm, avi, mov, flv, wmv, 3gp
3. WHEN format selector is displayed, THE Frontend SHALL auto-hide any format option matching the input file format
4. WHEN user selects target format, THE Frontend SHALL validate format is different from input format and display error if invalid
5. WHEN format is selected, THE Frontend SHALL enable the Convert button in Step 3

### Requirement 21: Frontend Progress Display

**User Story:** As a user, I want to see animated progress of video conversion in real-time, so that I understand how long the process will take.

#### Acceptance Criteria

1. WHEN user clicks Convert button, THE ProgressUIController SHALL send conversion request to /api/convert endpoint
2. WHEN conversion request is submitted, THE Frontend SHALL display animated progress bar starting at 0%
3. WHEN progress SSE stream updates are received, THE Frontend progress bar SHALL update to show current percentage (0-100%)
4. WHEN progress bar updates, THE Animation SHALL be smooth without jumping between values
5. WHEN conversion completes (progress reaches 100%), THE Progress bar animation SHALL complete and display "Conversion Complete" message
6. WHEN conversion fails, THE ProgressUIController SHALL display error message with error description from backend

### Requirement 22: Frontend Download Functionality

**User Story:** As a user, I want to download my converted video file after conversion completes, so that I can access the converted file.

#### Acceptance Criteria

1. WHEN conversion completes successfully, THE Frontend SHALL display Download button
2. WHEN user clicks Download button, THE Frontend SHALL trigger file download using downloadUrl provided by backend
3. WHEN file download is triggered, THE Downloaded file SHALL have original filename with new extension matching target format
4. WHEN file is downloaded successfully, THE Frontend SHALL display success notification

### Requirement 23: Frontend Success Notification

**User Story:** As a user, I want to see clear success feedback when conversion completes, so that I know the operation was successful.

#### Acceptance Criteria

1. WHEN conversion completes successfully, THE NotificationManager SHALL display success notification
2. WHEN success notification is displayed, THE Notification background color SHALL be emerald green
3. WHEN success notification appears, THE Animation SHALL fade-in over 300ms
4. WHEN success notification includes icon, THE Icon animation SHALL bounce for 500ms then stabilize
5. WHEN notification is displayed, THE Notification SHALL auto-dismiss after 5 seconds or when user clicks dismiss button
6. WHEN success notification appears, THE Notification message SHALL include "Conversion completed successfully" or similar confirmation text

### Requirement 24: Frontend Error Notification

**User Story:** As a user, I want to see clear error feedback when conversion fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN conversion fails with error, THE NotificationManager SHALL display error notification
2. WHEN error notification is displayed, THE Notification background color SHALL be red
3. WHEN error notification appears, THE Animation SHALL shake horizontally for 400ms
4. WHEN error notification includes error message, THE Message SHALL describe the error in user-friendly language
5. WHEN notification is displayed, THE Notification SHALL remain visible until user dismisses it or retries conversion
6. WHEN conversion fails due to backend error, THE Error message SHALL NOT expose sensitive system information

### Requirement 25: Frontend Dark Mode Theme

**User Story:** As a user, I want to use the application in dark mode for comfortable viewing, so that I can reduce eye strain in low-light environments.

#### Acceptance Criteria

1. WHEN Frontend loads, THE Application SHALL default to dark mode color scheme
2. WHEN dark mode is active, THE Background colors SHALL use dark grays and blacks
3. WHEN dark mode is active, THE Text colors SHALL use light grays and whites for readability
4. WHEN dark mode is active, THE Component borders and accents SHALL use muted colors appropriate for dark backgrounds
5. WHEN user toggles dark/light mode (if implemented), THE Preference SHALL be stored in browser localStorage and persist across sessions

### Requirement 26: Frontend Hardware Status Badge

**User Story:** As a user, I want to see which hardware is processing my video, so that I understand if GPU acceleration is being used.

#### Acceptance Criteria

1. THE Frontend SHALL display hardware status badge prominently in UI
2. WHEN NVIDIA GPU is active, THE Badge color SHALL be green
3. WHEN AMD GPU is active, THE Badge color SHALL be red or orange
4. WHEN CPU is active, THE Badge color SHALL be gray
5. WHEN badge is displayed, THE Badge SHALL show text indicating accelerator type: "NVIDIA NVENC", "AMD GPU", or "CPU Processing"
6. WHEN Frontend loads, THE Frontend SHALL query /api/hardware-status endpoint and update badge to reflect current hardware

### Requirement 27: Frontend Modular Architecture - ApiClient Class

**User Story:** As a frontend developer, I want API communication logic isolated in a dedicated class, so that HTTP requests are centralized and testable.

#### Acceptance Criteria

1. THE Frontend code SHALL implement ApiClient class with responsibility of handling all backend API communication
2. WHEN ApiClient class is instantiated, THE Class SHALL expose public method submitConversion(file: File, targetFormat: string) returning Promise<{jobId: string}>
3. WHEN ApiClient class is instantiated, THE Class SHALL expose public method streamProgress(jobId: string) returning EventSource for SSE streaming
4. WHEN ApiClient class is instantiated, THE Class SHALL expose public method getHardwareStatus() returning Promise<{status: string}>
5. WHEN API methods are called, THE Class SHALL NOT handle UI updates or user interactions

### Requirement 28: Frontend Modular Architecture - DropzoneHandler Class

**User Story:** As a frontend developer, I want drag-drop handling logic isolated in a dedicated class, so that file input logic is independent and reusable.

#### Acceptance Criteria

1. THE Frontend code SHALL implement DropzoneHandler class with responsibility of managing file drag-drop interactions
2. WHEN DropzoneHandler class is instantiated, THE Class SHALL accept DOM element reference in constructor
3. WHEN DropzoneHandler is initialized, THE Class SHALL register listeners for dragover, dragenter, dragleave, and drop events
4. WHEN user drags file over dropzone, THE DropzoneHandler SHALL emit 'highlight' event
5. WHEN user leaves dropzone without dropping, THE DropzoneHandler SHALL emit 'unhighlight' event
6. WHEN user drops file, THE DropzoneHandler SHALL emit 'fileDropped' event with File object
7. WHEN DropzoneHandler executes, THE Class SHALL NOT handle file uploads or API calls

### Requirement 29: Frontend Modular Architecture - ProgressUIController Class

**User Story:** As a frontend developer, I want progress display logic isolated in a dedicated class, so that progress handling is testable and maintainable.

#### Acceptance Criteria

1. THE Frontend code SHALL implement ProgressUIController class with responsibility of managing progress bar updates
2. WHEN ProgressUIController class is instantiated, THE Class SHALL accept DOM element references for progress bar and status text
3. WHEN ProgressUIController.updateProgress(percentage: number) is called, THE Method SHALL update progress bar to show current percentage
4. WHEN ProgressUIController.showError(errorMessage: string) is called, THE Method SHALL display error state and message
5. WHEN ProgressUIController.showSuccess(downloadUrl: string) is called, THE Method SHALL display success state with download button
6. WHEN ProgressUIController executes, THE Class SHALL NOT handle API communication or file downloads

### Requirement 30: Frontend Modular Architecture - NotificationManager Class

**User Story:** As a frontend developer, I want notification display logic isolated in a dedicated class, so that notification handling is consistent and reusable.

#### Acceptance Criteria

1. THE Frontend code SHALL implement NotificationManager class with responsibility of displaying user notifications
2. WHEN NotificationManager class is instantiated, THE Class SHALL expose public method showSuccess(message: string, duration: number = 5000)
3. WHEN NotificationManager class is instantiated, THE Class SHALL expose public method showError(message: string, autoClose: boolean = false)
4. WHEN showSuccess() is called, THE Method SHALL display green success notification with fade-in animation
5. WHEN showError() is called, THE Method SHALL display red error notification with shake animation
6. WHEN notification display duration expires, THE Method SHALL remove notification from DOM
7. WHEN NotificationManager executes, THE Class SHALL NOT handle conversion logic or API communication

### Requirement 31: Error Handling - Invalid File Type

**User Story:** As a user, I want clear feedback if I upload an unsupported file type, so that I understand what files are acceptable.

#### Acceptance Criteria

1. WHEN user uploads file that is not a recognized video format, THE System SHALL reject the file
2. WHEN file is rejected, THE Frontend SHALL display error notification: "Unsupported file format. Please upload a video file."
3. WHEN error is displayed, THE Upload area SHALL remain enabled for retry with valid file

### Requirement 32: Error Handling - FFmpeg Encoding Failure

**User Story:** As a user, I want to understand why conversion failed, so that I can troubleshoot or retry appropriately.

#### Acceptance Criteria

1. WHEN FFmpeg encoding process returns error exit code, THE Backend SHALL capture error message and log details
2. WHEN encoding fails, THE Backend SHALL send error event to frontend via SSE with descriptive message
3. WHEN error is received, THE Frontend SHALL display error notification with message
4. WHEN conversion fails, THE Error message SHALL indicate general error category (encoding error, file corruption, unsupported codec, etc.)
5. WHEN conversion fails, THE Upload area SHALL be re-enabled allowing user to retry with same or different file

### Requirement 33: Error Handling - File Size Limit

**User Story:** As a system operator, I want to prevent extremely large file uploads, so that server resources are protected.

#### Acceptance Criteria

1. THE Backend SHALL enforce maximum upload file size limit of 2GB
2. WHEN file exceeding size limit is uploaded, THE Backend SHALL reject request with HTTP 413 (Payload Too Large) status code
3. WHEN upload is rejected, THE Frontend SHALL display error notification: "File size exceeds maximum limit of 2GB"

### Requirement 34: Smooth State Transitions - Upload to Format Selection

**User Story:** As a user, I want smooth transitions between conversion steps, so that the workflow feels polished and professional.

#### Acceptance Criteria

1. WHEN file is successfully uploaded in Step 1, THE Frontend SHALL animate Step 1 container fade-out over 300ms
2. WHEN Step 1 fades out, THE Frontend SHALL animate Step 2 container fade-in over 300ms
3. WHEN Step 2 is visible, THE Format selector dropdown SHALL be enabled and focused
4. WHEN user navigates between steps, THE Transition animation SHALL be smooth without jarring movements

### Requirement 35: Smooth State Transitions - Format Selection to Conversion

**User Story:** As a user, I want smooth progression through the conversion workflow, so that the UX feels cohesive.

#### Acceptance Criteria

1. WHEN user selects target format in Step 2 and clicks Convert, THE Frontend SHALL animate Step 2 container fade-out over 300ms
2. WHEN Step 2 fades out, THE Frontend SHALL animate Step 3 container fade-in over 300ms
3. WHEN Step 3 is visible, THE Progress bar SHALL appear with animation starting from 0%
4. WHEN step transitions occur, THE UI SHALL remain responsive to user actions

### Requirement 36: Backend Architecture - TypeScript ES Modules

**User Story:** As a developer, I want the backend codebase to use modern TypeScript with ES Modules, so that code is maintainable and follows contemporary JavaScript standards.

#### Acceptance Criteria

1. THE Backend code SHALL use TypeScript language for type safety
2. THE Backend code SHALL use ES Modules (import/export) instead of CommonJS
3. THE Backend package.json SHALL include "type": "module" to enable ES Modules
4. WHEN compiling TypeScript, THE Build process SHALL generate JavaScript ES Modules in output directory

### Requirement 37: Logging and Monitoring - Conversion Event Logging

**User Story:** As a system operator, I want detailed logs of conversion events, so that I can monitor system health and debug issues.

#### Acceptance Criteria

1. WHEN hardware detection completes, THE System SHALL log detected accelerator type with timestamp
2. WHEN conversion request is received, THE System SHALL log jobId, input filename, target format, and timestamp
3. WHEN conversion begins, THE System SHALL log conversion start event with jobId and encoder type
4. WHEN conversion completes successfully, THE System SHALL log completion with jobId, duration, file size, and timestamp
5. WHEN conversion fails, THE System SHALL log failure with jobId, error message, and timestamp
6. WHEN file is deleted by cleanup manager, THE System SHALL log deletion with filename, path, and timestamp

### Requirement 38: Graceful Shutdown and Resource Cleanup

**User Story:** As a system operator, I want the application to cleanly shut down running conversions, so that no processes are orphaned.

#### Acceptance Criteria

1. WHEN application receives shutdown signal (SIGTERM/SIGINT), THE Backend SHALL stop accepting new conversion requests
2. WHEN shutdown is initiated, THE Backend SHALL wait up to 30 seconds for in-progress conversions to complete
3. WHEN conversion is terminated during shutdown, THE System SHALL update job status to 'cancelled'
4. WHEN 30 second grace period expires, THE Backend SHALL forcefully terminate remaining FFmpeg processes
5. WHEN shutdown completes, THE Backend SHALL close all database/file connections and exit cleanly

