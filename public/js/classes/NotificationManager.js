/**
 * NotificationManager Class
 * Displays success, error, warning, and info notifications
 */

import { UI_CONFIG } from '../config.js';

export class NotificationManager {
    constructor(containerElement) {
        this.container = containerElement;
        this.notifications = [];
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {number} duration - Display duration in ms (0 = persistent)
     */
    showSuccess(message, duration = UI_CONFIG.notificationDuration) {
        this.show(message, 'success', duration, '✓');
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {boolean} autoClose - Auto-dismiss after duration
     */
    showError(message, autoClose = false) {
        const duration = autoClose ? UI_CONFIG.notificationDuration : 0;
        this.show(message, 'error', duration, '✕');
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {number} duration - Display duration in ms
     */
    showWarning(message, duration = UI_CONFIG.notificationDuration) {
        this.show(message, 'warning', duration, '⚠');
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {number} duration - Display duration in ms
     */
    showInfo(message, duration = UI_CONFIG.notificationDuration) {
        this.show(message, 'info', duration, 'ℹ');
    }

    /**
     * Show notification (internal method)
     */
    show(message, type, duration, icon) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;
        
        const iconElement = document.createElement('div');
        iconElement.className = 'notification-icon';
        iconElement.textContent = icon;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'notification-content';
        contentElement.textContent = message;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.textContent = '×';
        closeButton.onclick = () => this.removeNotification(notification);
        
        notification.appendChild(iconElement);
        notification.appendChild(contentElement);
        notification.appendChild(closeButton);
        
        this.container.appendChild(notification);
        this.notifications.push({ element: notification, message, type });

        // Auto-dismiss if duration specified
        if (duration > 0) {
            setTimeout(() => this.removeNotification(notification), duration);
        }
    }

    /**
     * Remove notification
     */
    removeNotification(notificationElement) {
        notificationElement.classList.add('fade-out');
        
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.parentNode.removeChild(notificationElement);
            }
            this.notifications = this.notifications.filter(n => n.element !== notificationElement);
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(n => this.removeNotification(n.element));
    }

    /**
     * Get notification count
     */
    getCount() {
        return this.notifications.length;
    }
}

export default NotificationManager;
