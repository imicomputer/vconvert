/**
 * Main Application Entry Point
 * Orchestrates all frontend components
 */

import { ApiClient } from './classes/ApiClient.js';
import { ThemeManager } from './classes/ThemeManager.js';
import { DropzoneHandler } from './classes/DropzoneHandler.js';
import { FormatSelector } from './classes/FormatSelector.js';
import { ProgressUIController } from './classes/ProgressUIController.js';
import { NotificationManager } from './classes/NotificationManager.js';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from './config.js';

class VideoConverterApp {
    constructor() {
        // Initialize components
        this.api = new ApiClient();
        this.theme = new ThemeManager();
        this.formatSelector = new FormatSelector();
        this.notificationManager = null;
        this.progressController = null;
        this.dropzoneHandler = null;
        
        // State
        this.currentFile = null;
        this.currentJobId = null;
        this.progressStream = null;
        this.currentStep = 1;
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            // Initialize theme
            this.theme.init();
            
            // Initialize UI components
            this.initializeUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load hardware status
            await this.loadHardwareStatus();
            
            console.log('✅ Application initialized');
        } catch (error) {
            console.error('Initialization error:', error);
            this.notificationManager?.showError('Failed to initialize application');
        }
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Notification Manager
        const notificationsContainer = document.getElementById('notifications');
        this.notificationManager = new NotificationManager(notificationsContainer);
        
        // Progress Controller
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');
        const statusText = document.getElementById('status-text');
        const downloadSection = document.getElementById('download-section');
        
        this.progressController = new ProgressUIController(
            progressBar,
            progressPercent,
            statusText,
            downloadSection
        );
        
        // Dropzone Handler
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('file-input');
        
        this.dropzoneHandler = new DropzoneHandler(dropzone, fileInput);
        this.dropzoneHandler.init();
        
