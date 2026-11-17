/**
 * FormatSelector Class
 * Manages video format selection with dynamic filtering
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
        this.updateUIFormatFiltering();
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
     * Update format UI to reflect filtering
     */
    updateUIFormatFiltering() {
        const formatRadios = document.querySelectorAll('input[name="format"]');
        
        formatRadios.forEach(radio => {
            const format = radio.value;
            const label = radio.closest('label');
            const isDisabled = format === this.inputFormat;

            // Update radio disabled state
            radio.disabled = isDisabled;

            if (label) {
                // Smooth transition (200ms)
                label.style.transition = 'opacity 200ms ease, text-decoration 200ms ease';
                
                if (isDisabled) {
                    // Disable styling
                    label.style.opacity = '0.5';
                    label.style.textDecoration = 'line-through';
                    label.style.cursor = 'not-allowed';
                    
                    // Add helper text if not already present
                    let helper = label.querySelector('.format-helper');
                    if (!helper) {
                        helper = document.createElement('p');
                        helper.className = 'format-helper text-sm text-theme-text-secondary mt-1';
                        helper.textContent = '(Same as input format)';
                        label.appendChild(helper);
                    }
                } else {
                    // Enable styling
                    label.style.opacity = '1';
                    label.style.textDecoration = 'none';
                    label.style.cursor = 'pointer';
                    
                    // Remove helper text if present
                    const helper = label.querySelector('.format-helper');
                    if (helper) {
                        helper.remove();
                    }
                }
            }
        });

        // Emit event for format filtering
        this.emit('formatsFiltered', { 
            availableFormats: this.getAvailableFormats()
        });
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
     * Set selected format programmatically
     */
    setSelectedFormat(format) {
        const radio = document.querySelector(`input[name="format"][value="${format}"]`);
        if (radio && !radio.disabled) {
            radio.checked = true;
            this.selectFormat(format);
        }
    }

    /**
     * Get format details
     */
    getFormatDetails(format) {
        return SUPPORTED_FORMATS.find(fmt => fmt.value === format);
    }

    /**
     * Get input format
     */
    getInputFormat() {
        return this.inputFormat;
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
