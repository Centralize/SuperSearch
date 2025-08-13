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

        // Set up search debouncing
        this.setupSearchDebouncing();

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

        // History modal events
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            this.addEventListener(clearHistoryBtn, 'click', this.handleClearHistory.bind(this));
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
        this.setupSettingsModal();
        this.showModal('settings');
    }

    /**
     * Handle history button click
     */
    handleHistoryClick(event) {
        event.preventDefault();
        this.setupHistoryModal();
        this.showModal('history');
    }

    /**
     * Handle help button click
     */
    handleHelpClick(event) {
        event.preventDefault();
        this.setupHelpModal();
        this.showModal('help');
    }

    /**
     * Handle manage engines button click
     */
    handleManageEnginesClick(event) {
        event.preventDefault();
        this.setupAddEngineModal();
        this.showModal('addEngine');
    }

    /**
     * Handle add engine form submission
     */
    async handleAddEngineSubmit(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const engineData = {
                id: formData.get('engineId'),
                name: formData.get('engineName'),
                url: formData.get('engineUrl'),
                description: formData.get('engineDescription') || '',
                category: formData.get('engineCategory') || 'general',
                isActive: formData.get('engineActive') === 'on',
                isDefault: formData.get('engineDefault') === 'on'
            };

            // Validate form data
            const validation = this.validateEngineData(engineData);
            if (!validation.isValid) {
                this.showFormErrors('add-engine-form', validation.errors);
                return;
            }

            // Clear any existing errors
            this.clearFormErrors('add-engine-form');

            // Add engine through SearchEngineManager
            await this.modules.searchEngine.addEngine(engineData);

            // Show success notification
            this.modules.notification.success(`Search engine "${engineData.name}" added successfully!`);

            // Close modal
            this.hideModal('addEngine');

            // Refresh engine list
            await this.loadSearchEngines();

            // Reset form
            event.target.reset();

        } catch (error) {
            console.error('Failed to add engine:', error);
            this.modules.notification.error(`Failed to add engine: ${error.message}`);
        }
    }

    /**
     * Handle edit engine form submission
     */
    async handleEditEngineSubmit(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const originalId = formData.get('originalEngineId');
            const engineData = {
                id: formData.get('engineId'),
                name: formData.get('engineName'),
                url: formData.get('engineUrl'),
                description: formData.get('engineDescription') || '',
                category: formData.get('engineCategory') || 'general',
                isActive: formData.get('engineActive') === 'on',
                isDefault: formData.get('engineDefault') === 'on'
            };

            // Update engine through SearchEngineManager
            await this.modules.searchEngine.updateEngine(originalId, engineData);

            // Show success notification
            this.modules.notification.success(`Search engine "${engineData.name}" updated successfully!`);

            // Close modal
            this.hideModal('editEngine');

            // Refresh engine list
            await this.loadSearchEngines();

        } catch (error) {
            console.error('Failed to update engine:', error);
            this.modules.notification.error(`Failed to update engine: ${error.message}`);
        }
    }

    /**
     * Edit an engine
     */
    async editEngine(engineId) {
        try {
            const engine = await this.modules.searchEngine.getEngine(engineId);
            this.setupEditEngineModal(engine);
            this.showModal('editEngine');
        } catch (error) {
            console.error('Failed to load engine for editing:', error);
            this.modules.notification.error(`Failed to load engine: ${error.message}`);
        }
    }

    /**
     * Delete an engine with confirmation
     */
    async deleteEngine(engineId) {
        try {
            const engine = await this.modules.searchEngine.getEngine(engineId);

            // Show confirmation dialog
            const confirmed = confirm(`Are you sure you want to delete the search engine "${engine.name}"?\n\nThis action cannot be undone.`);

            if (confirmed) {
                await this.modules.searchEngine.deleteEngine(engineId);
                this.modules.notification.success(`Search engine "${engine.name}" deleted successfully!`);

                // Refresh engine list
                await this.loadSearchEngines();
            }

        } catch (error) {
            console.error('Failed to delete engine:', error);
            this.modules.notification.error(`Failed to delete engine: ${error.message}`);
        }
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

            // Open search results in new tabs
            this.modules.search.openSearchResults(results);

            // Display results summary
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
            <div class="d-flex align-items-center">
                <img src="${engine.icon}" alt="${engine.name}" class="engine-icon me-2" width="24" height="24"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0xNSAxNS02LTYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'">
                <div class="flex-grow-1">
                    <span class="engine-name">${engine.name}</span>
                    ${engine.isDefault ? '<span class="badge bg-success ms-1">Default</span>' : ''}
                    ${!engine.isActive ? '<span class="badge bg-secondary ms-1">Inactive</span>' : ''}
                </div>
                <div class="engine-actions ms-2">
                    <button type="button" class="btn btn-sm btn-outline-primary me-1"
                            onclick="event.stopPropagation(); window.uiManager.editEngine('${engine.id}')"
                            title="Edit Engine">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger"
                            onclick="event.stopPropagation(); window.uiManager.deleteEngine('${engine.id}')"
                            title="Delete Engine">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Add click handler for selection (on the main area, not buttons)
        div.addEventListener('click', (event) => {
            if (!event.target.closest('.engine-actions')) {
                this.toggleEngineSelection(div, engine);
            }
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
    // Modal Setup and Management
    // ========================================

    /**
     * Set up the add engine modal with form content
     */
    setupAddEngineModal() {
        const modalBody = this.elements.addEngineForm?.querySelector('.modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="mb-3">
                <label for="engineId" class="form-label">Engine ID *</label>
                <input type="text" class="form-control" id="engineId" name="engineId" required
                       pattern="[a-zA-Z0-9_-]+"
                       placeholder="e.g., custom-search"
                       title="Only letters, numbers, underscores, and hyphens allowed">
                <div class="form-text">Unique identifier for the search engine</div>
            </div>

            <div class="mb-3">
                <label for="engineName" class="form-label">Engine Name *</label>
                <input type="text" class="form-control" id="engineName" name="engineName" required
                       placeholder="e.g., Custom Search Engine">
                <div class="form-text">Display name for the search engine</div>
            </div>

            <div class="mb-3">
                <label for="engineUrl" class="form-label">Search URL Template *</label>
                <input type="url" class="form-control" id="engineUrl" name="engineUrl" required
                       placeholder="https://example.com/search?q={query}"
                       pattern="https?://.*\\{query\\}.*">
                <div class="form-text">URL template with {query} placeholder for search terms</div>
            </div>

            <div class="mb-3">
                <label for="engineDescription" class="form-label">Description</label>
                <textarea class="form-control" id="engineDescription" name="engineDescription" rows="2"
                          placeholder="Brief description of the search engine"></textarea>
            </div>

            <div class="mb-3">
                <label for="engineCategory" class="form-label">Category</label>
                <select class="form-select" id="engineCategory" name="engineCategory">
                    <option value="general">General Search</option>
                    <option value="academic">Academic</option>
                    <option value="specialized">Specialized</option>
                    <option value="privacy">Privacy-Focused</option>
                </select>
            </div>

            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="engineActive" name="engineActive" checked>
                    <label class="form-check-label" for="engineActive">
                        Active (available for searching)
                    </label>
                </div>
            </div>

            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="engineDefault" name="engineDefault">
                    <label class="form-check-label" for="engineDefault">
                        Set as default search engine
                    </label>
                </div>
            </div>
        `;

        // Set up real-time validation
        setTimeout(() => {
            this.setupRealTimeValidation('add-engine-form');
        }, 100);
    }

    /**
     * Set up the edit engine modal with form content
     */
    setupEditEngineModal(engine) {
        const modalBody = this.elements.editEngineForm?.querySelector('.modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <input type="hidden" name="originalEngineId" value="${engine.id}">

            <div class="mb-3">
                <label for="editEngineId" class="form-label">Engine ID *</label>
                <input type="text" class="form-control" id="editEngineId" name="engineId" required
                       pattern="[a-zA-Z0-9_-]+" value="${engine.id}"
                       title="Only letters, numbers, underscores, and hyphens allowed">
                <div class="form-text">Unique identifier for the search engine</div>
            </div>

            <div class="mb-3">
                <label for="editEngineName" class="form-label">Engine Name *</label>
                <input type="text" class="form-control" id="editEngineName" name="engineName" required
                       value="${engine.name}">
                <div class="form-text">Display name for the search engine</div>
            </div>

            <div class="mb-3">
                <label for="editEngineUrl" class="form-label">Search URL Template *</label>
                <input type="url" class="form-control" id="editEngineUrl" name="engineUrl" required
                       value="${engine.url}"
                       pattern="https?://.*\\{query\\}.*">
                <div class="form-text">URL template with {query} placeholder for search terms</div>
            </div>

            <div class="mb-3">
                <label for="editEngineDescription" class="form-label">Description</label>
                <textarea class="form-control" id="editEngineDescription" name="engineDescription" rows="2">${engine.description || ''}</textarea>
            </div>

            <div class="mb-3">
                <label for="editEngineCategory" class="form-label">Category</label>
                <select class="form-select" id="editEngineCategory" name="engineCategory">
                    <option value="general" ${engine.category === 'general' ? 'selected' : ''}>General Search</option>
                    <option value="academic" ${engine.category === 'academic' ? 'selected' : ''}>Academic</option>
                    <option value="specialized" ${engine.category === 'specialized' ? 'selected' : ''}>Specialized</option>
                    <option value="privacy" ${engine.category === 'privacy' ? 'selected' : ''}>Privacy-Focused</option>
                </select>
            </div>

            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="editEngineActive" name="engineActive" ${engine.isActive ? 'checked' : ''}>
                    <label class="form-check-label" for="editEngineActive">
                        Active (available for searching)
                    </label>
                </div>
            </div>

            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="editEngineDefault" name="engineDefault" ${engine.isDefault ? 'checked' : ''}>
                    <label class="form-check-label" for="editEngineDefault">
                        Set as default search engine
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Set up the settings modal with content
     */
    setupSettingsModal() {
        const settingsContent = document.getElementById('settings-content');
        if (!settingsContent) return;

        const preferences = this.modules.config.getAllPreferences();

        settingsContent.innerHTML = `
            <form id="settings-form">
                <div class="row">
                    <div class="col-md-6">
                        <h5>Search Preferences</h5>

                        <div class="mb-3">
                            <label for="defaultSearchMode" class="form-label">Default Search Mode</label>
                            <select class="form-select" id="defaultSearchMode" name="defaultSearchMode">
                                <option value="selected" ${preferences.defaultSearchMode === 'selected' ? 'selected' : ''}>Selected Engines Only</option>
                                <option value="all" ${preferences.defaultSearchMode === 'all' ? 'selected' : ''}>All Active Engines</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="openInNewTab" name="openInNewTab" ${preferences.openInNewTab ? 'checked' : ''}>
                                <label class="form-check-label" for="openInNewTab">
                                    Open search results in new tabs
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="autoSelectEngines" name="autoSelectEngines" ${preferences.autoSelectEngines ? 'checked' : ''}>
                                <label class="form-check-label" for="autoSelectEngines">
                                    Auto-select active engines on page load
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <h5>History & Privacy</h5>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="enableHistory" name="enableHistory" ${preferences.enableHistory ? 'checked' : ''}>
                                <label class="form-check-label" for="enableHistory">
                                    Enable search history
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="maxHistoryItems" class="form-label">Maximum history items</label>
                            <input type="number" class="form-control" id="maxHistoryItems" name="maxHistoryItems"
                                   value="${preferences.maxHistoryItems}" min="10" max="1000" step="10">
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="showNotifications" name="showNotifications" ${preferences.showNotifications ? 'checked' : ''}>
                                <label class="form-check-label" for="showNotifications">
                                    Show notifications
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="confirmDeletion" name="confirmDeletion" ${preferences.confirmDeletion ? 'checked' : ''}>
                                <label class="form-check-label" for="confirmDeletion">
                                    Confirm before deleting engines
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="row">
                    <div class="col-12">
                        <h5>Data Management</h5>

                        <div class="d-flex gap-2 flex-wrap">
                            <button type="button" class="btn btn-outline-primary" id="export-config-btn">
                                <i class="bi bi-download me-1"></i>
                                Export Configuration
                            </button>

                            <button type="button" class="btn btn-outline-secondary" id="import-config-btn">
                                <i class="bi bi-upload me-1"></i>
                                Import Configuration
                            </button>

                            <button type="button" class="btn btn-outline-warning" id="reset-settings-btn">
                                <i class="bi bi-arrow-clockwise me-1"></i>
                                Reset to Defaults
                            </button>

                            <button type="button" class="btn btn-outline-danger" id="clear-data-btn">
                                <i class="bi bi-trash me-1"></i>
                                Clear All Data
                            </button>
                        </div>

                        <input type="file" id="import-file-input" accept=".json" style="display: none;">
                    </div>
                </div>
            </form>
        `;

        // Set up event listeners for settings
        this.setupSettingsEventListeners();
    }

    /**
     * Set up the history modal with content
     */
    async setupHistoryModal() {
        const historyContent = document.getElementById('history-content');
        if (!historyContent) return;

        try {
            // Load search history
            const history = await this.modules.database.loadSearchHistory({ limit: 50 });

            if (history.length === 0) {
                historyContent.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-clock-history display-4 text-muted"></i>
                        <h5 class="mt-3">No Search History</h5>
                        <p class="text-muted">Your search history will appear here after you perform searches.</p>
                    </div>
                `;
                return;
            }

            historyContent.innerHTML = `
                <div class="mb-3">
                    <div class="input-group">
                        <input type="text" class="form-control" id="history-search" placeholder="Search history...">
                        <button class="btn btn-outline-secondary" type="button" id="clear-search">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>

                <div id="history-list" class="list-group" style="max-height: 400px; overflow-y: auto;">
                    ${history.map(item => this.createHistoryItem(item)).join('')}
                </div>

                <div class="mt-3 text-muted small">
                    <i class="bi bi-info-circle"></i>
                    Showing ${history.length} most recent searches
                </div>
            `;

            // Set up history search functionality
            this.setupHistorySearch(history);

        } catch (error) {
            console.error('Failed to load search history:', error);
            historyContent.innerHTML = `
                <div class="alert alert-danger">
                    <h6>Error Loading History</h6>
                    <p class="mb-0">Failed to load search history: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Create a history item element
     */
    createHistoryItem(historyItem) {
        const date = new Date(historyItem.timestamp);
        const timeAgo = this.getTimeAgo(date);
        const engines = Array.isArray(historyItem.engines) ? historyItem.engines : [];

        return `
            <div class="list-group-item list-group-item-action history-item" data-query="${historyItem.query}">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${this.escapeHtml(historyItem.query)}</h6>
                        <p class="mb-1 small text-muted">
                            <i class="bi bi-search me-1"></i>
                            Searched with: ${engines.join(', ') || 'Unknown engines'}
                        </p>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${timeAgo}
                        </small>
                    </div>
                    <div class="btn-group-vertical btn-group-sm">
                        <button type="button" class="btn btn-outline-primary btn-sm"
                                onclick="window.uiManager.repeatSearch('${this.escapeHtml(historyItem.query)}')"
                                title="Repeat Search">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm"
                                onclick="window.uiManager.deleteHistoryItem('${historyItem.id}')"
                                title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set up history search functionality
     */
    setupHistorySearch(allHistory) {
        const searchInput = document.getElementById('history-search');
        const clearBtn = document.getElementById('clear-search');
        const historyList = document.getElementById('history-list');

        if (!searchInput || !historyList) return;

        // Search functionality
        searchInput.addEventListener('input', (event) => {
            const query = event.target.value.toLowerCase();

            if (query === '') {
                // Show all history
                historyList.innerHTML = allHistory.map(item => this.createHistoryItem(item)).join('');
            } else {
                // Filter history
                const filtered = allHistory.filter(item =>
                    item.query.toLowerCase().includes(query)
                );

                if (filtered.length === 0) {
                    historyList.innerHTML = `
                        <div class="text-center py-3 text-muted">
                            <i class="bi bi-search"></i>
                            No matching searches found
                        </div>
                    `;
                } else {
                    historyList.innerHTML = filtered.map(item => this.createHistoryItem(item)).join('');
                }
            }
        });

        // Clear search
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                historyList.innerHTML = allHistory.map(item => this.createHistoryItem(item)).join('');
            });
        }
    }

    /**
     * Repeat a search from history
     */
    async repeatSearch(query) {
        // Close history modal
        this.hideModal('history');

        // Set search input
        if (this.elements.searchInput) {
            this.elements.searchInput.value = query;
        }

        // Perform search
        await this.performSearch(query);
    }

    /**
     * Delete a history item
     */
    async deleteHistoryItem(itemId) {
        try {
            await this.modules.database.delete('searchHistory', parseInt(itemId));
            this.modules.notification.success('History item deleted');

            // Refresh history modal
            this.setupHistoryModal();

        } catch (error) {
            console.error('Failed to delete history item:', error);
            this.modules.notification.error(`Failed to delete: ${error.message}`);
        }
    }

    /**
     * Handle clear history button click
     */
    async handleClearHistory(event) {
        event.preventDefault();

        const confirmed = confirm('Are you sure you want to clear all search history? This action cannot be undone.');

        if (confirmed) {
            try {
                await this.modules.database.clear('searchHistory');
                this.modules.notification.success('Search history cleared');

                // Refresh history modal
                this.setupHistoryModal();

            } catch (error) {
                console.error('Failed to clear history:', error);
                this.modules.notification.error(`Failed to clear history: ${error.message}`);
            }
        }
    }

    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
    // Form Validation
    // ========================================

    /**
     * Validate engine data
     * @param {Object} engineData - Engine data to validate
     * @returns {Object} Validation result
     */
    validateEngineData(engineData) {
        const errors = {};
        let isValid = true;

        // Validate ID
        if (!engineData.id || engineData.id.trim() === '') {
            errors.engineId = 'Engine ID is required';
            isValid = false;
        } else if (!/^[a-zA-Z0-9_-]+$/.test(engineData.id)) {
            errors.engineId = 'Engine ID can only contain letters, numbers, underscores, and hyphens';
            isValid = false;
        } else if (engineData.id.length < 2) {
            errors.engineId = 'Engine ID must be at least 2 characters long';
            isValid = false;
        } else if (engineData.id.length > 50) {
            errors.engineId = 'Engine ID must be less than 50 characters';
            isValid = false;
        }

        // Validate name
        if (!engineData.name || engineData.name.trim() === '') {
            errors.engineName = 'Engine name is required';
            isValid = false;
        } else if (engineData.name.length < 2) {
            errors.engineName = 'Engine name must be at least 2 characters long';
            isValid = false;
        } else if (engineData.name.length > 100) {
            errors.engineName = 'Engine name must be less than 100 characters';
            isValid = false;
        }

        // Validate URL
        if (!engineData.url || engineData.url.trim() === '') {
            errors.engineUrl = 'Search URL is required';
            isValid = false;
        } else {
            // Check if URL contains {query} placeholder
            if (!engineData.url.includes('{query}')) {
                errors.engineUrl = 'URL must contain {query} placeholder for search terms';
                isValid = false;
            } else {
                // Validate URL format
                try {
                    const testUrl = engineData.url.replace('{query}', 'test');
                    const url = new URL(testUrl);

                    // Must be HTTP or HTTPS
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        errors.engineUrl = 'URL must use HTTP or HTTPS protocol';
                        isValid = false;
                    }
                } catch (error) {
                    errors.engineUrl = 'Invalid URL format';
                    isValid = false;
                }
            }
        }

        // Validate description length
        if (engineData.description && engineData.description.length > 500) {
            errors.engineDescription = 'Description must be less than 500 characters';
            isValid = false;
        }

        return { isValid, errors };
    }

    /**
     * Show form validation errors
     * @param {string} formId - Form ID
     * @param {Object} errors - Validation errors
     */
    showFormErrors(formId, errors) {
        // Clear existing errors first
        this.clearFormErrors(formId);

        // Show new errors
        Object.entries(errors).forEach(([fieldName, errorMessage]) => {
            const field = document.querySelector(`#${formId} [name="${fieldName}"]`);
            if (field) {
                // Add error class to field
                field.classList.add('is-invalid');

                // Create or update error message
                let errorDiv = field.parentNode.querySelector('.invalid-feedback');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'invalid-feedback';
                    field.parentNode.appendChild(errorDiv);
                }
                errorDiv.textContent = errorMessage;
            }
        });
    }

    /**
     * Clear form validation errors
     * @param {string} formId - Form ID
     */
    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Remove error classes and messages
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });

        const errorMessages = form.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(msg => {
            msg.remove();
        });
    }

    /**
     * Set up real-time validation for a form
     * @param {string} formId - Form ID
     */
    setupRealTimeValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Add event listeners for real-time validation
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateSingleField(field);
            });

            field.addEventListener('input', () => {
                // Clear error on input
                if (field.classList.contains('is-invalid')) {
                    field.classList.remove('is-invalid');
                    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
                    if (errorDiv) {
                        errorDiv.remove();
                    }
                }
            });
        });
    }

    /**
     * Validate a single form field
     * @param {HTMLElement} field - Form field element
     */
    validateSingleField(field) {
        const fieldName = field.name;
        const fieldValue = field.value;

        // Create temporary engine data for validation
        const tempData = {};
        tempData[fieldName] = fieldValue;

        // Validate based on field type
        let error = null;

        switch (fieldName) {
            case 'engineId':
                if (!fieldValue.trim()) {
                    error = 'Engine ID is required';
                } else if (!/^[a-zA-Z0-9_-]+$/.test(fieldValue)) {
                    error = 'Only letters, numbers, underscores, and hyphens allowed';
                } else if (fieldValue.length < 2) {
                    error = 'Must be at least 2 characters long';
                } else if (fieldValue.length > 50) {
                    error = 'Must be less than 50 characters';
                }
                break;

            case 'engineName':
                if (!fieldValue.trim()) {
                    error = 'Engine name is required';
                } else if (fieldValue.length < 2) {
                    error = 'Must be at least 2 characters long';
                } else if (fieldValue.length > 100) {
                    error = 'Must be less than 100 characters';
                }
                break;

            case 'engineUrl':
                if (!fieldValue.trim()) {
                    error = 'Search URL is required';
                } else if (!fieldValue.includes('{query}')) {
                    error = 'Must contain {query} placeholder';
                } else {
                    try {
                        const testUrl = fieldValue.replace('{query}', 'test');
                        const url = new URL(testUrl);
                        if (!['http:', 'https:'].includes(url.protocol)) {
                            error = 'Must use HTTP or HTTPS protocol';
                        }
                    } catch {
                        error = 'Invalid URL format';
                    }
                }
                break;

            case 'engineDescription':
                if (fieldValue.length > 500) {
                    error = 'Must be less than 500 characters';
                }
                break;
        }

        // Show or clear error
        if (error) {
            field.classList.add('is-invalid');
            let errorDiv = field.parentNode.querySelector('.invalid-feedback');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                field.parentNode.appendChild(errorDiv);
            }
            errorDiv.textContent = error;
        } else {
            field.classList.remove('is-invalid');
            const errorDiv = field.parentNode.querySelector('.invalid-feedback');
            if (errorDiv) {
                errorDiv.remove();
            }
        }
    }

    // ========================================
    // Performance Optimizations
    // ========================================

    /**
     * Set up search input debouncing
     */
    setupSearchDebouncing() {
        if (!this.elements.searchInput) return;

        let debounceTimer;
        const debounceDelay = 300; // 300ms delay

        // Remove existing input listener and add debounced version
        this.elements.searchInput.removeEventListener('input', this.handleSearchInput.bind(this));

        this.elements.searchInput.addEventListener('input', (event) => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                this.handleSearchInput(event);
            }, debounceDelay);
        });
    }

    /**
     * Optimize DOM operations with batch updates
     */
    batchDOMUpdates(updates) {
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            updates.forEach(update => {
                if (typeof update === 'function') {
                    update();
                }
            });
        });
    }

    /**
     * Lazy load engine icons
     */
    lazyLoadEngineIcons() {
        const engineItems = document.querySelectorAll('.engine-item img');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            engineItems.forEach(img => {
                if (img.src && !img.dataset.src) {
                    img.dataset.src = img.src;
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0xNSAxNS02LTYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'; // Placeholder
                    imageObserver.observe(img);
                }
            });
        }
    }

    /**
     * Optimize database queries with caching
     */
    setupDatabaseOptimizations() {
        // Cache frequently accessed data
        this.cache = {
            engines: null,
            preferences: null,
            lastCacheTime: 0,
            cacheTimeout: 5 * 60 * 1000 // 5 minutes
        };
    }

    /**
     * Get cached data or fetch from database
     */
    async getCachedData(type, fetchFunction) {
        const now = Date.now();
        const cacheKey = type;

        // Check if cache is valid
        if (this.cache[cacheKey] &&
            (now - this.cache.lastCacheTime) < this.cache.cacheTimeout) {
            return this.cache[cacheKey];
        }

        // Fetch fresh data
        try {
            const data = await fetchFunction();
            this.cache[cacheKey] = data;
            this.cache.lastCacheTime = now;
            return data;
        } catch (error) {
            // Return cached data if available, even if stale
            if (this.cache[cacheKey]) {
                console.warn(`Using stale cache for ${type}:`, error);
                return this.cache[cacheKey];
            }
            throw error;
        }
    }

    /**
     * Clear cache
     */
    clearCache(type = null) {
        if (type) {
            this.cache[type] = null;
        } else {
            this.cache = {
                engines: null,
                preferences: null,
                lastCacheTime: 0,
                cacheTimeout: 5 * 60 * 1000
            };
        }
    }

    /**
     * Throttle function execution
     */
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;

        return function (...args) {
            const currentTime = Date.now();

            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    /**
     * Debounce function execution
     */
    debounce(func, delay) {
        let timeoutId;

        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // ========================================
    // Security Enhancements
    // ========================================

    /**
     * Sanitize input to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        // Basic XSS prevention
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate URL for security
     */
    isValidURL(url) {
        try {
            const urlObj = new URL(url);

            // Only allow HTTP and HTTPS
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }

            // Prevent localhost and private IPs in production
            const hostname = urlObj.hostname.toLowerCase();
            const privateIPs = [
                'localhost',
                '127.0.0.1',
                '0.0.0.0',
                '::1'
            ];

            if (privateIPs.includes(hostname)) {
                console.warn('Private/localhost URLs detected:', hostname);
                // Allow in development, warn in production
                return true; // For now, allow all
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate search engine configuration
     */
    validateEngineConfig(config) {
        const errors = [];

        // Required fields
        if (!config.id || typeof config.id !== 'string') {
            errors.push('Invalid engine ID');
        }

        if (!config.name || typeof config.name !== 'string') {
            errors.push('Invalid engine name');
        }

        if (!config.url || typeof config.url !== 'string') {
            errors.push('Invalid engine URL');
        }

        // URL validation
        if (config.url && !this.isValidURL(config.url.replace('{query}', 'test'))) {
            errors.push('Invalid URL format');
        }

        // Query placeholder validation
        if (config.url && !config.url.includes('{query}')) {
            errors.push('URL must contain {query} placeholder');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
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
