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
     * Generate export data with enhanced options
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export data
     */
    async generateExportData(options = {}) {
        try {
            const {
                includeEngines = true,
                includePreferences = true,
                includeHistory = false,
                includeMetadata = true
            } = options;

            const exportData = {
                version: this.configVersion,
                exportedAt: new Date().toISOString(),
                exportOptions: {
                    engines: includeEngines,
                    preferences: includePreferences,
                    history: includeHistory
                }
            };

            // Add metadata if requested
            if (includeMetadata) {
                exportData.metadata = await this.generateExportMetadata();
            }

            // Add engines if requested
            if (includeEngines) {
                const engines = await this.dbManager.getAllEngines();
                exportData.engines = engines.map(engine => ({
                    ...engine,
                    // Add export-specific metadata
                    exportedAt: new Date().toISOString(),
                    originalId: engine.id // Preserve original ID for import reference
                }));
            }

            // Add preferences if requested
            if (includePreferences) {
                exportData.preferences = await this.dbManager.getPreferences();
            }

            // Add history if requested
            if (includeHistory) {
                const history = await this.dbManager.getSearchHistory();
                exportData.history = history.map(entry => ({
                    ...entry,
                    // Remove sensitive data if needed
                    userAgent: undefined, // Don't export user agent
                    ip: undefined // Don't export IP if stored
                }));
            }

            // Add export statistics
            exportData.statistics = {
                totalEngines: exportData.engines?.length || 0,
                enabledEngines: exportData.engines?.filter(e => e.enabled).length || 0,
                defaultEngine: exportData.engines?.find(e => e.isDefault)?.name || null,
                historyEntries: exportData.history?.length || 0,
                exportSize: JSON.stringify(exportData).length
            };

            // Validate export data before returning
            const validation = this.validateExportData(exportData);
            if (!validation.isValid) {
                throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
            }

            // Add validation results to export
            exportData.validation = {
                isValid: validation.isValid,
                validatedAt: new Date().toISOString(),
                checksum: this.generateExportChecksum(exportData),
                warnings: validation.warnings
            };

            return exportData;

        } catch (error) {
            Utils.logError(error, 'Failed to generate export data');
            throw new Error('Failed to generate export data: ' + error.message);
        }
    }

    /**
     * Generate comprehensive export metadata
     * @returns {Promise<Object>} Metadata object
     */
    async generateExportMetadata() {
        try {
            const engines = await this.dbManager.getAllEngines();
            const preferences = await this.dbManager.getPreferences();
            const history = await this.dbManager.getSearchHistory();

            return {
                application: {
                    name: 'SuperSearch',
                    version: '1.0',
                    url: 'https://github.com/Centralize/SuperSearch'
                },
                export: {
                    timestamp: new Date().toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    userAgent: navigator.userAgent,
                    language: navigator.language
                },
                content: {
                    engines: {
                        total: engines.length,
                        enabled: engines.filter(e => e.enabled).length,
                        disabled: engines.filter(e => !e.enabled).length,
                        default: engines.find(e => e.isDefault)?.name || null,
                        custom: engines.filter(e => !e.isBuiltIn).length,
                        builtin: engines.filter(e => e.isBuiltIn).length
                    },
                    preferences: {
                        theme: preferences.theme || 'light',
                        activeEngines: preferences.activeEngines?.length || 0,
                        customSettings: Object.keys(preferences).length
                    },
                    history: {
                        entries: history.length,
                        dateRange: history.length > 0 ? {
                            oldest: new Date(Math.min(...history.map(h => h.timestamp))).toISOString(),
                            newest: new Date(Math.max(...history.map(h => h.timestamp))).toISOString()
                        } : null
                    }
                },
                compatibility: {
                    minVersion: '1.0',
                    maxVersion: '2.0',
                    features: ['engines', 'preferences', 'history', 'themes']
                }
            };

        } catch (error) {
            Utils.logError(error, 'Failed to generate export metadata');
            return {
                error: 'Failed to generate metadata',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Validate export data for integrity and completeness
     * @param {Object} exportData - Export data to validate
     * @returns {Object} Validation result
     */
    validateExportData(exportData) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check required fields
        if (!exportData.version) {
            result.errors.push('Missing version information');
            result.isValid = false;
        }

        if (!exportData.exportedAt) {
            result.errors.push('Missing export timestamp');
            result.isValid = false;
        }

        // Validate engines if included
        if (exportData.engines) {
            if (!Array.isArray(exportData.engines)) {
                result.errors.push('Engines data is not an array');
                result.isValid = false;
            } else {
                exportData.engines.forEach((engine, index) => {
                    if (!engine.name || !engine.url) {
                        result.errors.push(`Engine ${index + 1} missing required fields (name, url)`);
                        result.isValid = false;
                    }

                    if (engine.url && !engine.url.includes('{query}')) {
                        result.warnings.push(`Engine "${engine.name}" URL may not contain {query} placeholder`);
                    }
                });

                // Check for duplicate names
                const names = exportData.engines.map(e => e.name.toLowerCase());
                const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
                if (duplicates.length > 0) {
                    result.warnings.push(`Duplicate engine names found: ${[...new Set(duplicates)].join(', ')}`);
                }

                // Check for default engine
                const defaultEngines = exportData.engines.filter(e => e.isDefault);
                if (defaultEngines.length === 0) {
                    result.warnings.push('No default engine specified');
                } else if (defaultEngines.length > 1) {
                    result.warnings.push('Multiple default engines found');
                }
            }
        }

        // Validate preferences if included
        if (exportData.preferences) {
            if (typeof exportData.preferences !== 'object') {
                result.errors.push('Preferences data is not an object');
                result.isValid = false;
            }
        }

        // Validate history if included
        if (exportData.history) {
            if (!Array.isArray(exportData.history)) {
                result.errors.push('History data is not an array');
                result.isValid = false;
            } else {
                exportData.history.forEach((entry, index) => {
                    if (!entry.query || !entry.timestamp) {
                        result.warnings.push(`History entry ${index + 1} missing required fields`);
                    }
                });
            }
        }

        // Check export size
        const exportSize = JSON.stringify(exportData).length;
        if (exportSize > 10 * 1024 * 1024) { // 10MB
            result.warnings.push('Export file is very large (>10MB)');
        }

        return result;
    }

    /**
     * Generate checksum for export data integrity
     * @param {Object} exportData - Export data
     * @returns {string} Checksum
     */
    generateExportChecksum(exportData) {
        try {
            // Create a simplified version for checksum (exclude validation and metadata)
            const checksumData = {
                version: exportData.version,
                engines: exportData.engines,
                preferences: exportData.preferences,
                history: exportData.history
            };

            // Simple hash function (for basic integrity checking)
            const dataString = JSON.stringify(checksumData);
            let hash = 0;

            for (let i = 0; i < dataString.length; i++) {
                const char = dataString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }

            return Math.abs(hash).toString(16);

        } catch (error) {
            Utils.logError(error, 'Failed to generate export checksum');
            return 'error-' + Date.now().toString(16);
        }
    }

    /**
     * Verify export data integrity using checksum
     * @param {Object} exportData - Export data with checksum
     * @returns {boolean} Whether checksum is valid
     */
    verifyExportChecksum(exportData) {
        try {
            if (!exportData.validation || !exportData.validation.checksum) {
                return false; // No checksum to verify
            }

            const originalChecksum = exportData.validation.checksum;

            // Remove validation data and regenerate checksum
            const dataForVerification = { ...exportData };
            delete dataForVerification.validation;

            const newChecksum = this.generateExportChecksum(dataForVerification);

            return originalChecksum === newChecksum;

        } catch (error) {
            Utils.logError(error, 'Failed to verify export checksum');
            return false;
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