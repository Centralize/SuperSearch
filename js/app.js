/**
 * SuperSearch - Main Application Controller
 * Coordinates all application components and handles UI interactions
 */

class SuperSearchApp {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.engineManager = new SearchEngineManager(this.dbManager);
        this.searchHandler = new SearchHandler(this.engineManager, this.dbManager);
        this.configManager = new ConfigManager(this.dbManager, this.engineManager);
        
        this.isInitialized = false;
        this.currentSearch = null;
        
        // UI element references
        this.elements = {};
        
        // Debounced functions
        this.debouncedSearch = Utils.debounce(this.handleSearch.bind(this), 300);
        this.debouncedSuggestions = Utils.debounce(this.updateSearchSuggestions.bind(this), 200);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading state
            this.showLoading('Initializing SuperSearch...');

            // Initialize components
            await this.dbManager.initDb();
            await this.engineManager.init();
            
            // Initialize UI
            this.initializeElements();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            
            // Load user preferences
            await this.loadPreferences();
            
            // Initialize search engines UI
            await this.updateEngineSelection();
            
            // Hide loading state
            this.hideLoading();
            
            this.isInitialized = true;
            
            // Focus search input
            this.elements.searchInput?.focus();
            
            Utils.showNotification('SuperSearch initialized successfully', 'success');

        } catch (error) {
            Utils.logError(error, 'Application initialization failed');
            this.showError('Failed to initialize SuperSearch. Please refresh the page.');
        }
    }

    /**
     * Initialize UI element references
     */
    initializeElements() {
        this.elements = {
            // Search elements
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            searchForm: document.querySelector('.search-form'),
            
            // Engine selection
            engineSelection: document.querySelector('.engine-selection'),
            googleEngine: document.getElementById('googleEngine'),
            duckduckgoEngine: document.getElementById('duckduckgoEngine'),
            bingEngine: document.getElementById('bingEngine'),
            
            // Results
            resultsSection: document.getElementById('resultsSection'),
            resultsTabs: document.getElementById('resultsTabs'),
            resultsContent: document.getElementById('results-content'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            noResults: document.getElementById('noResults'),
            
            // Navigation buttons
            settingsBtn: document.getElementById('settingsBtn'),
            historyBtn: document.getElementById('historyBtn'),
            helpBtn: document.getElementById('helpBtn'),
            manageEnginesBtn: document.getElementById('manageEnginesBtn'),
            importConfigBtn: document.getElementById('importConfigBtn'),
            exportConfigBtn: document.getElementById('exportConfigBtn'),
            
            // Modals
            settingsModal: document.getElementById('settingsModal'),
            manageEnginesModal: document.getElementById('manageEnginesModal'),
            engineFormModal: document.getElementById('engineFormModal'),
            historyModal: document.getElementById('historyModal'),
            helpModal: document.getElementById('helpModal'),
            
            // Settings form
            defaultEngine: document.getElementById('defaultEngine'),
            resultsPerPage: document.getElementById('resultsPerPage'),
            openInNewTab: document.getElementById('openInNewTab'),
            enableHistory: document.getElementById('enableHistory'),
            saveSettings: document.getElementById('saveSettings'),
            
            // Engine management
            enginesList: document.getElementById('enginesList'),
            addEngineBtn: document.getElementById('addEngineBtn'),
            engineForm: document.getElementById('engineForm'),
            engineFormTitle: document.getElementById('engineFormTitle'),
            engineName: document.getElementById('engineName'),
            engineUrl: document.getElementById('engineUrl'),
            engineIcon: document.getElementById('engineIcon'),
            engineColor: document.getElementById('engineColor'),
            engineEnabled: document.getElementById('engineEnabled'),
            saveEngine: document.getElementById('saveEngine'),
            
            // History
            historyList: document.getElementById('historyList'),
            clearHistory: document.getElementById('clearHistory'),
            
            // File input
            importFileInput: document.getElementById('importFileInput')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search form
        if (this.elements.searchForm) {
            this.elements.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                this.debouncedSuggestions();
            });
        }

        // Engine checkboxes
        this.setupEngineCheckboxListeners();

        // Navigation buttons
        this.elements.settingsBtn?.addEventListener('click', () => this.openSettingsModal());
        this.elements.historyBtn?.addEventListener('click', () => this.openHistoryModal());
        this.elements.helpBtn?.addEventListener('click', () => this.openHelpModal());
        this.elements.manageEnginesBtn?.addEventListener('click', () => this.openManageEnginesModal());
        this.elements.exportConfigBtn?.addEventListener('click', () => this.exportConfiguration());
        this.elements.importConfigBtn?.addEventListener('click', () => this.importConfiguration());

        // Settings
        this.elements.saveSettings?.addEventListener('click', () => this.saveSettings());

        // Engine management
        this.elements.addEngineBtn?.addEventListener('click', () => this.openAddEngineModal());
        this.elements.saveEngine?.addEventListener('click', () => this.saveEngine());

        // History
        this.elements.clearHistory?.addEventListener('click', () => this.clearSearchHistory());

        // File import
        this.elements.importFileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileImport(e.target.files[0]);
            }
        });

        // Search result events
        document.addEventListener('searchResult', (e) => this.handleSearchResult(e));
        document.addEventListener('searchComplete', (e) => this.handleSearchComplete(e));
    }

    /**
     * Set up engine checkbox listeners
     */
    setupEngineCheckboxListeners() {
        const checkboxes = ['googleEngine', 'duckduckgoEngine', 'bingEngine'];
        checkboxes.forEach(id => {
            const checkbox = this.elements[id];
            if (checkbox) {
                checkbox.addEventListener('change', () => this.updateActiveEngines());
            }
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key - close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + K - focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.elements.searchInput?.focus();
            }
            
            // Ctrl/Cmd + Enter - search all engines
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.searchAllEngines();
            }
        });
    }

    /**
     * Handle search form submission
     */
    async handleSearch() {
        try {
            const query = this.elements.searchInput?.value?.trim();
            if (!query) {
                Utils.showNotification('Please enter a search query', 'warning');
                return;
            }

            // Validate query
            const validation = this.searchHandler.validateQuery(query);
            if (!validation.valid) {
                Utils.showNotification(validation.errors.join(', '), 'danger');
                return;
            }

            // Show warnings if any
            if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    Utils.showNotification(warning, 'warning');
                });
            }

            // Get active engines
            const activeEngines = this.getSelectedEngines();
            if (activeEngines.length === 0) {
                Utils.showNotification('Please select at least one search engine', 'warning');
                return;
            }

            // Start search
            this.showSearchResults();
            this.showLoadingIndicator();
            
            this.currentSearch = await this.searchHandler.searchMultiple(query, activeEngines.map(e => e.id));
            
        } catch (error) {
            Utils.logError(error, 'Search failed');
            Utils.showNotification('Search failed: ' + error.message, 'danger');
            this.hideLoadingIndicator();
        }
    }

    /**
     * Handle individual search result
     */
    handleSearchResult(event) {
        const { searchId, engineId, result } = event.detail;
        
        if (this.currentSearch?.searchId !== searchId) {
            return; // Ignore outdated results
        }

        this.addSearchResultTab(result);
    }

    /**
     * Handle search completion
     */
    handleSearchComplete(event) {
        const { searchId, summary } = event.detail;
        
        if (this.currentSearch?.searchId !== searchId) {
            return; // Ignore outdated results
        }

        this.hideLoadingIndicator();
        
        if (summary.successful === 0) {
            this.showNoResults();
        }
        
        const message = `Search completed: ${summary.successful} successful, ${summary.failed} failed`;
        Utils.showNotification(message, summary.failed > 0 ? 'warning' : 'success');
    }

    /**
     * Get currently selected search engines
     */
    getSelectedEngines() {
        const selected = [];
        const engines = this.engineManager.getEnabledEngines();
        
        engines.forEach(engine => {
            const checkbox = document.getElementById(`${engine.id}Engine`);
            if (checkbox?.checked) {
                selected.push(engine);
            }
        });
        
        return selected;
    }

    /**
     * Update active engines based on selection
     */
    updateActiveEngines() {
        const selectedEngines = this.getSelectedEngines();
        this.engineManager.setActiveEngines(selectedEngines.map(e => e.id));
    }

    /**
     * Search all enabled engines
     */
    async searchAllEngines() {
        // Check all engine checkboxes
        const engines = this.engineManager.getEnabledEngines();
        engines.forEach(engine => {
            const checkbox = document.getElementById(`${engine.id}Engine`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        this.updateActiveEngines();
        await this.handleSearch();
    }

    /**
     * Update engine selection UI
     */
    async updateEngineSelection() {
        try {
            const engines = this.engineManager.getEnabledEngines();
            const container = this.elements.engineSelection?.querySelector('.uk-grid');
            
            if (!container) return;

            // Clear existing checkboxes (except default ones)
            const existingCustom = container.querySelectorAll('[data-custom="true"]');
            existingCustom.forEach(el => el.remove());

            // Add custom engines
            engines.forEach(engine => {
                if (!['google', 'duckduckgo', 'bing'].includes(engine.id)) {
                    this.addEngineCheckbox(container, engine);
                }
            });

            // Update default engine selection
            await this.updateDefaultEngineSelect();

        } catch (error) {
            Utils.logError(error, 'Failed to update engine selection');
        }
    }

    /**
     * Add engine checkbox to selection UI
     */
    addEngineCheckbox(container, engine) {
        const div = document.createElement('div');
        div.setAttribute('data-custom', 'true');
        
        div.innerHTML = `
            <label class="engine-checkbox">
                <input class="uk-checkbox" type="checkbox" id="${engine.id}Engine" checked>
                <span class="uk-margin-small-left">${Utils.sanitizeHtml(engine.name)}</span>
            </label>
        `;
        
        container.appendChild(div);
        
        // Add event listener
        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', () => this.updateActiveEngines());
    }

    /**
     * Update default engine select options
     */
    async updateDefaultEngineSelect() {
        const select = this.elements.defaultEngine;
        if (!select) return;

        const engines = this.engineManager.getAllEngines();
        const currentDefault = this.engineManager.getDefaultEngine();

        // Clear and rebuild options
        select.innerHTML = '';
        
        engines.forEach(engine => {
            const option = document.createElement('option');
            option.value = engine.id;
            option.textContent = engine.name;
            option.selected = engine.id === currentDefault?.id;
            select.appendChild(option);
        });
    }

    /**
     * Show search results section
     */
    showSearchResults() {
        this.elements.resultsSection?.classList.remove('uk-hidden');
        this.elements.noResults?.classList.add('uk-hidden');
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        this.elements.loadingIndicator?.classList.remove('uk-hidden');
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        this.elements.loadingIndicator?.classList.add('uk-hidden');
    }

    /**
     * Show no results message
     */
    showNoResults() {
        this.elements.noResults?.classList.remove('uk-hidden');
        this.elements.loadingIndicator?.classList.add('uk-hidden');
    }

    /**
     * Add search result tab
     */
    addSearchResultTab(result) {
        if (!this.elements.resultsTabs || !this.elements.resultsContent) return;

        // Create tab
        const tabId = `tab-${result.engineId}`;
        const tab = document.createElement('li');
        tab.innerHTML = `<a href="#${tabId}">${Utils.sanitizeHtml(result.engineName)}</a>`;
        this.elements.resultsTabs.appendChild(tab);

        // Create content
        const content = document.createElement('div');
        content.id = tabId;
        content.className = 'result-content';

        if (result.status === 'ready') {
            content.innerHTML = `
                <div class="uk-text-center uk-padding">
                    <h3>Search on ${Utils.sanitizeHtml(result.engineName)}</h3>
                    <p class="uk-text-muted">Query: "${Utils.sanitizeHtml(result.query)}"</p>
                    <a href="${result.url}" target="_blank" class="uk-button uk-button-primary">
                        <span uk-icon="external-link"></span>
                        <span class="uk-margin-small-left">Open Search Results</span>
                    </a>
                </div>
            `;
        } else if (result.status === 'error') {
            content.innerHTML = `
                <div class="uk-text-center uk-padding">
                    <h3>Error - ${Utils.sanitizeHtml(result.engineName)}</h3>
                    <p class="uk-text-danger">${Utils.sanitizeHtml(result.error)}</p>
                </div>
            `;
        }

        this.elements.resultsContent.appendChild(content);

        // Initialize UIKit tab if first tab
        if (this.elements.resultsTabs.children.length === 1) {
            UIkit.tab(this.elements.resultsTabs);
        }
    }

    /**
     * Clear search results
     */
    clearSearchResults() {
        if (this.elements.resultsTabs) {
            this.elements.resultsTabs.innerHTML = '';
        }
        if (this.elements.resultsContent) {
            this.elements.resultsContent.innerHTML = '';
        }
    }

    /**
     * Update search suggestions
     */
    async updateSearchSuggestions() {
        // Implementation would go here for autocomplete suggestions
        // For now, this is a placeholder
    }

    /**
     * Load user preferences and apply them
     */
    async loadPreferences() {
        try {
            const preferences = await this.dbManager.getPreferences();
            
            // Apply preferences to UI
            if (this.elements.defaultEngine) {
                this.elements.defaultEngine.value = preferences.defaultEngine || 'google';
            }
            if (this.elements.resultsPerPage) {
                this.elements.resultsPerPage.value = preferences.resultsPerPage || 10;
            }
            if (this.elements.openInNewTab) {
                this.elements.openInNewTab.checked = preferences.openInNewTab !== false;
            }
            if (this.elements.enableHistory) {
                this.elements.enableHistory.checked = preferences.enableHistory !== false;
            }

        } catch (error) {
            Utils.logError(error, 'Failed to load preferences');
        }
    }

    /**
     * Save user preferences
     */
    async saveSettings() {
        try {
            const preferences = {
                defaultEngine: this.elements.defaultEngine?.value || 'google',
                resultsPerPage: parseInt(this.elements.resultsPerPage?.value) || 10,
                openInNewTab: this.elements.openInNewTab?.checked !== false,
                enableHistory: this.elements.enableHistory?.checked !== false
            };

            await this.dbManager.updatePreferences(preferences);
            
            // Set default engine
            if (preferences.defaultEngine) {
                await this.engineManager.setDefault(preferences.defaultEngine);
            }

            Utils.showNotification('Settings saved successfully', 'success');
            UIkit.modal(this.elements.settingsModal).hide();

        } catch (error) {
            Utils.logError(error, 'Failed to save settings');
            Utils.showNotification('Failed to save settings', 'danger');
        }
    }

    /**
     * Open settings modal
     */
    async openSettingsModal() {
        await this.loadPreferences();
        await this.updateDefaultEngineSelect();
        UIkit.modal(this.elements.settingsModal).show();
    }

    /**
     * Open manage engines modal
     */
    async openManageEnginesModal() {
        await this.updateEnginesList();
        UIkit.modal(this.elements.manageEnginesModal).show();
    }

    /**
     * Update engines list in management modal
     */
    async updateEnginesList() {
        const container = this.elements.enginesList;
        if (!container) return;

        try {
            const engines = this.engineManager.getAllEngines();
            container.innerHTML = '';

            if (engines.length === 0) {
                container.innerHTML = '<p class="uk-text-muted uk-text-center">No search engines configured</p>';
                return;
            }

            engines.forEach(engine => {
                const engineElement = this.createEngineListItem(engine);
                container.appendChild(engineElement);
            });

        } catch (error) {
            Utils.logError(error, 'Failed to update engines list');
        }
    }

    /**
     * Create engine list item
     */
    createEngineListItem(engine) {
        const div = document.createElement('div');
        div.className = 'engine-item';
        div.innerHTML = `
            <div class="engine-info">
                <div class="engine-icon" style="background-color: ${engine.color}">
                    ${engine.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="engine-name">${Utils.sanitizeHtml(engine.name)}${engine.isDefault ? ' (Default)' : ''}</p>
                    <p class="engine-url text-truncate">${Utils.sanitizeHtml(engine.url)}</p>
                </div>
            </div>
            <div class="engine-actions">
                <button class="uk-button uk-button-small uk-button-default" onclick="app.editEngine('${engine.id}')">
                    <span uk-icon="pencil"></span>
                </button>
                <button class="uk-button uk-button-small uk-button-danger" onclick="app.deleteEngine('${engine.id}')">
                    <span uk-icon="trash"></span>
                </button>
            </div>
        `;
        return div;
    }

    /**
     * Open add engine modal
     */
    openAddEngineModal() {
        this.resetEngineForm();
        this.elements.engineFormTitle.textContent = 'Add Search Engine';
        this.currentEditingEngine = null;
        UIkit.modal(this.elements.engineFormModal).show();
    }

    /**
     * Edit engine
     */
    async editEngine(engineId) {
        try {
            const engine = this.engineManager.getEngine(engineId);
            if (!engine) {
                Utils.showNotification('Engine not found', 'danger');
                return;
            }

            this.populateEngineForm(engine);
            this.elements.engineFormTitle.textContent = 'Edit Search Engine';
            this.currentEditingEngine = engine;
            UIkit.modal(this.elements.engineFormModal).show();

        } catch (error) {
            Utils.logError(error, 'Failed to edit engine');
            Utils.showNotification('Failed to edit engine', 'danger');
        }
    }

    /**
     * Delete engine with confirmation
     */
    async deleteEngine(engineId) {
        try {
            const engine = this.engineManager.getEngine(engineId);
            if (!engine) {
                Utils.showNotification('Engine not found', 'danger');
                return;
            }

            if (confirm(`Are you sure you want to delete "${engine.name}"?`)) {
                await this.engineManager.deleteEngine(engineId);
                await this.updateEnginesList();
                await this.updateEngineSelection();
            }

        } catch (error) {
            Utils.logError(error, 'Failed to delete engine');
            Utils.showNotification('Failed to delete engine', 'danger');
        }
    }

    /**
     * Save engine (add or edit)
     */
    async saveEngine() {
        try {
            const engineData = {
                name: this.elements.engineName?.value?.trim(),
                url: this.elements.engineUrl?.value?.trim(),
                icon: this.elements.engineIcon?.value?.trim(),
                color: this.elements.engineColor?.value || '#4285f4',
                enabled: this.elements.engineEnabled?.checked !== false
            };

            // Validate required fields
            if (!engineData.name || !engineData.url) {
                Utils.showNotification('Name and URL are required', 'danger');
                return;
            }

            if (this.currentEditingEngine) {
                // Edit existing engine
                await this.engineManager.modifyEngine(this.currentEditingEngine.id, engineData);
            } else {
                // Add new engine
                await this.engineManager.addEngine(engineData);
            }

            UIkit.modal(this.elements.engineFormModal).hide();
            await this.updateEnginesList();
            await this.updateEngineSelection();

        } catch (error) {
            Utils.logError(error, 'Failed to save engine');
            Utils.showNotification('Failed to save engine: ' + error.message, 'danger');
        }
    }

    /**
     * Reset engine form
     */
    resetEngineForm() {
        if (this.elements.engineName) this.elements.engineName.value = '';
        if (this.elements.engineUrl) this.elements.engineUrl.value = '';
        if (this.elements.engineIcon) this.elements.engineIcon.value = '';
        if (this.elements.engineColor) this.elements.engineColor.value = '#4285f4';
        if (this.elements.engineEnabled) this.elements.engineEnabled.checked = true;
    }

    /**
     * Populate engine form with existing data
     */
    populateEngineForm(engine) {
        if (this.elements.engineName) this.elements.engineName.value = engine.name || '';
        if (this.elements.engineUrl) this.elements.engineUrl.value = engine.url || '';
        if (this.elements.engineIcon) this.elements.engineIcon.value = engine.icon || '';
        if (this.elements.engineColor) this.elements.engineColor.value = engine.color || '#4285f4';
        if (this.elements.engineEnabled) this.elements.engineEnabled.checked = engine.enabled !== false;
    }

    /**
     * Open history modal
     */
    async openHistoryModal() {
        await this.updateHistoryList();
        UIkit.modal(this.elements.historyModal).show();
    }

    /**
     * Update history list
     */
    async updateHistoryList() {
        const container = this.elements.historyList;
        if (!container) return;

        try {
            const history = await this.dbManager.getSearchHistory(50);
            container.innerHTML = '';

            if (history.length === 0) {
                container.innerHTML = '<p class="uk-text-muted uk-text-center">No search history</p>';
                return;
            }

            history.forEach(item => {
                const historyElement = this.createHistoryItem(item);
                container.appendChild(historyElement);
            });

        } catch (error) {
            Utils.logError(error, 'Failed to update history list');
        }
    }

    /**
     * Create history item element
     */
    createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-query">${Utils.sanitizeHtml(item.query)}</div>
            <div class="history-meta">${Utils.formatDate(item.timestamp)} • ${Utils.sanitizeHtml(item.engine)}</div>
        `;

        div.addEventListener('click', () => {
            this.elements.searchInput.value = item.query;
            UIkit.modal(this.elements.historyModal).hide();
            this.elements.searchInput.focus();
        });

        return div;
    }

    /**
     * Clear search history
     */
    async clearSearchHistory() {
        try {
            if (confirm('Are you sure you want to clear all search history?')) {
                await this.dbManager.clearSearchHistory();
                await this.updateHistoryList();
                Utils.showNotification('Search history cleared', 'success');
            }
        } catch (error) {
            Utils.logError(error, 'Failed to clear history');
            Utils.showNotification('Failed to clear history', 'danger');
        }
    }

    /**
     * Open help modal
     */
    openHelpModal() {
        UIkit.modal(this.elements.helpModal).show();
    }

    /**
     * Export configuration
     */
    async exportConfiguration() {
        try {
            await this.configManager.downloadConfig(false);
        } catch (error) {
            Utils.logError(error, 'Export failed');
        }
    }

    /**
     * Import configuration
     */
    importConfiguration() {
        this.elements.importFileInput?.click();
    }

    /**
     * Handle file import
     */
    async handleFileImport(file) {
        try {
            const options = {
                replaceEngines: confirm('Replace existing search engines?'),
                replacePreferences: confirm('Replace existing preferences?')
            };

            await this.configManager.uploadConfig(file, options);
            
            // Refresh UI
            await this.updateEngineSelection();
            await this.loadPreferences();

        } catch (error) {
            Utils.logError(error, 'Import failed');
        } finally {
            // Reset file input
            this.elements.importFileInput.value = '';
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = ['settingsModal', 'manageEnginesModal', 'engineFormModal', 'historyModal', 'helpModal'];
        modals.forEach(modalId => {
            const modal = this.elements[modalId];
            if (modal) {
                UIkit.modal(modal).hide();
            }
        });
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        // Implementation would show a loading overlay
        console.log(message);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Implementation would hide loading overlay
    }

    /**
     * Show error message
     */
    showError(message) {
        Utils.showNotification(message, 'danger');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SuperSearchApp();
    app.init().catch(error => {
        console.error('Failed to initialize SuperSearch:', error);
        Utils.showNotification('Failed to initialize SuperSearch. Please refresh the page.', 'danger');
    });
});