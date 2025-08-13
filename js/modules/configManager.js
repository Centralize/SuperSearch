/**
 * Configuration Manager Module
 *
 * Manages application configuration and user preferences.
 * Handles import/export of settings and preference persistence.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class ConfigManager {
    constructor(database) {
        this.database = database;
        this.preferences = {};
        this.defaultPreferences = {
            enableHistory: true,
            maxHistoryItems: 100,
            defaultSearchMode: 'selected', // 'selected' or 'all'
            openInNewTab: true,
            showNotifications: true,
            theme: 'auto', // 'light', 'dark', 'auto'
            autoSelectEngines: true,
            confirmDeletion: true
        };
    }

    /**
     * Load preferences from database
     */
    async loadPreferences() {
        console.log('⚙️ ConfigManager: Loading preferences...');

        try {
            // Load all preferences from database
            const allPrefs = await this.database.getAll('preferences');

            // Convert to key-value object
            this.preferences = {};
            allPrefs.forEach(pref => {
                this.preferences[pref.key] = pref.value;
            });

            // Apply default values for missing preferences
            for (const [key, defaultValue] of Object.entries(this.defaultPreferences)) {
                if (!(key in this.preferences)) {
                    this.preferences[key] = defaultValue;
                }
            }

            console.log('✅ ConfigManager: Preferences loaded');

        } catch (error) {
            console.warn('ConfigManager: Failed to load preferences, using defaults:', error);
            this.preferences = { ...this.defaultPreferences };
        }
    }

    /**
     * Get a preference value
     * @param {string} key - Preference key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Preference value
     */
    getPreference(key, defaultValue = null) {
        if (key in this.preferences) {
            return this.preferences[key];
        }

        if (key in this.defaultPreferences) {
            return this.defaultPreferences[key];
        }

        return defaultValue;
    }

    /**
     * Set a preference value
     * @param {string} key - Preference key
     * @param {any} value - Preference value
     * @param {string} category - Preference category
     */
    async setPreference(key, value, category = 'general') {
        this.preferences[key] = value;

        try {
            await this.database.setPreference(key, value, category);
            console.log(`⚙️ ConfigManager: Set preference ${key} = ${value}`);
        } catch (error) {
            console.error(`Failed to save preference ${key}:`, error);
        }
    }

    /**
     * Save all preferences to database
     */
    async savePreferences() {
        console.log('⚙️ ConfigManager: Saving all preferences...');

        try {
            for (const [key, value] of Object.entries(this.preferences)) {
                await this.database.setPreference(key, value);
            }
            console.log('✅ ConfigManager: All preferences saved');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            throw error;
        }
    }

    /**
     * Reset preferences to defaults
     */
    async resetPreferences() {
        console.log('⚙️ ConfigManager: Resetting preferences to defaults...');

        this.preferences = { ...this.defaultPreferences };
        await this.savePreferences();

        console.log('✅ ConfigManager: Preferences reset to defaults');
    }

    /**
     * Export configuration as JSON
     * @returns {Object} Configuration object
     */
    async exportConfiguration() {
        console.log('⚙️ ConfigManager: Exporting configuration...');

        try {
            const engines = await this.database.getAll('engines');
            const preferences = { ...this.preferences };

            const config = {
                version: '1.0.0',
                exported: new Date().toISOString(),
                engines: engines,
                preferences: preferences,
                metadata: {
                    appName: 'SuperSearch',
                    exportedBy: 'SuperSearch Configuration Manager'
                }
            };

            console.log('✅ ConfigManager: Configuration exported');
            return config;

        } catch (error) {
            console.error('Failed to export configuration:', error);
            throw error;
        }
    }

    /**
     * Import configuration from JSON
     * @param {Object} config - Configuration object
     * @param {Object} options - Import options
     */
    async importConfiguration(config, options = {}) {
        const { mergeEngines = false, mergePreferences = true } = options;

        console.log('⚙️ ConfigManager: Importing configuration...');

        try {
            // Validate configuration
            if (!config.version || !config.engines || !config.preferences) {
                throw new Error('Invalid configuration format');
            }

            // Import engines
            if (config.engines && Array.isArray(config.engines)) {
                if (!mergeEngines) {
                    // Clear existing engines
                    await this.database.clear('engines');
                }

                // Add imported engines
                for (const engine of config.engines) {
                    try {
                        await this.database.create('engines', engine);
                    } catch (error) {
                        if (mergeEngines) {
                            // Update existing engine
                            await this.database.update('engines', engine.id, engine);
                        } else {
                            console.warn(`Failed to import engine ${engine.name}:`, error);
                        }
                    }
                }
            }

            // Import preferences
            if (config.preferences) {
                if (mergePreferences) {
                    // Merge with existing preferences
                    Object.assign(this.preferences, config.preferences);
                } else {
                    // Replace all preferences
                    this.preferences = { ...config.preferences };
                }

                await this.savePreferences();
            }

            console.log('✅ ConfigManager: Configuration imported successfully');

        } catch (error) {
            console.error('Failed to import configuration:', error);
            throw error;
        }
    }

    /**
     * Download configuration as JSON file
     */
    async downloadConfiguration() {
        try {
            const config = await this.exportConfiguration();
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `supersearch-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ ConfigManager: Configuration downloaded');

        } catch (error) {
            console.error('Failed to download configuration:', error);
            throw error;
        }
    }

    /**
     * Get all preferences
     * @returns {Object} All preferences
     */
    getAllPreferences() {
        return { ...this.preferences };
    }

    /**
     * Get default preferences
     * @returns {Object} Default preferences
     */
    getDefaultPreferences() {
        return { ...this.defaultPreferences };
    }
}
