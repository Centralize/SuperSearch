/**
 * Notification Manager Module
 *
 * Manages user notifications and feedback messages using Bootstrap toasts.
 * Provides methods for showing success, error, warning, and info messages.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class NotificationManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultDuration = 5000;
        this.maxToasts = 5;
    }

    /**
     * Initialize the notification manager
     */
    init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            console.warn('NotificationManager: Container not found, creating one');
            this.createContainer();
        }
        console.log('✅ NotificationManager: Initialized');
    }

    /**
     * Create notification container if it doesn't exist
     * @private
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'position-fixed top-0 end-0 p-3 notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {Object} options - Additional options
     */
    show(message, type = 'info', options = {}) {
        const {
            duration = this.defaultDuration,
            title = null,
            persistent = false,
            actions = []
        } = options;

        // Ensure container exists
        if (!this.container) {
            this.init();
        }

        // Limit number of toasts
        this.limitToasts();

        // Create toast element
        const toastId = this.generateToastId();
        const toastElement = this.createToastElement(toastId, message, type, title, actions);

        // Add to container
        this.container.appendChild(toastElement);

        // Initialize Bootstrap toast
        if (typeof bootstrap !== 'undefined') {
            const toast = new bootstrap.Toast(toastElement, {
                autohide: !persistent,
                delay: duration
            });

            // Store toast reference
            this.toasts.set(toastId, {
                element: toastElement,
                toast: toast,
                type: type,
                timestamp: Date.now()
            });

            // Show the toast
            toast.show();

            // Clean up after hiding
            toastElement.addEventListener('hidden.bs.toast', () => {
                this.removeToast(toastId);
            });

            console.log(`📢 NotificationManager: ${type.toUpperCase()}: ${message}`);

            return toastId;
        } else {
            console.warn('Bootstrap not available, falling back to console log');
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            return null;
        }
    }

    /**
     * Create toast element
     * @private
     */
    createToastElement(toastId, message, type, title, actions) {
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${this.getBootstrapType(type)} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        let headerHtml = '';
        if (title) {
            headerHtml = `
                <div class="toast-header bg-${this.getBootstrapType(type)} text-white">
                    <strong class="me-auto">${this.escapeHtml(title)}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;
        }

        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="toast-actions mt-2">
                    ${actions.map(action => `
                        <button type="button" class="btn btn-sm btn-outline-light me-2"
                                onclick="${action.handler}">
                            ${this.escapeHtml(action.label)}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        toast.innerHTML = `
            ${headerHtml}
            <div class="d-flex">
                <div class="toast-body">
                    ${this.getTypeIcon(type)} ${this.escapeHtml(message)}
                    ${actionsHtml}
                </div>
                ${!title ? '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
            </div>
        `;

        return toast;
    }

    /**
     * Get Bootstrap type class
     * @private
     */
    getBootstrapType(type) {
        const typeMap = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info',
            primary: 'primary',
            secondary: 'secondary'
        };
        return typeMap[type] || 'info';
    }

    /**
     * Get icon for notification type
     * @private
     */
    getTypeIcon(type) {
        const iconMap = {
            success: '<i class="bi bi-check-circle-fill me-2"></i>',
            error: '<i class="bi bi-exclamation-triangle-fill me-2"></i>',
            warning: '<i class="bi bi-exclamation-circle-fill me-2"></i>',
            info: '<i class="bi bi-info-circle-fill me-2"></i>'
        };
        return iconMap[type] || iconMap.info;
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate unique toast ID
     * @private
     */
    generateToastId() {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Limit number of visible toasts
     * @private
     */
    limitToasts() {
        if (this.toasts.size >= this.maxToasts) {
            // Remove oldest toast
            const oldestId = Array.from(this.toasts.keys())[0];
            this.hideToast(oldestId);
        }
    }

    /**
     * Remove toast from DOM and tracking
     * @private
     */
    removeToast(toastId) {
        const toastData = this.toasts.get(toastId);
        if (toastData) {
            if (toastData.element && toastData.element.parentNode) {
                toastData.element.remove();
            }
            this.toasts.delete(toastId);
        }
    }

    /**
     * Hide a specific toast
     */
    hideToast(toastId) {
        const toastData = this.toasts.get(toastId);
        if (toastData && toastData.toast) {
            toastData.toast.hide();
        }
    }

    /**
     * Show success notification
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Show error notification
     */
    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 8000 });
    }

    /**
     * Show warning notification
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', { ...options, duration: 6000 });
    }

    /**
     * Show info notification
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        for (const toastId of this.toasts.keys()) {
            this.hideToast(toastId);
        }
    }

    /**
     * Get notification statistics
     */
    getStats() {
        return {
            active: this.toasts.size,
            maxToasts: this.maxToasts,
            defaultDuration: this.defaultDuration
        };
    }
}
