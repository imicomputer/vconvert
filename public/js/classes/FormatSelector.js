/**
 * FormatSelector Class
 * Manages video format selection
 */

import { SUPPORTED_FORMATS } from '../config.js';

export class FormatSelector {
    constructor() {
        this.selectedFormat = null;
        this.inputFormat = null;
        this.listeners = {};
    }

    /**
     * Set input file format
     * @param {string} format - File extension (without dot)
     */
    setInputFormat(format) {
        this.inputFormat = format.toLowerCase();
    }

    /**
     * Get supported formats (excluding input format)
     */
    getAvailableFormats() {
        if (!this.inputFormat) {
            return SUPPORTED_FORMATS;
        }

        return SUPPORTED_FORMATS.filter(fmt => fmt.value !== this.inputFormat);
    }

    /**
     * Validate format selection
     */
    validateFormat(format) {
        if (!format) {
            return { valid: false, error: 'No format selected' };
        }

        if (format === this.inputFormat) {
            return { valid: false, error: 'Output format cannot be the same as input format' };
        }

        const supported = SUPPORTED_FORMATS.find(fmt => fmt.value === format);
        if (!supported) {
            return { valid: false, error: 'Unsupported format' };
        }

        return { valid: true };
    }

    /**
     * Select format
     */
    selectFormat(format) {
        const validation = this.validateFormat(format);
        
        if (!validation.valid) {
            this.emit('error', { message: validation.error });
            return false;
        }

        this.selectedFormat = format;
        this.emit('formatSelected', { format });
        return true;
    }

    /**
     * Get selected format
     */
    getSelectedFormat() {
        return this.selectedFormat;
    }

    /**
     * Get format details
     */
    getFormatDetails(format) {
        return SUPPORTED_FORMATS.find(fmt => fmt.value === format);
    }

    /**
     * Emit events
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

export default FormatSelector;
