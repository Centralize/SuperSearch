/**
 * Keyboard Manager Module
 *
 * Manages keyboard shortcuts and navigation.
 * Provides comprehensive keyboard accessibility and shortcuts.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class KeyboardManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.shortcuts = new Map();
        this.isEnabled = true;
    }

    /**
     * Initialize keyboard manager and set up shortcuts
     */
    init() {
        console.log('⌨️ KeyboardManager: Initializing...');

        this.setupShortcuts();
        this.setupEventListeners();

        console.log('✅ KeyboardManager: Initialized');
    }

    /**
     * Set up keyboard shortcuts
     */
    setupShortcuts() {
        // Search shortcuts
        this.addShortcut('ctrl+k', 'Focus search input', () => {
            this.focusSearchInput();
        });

        this.addShortcut('cmd+k', 'Focus search input (Mac)', () => {
            this.focusSearchInput();
        });

        this.addShortcut('/', 'Focus search input', () => {
            this.focusSearchInput();
        });

        // Navigation shortcuts
        this.addShortcut('escape', 'Close modals/clear focus', () => {
            this.handleEscape();
        });

        this.addShortcut('enter', 'Submit search', () => {
            this.handleEnter();
        });

        // Engine selection shortcuts
        this.addShortcut('ctrl+a', 'Select all engines', () => {
            this.selectAllEngines();
        });

        this.addShortcut('ctrl+d', 'Deselect all engines', () => {
            this.deselectAllEngines();
        });

        // Modal shortcuts
        this.addShortcut('ctrl+shift+a', 'Add new engine', () => {
            this.uiManager.handleManageEnginesClick({ preventDefault: () => {} });
        });

        this.addShortcut('ctrl+shift+s', 'Open settings', () => {
            this.uiManager.handleSettingsClick({ preventDefault: () => {} });
        });

        this.addShortcut('ctrl+shift+h', 'Open history', () => {
            this.uiManager.handleHistoryClick({ preventDefault: () => {} });
        });

        this.addShortcut('f1', 'Open help', () => {
            this.uiManager.handleHelpClick({ preventDefault: () => {} });
        });

        // Number shortcuts for engine selection (1-9)
        for (let i = 1; i <= 9; i++) {
            this.addShortcut(`${i}`, `Select engine ${i}`, () => {
                this.selectEngineByIndex(i - 1);
            });
        }
    }

    /**
     * Add a keyboard shortcut
     * @param {string} key - Key combination
     * @param {string} description - Description of the shortcut
     * @param {Function} handler - Handler function
     */
    addShortcut(key, description, handler) {
        this.shortcuts.set(key.toLowerCase(), {
            description,
            handler,
            key
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return;

            this.handleKeyDown(event);
        });

        // Prevent default behavior for certain keys in search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keydown', (event) => {
                this.handleSearchInputKeyDown(event);
            });
        }
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        const key = this.getKeyString(event);
        const shortcut = this.shortcuts.get(key);

        if (shortcut) {
            // Don't trigger shortcuts when typing in inputs (except for specific cases)
            if (this.shouldIgnoreShortcut(event, key)) {
                return;
            }

            event.preventDefault();
            shortcut.handler(event);
        }
    }

    /**
     * Handle search input specific keydown events
     * @param {KeyboardEvent} event
     */
    handleSearchInputKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.uiManager.handleSearchSubmit({ preventDefault: () => {} });
                break;

            case 'Escape':
                event.target.blur();
                break;
        }
    }

    /**
     * Get key string from event
     * @param {KeyboardEvent} event
     * @returns {string}
     */
    getKeyString(event) {
        const parts = [];

        if (event.ctrlKey) parts.push('ctrl');
        if (event.metaKey) parts.push('cmd');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');

        const key = event.key.toLowerCase();
        parts.push(key);

        return parts.join('+');
    }

    /**
     * Check if shortcut should be ignored
     * @param {KeyboardEvent} event
     * @param {string} key
     * @returns {boolean}
     */
    shouldIgnoreShortcut(event, key) {
        const target = event.target;
        const tagName = target.tagName.toLowerCase();

        // Always allow escape
        if (key === 'escape') return false;

        // Allow specific shortcuts in inputs
        const allowedInInputs = ['ctrl+k', 'cmd+k', 'ctrl+a', 'ctrl+d'];
        if (allowedInInputs.includes(key)) return false;

        // Ignore shortcuts when typing in inputs
        if (['input', 'textarea', 'select'].includes(tagName)) {
            return true;
        }

        // Ignore shortcuts when element is contenteditable
        if (target.contentEditable === 'true') {
            return true;
        }

        return false;
    }

    /**
     * Focus search input
     */
    focusSearchInput() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    /**
     * Handle escape key
     */
    handleEscape() {
        // Close any open modals
        this.uiManager.closeAllModals();

        // Clear focus from search input
        const searchInput = document.getElementById('search-input');
        if (searchInput && document.activeElement === searchInput) {
            searchInput.blur();
        }
    }

    /**
     * Handle enter key
     */
    handleEnter() {
        // If search input is focused, submit search
        const searchInput = document.getElementById('search-input');
        if (searchInput && document.activeElement === searchInput) {
            this.uiManager.handleSearchSubmit({ preventDefault: () => {} });
        }
    }

    /**
     * Select all engines
     */
    selectAllEngines() {
        const engineItems = document.querySelectorAll('.engine-item');
        engineItems.forEach(item => {
            if (!item.classList.contains('active')) {
                item.click();
            }
        });
    }

    /**
     * Deselect all engines
     */
    deselectAllEngines() {
        const engineItems = document.querySelectorAll('.engine-item.active');
        engineItems.forEach(item => {
            item.click();
        });
    }

    /**
     * Select engine by index
     * @param {number} index
     */
    selectEngineByIndex(index) {
        const engineItems = document.querySelectorAll('.engine-item');
        if (engineItems[index]) {
            engineItems[index].click();
        }
    }

    /**
     * Get all shortcuts for help display
     * @returns {Array}
     */
    getAllShortcuts() {
        return Array.from(this.shortcuts.values()).map(shortcut => ({
            key: shortcut.key,
            description: shortcut.description
        }));
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.isEnabled = true;
        console.log('⌨️ KeyboardManager: Enabled');
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.isEnabled = false;
        console.log('⌨️ KeyboardManager: Disabled');
    }

    /**
     * Check if keyboard shortcuts are enabled
     * @returns {boolean}
     */
    isShortcutsEnabled() {
        return this.isEnabled;
    }
}
