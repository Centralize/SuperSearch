/**
 * Search Engine Manager Module
 *
 * Manages search engines and their configurations.
 * Handles CRUD operations, default engine management, and validation.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class SearchEngineManager {
    constructor(database) {
        this.database = database;
        this.engines = [];
        this.defaultEngineId = null;
    }

    /**
     * Initialize the search engine manager
     */
    async init() {
        console.log('🔍 SearchEngineManager: Initializing...');

        try {
            // Load existing engines
            await this.loadEngines();

            // Ensure default engines exist
            await this.ensureDefaultEngines();

            // Set default engine if none exists
            await this.ensureDefaultEngine();

            console.log('✅ SearchEngineManager: Initialized successfully');

        } catch (error) {
            console.error('❌ SearchEngineManager: Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * Load all engines from database
     */
    async loadEngines() {
        try {
            this.engines = await this.database.getAll('engines');

            // Validate loaded engines
            if (!Array.isArray(this.engines)) {
                console.warn('SearchEngineManager: Invalid engines data from database');
                this.engines = [];
                return;
            }

            // Filter out invalid engines
            const validEngines = this.engines.filter(engine => {
                if (!engine || typeof engine !== 'object') {
                    console.warn('SearchEngineManager: Invalid engine object:', engine);
                    return false;
                }

                if (!engine.id || !engine.name || !engine.url) {
                    console.warn('SearchEngineManager: Engine missing required properties:', engine);
                    return false;
                }

                return true;
            });

            this.engines = validEngines;
            console.log(`📊 Loaded ${this.engines.length} valid search engines`);

        } catch (error) {
            console.warn('No engines found in database, will load defaults:', error);
            this.engines = [];
        }
    }

    /**
     * Ensure default engines exist in database
     */
    async ensureDefaultEngines() {
        if (this.engines.length > 0) {
            console.log('ℹ️ Search engines already exist, skipping default setup');
            return;
        }

        try {
            console.log('📥 Loading default search engines...');

            // Load default engines from JSON file
            const response = await fetch('assets/data/default-engines.json');
            if (!response.ok) {
                throw new Error(`Failed to load default engines: ${response.status}`);
            }

            const data = await response.json();

            // Add each engine to database
            for (const engine of data.engines) {
                try {
                    await this.addEngine(engine);
                    console.log(`✅ Added default engine: ${engine.name}`);
                } catch (error) {
                    console.warn(`Failed to add engine ${engine.name}:`, error);
                }
            }

            // Reload engines after adding defaults
            await this.loadEngines();

        } catch (error) {
            console.error('Failed to load default engines:', error);
            throw new Error('Could not initialize default search engines');
        }
    }

    /**
     * Ensure a default engine is set
     */
    async ensureDefaultEngine() {
        const defaultEngine = await this.getDefaultEngine();

        if (!defaultEngine && this.engines.length > 0) {
            // Set first active engine as default
            const firstActiveEngine = this.engines.find(e => e.isActive);
            if (firstActiveEngine) {
                await this.setDefaultEngine(firstActiveEngine.id);
                console.log(`🎯 Set ${firstActiveEngine.name} as default engine`);
            }
        }
    }

    // ========================================
    // CRUD Operations
    // ========================================

    /**
     * Add a new search engine
     * @param {Object} engineData - Engine configuration
     * @returns {Promise<Object>} Created engine
     */
    async addEngine(engineData) {
        // Validate engine data
        this.validateEngineData(engineData);

        // Ensure unique ID
        if (await this.engineExists(engineData.id)) {
            throw new Error(`Engine with ID '${engineData.id}' already exists`);
        }

        // Set defaults
        const engine = {
            ...engineData,
            isActive: engineData.isActive !== false, // Default to true
            isDefault: engineData.isDefault || false,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        // If this is set as default, remove default from others
        if (engine.isDefault) {
            await this.clearDefaultEngines();
        }

        // Save to database
        await this.database.create('engines', engine);

        // Update local cache
        this.engines.push(engine);

        return engine;
    }

    /**
     * Get engine by ID
     * @param {string} engineId - Engine ID
     * @returns {Promise<Object>} Engine object
     */
    async getEngine(engineId) {
        return await this.database.get('engines', engineId);
    }

    /**
     * Update an existing engine
     * @param {string} engineId - Engine ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated engine
     */
    async updateEngine(engineId, updates) {
        // Validate updates
        if (updates.id && updates.id !== engineId) {
            throw new Error('Cannot change engine ID');
        }

        // If setting as default, clear others
        if (updates.isDefault) {
            await this.clearDefaultEngines();
        }

        // Add timestamp
        updates.updated = new Date().toISOString();

        // Update in database
        await this.database.update('engines', engineId, updates);

        // Update local cache
        const engineIndex = this.engines.findIndex(e => e.id === engineId);
        if (engineIndex !== -1) {
            this.engines[engineIndex] = { ...this.engines[engineIndex], ...updates };
        }

        return this.engines[engineIndex];
    }

    /**
     * Delete an engine
     * @param {string} engineId - Engine ID
     * @returns {Promise<void>}
     */
    async deleteEngine(engineId) {
        // Prevent deletion of last engine
        const activeEngines = this.engines.filter(e => e.isActive);
        if (activeEngines.length <= 1 && activeEngines[0]?.id === engineId) {
            throw new Error('Cannot delete the last active search engine');
        }

        // Get engine before deletion
        const engine = await this.getEngine(engineId);

        // If deleting default engine, set new default
        if (engine.isDefault) {
            const newDefault = this.engines.find(e => e.id !== engineId && e.isActive);
            if (newDefault) {
                await this.setDefaultEngine(newDefault.id);
            }
        }

        // Delete from database
        await this.database.delete('engines', engineId);

        // Update local cache
        this.engines = this.engines.filter(e => e.id !== engineId);
    }

    /**
     * Get all engines
     * @returns {Array} All engines
     */
    getAllEngines() {
        return [...this.engines];
    }

    /**
     * Get active engines
     * @returns {Array} Active engines
     */
    getActiveEngines() {
        if (!this.engines || !Array.isArray(this.engines)) {
            console.warn('SearchEngineManager: No engines loaded');
            return [];
        }

        const activeEngines = this.engines.filter(e => e && e.isActive);

        // Validate each engine has required properties
        const validEngines = activeEngines.filter(engine => {
            if (!engine.id || !engine.name || !engine.url) {
                console.warn(`SearchEngineManager: Invalid engine data:`, engine);
                return false;
            }
            return true;
        });

        return validEngines;
    }

    /**
     * Get default engine
     * @returns {Object|null} Default engine or null
     */
    async getDefaultEngine() {
        const defaultEngines = this.engines.filter(e => e.isDefault);
        return defaultEngines.length > 0 ? defaultEngines[0] : null;
    }

    /**
     * Set default engine
     * @param {string} engineId - Engine ID to set as default
     * @returns {Promise<void>}
     */
    async setDefaultEngine(engineId) {
        // Clear current default
        await this.clearDefaultEngines();

        // Set new default
        await this.updateEngine(engineId, { isDefault: true, isActive: true });

        this.defaultEngineId = engineId;
    }

    // ========================================
    // Utility Methods
    // ========================================

    /**
     * Check if engine exists
     * @param {string} engineId - Engine ID
     * @returns {Promise<boolean>} True if exists
     */
    async engineExists(engineId) {
        try {
            await this.database.get('engines', engineId);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear default flag from all engines
     * @private
     */
    async clearDefaultEngines() {
        const defaultEngines = this.engines.filter(e => e.isDefault);

        for (const engine of defaultEngines) {
            await this.database.update('engines', engine.id, { isDefault: false });
            engine.isDefault = false;
        }
    }

    /**
     * Validate engine data
     * @private
     * @param {Object} engineData - Engine data to validate
     */
    validateEngineData(engineData) {
        const required = ['id', 'name', 'url'];

        for (const field of required) {
            if (!engineData[field]) {
                throw new Error(`Engine ${field} is required`);
            }
        }

        // Validate URL template
        if (!engineData.url.includes('{query}')) {
            throw new Error('Engine URL must contain {query} placeholder');
        }

        // Validate URL format
        try {
            const testUrl = engineData.url.replace('{query}', 'test');
            new URL(testUrl);
        } catch (error) {
            throw new Error('Engine URL template is invalid');
        }

        // Validate ID format
        if (!/^[a-z0-9_-]+$/i.test(engineData.id)) {
            throw new Error('Engine ID can only contain letters, numbers, underscores, and hyphens');
        }
    }

    /**
     * Search engines by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching engines
     */
    searchEngines(criteria) {
        return this.engines.filter(engine => {
            for (const [key, value] of Object.entries(criteria)) {
                if (engine[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Get engine statistics
     * @returns {Object} Engine statistics
     */
    getStats() {
        return {
            total: this.engines.length,
            active: this.engines.filter(e => e.isActive).length,
            inactive: this.engines.filter(e => !e.isActive).length,
            default: this.engines.find(e => e.isDefault)?.name || 'None'
        };
    }
}
