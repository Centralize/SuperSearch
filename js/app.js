/**
 * SuperSearch - Main Application Entry Point
 * 
 * This is the main application module that initializes and coordinates
 * all other modules in the SuperSearch application.
 * 
 * @author SuperSearch Team
 * @version 1.0.0
 */

// Import all required modules
import { DatabaseManager } from './modules/dbManager.js';
import { SearchEngineManager } from './modules/searchEngine.js';
import { SearchHandler } from './modules/searchHandler.js';
import { ConfigManager } from './modules/configManager.js';
import { UIManager } from './modules/uiManager.js';
import { NotificationManager } from './modules/notificationManager.js';
import { KeyboardManager } from './modules/keyboardManager.js';

/**
 * Main Application Class
 * Coordinates all application modules and manages the overall application state
 */
class SuperSearchApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.config = {
            version: '1.0.0',
            appName: 'SuperSearch',
            debug: false
        };
    }

    /**
     * Initialize the application
     * Sets up all modules and establishes their connections
     */
    async init() {
        try {
            console.log('🚀 Initializing SuperSearch Application...');
            
            // Show loading state
            this.showLoadingState();

            // Initialize core modules in order of dependency
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Initialize UI
            await this.initializeUI();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log('✅ SuperSearch Application initialized successfully');
            
            // Show welcome notification
            this.modules.notification.show('SuperSearch loaded successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize SuperSearch:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize all application modules
     */
    async initializeModules() {
        console.log('📦 Initializing modules...');
        
        // Initialize Database Manager first (other modules depend on it)
        this.modules.database = new DatabaseManager();
        await this.modules.database.init();
        
        // Initialize Notification Manager (needed for user feedback)
        this.modules.notification = new NotificationManager();
        
        // Initialize Search Engine Manager
        this.modules.searchEngine = new SearchEngineManager(this.modules.database);
        await this.modules.searchEngine.init();
        
        // Initialize Search Handler
        this.modules.search = new SearchHandler(this.modules.searchEngine);
        
        // Initialize Config Manager
        this.modules.config = new ConfigManager(this.modules.database);
        
        // Initialize UI Manager
        this.modules.ui = new UIManager({
            database: this.modules.database,
            searchEngine: this.modules.searchEngine,
            search: this.modules.search,
            config: this.modules.config,
            notification: this.modules.notification
        });
        
        // Initialize Keyboard Manager
        this.modules.keyboard = new KeyboardManager(this.modules.ui);
        
        console.log('✅ All modules initialized');
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
        
        // Handle before unload (save state)
        window.addEventListener('beforeunload', (event) => {
            this.onBeforeUnload(event);
        });
        
        // Handle errors
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason);
        });
        
        console.log('✅ Event listeners set up');
    }

    /**
     * Load initial application data
     */
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        try {
            // Load user preferences
            await this.modules.config.loadPreferences();
            
            // Ensure default search engines are available
            await this.modules.searchEngine.ensureDefaultEngines();
            
            // Load search history (if enabled)
            if (this.modules.config.getPreference('enableHistory', true)) {
                await this.modules.database.loadSearchHistory();
            }
            
            console.log('✅ Initial data loaded');
            
        } catch (error) {
            console.warn('⚠️ Some initial data could not be loaded:', error);
            // Don't throw here - app can still function with defaults
        }
    }

    /**
     * Initialize the user interface
     */
    async initializeUI() {
        console.log('🎨 Initializing UI...');
        
        // Initialize UI components
        await this.modules.ui.init();
        
        // Set up keyboard shortcuts
        this.modules.keyboard.init();
        
        // Focus on search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
        
        console.log('✅ UI initialized');
    }

    /**
     * Show loading state during initialization
     */
    showLoadingState() {
        const body = document.body;
        body.classList.add('loading');
        
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('app-loading')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'app-loading';
            loadingOverlay.className = 'uk-position-cover uk-flex uk-flex-center uk-flex-middle uk-background-default';
            loadingOverlay.innerHTML = `
                <div class="uk-text-center">
                    <div uk-spinner="ratio: 2"></div>
                    <p class="uk-margin-small-top">Loading SuperSearch...</p>
                </div>
            `;
            body.appendChild(loadingOverlay);
        }
    }

    /**
     * Hide loading state after initialization
     */
    hideLoadingState() {
        const body = document.body;
        body.classList.remove('loading');
        
        const loadingOverlay = document.getElementById('app-loading');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Hide loading state
        this.hideLoadingState();
        
        // Show error message to user
        const errorContainer = document.createElement('div');
        errorContainer.className = 'uk-alert-danger uk-margin';
        errorContainer.innerHTML = `
            <h3>Application Error</h3>
            <p>SuperSearch failed to initialize properly. Please refresh the page to try again.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <button class="uk-button uk-button-primary" onclick="location.reload()">
                Refresh Page
            </button>
        `;
        
        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(errorContainer, main.firstChild);
        }
    }

    /**
     * Handle global application errors
     */
    handleGlobalError(error) {
        console.error('Global error:', error);
        
        if (this.modules.notification) {
            this.modules.notification.show(
                'An unexpected error occurred. Please try refreshing the page.',
                'error'
            );
        }
    }

    /**
     * Handle page becoming hidden
     */
    onPageHidden() {
        console.log('📱 Page hidden - pausing non-essential operations');
        // Could pause timers, reduce polling, etc.
    }

    /**
     * Handle page becoming visible
     */
    onPageVisible() {
        console.log('📱 Page visible - resuming operations');
        // Could resume timers, refresh data, etc.
    }

    /**
     * Handle before page unload
     */
    onBeforeUnload(event) {
        // Save any pending data
        if (this.modules.config) {
            this.modules.config.savePreferences();
        }
        
        // Don't show confirmation dialog unless there's unsaved work
        // event.preventDefault();
        // event.returnValue = '';
    }

    /**
     * Get application information
     */
    getInfo() {
        return {
            name: this.config.appName,
            version: this.config.version,
            initialized: this.isInitialized,
            modules: Object.keys(this.modules)
        };
    }

    /**
     * Enable debug mode
     */
    enableDebug() {
        this.config.debug = true;
        console.log('🐛 Debug mode enabled');
        window.superSearch = this; // Expose for debugging
        window.uiManager = this.modules.ui; // Expose UI manager for onclick handlers
    }

    /**
     * Disable debug mode
     */
    disableDebug() {
        this.config.debug = false;
        console.log('🐛 Debug mode disabled');
        delete window.superSearch;
    }

    /**
     * Handle application errors
     */
    handleError(error, context = 'Application') {
        console.error(`❌ ${context} Error:`, error);

        // Check if it's a database-related error
        if (error.message && error.message.includes('index') && error.message.includes('not found')) {
            this.handleDatabaseError(error);
            return;
        }

        // Show user-friendly error message
        if (this.modules.notification) {
            this.modules.notification.error(`${context} error: ${error.message}`);
        }

        // In development, you might want to show more details
        if (this.config.debug) {
            console.trace('Error stack trace:', error);
        }
    }

    /**
     * Handle database-specific errors
     */
    async handleDatabaseError(error) {
        console.error('🗄️ Database Error:', error);

        if (this.modules.notification) {
            this.modules.notification.error('Database error detected. Attempting to fix...');
        }

        try {
            // Diagnose the database
            const diagnosis = await this.modules.database.diagnoseDatabase();
            console.log('📊 Database Diagnosis:', diagnosis);

            if (diagnosis.issues.length > 0) {
                console.warn('🔧 Database issues found:', diagnosis.issues);

                // Ask user if they want to reset the database
                const shouldReset = confirm(
                    'Database issues detected. Would you like to reset the database?\n\n' +
                    'This will:\n' +
                    '- Clear all data (search engines, history, settings)\n' +
                    '- Reload default search engines\n' +
                    '- Fix database structure issues\n\n' +
                    'Click OK to reset, Cancel to continue with potential issues.'
                );

                if (shouldReset) {
                    await this.resetDatabase();
                } else {
                    this.modules.notification.warning('Continuing with database issues. Some features may not work correctly.');
                }
            }

        } catch (diagError) {
            console.error('Failed to diagnose database:', diagError);
            this.modules.notification.error('Database error could not be resolved automatically.');
        }
    }

    /**
     * Reset the database and reinitialize
     */
    async resetDatabase() {
        try {
            this.modules.notification.info('Resetting database...');

            // Reset the database
            await this.modules.database.resetDatabase();

            // Reinitialize modules that depend on the database
            await this.modules.searchEngine.init();
            await this.modules.config.loadPreferences();

            // Reload the UI
            await this.modules.ui.loadSearchEngines();

            this.modules.notification.success('Database reset successfully! Default search engines have been restored.');

        } catch (error) {
            console.error('Failed to reset database:', error);
            this.modules.notification.error('Failed to reset database. Please refresh the page.');
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 DOM loaded, starting SuperSearch...');

    try {
        // Create and initialize the application
        const app = new SuperSearchApp();

        // Enable debug mode in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            app.enableDebug();
        }

        // Set up global error handlers
        window.addEventListener('error', (event) => {
            app.handleError(event.error, 'Global');
        });

        window.addEventListener('unhandledrejection', (event) => {
            app.handleError(event.reason, 'Promise');
            event.preventDefault(); // Prevent console error
        });

        // Initialize the application
        await app.init();

        // Expose app globally for debugging
        window.app = app;

    } catch (error) {
        console.error('❌ Failed to initialize SuperSearch:', error);

        // Show basic error message if notification system isn't available
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f8d7da;color:#721c24;padding:15px;border:1px solid #f5c6cb;border-radius:5px;z-index:9999;max-width:500px;';
        errorDiv.innerHTML = `
            <strong>SuperSearch Failed to Start</strong><br>
            Error: ${error.message}<br>
            <button onclick="location.reload()" style="margin-top:10px;padding:5px 10px;background:#dc3545;color:white;border:none;border-radius:3px;cursor:pointer;">
                Reload Page
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Export for potential external use
export { SuperSearchApp };