        // Setup dropzone listeners
        this.dropzoneHandler.on('fileDropped', (data) => this.handleFileSelected(data.file, data.format));
        this.dropzoneHandler.on('formatChange', (data) => {
            // Update format selector when file format changes
            this.formatSelector.setInputFormat(data.format);
        });
        this.dropzoneHandler.on('error', (data) => {
            this.notificationManager.showError(data.message);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File selection
        const changeFileBtn = document.getElementById('change-file');
        if (changeFileBtn) {
            changeFileBtn.addEventListener('click', () => this.resetToStep1());
        }
        
        // Format selection
        const formatRadios = document.querySelectorAll('input[name="format"]');
        formatRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const formatNext = document.getElementById('format-next');
                if (!radio.disabled) {
                    formatNext.disabled = false;
                }
            });
        });
        
        // Format buttons
        const formatBackBtn = document.getElementById('format-back');
        const formatNextBtn = document.getElementById('format-next');
        
        if (formatBackBtn) {
            formatBackBtn.addEventListener('click', () => this.goToStep(1));
        }
        
        if (formatNextBtn) {
            formatNextBtn.addEventListener('click', () => this.handleFormatSelection());
        }
        
        // Download buttons
        const convertAgainBtn = document.getElementById('convert-again-btn');
        if (convertAgainBtn) {
            convertAgainBtn.addEventListener('click', () => this.resetToStep1());
        }
    }

    /**
     * Load hardware status from backend
     */
    async loadHardwareStatus() {
        try {
            const status = await this.api.getHardwareStatus();
            this.updateHardwareBadge(status.status);
        } catch (error) {
            console.warn('Could not load hardware status:', error);
            this.updateHardwareBadge('cpu');
        }
    }

    /**
     * Update hardware badge display
     */
    updateHardwareBadge(hardwareType) {
        const badge = document.getElementById('hardware-badge');
        const text = document.getElementById('hardware-text');
        
        const hwLabels = {
            nvidia: '🚀 NVIDIA NVENC',
            amd: '🎮 AMD GPU',
            cpu: '💻 CPU Processing',
        };
        
        badge.className = `px-3 py-2 rounded-lg bg-theme-surface border border-theme-border text-sm font-medium ${hardwareType}`;
        text.textContent = hwLabels[hardwareType] || 'Unknown';
    }

    /**
     * Handle file selection
     */
    handleFileSelected(file, fileFormat) {
        this.currentFile = file;
        
        // Extract file info
        const filename = file.name;
        const fileExt = fileFormat || this.extractExtension(filename);
        const fileSize = this.formatFileSize(file.size);
        
        // Update UI
        document.getElementById('file-name').textContent = filename;
        document.getElementById('file-size').textContent = fileSize;
        document.getElementById('file-ext').textContent = `.${fileExt}`;
        document.getElementById('file-info').classList.remove('hidden');
        document.getElementById('dropzone').classList.add('hidden');
        
        // Set format selector with input format
        this.formatSelector.setInputFormat(fileExt);
        
        // Show notification
        this.notificationManager.showSuccess(`File selected: ${filename}`);
        
        // Enable next step
        this.goToStep(2);
    }

    /**
     * Extract file extension
     */
    extractExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) return '';
        return filename.substring(lastDot + 1).toLowerCase();
    }

    /**
     * Handle format selection
     */
    handleFormatSelection() {
        const selectedRadio = document.querySelector('input[name="format"]:checked');
        if (!selectedRadio) {
            this.notificationManager.showError(ERROR_MESSAGES.NO_FORMAT_SELECTED);
            return;
        }
        
        const selectedFormat = selectedRadio.value;
        if (!this.formatSelector.selectFormat(selectedFormat)) {
            return;
        }
        
        this.goToStep(3);
        this.startConversion();
    }

    /**
     * Start video conversion
     */
    async startConversion() {
        if (!this.currentFile || !this.formatSelector.getSelectedFormat()) {
            this.notificationManager.showError('Missing file or format');
            return;
        }
        
        try {
            this.notificationManager.showInfo('Starting conversion...');
            
            // Submit conversion
            const response = await this.api.submitConversion(
                this.currentFile,
                this.formatSelector.getSelectedFormat()
            );
            
            this.currentJobId = response.jobId;
            this.notificationManager.showInfo('Conversion started, streaming progress...');
            
            // Stream progress
            this.streamProgress();
        } catch (error) {
            console.error('Conversion error:', error);
            this.notificationManager.showError(
                error.message || ERROR_MESSAGES.CONVERSION_FAILED
            );
            this.progressController.showError(error.message || 'Conversion failed');
        }
    }

    /**
     * Stream conversion progress
     */
    streamProgress() {
        this.progressStream = this.api.streamProgress(
            this.currentJobId,
            (data) => {
                // On progress update
                this.progressController.updateProgress(data.progress || 0);
                this.progressController.updateStatus(`${data.status || 'Converting'}...`);
            },
            (data) => {
                // On completion
                const filename = this.currentFile.name
                    .replace(/\.[^/.]+$/, '')
                    + '.' + this.formatSelector.getSelectedFormat();
                
                this.progressController.showSuccess(
                    this.api.getDownloadUrl(this.currentJobId),
                    filename
                );
                
                this.notificationManager.showSuccess(SUCCESS_MESSAGES.CONVERSION_COMPLETE);
            },
            (error) => {
                // On error
                const message = error.errorMessage || ERROR_MESSAGES.CONVERSION_FAILED;
                this.progressController.showError(message);
                this.notificationManager.showError(message);
            }
        );
    }

    /**
     * Navigate to step
     */
    goToStep(step) {
        // Hide all sections
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const sectionMap = {
            1: '#step1-upload',
            2: '#step2-format',
            3: '#step3-progress',
        };
        
        const section = document.querySelector(sectionMap[step]);
        if (section) {
            section.classList.add('active');
        }
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            indicator.classList.toggle('active', indicatorStep === step);
            indicator.classList.toggle('completed', indicatorStep < step);
        });
        
        this.currentStep = step;
    }

    /**
     * Reset to step 1
     */
    resetToStep1() {
        this.currentFile = null;
        this.currentJobId = null;
        this.formatSelector.selectedFormat = null;
        
        if (this.progressStream) {
            this.progressStream.close();
        }
        
        // Reset UI
        document.getElementById('file-info').classList.add('hidden');
        document.getElementById('dropzone').classList.remove('hidden');
        document.querySelectorAll('input[name="format"]').forEach(radio => radio.checked = false);
        document.getElementById('format-next').disabled = true;
        this.progressController.reset();
        
        // Clear dropzone
        this.dropzoneHandler.clearSelection();
        
        this.goToStep(1);
        this.notificationManager.showInfo('Ready for new conversion');
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize application on page load
document.addEventListener('DOMContentLoaded', () => {
    const app = new VideoConverterApp();
    app.init();
});

export default VideoConverterApp;
