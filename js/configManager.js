/**
 * SuperSearch - Configuration Manager
 * Handles import/export and configuration management
 */

class ConfigManager {
    constructor(dbManager, engineManager) {
        this.dbManager = dbManager;
        this.engineManager = engineManager;
        this.configVersion = '1.0';
    }

    /**
     * Export complete application configuration
     * @param {boolean} includeHistory - Whether to include search history
     * @returns {Promise<Object>} Configuration data
     */
    async exportConfig(includeHistory = false) {
        try {
            const [engines, preferences, history] = await Promise.all([
                this.dbManager.getAllEngines(),
                this.dbManager.getPreferences(),
                includeHistory ? this.dbManager.getSearchHistory() : []
            ]);

            const config = {
                version: this.configVersion,
                exportedAt: new Date().toISOString(),
                metadata: {
                    totalEngines: engines.length,
                    enabledEngines: engines.filter(e => e.enabled).length,
                    defaultEngine: engines.find(e => e.isDefault)?.name || null,
                    historyEntries: history.length,
                    includesHistory: includeHistory
                },
                engines: engines.map(engine => ({
                    id: engine.id,
                    name: engine.name,
                    url: engine.url,
                    icon: engine.icon,
                    color: engine.color,
                    enabled: engine.enabled,
                    isDefault: engine.isDefault,
                    sortOrder: engine.sortOrder,
                    createdAt: engine.createdAt,
                    modifiedAt: engine.modifiedAt
                })),
                preferences: {
                    defaultEngine: preferences.defaultEngine,
                    theme: preferences.theme,
                    resultsPerPage: preferences.resultsPerPage,
                    openInNewTab: preferences.openInNewTab,
                    showPreviews: preferences.showPreviews,
                    autoComplete: preferences.autoComplete,
                    enableHistory: preferences.enableHistory,
                    maxHistoryItems: preferences.maxHistoryItems
                }
            };

            if (includeHistory && history.length > 0) {
                config.searchHistory = history.map(item => ({
                    query: item.query,
                    engine: item.engine,
                    timestamp: item.timestamp,
                    resultsCount: item.resultsCount
                }));
            }

            return config;

        } catch (error) {
            Utils.logError(error, 'Failed to export configuration');
            throw new Error('Failed to export configuration: ' + error.message);
        }
    }

    /**
     * Import application configuration
     * @param {Object} config - Configuration data to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>} Import result summary
     */
    async importConfig(config, options = {}) {
        const {
            replaceEngines = false,
            replacePreferences = false,
            replaceHistory = false,
            skipValidation = false
        } = options;

        try {
            // Validate configuration
            if (!skipValidation) {
                const validation = this.validateConfig(config);
                if (!validation.valid) {
                    throw new Error('Invalid configuration: ' + validation.errors.join(', '));
                }
            }

            const result = {
                success: true,
                imported: {
                    engines: 0,
                    preferences: false,
                    history: 0
                },
                errors: [],
                warnings: []
            };

            // Import engines
            if (config.engines && Array.isArray(config.engines)) {
                try {
                    const engineResult = await this.importEngines(config.engines, replaceEngines);
                    result.imported.engines = engineResult.imported;
                    result.errors.push(...engineResult.errors);
                    result.warnings.push(...engineResult.warnings);
                } catch (error) {
                    result.errors.push(`Engine import failed: ${error.message}`);
                }
            }

            // Import preferences
            if (config.preferences && (replacePreferences || !await this.hasExistingPreferences())) {
                try {
                    await this.importPreferences(config.preferences);
                    result.imported.preferences = true;
                } catch (error) {
                    result.errors.push(`Preferences import failed: ${error.message}`);
                }
            }

            // Import search history
            if (config.searchHistory && Array.isArray(config.searchHistory) && replaceHistory) {
                try {
                    const historyResult = await this.importSearchHistory(config.searchHistory);
                    result.imported.history = historyResult.imported;
                    result.errors.push(...historyResult.errors);
                } catch (error) {
                    result.errors.push(`History import failed: ${error.message}`);
                }
            }

            // Reload engine manager
            await this.engineManager.loadEngines();

            return result;

        } catch (error) {
            Utils.logError(error, 'Configuration import failed');
            throw error;
        }
    }

