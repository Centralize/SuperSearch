/**
 * SuperSearch - Search Engine Manager
 * Handles search engine management operations
 */

class SearchEngineManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.engines = [];
        this.defaultEngine = null;
        this.activeEngines = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the search engine manager
     * @returns {Promise<void>}
     */
    async init() {
        try {
            await this.dbManager.initDb();
            await this.loadEngines();
            
            // If no engines exist, load defaults
            if (this.engines.length === 0) {
                await this.loadDefaultEngines();
            }
            
            this.isInitialized = true;
        } catch (error) {
            Utils.logError(error, 'Failed to initialize SearchEngineManager');
            throw error;
        }
    }

    /**
     * Load engines from database
     * @returns {Promise<void>}
     */
    async loadEngines() {
        try {
            this.engines = await this.dbManager.getAllEngines();
            this.updateActiveEngines();
            this.updateDefaultEngine();
        } catch (error) {
            Utils.logError(error, 'Failed to load engines');
            this.engines = [];
        }
    }

    /**
     * Load default engines from configuration file
     * @returns {Promise<void>}
     */
    async loadDefaultEngines() {
        try {
            const response = await fetch('data/default-engines.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const config = await response.json();
            
            if (config.engines && Array.isArray(config.engines)) {
                for (const engineConfig of config.engines) {
                    await this.addEngine(engineConfig);
                }
                
                // Load default preferences if available
                if (config.preferences) {
                    await this.dbManager.updatePreferences(config.preferences);
                }
                
                Utils.showNotification('Default search engines loaded successfully', 'success');
            }
        } catch (error) {
            Utils.logError(error, 'Failed to load default engines');
            Utils.showNotification('Failed to load default engines', 'warning');
        }
    }

    /**
     * Add new search engine
     * @param {Object} engineConfig - Engine configuration
     * @returns {Promise<string>} Engine ID
     */
    async addEngine(engineConfig) {
        try {
            // Validate engine configuration
            if (!this.validateEngineConfig(engineConfig)) {
                throw new Error('Invalid engine configuration');
            }

            // Check for duplicate names or URLs
            const existingEngine = this.engines.find(engine => 
                engine.name.toLowerCase() === engineConfig.name.toLowerCase() ||
                engine.url === engineConfig.url
            );

            if (existingEngine) {
                throw new Error('Search engine with this name or URL already exists');
            }

            // Add to database
            const engineId = await this.dbManager.addEngine(engineConfig);
            
            // Reload engines to update local cache
            await this.loadEngines();
            
            Utils.showNotification(`Added search engine: ${engineConfig.name}`, 'success');
            return engineId;
        } catch (error) {
            Utils.logError(error, 'Failed to add engine');
            Utils.showNotification(`Failed to add engine: ${error.message}`, 'danger');
            throw error;
        }
    }

    /**
     * Update existing search engine
     * @param {string} id - Engine ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<void>}
     */
    async modifyEngine(id, updates) {
        try {
            const existingEngine = this.engines.find(engine => engine.id === id);
            if (!existingEngine) {
                throw new Error('Search engine not found');
            }

            // Validate updates
            const updatedEngine = { ...existingEngine, ...updates };
            if (!this.validateEngineConfig(updatedEngine)) {
                throw new Error('Invalid engine configuration');
            }

            // Check for duplicate names or URLs (excluding current engine)
            const duplicateEngine = this.engines.find(engine => 
                engine.id !== id && (
                    engine.name.toLowerCase() === updatedEngine.name.toLowerCase() ||
                    engine.url === updatedEngine.url
                )
            );

            if (duplicateEngine) {
                throw new Error('Another search engine with this name or URL already exists');
            }

            // Update in database
            await this.dbManager.updateEngine(id, updates);
            
            // Reload engines to update local cache
            await this.loadEngines();
            
            Utils.showNotification(`Updated search engine: ${updatedEngine.name}`, 'success');
        } catch (error) {
            Utils.logError(error, 'Failed to modify engine');
            Utils.showNotification(`Failed to update engine: ${error.message}`, 'danger');
            throw error;
        }
    }

    /**
     * Delete search engine
     * @param {string} id - Engine ID
     * @returns {Promise<void>}
     */
    async deleteEngine(id) {
        try {
            const engine = this.engines.find(e => e.id === id);
            if (!engine) {
                throw new Error('Search engine not found');
            }

            // Prevent deletion if it's the only engine
            if (this.engines.length <= 1) {
                throw new Error('Cannot delete the only search engine');
            }

            // If deleting default engine, set new default
            if (engine.isDefault) {
                const remainingEngines = this.engines.filter(e => e.id !== id);
                if (remainingEngines.length > 0) {
                    await this.setDefault(remainingEngines[0].id);
                }
            }

            // Delete from database
            await this.dbManager.deleteEngine(id);
            
            // Reload engines to update local cache
            await this.loadEngines();
            
            Utils.showNotification(`Deleted search engine: ${engine.name}`, 'success');
        } catch (error) {
            Utils.logError(error, 'Failed to delete engine');
            Utils.showNotification(`Failed to delete engine: ${error.message}`, 'danger');
            throw error;
        }
    }

    /**
     * Set default search engine
     * @param {string} id - Engine ID
     * @returns {Promise<void>}
     */
    async setDefault(id) {
        try {
            const engine = this.engines.find(e => e.id === id);
            if (!engine) {
                throw new Error('Search engine not found');
            }

            await this.dbManager.setDefaultEngine(id);
            await this.loadEngines();
            
            Utils.showNotification(`Set ${engine.name} as default search engine`, 'success');
        } catch (error) {
            Utils.logError(error, 'Failed to set default engine');
            Utils.showNotification('Failed to set default engine', 'danger');
            throw error;
        }
    }

    /**
     * Enable or disable search engine
     * @param {string} id - Engine ID
     * @param {boolean} enabled - Enable/disable status
     * @returns {Promise<void>}
     */
    async toggleEngine(id, enabled) {
        try {
            const engine = this.engines.find(e => e.id === id);
            if (!engine) {
                throw new Error('Search engine not found');
            }

            // Prevent disabling all engines
            if (!enabled && this.getEnabledEngines().length <= 1) {
                throw new Error('Cannot disable all search engines');
            }

            await this.modifyEngine(id, { enabled });
        } catch (error) {
            Utils.logError(error, 'Failed to toggle engine');
            throw error;
        }
    }

    /**
     * Get all search engines
     * @returns {Array} Array of search engines
     */
    getAllEngines() {
        return [...this.engines];
    }

    /**
     * Get enabled search engines
     * @returns {Array} Array of enabled search engines
     */
    getEnabledEngines() {
        return this.engines.filter(engine => engine.enabled);
    }

    /**
     * Get active engines (selected for searching)
     * @returns {Array} Array of active search engines
     */
    getActiveEngines() {
        return [...this.activeEngines];
    }

    /**
     * Set active engines for searching
     * @param {Array} engineIds - Array of engine IDs
     */
    setActiveEngines(engineIds) {
        this.activeEngines = this.engines.filter(engine => 
            engineIds.includes(engine.id) && engine.enabled
        );
    }

    /**
     * Get default search engine
     * @returns {Object|null} Default search engine or null
     */
    getDefaultEngine() {
        return this.defaultEngine;
    }

    /**
     * Get search engine by ID
     * @param {string} id - Engine ID
     * @returns {Object|null} Search engine or null
     */
    getEngine(id) {
        return this.engines.find(engine => engine.id === id) || null;
    }

    /**
     * Search for engines by name
     * @param {string} query - Search query
     * @returns {Array} Matching engines
     */
    searchEngines(query) {
        if (!query) return this.engines;
        
        const searchTerm = query.toLowerCase();
        return this.engines.filter(engine => 
            engine.name.toLowerCase().includes(searchTerm) ||
            engine.url.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Update sort order of engines
     * @param {Array} orderedIds - Array of engine IDs in desired order
     * @returns {Promise<void>}
     */
    async updateSortOrder(orderedIds) {
        try {
            const updates = orderedIds.map((id, index) => 
                this.dbManager.updateEngine(id, { sortOrder: index })
            );
            
            await Promise.all(updates);
            await this.loadEngines();
            
            Utils.showNotification('Engine order updated', 'success');
        } catch (error) {
            Utils.logError(error, 'Failed to update sort order');
            Utils.showNotification('Failed to update engine order', 'danger');
            throw error;
        }
    }

    /**
     * Validate engine configuration
     * @param {Object} config - Engine configuration
     * @returns {boolean} True if valid
     * @private
     */
    validateEngineConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        // Required fields
        if (!config.name || typeof config.name !== 'string' || config.name.trim().length === 0) {
            return false;
        }

        if (!config.url || typeof config.url !== 'string' || !Utils.isValidSearchTemplate(config.url)) {
            return false;
        }

        // Optional fields validation
        if (config.icon && !Utils.isValidUrl(config.icon)) {
            return false;
        }

        if (config.color && !/^#[0-9A-F]{6}$/i.test(config.color)) {
            return false;
        }

        return true;
    }

    /**
     * Update active engines based on enabled status
     * @private
     */
    updateActiveEngines() {
        // If no active engines set, use all enabled engines
        if (this.activeEngines.length === 0) {
            this.activeEngines = this.getEnabledEngines();
        } else {
            // Filter out disabled engines from active list
            this.activeEngines = this.activeEngines.filter(engine => engine.enabled);
        }
    }

    /**
     * Update default engine reference
     * @private
     */
    updateDefaultEngine() {
        this.defaultEngine = this.engines.find(engine => engine.isDefault) || null;
        
        // If no default engine set, set the first enabled engine as default
        if (!this.defaultEngine && this.engines.length > 0) {
            const firstEnabled = this.engines.find(engine => engine.enabled);
            if (firstEnabled) {
                this.setDefault(firstEnabled.id).catch(error => {
                    Utils.logError(error, 'Failed to set automatic default engine');
                });
            }
        }
    }

    /**
     * Get engine statistics
     * @returns {Object} Engine statistics
     */
    getStats() {
        return {
            total: this.engines.length,
            enabled: this.getEnabledEngines().length,
            active: this.activeEngines.length,
            hasDefault: !!this.defaultEngine
        };
    }

    /**
     * Reset to default engines
     * @returns {Promise<void>}
     */
    async resetToDefaults() {
        try {
            // Clear existing engines
            const deletePromises = this.engines.map(engine => 
                this.dbManager.deleteEngine(engine.id)
            );
            await Promise.all(deletePromises);
            
            // Load default engines
            await this.loadDefaultEngines();
            
            Utils.showNotification('Reset to default search engines', 'success');
        } catch (error) {
            Utils.logError(error, 'Failed to reset to defaults');
            Utils.showNotification('Failed to reset to defaults', 'danger');
            throw error;
        }
    }

    /**
     * Export engines configuration
     * @returns {Object} Engines configuration
     */
    exportConfig() {
        return {
            engines: this.engines.map(engine => ({
                id: engine.id,
                name: engine.name,
                url: engine.url,
                icon: engine.icon,
                color: engine.color,
                enabled: engine.enabled,
                isDefault: engine.isDefault,
                sortOrder: engine.sortOrder
            }))
        };
    }

    /**
     * Import engines configuration
     * @param {Object} config - Configuration to import
     * @param {boolean} replaceExisting - Whether to replace existing engines
     * @returns {Promise<void>}
     */
    async importConfig(config, replaceExisting = false) {
        try {
            if (!config.engines || !Array.isArray(config.engines)) {
                throw new Error('Invalid configuration format');
            }

            if (replaceExisting) {
                // Clear existing engines
                const deletePromises = this.engines.map(engine => 
                    this.dbManager.deleteEngine(engine.id)
                );
                await Promise.all(deletePromises);
            }

            // Import engines
            for (const engineConfig of config.engines) {
                try {
                    await this.addEngine(engineConfig);
                } catch (error) {
                    Utils.logError(error, `Failed to import engine: ${engineConfig.name}`);
                }
            }

            await this.loadEngines();
            Utils.showNotification('Configuration imported successfully', 'success');
        } catch (error) {
            Utils.logError(error, 'Failed to import configuration');
            Utils.showNotification('Failed to import configuration', 'danger');
            throw error;
        }
    }
}