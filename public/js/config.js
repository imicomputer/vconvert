/**
 * Frontend Configuration
 * Constants and configuration for the video converter application
 */

// API Configuration
const configuredApiBaseUrl = typeof process === 'undefined'
    ? undefined
    : process.env?.API_BASE_URL;
export const API_BASE_URL = configuredApiBaseUrl || 'http://localhost:3000/api';

// Supported Video Formats
export const SUPPORTED_FORMATS = [
    { value: 'mp4', label: 'MP4 (H.264)', description: 'Best compatibility, GPU accelerated' },
    { value: 'mkv', label: 'MKV (H.264)', description: 'High quality, GPU accelerated' },
    { value: 'webm', label: 'WebM (VP9)', description: 'Web optimized, modern format' },
    { value: 'avi', label: 'AVI (MPEG4)', description: 'Legacy format, widely compatible' },
    { value: 'mov', label: 'MOV (H.264)', description: 'Apple format, GPU accelerated' },
    { value: 'flv', label: 'FLV (MPEG2)', description: 'Flash format, legacy support' },
    { value: 'wmv', label: 'WMV (WMV2)', description: 'Windows Media, legacy support' },
    { value: '3gp', label: '3GP (H.263)', description: 'Mobile format, QCIF 352x288' },
];

// File Upload Configuration
export const FILE_CONFIG = {
    maxSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
    maxSizeMB: 2048,
    allowedMimeTypes: [
        'video/mp4',
        'video/x-matroska',
        'video/webm',
        'video/x-msvideo',
        'video/quicktime',
        'video/x-flv',
        'video/x-ms-wmv',
        'video/3gpp',
        'video/mpeg',
        'video/ogg',
    ],
};

// UI Configuration
export const UI_CONFIG = {
    notificationDuration: 5000, // 5 seconds
    progressUpdateInterval: 500, // 500ms
    stepTransitionDuration: 300, // 300ms
};

// Hardware Status Configuration
export const HARDWARE_STATUS = {
    nvidia: { color: '#76b900', label: 'NVIDIA NVENC' },
    amd: { color: '#ed1c24', label: 'AMD GPU' },
    cpu: { color: '#9ca3af', label: 'CPU Processing' },
};

// Theme Configuration
export const THEME_CONFIG = {
    default: 'dark',
    storageKey: 'video-converter-theme',
    modes: ['dark', 'light'],
};

// API Endpoints
export const API_ENDPOINTS = {
    hardwareStatus: '/hardware-status',
    convert: '/convert',
    progress: '/progress',
    download: '/download',
};

// Error Messages
export const ERROR_MESSAGES = {
    FILE_TOO_LARGE: 'File size exceeds 2GB limit',
    UNSUPPORTED_FORMAT: 'Unsupported file format. Please upload a video file.',
    SAME_FORMAT: 'Output format cannot be the same as input format',
    NO_FILE_SELECTED: 'Please select a video file',
    NO_FORMAT_SELECTED: 'Please select an output format',
    CONVERSION_FAILED: 'Conversion failed. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
    CONVERSION_COMPLETE: 'Conversion completed successfully!',
    FILE_DOWNLOADED: 'File downloaded successfully!',
};

export default {
    API_BASE_URL,
    SUPPORTED_FORMATS,
    FILE_CONFIG,
    UI_CONFIG,
    HARDWARE_STATUS,
    THEME_CONFIG,
    API_ENDPOINTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
};