    /**
     * Import engines from configuration
     * @param {Array} engines - Engine configurations
     * @param {boolean} replaceExisting - Whether to replace existing engines
     * @returns {Promise<Object>} Import result
     * @private
     */
    async importEngines(engines, replaceExisting = false) {
        const result = {
            imported: 0,
            errors: [],
            warnings: []
        };

        try {
            // Clear existing engines if replacing
            if (replaceExisting) {
                const existingEngines = await this.dbManager.getAllEngines();
                for (const engine of existingEngines) {
                    await this.dbManager.deleteEngine(engine.id);
                }
            }

            // Import each engine
            for (const engineConfig of engines) {
                try {
                    // Check if engine already exists (by name or URL)
                    const existingEngines = await this.dbManager.getAllEngines();
                    const duplicate = existingEngines.find(existing => 
                        existing.name.toLowerCase() === engineConfig.name.toLowerCase() ||
                        existing.url === engineConfig.url
                    );

                    if (duplicate && !replaceExisting) {
                        result.warnings.push(`Skipped duplicate engine: ${engineConfig.name}`);
                        continue;
                    }

                    // Validate engine configuration
                    if (!this.validateEngineConfig(engineConfig)) {
                        result.errors.push(`Invalid engine configuration: ${engineConfig.name}`);
                        continue;
                    }

                    // Add engine to database
                    await this.dbManager.addEngine({
                        ...engineConfig,
                        id: engineConfig.id || Utils.generateId() // Generate new ID if not provided
                    });

                    result.imported++;

                } catch (error) {
                    result.errors.push(`Failed to import engine ${engineConfig.name}: ${error.message}`);
                }
            }

        } catch (error) {
            throw new Error(`Engine import failed: ${error.message}`);
        }

        return result;
    }

    /**
     * Import preferences from configuration
     * @param {Object} preferences - Preferences configuration
     * @returns {Promise<void>}
     * @private
     */
    async importPreferences(preferences) {
        try {
            // Validate preferences
            const validatedPreferences = this.validatePreferences(preferences);
            await this.dbManager.updatePreferences(validatedPreferences);
        } catch (error) {
            throw new Error(`Preferences import failed: ${error.message}`);
        }
    }

    /**
     * Import search history from configuration
     * @param {Array} history - Search history entries
     * @returns {Promise<Object>} Import result
     * @private
     */
    async importSearchHistory(history) {
        const result = {
            imported: 0,
            errors: []
        };

        try {
            // Clear existing history
            await this.dbManager.clearSearchHistory();

            // Import each history entry
            for (const entry of history) {
                try {
                    if (entry.query && entry.engine && entry.timestamp) {
                        await this.dbManager.addSearchHistory(entry.query, entry.engine);
                        result.imported++;
                    } else {
                        result.errors.push('Invalid history entry format');
                    }
                } catch (error) {
                    result.errors.push(`Failed to import history entry: ${error.message}`);
                }
            }

        } catch (error) {
            throw new Error(`History import failed: ${error.message}`);
        }

        return result;
    }

    /**
     * Download configuration as JSON file
     * @param {boolean} includeHistory - Whether to include search history
     * @param {string} filename - Custom filename (optional)
     * @returns {Promise<void>}
     */
    async downloadConfig(includeHistory = false, filename = null) {
        try {
            const config = await this.exportConfig(includeHistory);
            
            const defaultFilename = `supersearch-config-${new Date().toISOString().split('T')[0]}.json`;
            const downloadFilename = filename || defaultFilename;
            
            Utils.downloadJson(config, downloadFilename);
            
            const historyNote = includeHistory ? ' (including history)' : '';
            Utils.showNotification(`Configuration exported${historyNote}`, 'success');

        } catch (error) {
            Utils.logError(error, 'Failed to download configuration');
            Utils.showNotification('Failed to export configuration', 'danger');
        }
    }

    /**
     * Upload and import configuration from file
     * @param {File} file - Configuration file
     * @param {Object} options - Import options
     * @returns {Promise<void>}
     */
    async uploadConfig(file, options = {}) {
        try {
            const config = await Utils.readJsonFile(file);
            const result = await this.importConfig(config, options);

            // Show import summary
            const summary = [
                `Imported ${result.imported.engines} engines`,
                result.imported.preferences ? 'Updated preferences' : '',
                result.imported.history > 0 ? `Imported ${result.imported.history} history entries` : ''
            ].filter(Boolean).join(', ');

            if (result.errors.length > 0) {
                Utils.showNotification(`Import completed with errors: ${summary}`, 'warning');
                console.warn('Import errors:', result.errors);
            } else {
                Utils.showNotification(`Configuration imported: ${summary}`, 'success');
            }

            if (result.warnings.length > 0) {
                console.warn('Import warnings:', result.warnings);
            }

        } catch (error) {
            Utils.logError(error, 'Failed to upload configuration');
            Utils.showNotification(`Import failed: ${error.message}`, 'danger');
        }
    }

