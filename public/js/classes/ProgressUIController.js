/**
 * ProgressUIController Class
 * Manages progress bar and conversion status display
 */

export class ProgressUIController {
    constructor(progressBarElement, progressPercentElement, statusTextElement, downloadSectionElement) {
        this.progressBar = progressBarElement;
        this.progressPercent = progressPercentElement;
        this.statusText = statusTextElement;
        this.downloadSection = downloadSectionElement;
        this.currentProgress = 0;
    }

    /**
     * Update progress percentage
     * @param {number} percentage - 0-100
     */
    updateProgress(percentage) {
        percentage = Math.max(0, Math.min(100, percentage));
        this.currentProgress = percentage;
        
        this.progressBar.style.width = `${percentage}%`;
        this.progressPercent.textContent = `${percentage}%`;

        if (percentage === 100) {
            this.progressBar.classList.add('complete');
        }
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
        this.updateProgress(100);
        this.updateStatus('✅ Conversion complete!');
        
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

        this.downloadSection.classList.remove('hidden');
    }

    /**
     * Show error state
     * @param {string} errorMessage - Error description
     */
    showError(errorMessage) {
        this.updateProgress(0);
        this.updateStatus(`❌ ${errorMessage}`);
        this.progressBar.style.backgroundColor = '#ef4444';
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.currentProgress = 0;
        this.updateProgress(0);
        this.updateStatus('Preparing conversion...');
        this.progressBar.style.backgroundColor = '';
        this.progressBar.classList.remove('complete');
        this.downloadSection.classList.add('hidden');
    }

    /**
     * Get current progress
     */
    getProgress() {
        return this.currentProgress;
    }
}

export default ProgressUIController;
