/**
 * SuperSearch - Utility Functions
 * Contains common utility functions used throughout the application
 */

const Utils = {
    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Sanitize HTML string to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate search engine URL template
     * @param {string} template - URL template with {query} placeholder
     * @returns {boolean} True if valid template
     */
    isValidSearchTemplate(template) {
        return this.isValidUrl(template.replace('{query}', 'test')) && 
               template.includes('{query}');
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return d.toLocaleDateString();
    },

    /**
     * Download data as JSON file
     * @param {Object} data - Data to download
     * @param {string} filename - File name
     */
    downloadJson(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Read JSON file from input element
     * @param {File} file - File object
     * @returns {Promise<Object>} Parsed JSON data
     */
    async readJsonFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || file.type !== 'application/json') {
                reject(new Error('Invalid file type. Please select a JSON file.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON format.'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file.'));
            reader.readAsText(file);
        });
    },

    /**
     * Show notification toast
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, warning, danger)
     * @param {number} timeout - Auto-hide timeout in ms
     */
    showNotification(message, type = 'primary', timeout = 5000) {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
            `;
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `uk-alert uk-alert-${type} fade-in-up`;
        notification.innerHTML = `
            <button class="uk-alert-close" uk-close></button>
            <p>${this.sanitizeHtml(message)}</p>
        `;

        container.appendChild(notification);

        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, timeout);

        // Handle close button
        const closeBtn = notification.querySelector('.uk-alert-close');
        closeBtn.addEventListener('click', () => notification.remove());
    },

    /**
     * Build search URL from template and query
     * @param {string} template - URL template with {query} placeholder
     * @param {string} query - Search query
     * @returns {string} Complete search URL
     */
    buildSearchUrl(template, query) {
        if (!template || !query) return '';
        
        const encodedQuery = encodeURIComponent(query.trim());
        return template.replace(/{query}/g, encodedQuery);
    },

    /**
     * Get favicon URL for a domain
     * @param {string} url - URL to get favicon for
     * @returns {string} Favicon URL
     */
    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23ddd"/></svg>';
        }
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
                return true;
            }
        } catch {
            return false;
        }
    },

    /**
     * Validate configuration object
     * @param {Object} config - Configuration object to validate
     * @returns {boolean} True if valid configuration
     */
    isValidConfig(config) {
        if (!config || typeof config !== 'object') return false;
        
        // Check required properties
        if (!config.version || !config.engines || !Array.isArray(config.engines)) {
            return false;
        }

        // Validate each engine
        for (const engine of config.engines) {
            if (!engine.id || !engine.name || !engine.url || 
                !this.isValidSearchTemplate(engine.url)) {
                return false;
            }
        }

        return true;
    },

    /**
     * Get color contrast (light/dark) for accessibility
     * @param {string} hexColor - Hex color code
     * @returns {string} 'light' or 'dark'
     */
    getContrastColor(hexColor) {
        const rgb = parseInt(hexColor.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        return brightness > 186 ? 'dark' : 'light';
    },

    /**
     * Escape special characters for use in regular expressions
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Get current theme preference
     * @returns {string} 'light' or 'dark'
     */
    getThemePreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },

    /**
     * Log error with context
     * @param {Error|string} error - Error to log
     * @param {string} context - Context information
     */
    logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorMsg = error instanceof Error ? error.message : error;
        console.error(`[${timestamp}] ${context}: ${errorMsg}`);
        
        // In production, you might want to send this to an error tracking service
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}