    /**
     * Validate configuration object
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateConfig(config) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check basic structure
        if (!config || typeof config !== 'object') {
            result.valid = false;
            result.errors.push('Configuration must be an object');
            return result;
        }

        // Check version
        if (!config.version) {
            result.warnings.push('No version specified in configuration');
        } else if (config.version !== this.configVersion) {
            result.warnings.push(`Configuration version ${config.version} may not be fully compatible with current version ${this.configVersion}`);
        }

        // Validate engines
        if (config.engines) {
            if (!Array.isArray(config.engines)) {
                result.valid = false;
                result.errors.push('Engines must be an array');
            } else {
                for (let i = 0; i < config.engines.length; i++) {
                    const engine = config.engines[i];
                    if (!this.validateEngineConfig(engine)) {
                        result.errors.push(`Invalid engine configuration at index ${i}`);
                    }
                }
            }
        }

        // Validate preferences
        if (config.preferences) {
            try {
                this.validatePreferences(config.preferences);
            } catch (error) {
                result.errors.push(`Invalid preferences: ${error.message}`);
            }
        }

        // Validate search history
        if (config.searchHistory) {
            if (!Array.isArray(config.searchHistory)) {
                result.warnings.push('Search history should be an array');
            }
        }

        if (result.errors.length > 0) {
            result.valid = false;
        }

        return result;
    }

    /**
     * Validate engine configuration
     * @param {Object} engine - Engine configuration
     * @returns {boolean} True if valid
     * @private
     */
    validateEngineConfig(engine) {
        if (!engine || typeof engine !== 'object') return false;
        
        // Required fields
        if (!engine.name || typeof engine.name !== 'string') return false;
        if (!engine.url || !Utils.isValidSearchTemplate(engine.url)) return false;
        
        // Optional fields validation
        if (engine.icon && !Utils.isValidUrl(engine.icon)) return false;
        if (engine.color && !/^#[0-9A-F]{6}$/i.test(engine.color)) return false;
        
        return true;
    }

    /**
     * Validate preferences configuration
     * @param {Object} preferences - Preferences configuration
     * @returns {Object} Validated preferences
     * @private
     */
    validatePreferences(preferences) {
        const defaults = {
            defaultEngine: 'google',
            theme: 'light',
            resultsPerPage: 10,
            openInNewTab: true,
            showPreviews: true,
            autoComplete: true,
            enableHistory: true,
            maxHistoryItems: 1000
        };

        const validated = { ...defaults };

        if (preferences && typeof preferences === 'object') {
            // Validate and apply each preference
            Object.keys(defaults).forEach(key => {
                if (preferences.hasOwnProperty(key)) {
                    const value = preferences[key];
                    
                    switch (key) {
                        case 'defaultEngine':
                            if (typeof value === 'string') validated[key] = value;
                            break;
                        case 'theme':
                            if (['light', 'dark', 'auto'].includes(value)) validated[key] = value;
                            break;
                        case 'resultsPerPage':
                            if (typeof value === 'number' && value >= 5 && value <= 100) {
                                validated[key] = value;
                            }
                            break;
                        case 'maxHistoryItems':
                            if (typeof value === 'number' && value >= 0 && value <= 10000) {
                                validated[key] = value;
                            }
                            break;
                        default:
                            if (typeof value === 'boolean') validated[key] = value;
                            break;
                    }
                }
            });
        }

        return validated;
    }

    /**
     * Check if existing preferences exist
     * @returns {Promise<boolean>} True if preferences exist
     * @private
     */
    async hasExistingPreferences() {
        try {
            const preferences = await this.dbManager.getPreferences();
            return preferences && Object.keys(preferences).length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Reset configuration to defaults
     * @returns {Promise<void>}
     */
    async resetToDefaults() {
        try {
            // Load default configuration
            const response = await fetch('data/default-engines.json');
            if (!response.ok) {
                throw new Error('Failed to load default configuration');
            }
            
            const defaultConfig = await response.json();
            
            // Import with replace options
            await this.importConfig(defaultConfig, {
                replaceEngines: true,
                replacePreferences: true,
                replaceHistory: true
            });

            Utils.showNotification('Configuration reset to defaults', 'success');

        } catch (error) {
            Utils.logError(error, 'Failed to reset configuration');
            Utils.showNotification('Failed to reset configuration', 'danger');
        }
    }

    /**
     * Create backup of current configuration
     * @returns {Promise<void>}
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `supersearch-backup-${timestamp}.json`;
            
            await this.downloadConfig(true, filename);
            
            Utils.showNotification('Backup created successfully', 'success');

        } catch (error) {
            Utils.logError(error, 'Failed to create backup');
            Utils.showNotification('Failed to create backup', 'danger');
        }
    }

    /**
     * Get configuration summary
     * @returns {Promise<Object>} Configuration summary
     */
    async getConfigSummary() {
        try {
            const [engines, preferences, stats] = await Promise.all([
                this.dbManager.getAllEngines(),
                this.dbManager.getPreferences(),
                this.dbManager.getStats()
            ]);

            return {
                engines: {
                    total: engines.length,
                    enabled: engines.filter(e => e.enabled).length,
                    default: engines.find(e => e.isDefault)?.name || 'None'
                },
                preferences: {
                    theme: preferences.theme,
                    openInNewTab: preferences.openInNewTab,
                    enableHistory: preferences.enableHistory,
                    maxHistoryItems: preferences.maxHistoryItems
                },
                database: {
                    historyEntries: stats.searchHistory,
                    estimatedSize: stats.dbSize
                },
                lastModified: new Date().toISOString()
            };

        } catch (error) {
            Utils.logError(error, 'Failed to get configuration summary');
            return null;
        }
    }
}