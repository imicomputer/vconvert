/**
 * DropzoneHandler Class
 * Manages drag-drop file input interactions
 */

import { FILE_CONFIG } from '../config.js';

export class DropzoneHandler {
    constructor(dropzoneElement, fileInputElement) {
        this.dropzone = dropzoneElement;
        this.fileInput = fileInputElement;
        this.selectedFile = null;
        this.listeners = {};
    }

    /**
     * Initialize drag-drop listeners
     */
    init() {
        this.setupDragDropListeners();
        this.setupFileInputListener();
    }

    /**
     * Setup drag-drop event listeners
     */
    setupDragDropListeners() {
        // Drag over
        this.dropzone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropzone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        // Drop
        this.dropzone.addEventListener('drop', (e) => this.handleDrop(e));

        // Prevent default browser behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
    }

    /**
     * Setup file input listener
     */
    setupFileInputListener() {
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelected(file);
            }
        });
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        this.dropzone.classList.add('hover');
    }

    /**
     * Handle drag enter
     */
    handleDragEnter(e) {
        this.dropzone.classList.add('hover', 'active');
        this.emit('highlight');
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(e) {
        this.dropzone.classList.remove('hover', 'active');
        this.emit('unhighlight');
    }

    /**
     * Handle file drop
     */
    handleDrop(e) {
        this.dropzone.classList.remove('hover', 'active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            this.handleFileSelected(file);
        }
    }

    /**
     * Handle file selection (from input or drag-drop)
     */
    handleFileSelected(file) {
        // Validate file size
        if (file.size > FILE_CONFIG.maxSizeBytes) {
            this.emit('error', {
                message: `File size exceeds ${FILE_CONFIG.maxSizeMB}MB limit`,
                file,
            });
            return;
        }

        // Validate file type
        if (!this.isVideoFile(file)) {
            this.emit('error', {
                message: 'Unsupported file format. Please upload a video file.',
                file,
            });
            return;
        }

        this.selectedFile = file;
        this.emit('fileDropped', { file });
    }

    /**
     * Validate if file is a video
     */
    isVideoFile(file) {
        return file.type.startsWith('video/') || this.hasVideoExtension(file.name);
    }

    /**
     * Check file extension
     */
    hasVideoExtension(filename) {
        const videoExtensions = [
            '.mp4', '.mkv', '.webm', '.avi', '.mov', 
            '.flv', '.wmv', '.3gp', '.mpeg', '.ogg'
        ];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return videoExtensions.includes(ext);
    }

    /**
     * Get selected file
     */
    getSelectedFile() {
        return this.selectedFile;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedFile = null;
        this.fileInput.value = '';
    }

    /**
     * Emit custom events
     */
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => callback(data));
        }
    }

    /**
     * Listen for events
     */
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    /**
     * Remove event listener
     */
    off(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
        }
    }
}

export default DropzoneHandler;
