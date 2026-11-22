/**
 * ApiClient Class
 * Handles all backend API communication
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config.js';

export class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.endpoints = API_ENDPOINTS;
    }

    /**
     * Get hardware status from backend
     * @returns {Promise<{status: 'nvidia'|'amd'|'cpu'}>}
     */
    async getHardwareStatus() {
        try {
            const response = await fetch(`${this.baseUrl}${this.endpoints.hardwareStatus}`);
            if (!response.ok) throw new Error('Failed to fetch hardware status');
            return await response.json();
        } catch (error) {
            console.error('Hardware status error:', error);
            throw error;
        }
    }

    /**
     * Submit video file for conversion
     * @param {File} file - The video file
     * @param {string} targetFormat - Target output format
     * @returns {Promise<{jobId: string}>}
     */
    async submitConversion(file, targetFormat) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFormat', targetFormat);

        try {
            const response = await fetch(`${this.baseUrl}${this.endpoints.convert}?targetFormat=${targetFormat}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Conversion submission failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Conversion submission error:', error);
            throw error;
        }
    }

    /**
     * Stream progress updates via Server-Sent Events
     * @param {string} jobId - The job ID
     * @param {Function} onProgress - Callback for progress updates
     * @param {Function} onComplete - Callback for completion
     * @param {Function} onError - Callback for errors
     * @returns {EventSource}
     */
    streamProgress(jobId, onProgress, onComplete, onError) {
        const eventSource = new EventSource(
            `${this.baseUrl}${this.endpoints.progress}/${jobId}`
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.status === 'done' || data.status === 'completed') {
                    onComplete(data);
                    eventSource.close();
                } else if (data.status === 'error' || data.status === 'failed') {
                    onError(data);
                    eventSource.close();
                } else {
                    onProgress(data);
                }
            } catch (error) {
                console.error('Progress parse error:', error);
                onError({ errorMessage: 'Failed to parse progress update' });
                eventSource.close();
            }
        };

        eventSource.onerror = (error) => {
            console.error('Progress stream error:', error);
            onError({ errorMessage: 'The progress stream was interrupted. Check the server connection and logs.' });
            eventSource.close();
        };

        return eventSource;
    }

    /**
     * Get download URL for converted file
     * @param {string} jobId - The job ID
     * @returns {string}
     */
    getDownloadUrl(jobId) {
        return `${this.baseUrl}${this.endpoints.download}/${jobId}`;
    }

    /**
     * Download file by jobId
     * @param {string} jobId - The job ID
     * @param {string} filename - Filename for download
     */
    downloadFile(jobId, filename) {
        const link = document.createElement('a');
        link.href = this.getDownloadUrl(jobId);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export default ApiClient;
