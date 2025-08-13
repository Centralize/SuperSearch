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

    // ==================== DOM PERFORMANCE OPTIMIZATIONS ====================

    /**
     * Batch DOM updates to minimize reflows and repaints
     * @param {Function} updateFunction - Function containing DOM updates
     * @returns {Promise<void>}
     */
    static async batchDOMUpdates(updateFunction) {
        return new Promise((resolve) => {
            // Use requestAnimationFrame for optimal timing
            requestAnimationFrame(() => {
                try {
                    updateFunction();
                    resolve();
                } catch (error) {
                    Utils.logError(error, 'Batch DOM update failed');
                    resolve();
                }
            });
        });
    }

    /**
     * Create document fragment for efficient DOM manipulation
     * @param {Array} elements - Array of elements to add to fragment
     * @returns {DocumentFragment}
     */
    static createDocumentFragment(elements) {
        const fragment = document.createDocumentFragment();
        elements.forEach(element => {
            if (element instanceof Node) {
                fragment.appendChild(element);
            } else if (typeof element === 'string') {
                const div = document.createElement('div');
                div.innerHTML = element;
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
            }
        });
        return fragment;
    }

    /**
     * Debounce function calls for performance
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Throttle function calls for performance
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Lazy load images for better performance
     * @param {Element} container - Container to search for images
     */
    static lazyLoadImages(container = document) {
        const images = container.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
            });
        }
    }

    /**
     * Virtual scrolling for large lists
     * @param {Element} container - Container element
     * @param {Array} items - Array of items to render
     * @param {Function} renderItem - Function to render each item
     * @param {number} itemHeight - Height of each item
     */
    static initVirtualScrolling(container, items, renderItem, itemHeight = 50) {
        const viewportHeight = container.clientHeight;
        const visibleItems = Math.ceil(viewportHeight / itemHeight) + 2; // Buffer

        let startIndex = 0;
        let endIndex = Math.min(visibleItems, items.length);

        const renderVisibleItems = () => {
            const fragment = document.createDocumentFragment();

            for (let i = startIndex; i < endIndex; i++) {
                if (items[i]) {
                    const element = renderItem(items[i], i);
                    element.style.position = 'absolute';
                    element.style.top = `${i * itemHeight}px`;
                    element.style.height = `${itemHeight}px`;
                    fragment.appendChild(element);
                }
            }

            container.innerHTML = '';
            container.appendChild(fragment);
            container.style.height = `${items.length * itemHeight}px`;
            container.style.position = 'relative';
        };

        const handleScroll = Utils.throttle(() => {
            const scrollTop = container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / itemHeight);
            const newEndIndex = Math.min(newStartIndex + visibleItems, items.length);

            if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
                startIndex = newStartIndex;
                endIndex = newEndIndex;
                renderVisibleItems();
            }
        }, 16); // ~60fps

        container.addEventListener('scroll', handleScroll);
        renderVisibleItems();

        return {
            update: (newItems) => {
                items = newItems;
                startIndex = 0;
                endIndex = Math.min(visibleItems, items.length);
                renderVisibleItems();
            },
            destroy: () => {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }

    /**
     * Optimize CSS animations by using transform and opacity
     * @param {Element} element - Element to animate
     * @param {Object} properties - Animation properties
     * @param {number} duration - Animation duration in ms
     * @returns {Promise<void>}
     */
    static animateOptimized(element, properties, duration = 300) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const startValues = {};

            // Get initial values
            Object.keys(properties).forEach(prop => {
                if (prop === 'opacity') {
                    startValues[prop] = parseFloat(getComputedStyle(element).opacity) || 1;
                } else if (prop === 'translateX' || prop === 'translateY' || prop === 'scale') {
                    startValues[prop] = 0;
                }
            });

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);

                // Apply transforms
                let transform = '';
                Object.keys(properties).forEach(prop => {
                    const startValue = startValues[prop];
                    const endValue = properties[prop];
                    const currentValue = startValue + (endValue - startValue) * easeOut;

                    if (prop === 'opacity') {
                        element.style.opacity = currentValue;
                    } else if (prop === 'translateX') {
                        transform += `translateX(${currentValue}px) `;
                    } else if (prop === 'translateY') {
                        transform += `translateY(${currentValue}px) `;
                    } else if (prop === 'scale') {
                        transform += `scale(${currentValue}) `;
                    }
                });

                if (transform) {
                    element.style.transform = transform.trim();
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Measure and log performance metrics
     * @param {string} name - Performance mark name
     * @param {Function} operation - Operation to measure
     * @returns {Promise<any>} Operation result
     */
    static async measurePerformance(name, operation) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        const measureName = `${name}-duration`;

        try {
            performance.mark(startMark);
            const result = await operation();
            performance.mark(endMark);
            performance.measure(measureName, startMark, endMark);

            const measure = performance.getEntriesByName(measureName)[0];
            console.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);

            return result;
        } catch (error) {
            performance.mark(endMark);
            performance.measure(measureName, startMark, endMark);
            throw error;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}