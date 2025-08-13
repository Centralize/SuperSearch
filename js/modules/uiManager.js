/**
 * UI Manager Module
 *
 * Manages all user interface interactions and updates.
 * Handles event listeners, form interactions, modal management,
 * and dynamic content updates.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class UIManager {
    constructor(modules) {
        this.modules = modules;
        this.elements = {};
        this.eventListeners = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the UI Manager and set up event listeners
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('🎨 UIManager: Initializing...');

        try {
            // Cache DOM elements
            this.cacheElements();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize UI state
            await this.initializeUIState();

            this.isInitialized = true;
            console.log('✅ UIManager: Initialized successfully');

        } catch (error) {
            console.error('❌ UIManager: Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Search form elements
            searchForm: document.getElementById('search-form'),
            searchInput: document.getElementById('search-input'),
            searchAllBtn: document.getElementById('search-all-btn'),

            // Engine selection
            engineList: document.getElementById('engine-list'),
            manageEnginesBtn: document.getElementById('manage-engines-btn'),

            // Results section
            resultsSection: document.getElementById('results-section'),
            loadingState: document.getElementById('loading-state'),
            resultsNavTabs: document.getElementById('results-nav-tabs'),
            resultsContent: document.getElementById('results-content'),
            errorState: document.getElementById('error-state'),
            errorMessage: document.getElementById('error-message'),

            // Navigation buttons
            settingsBtn: document.getElementById('settings-btn'),
            historyBtn: document.getElementById('history-btn'),
            helpBtn: document.getElementById('help-btn'),

            // Modals
            settingsModal: document.getElementById('settings-modal'),
            historyModal: document.getElementById('history-modal'),
            addEngineModal: document.getElementById('add-engine-modal'),
            editEngineModal: document.getElementById('edit-engine-modal'),
            helpModal: document.getElementById('help-modal'),

            // Modal forms
            addEngineForm: document.getElementById('add-engine-form'),
            editEngineForm: document.getElementById('edit-engine-form'),

            // Notification container
            notificationContainer: document.getElementById('notification-container')
        };

        // Validate that required elements exist
        const requiredElements = [
            'searchForm', 'searchInput', 'engineList', 'resultsSection'
        ];

        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required element '${elementName}' not found in DOM`);
            }
        }
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Search form events
        this.addEventListener(this.elements.searchForm, 'submit', this.handleSearchSubmit.bind(this));
        this.addEventListener(this.elements.searchInput, 'input', this.handleSearchInput.bind(this));
        this.addEventListener(this.elements.searchAllBtn, 'click', this.handleSearchAll.bind(this));

        // Navigation events
        this.addEventListener(this.elements.settingsBtn, 'click', this.handleSettingsClick.bind(this));
        this.addEventListener(this.elements.historyBtn, 'click', this.handleHistoryClick.bind(this));
        this.addEventListener(this.elements.helpBtn, 'click', this.handleHelpClick.bind(this));
        this.addEventListener(this.elements.manageEnginesBtn, 'click', this.handleManageEnginesClick.bind(this));

        // Modal form events
        if (this.elements.addEngineForm) {
            this.addEventListener(this.elements.addEngineForm, 'submit', this.handleAddEngineSubmit.bind(this));
        }

        if (this.elements.editEngineForm) {
            this.addEventListener(this.elements.editEngineForm, 'submit', this.handleEditEngineSubmit.bind(this));
        }

        // Global keyboard events
        this.addEventListener(document, 'keydown', this.handleGlobalKeydown.bind(this));

        console.log('✅ UIManager: Event listeners set up');
    }

    /**
     * Add event listener and track it for cleanup
     */
    addEventListener(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
            this.eventListeners.push({ element, event, handler, options });
        }
    }

    /**
     * Initialize UI state
     */
    async initializeUIState() {
        // Initialize notification manager
        if (this.modules.notification) {
            this.modules.notification.init();
        }

        // Load and display search engines
        await this.loadSearchEngines();

        // Initialize tooltips
        this.initializeTooltips();

        // Set focus on search input
        if (this.elements.searchInput) {
            this.elements.searchInput.focus();
        }
    }

    /**
     * Initialize Bootstrap tooltips
     */
    initializeTooltips() {
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    // ========================================
    // Event Handlers
    // ========================================

    /**
     * Handle search form submission
     */
    async handleSearchSubmit(event) {
        event.preventDefault();

        const query = this.elements.searchInput.value.trim();
        if (!query) {
            this.modules.notification.warning('Please enter a search query');
            return;
        }

        await this.performSearch(query);
    }

    /**
     * Handle search input changes
     */
    handleSearchInput(event) {
        const query = event.target.value.trim();

        // Enable/disable search button based on input
        if (this.elements.searchAllBtn) {
            this.elements.searchAllBtn.disabled = !query;
        }

        // Could add real-time suggestions here in the future
    }

    /**
     * Handle search all button click
     */
    async handleSearchAll(event) {
        event.preventDefault();

        const query = this.elements.searchInput.value.trim();
        if (!query) {
            this.modules.notification.warning('Please enter a search query');
            return;
        }

        await this.performSearch(query, 'all');
    }

    /**
     * Handle settings button click
     */
    handleSettingsClick(event) {
        event.preventDefault();
        this.showModal('settings');
    }

    /**
     * Handle history button click
     */
    handleHistoryClick(event) {
        event.preventDefault();
        this.showModal('history');
    }

    /**
     * Handle help button click
     */
    handleHelpClick(event) {
        event.preventDefault();
        this.showModal('help');
    }

    /**
     * Handle manage engines button click
     */
    handleManageEnginesClick(event) {
        event.preventDefault();
        this.showModal('addEngine');
    }

    /**
     * Handle add engine form submission
     */
    async handleAddEngineSubmit(event) {
        event.preventDefault();
        // Implementation will be added in later tasks
        console.log('Add engine form submitted');
    }

    /**
     * Handle edit engine form submission
     */
    async handleEditEngineSubmit(event) {
        event.preventDefault();
        // Implementation will be added in later tasks
        console.log('Edit engine form submitted');
    }

    /**
     * Handle global keyboard events
     */
    handleGlobalKeydown(event) {
        // Escape key closes modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }

        // Ctrl/Cmd + K focuses search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
                this.elements.searchInput.select();
            }
        }
    }

    // ========================================
    // Search Functionality
    // ========================================

    /**
     * Perform search operation
     */
    async performSearch(query, mode = 'selected') {
        try {
            console.log(`🔍 Performing search: "${query}" (mode: ${mode})`);

            // Show loading state
            this.showLoadingState();

            // Get engines to search
            let engines;
            if (mode === 'all') {
                engines = await this.modules.database.getActiveEngines();
            } else {
                engines = this.getSelectedEngines();
            }

            if (engines.length === 0) {
                throw new Error('No search engines selected');
            }

            // Save to search history
            await this.modules.database.saveSearchHistory(query, engines);

            // Perform the search
            const results = await this.modules.search.search(query, engines);

            // Display results
            this.displaySearchResults(results, query);

            // Hide loading state
            this.hideLoadingState();

        } catch (error) {
            console.error('Search failed:', error);
            this.showError(error.message);
            this.hideLoadingState();
        }
    }

    /**
     * Get currently selected search engines
     */
    getSelectedEngines() {
        const selectedEngines = [];
        const engineItems = this.elements.engineList.querySelectorAll('.engine-item.active');

        engineItems.forEach(item => {
            const engineId = item.dataset.engineId;
            if (engineId) {
                selectedEngines.push({ id: engineId });
            }
        });

        return selectedEngines;
    }

    /**
     * Load and display search engines
     */
    async loadSearchEngines() {
        try {
            const engines = await this.modules.database.getAll('engines');
            this.displaySearchEngines(engines);
        } catch (error) {
            console.error('Failed to load search engines:', error);
            // Try to load default engines
            await this.loadDefaultEngines();
        }
    }

    /**
     * Load default search engines if none exist
     */
    async loadDefaultEngines() {
        try {
            // Load default engines from JSON file
            const response = await fetch('assets/data/default-engines.json');
            const data = await response.json();

            // Save engines to database
            for (const engine of data.engines) {
                try {
                    await this.modules.database.create('engines', engine);
                } catch (error) {
                    // Engine might already exist, ignore error
                }
            }

            // Display the engines
            this.displaySearchEngines(data.engines);

        } catch (error) {
            console.error('Failed to load default engines:', error);
            this.showError('Failed to load search engines');
        }
    }

    /**
     * Display search engines in the UI
     */
    displaySearchEngines(engines) {
        if (!this.elements.engineList) return;

        this.elements.engineList.innerHTML = '';

        engines.forEach(engine => {
            const engineElement = this.createEngineElement(engine);
            this.elements.engineList.appendChild(engineElement);
        });
    }

    /**
     * Create a search engine UI element
     */
    createEngineElement(engine) {
        const div = document.createElement('div');
        div.className = `engine-item ${engine.isActive ? 'active' : ''} ${engine.isDefault ? 'default' : ''}`;
        div.dataset.engineId = engine.id;

        div.innerHTML = `
            <img src="${engine.icon}" alt="${engine.name}" class="engine-icon" width="24" height="24">
            <span class="engine-name">${engine.name}</span>
            ${engine.isDefault ? '<span class="badge bg-success ms-1">Default</span>' : ''}
        `;

        // Add click handler for selection
        div.addEventListener('click', () => {
            this.toggleEngineSelection(div, engine);
        });

        return div;
    }

    /**
     * Toggle engine selection
     */
    toggleEngineSelection(element, engine) {
        element.classList.toggle('active');

        // Update visual feedback
        const isActive = element.classList.contains('active');
        console.log(`Engine ${engine.name} ${isActive ? 'selected' : 'deselected'}`);
    }

    // ========================================
    // Results Display
    // ========================================

    /**
     * Display search results
     */
    displaySearchResults(results, query) {
        if (!this.elements.resultsSection) return;

        // Show results section
        this.elements.resultsSection.classList.remove('d-none');

        // Update results heading
        const heading = this.elements.resultsSection.querySelector('#results-heading');
        if (heading) {
            heading.textContent = `Search Results for "${query}"`;
        }

        // Create tabs for each engine
        this.createResultsTabs(results);

        // Scroll to results
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Create tabs for search results
     */
    createResultsTabs(results) {
        if (!this.elements.resultsNavTabs || !this.elements.resultsContent) return;

        // Clear existing tabs
        this.elements.resultsNavTabs.innerHTML = '';
        this.elements.resultsContent.innerHTML = '';

        results.forEach((result, index) => {
            // Create tab
            const tabId = `results-tab-${index}`;
            const paneId = `results-pane-${index}`;

            const tab = document.createElement('li');
            tab.className = 'nav-item';
            tab.innerHTML = `
                <button class="nav-link ${index === 0 ? 'active' : ''}"
                        id="${tabId}"
                        data-bs-toggle="tab"
                        data-bs-target="#${paneId}"
                        type="button"
                        role="tab">
                    ${result.engine} (${result.results?.length || 0})
                </button>
            `;

            // Create tab pane
            const pane = document.createElement('div');
            pane.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
            pane.id = paneId;
            pane.innerHTML = this.createResultsContent(result);

            this.elements.resultsNavTabs.appendChild(tab);
            this.elements.resultsContent.appendChild(pane);
        });

        // Show tabs container
        const tabsContainer = document.getElementById('results-tabs');
        if (tabsContainer) {
            tabsContainer.classList.remove('d-none');
        }
    }

    /**
     * Create content for a results tab
     */
    createResultsContent(result) {
        if (result.error) {
            return `
                <div class="alert alert-danger">
                    <h5>Search Failed</h5>
                    <p>${result.error}</p>
                </div>
            `;
        }

        if (!result.results || result.results.length === 0) {
            return `
                <div class="alert alert-info">
                    <h5>No Results Found</h5>
                    <p>No results were found for this search engine.</p>
                </div>
            `;
        }

        // For now, just show that results would be displayed here
        return `
            <div class="alert alert-info">
                <h5>Search Results</h5>
                <p>Found ${result.results.length} results from ${result.engine}.</p>
                <p><small>Note: Actual result display will be implemented in later tasks.</small></p>
            </div>
        `;
    }

    // ========================================
    // Loading and Error States
    // ========================================

    /**
     * Show loading state
     */
    showLoadingState() {
        if (this.elements.loadingState) {
            this.elements.loadingState.classList.remove('d-none');
        }

        if (this.elements.resultsSection) {
            this.elements.resultsSection.classList.remove('d-none');
        }

        // Hide other states
        this.hideError();
        const tabsContainer = document.getElementById('results-tabs');
        if (tabsContainer) {
            tabsContainer.classList.add('d-none');
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        if (this.elements.loadingState) {
            this.elements.loadingState.classList.add('d-none');
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        if (this.elements.errorState && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorState.classList.remove('d-none');
        }

        if (this.elements.resultsSection) {
            this.elements.resultsSection.classList.remove('d-none');
        }

        // Hide other states
        this.hideLoadingState();
        const tabsContainer = document.getElementById('results-tabs');
        if (tabsContainer) {
            tabsContainer.classList.add('d-none');
        }
    }

    /**
     * Hide error state
     */
    hideError() {
        if (this.elements.errorState) {
            this.elements.errorState.classList.add('d-none');
        }
    }

    // ========================================
    // Modal Management
    // ========================================

    /**
     * Show a modal by name
     */
    showModal(modalName) {
        const modalElement = this.elements[`${modalName}Modal`];
        if (modalElement && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    /**
     * Hide a modal by name
     */
    hideModal(modalName) {
        const modalElement = this.elements[`${modalName}Modal`];
        if (modalElement && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }

    /**
     * Close all open modals
     */
    closeAllModals() {
        if (typeof bootstrap !== 'undefined') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modalElement => {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            });
        }
    }

    // ========================================
    // Notifications (Delegated to NotificationManager)
    // ========================================

    /**
     * Show a notification (delegates to notification manager)
     */
    showNotification(message, type = 'info', options = {}) {
        if (this.modules.notification) {
            return this.modules.notification.show(message, type, options);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    // ========================================
    // Cleanup
    // ========================================

    /**
     * Clean up event listeners and resources
     */
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            if (element) {
                element.removeEventListener(event, handler, options);
            }
        });

        this.eventListeners = [];
        this.elements = {};
        this.isInitialized = false;

        console.log('🎨 UIManager: Cleaned up');
    }
}
