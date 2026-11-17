/**
 * ProgressUIController Class
 * Manages progress bar and conversion status display with smooth animations
 */

export class ProgressUIController {
    constructor(progressBarElement, progressPercentElement, statusTextElement, downloadSectionElement) {
        this.progressBar = progressBarElement;
        this.progressPercent = progressPercentElement;
        this.statusText = statusTextElement;
        this.downloadSection = downloadSectionElement;
        this.currentProgress = 0;
        this.lastUpdateTime = 0;
        this.updateThrottle = 500; // ms - max 1 update per 500ms
    }

    /**
     * Update progress percentage with smooth animation
     * @param {number} percentage - 0-100
     */
    updateProgress(percentage) {
        // Throttle updates: max 1 per 500ms
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return;
        }
        this.lastUpdateTime = now;

        // Clamp to 0-99% during processing (save 100% for completion)
        percentage = Math.max(0, Math.min(99, percentage));
        
        // Only update if progress increased (monotonic)
        if (percentage <= this.currentProgress && percentage < 99) {
            return;
        }

        this.currentProgress = percentage;
        
        // Smooth CSS transition (0.3s) handles animation
        this.progressBar.style.width = `${percentage}%`;
        this.progressPercent.textContent = `${percentage}%`;

        // Add pulse animation when progress updates
        this.progressBar.classList.remove('pulse-animation');
        // Trigger reflow to restart animation
        void this.progressBar.offsetWidth;
        this.progressBar.classList.add('pulse-animation');
    }

    /**
     * Force progress to exact percentage
     * Used for final progress update
     */
    forceProgress(percentage) {
        percentage = Math.max(0, Math.min(100, percentage));
        this.currentProgress = percentage;
        
        this.progressBar.style.width = `${percentage}%`;
        this.progressPercent.textContent = `${percentage}%`;
    }

    /**
     * Update status text
     * @param {string} status - Status message
     */
    updateStatus(status) {
        this.statusText.textContent = status;
    }

    /**
     * Show success state with download button
     * @param {string} downloadUrl - Download URL
     * @param {string} filename - Output filename
     */
    showSuccess(downloadUrl, filename) {
        // Force to 100% on completion
        this.forceProgress(100);
        this.updateStatus('✅ Conversion complete!');
        
        // Remove pulse animation at completion
        this.progressBar.classList.remove('pulse-animation');
        this.progressBar.classList.add('complete');

        // Setup download button
        const downloadBtn = this.downloadSection.querySelector('#download-btn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }

        // Show download section
        this.downloadSection.classList.remove('hidden');
    }

    /**
     * Show error state
     * @param {string} errorMessage - Error description
     */
    showError(errorMessage) {
        // Reset progress on error
        this.currentProgress = 0;
        this.progressBar.style.width = '0%';
        this.progressPercent.textContent = '0%';
        
        this.updateStatus(`❌ ${errorMessage}`);
        
        // Change to red error color
        this.progressBar.style.backgroundColor = '#ef4444';
        this.progressBar.classList.add('shake-animation');
        
        // Remove pulse animation
        this.progressBar.classList.remove('pulse-animation', 'complete');
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.currentProgress = 0;
        this.lastUpdateTime = 0;
        
        this.progressBar.style.width = '0%';
        this.progressPercent.textContent = '0%';
        this.updateStatus('Preparing conversion...');
        
        // Reset styles
        this.progressBar.style.backgroundColor = '';
        this.progressBar.classList.remove('complete', 'pulse-animation', 'shake-animation');
        
        // Hide download section
        this.downloadSection.classList.add('hidden');
    }

    /**
     * Get current progress
     */
    getProgress() {
        return this.currentProgress;
    }

    /**
     * Check if progress reached completion
     */
    isComplete() {
        return this.currentProgress >= 100;
    }

    /**
     * Get monotonic progress (never decreases)
     */
    getMonotonicProgress() {
        return this.currentProgress;
    }
}

export default ProgressUIController;
