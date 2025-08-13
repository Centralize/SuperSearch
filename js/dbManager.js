/**
 * SuperSearch - Database Manager
 * Handles all IndexedDB operations for the application
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'SuperSearchDB';
        this.version = 1;
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize IndexedDB database
     * @returns {Promise<void>}
     */
    async initDb() {
        return new Promise((resolve, reject) => {
            if (this.isInitialized && this.db) {
                resolve();
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                Utils.logError(request.error, 'Database initialization failed');
                reject(new Error('Failed to initialize database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createObjectStores(db);
            };
        });
    }

    /**
     * Create object stores for the database
     * @param {IDBDatabase} db - Database instance
     */
    createObjectStores(db) {
        // Search Engines store
        if (!db.objectStoreNames.contains('engines')) {
            const enginesStore = db.createObjectStore('engines', { keyPath: 'id' });
            enginesStore.createIndex('name', 'name', { unique: false });
            enginesStore.createIndex('enabled', 'enabled', { unique: false });
            enginesStore.createIndex('isDefault', 'isDefault', { unique: false });
            enginesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // User Preferences store
        if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences', { keyPath: 'key' });
        }

        // Search History store
        if (!db.objectStoreNames.contains('searchHistory')) {
            const historyStore = db.createObjectStore('searchHistory', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
            historyStore.createIndex('query', 'query', { unique: false });
            historyStore.createIndex('engine', 'engine', { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
        }
    }

    /**
     * Ensure database is initialized
     * @private
     */
    async ensureDb() {
        if (!this.isInitialized) {
            await this.initDb();
        }
    }

    /**
     * Get object store transaction
     * @param {string} storeName - Store name
     * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
     * @returns {IDBObjectStore}
     * @private
     */
    getStore(storeName, mode = 'readonly') {
        const transaction = this.db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    }

    // ==================== SEARCH ENGINES OPERATIONS ====================

    /**
     * Add new search engine
     * @param {Object} engine - Search engine configuration
     * @returns {Promise<string>} Engine ID
     */
    async addEngine(engine) {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const engineData = {
                id: engine.id || Utils.generateId(),
                name: engine.name,
                url: engine.url,
                icon: engine.icon || Utils.getFaviconUrl(engine.url),
                color: engine.color || '#4285f4',
                enabled: engine.enabled !== false,
                isDefault: engine.isDefault || false,
                sortOrder: engine.sortOrder || 0,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            };

            const store = this.getStore('engines', 'readwrite');
            const request = store.add(engineData);

            request.onsuccess = () => resolve(engineData.id);
            request.onerror = () => {
                Utils.logError(request.error, 'Failed to add engine');
                reject(new Error('Failed to add search engine'));
            };
        });
    }

    /**
     * Update existing search engine
     * @param {string} id - Engine ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<void>}
     */
    async updateEngine(id, updates) {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('engines', 'readwrite');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const engine = getRequest.result;
                if (!engine) {
                    reject(new Error('Engine not found'));
                    return;
                }

                const updatedEngine = {
                    ...engine,
                    ...updates,
                    modifiedAt: new Date().toISOString()
                };

                const putRequest = store.put(updatedEngine);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => {
                    Utils.logError(putRequest.error, 'Failed to update engine');
                    reject(new Error('Failed to update search engine'));
                };
            };

            getRequest.onerror = () => {
                Utils.logError(getRequest.error, 'Failed to get engine for update');
                reject(new Error('Failed to find search engine'));
            };
        });
    }

    /**
     * Delete search engine
     * @param {string} id - Engine ID
     * @returns {Promise<void>}
     */
    async deleteEngine(id) {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('engines', 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                Utils.logError(request.error, 'Failed to delete engine');
                reject(new Error('Failed to delete search engine'));
            };
        });
    }

    /**
     * Get all search engines
     * @returns {Promise<Array>} Array of search engines
     */
    async getAllEngines() {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('engines');
            const request = store.getAll();

            request.onsuccess = () => {
                const engines = request.result || [];
                // Sort by sortOrder, then by name
                engines.sort((a, b) => {
                    if (a.sortOrder !== b.sortOrder) {
                        return a.sortOrder - b.sortOrder;
                    }
                    return a.name.localeCompare(b.name);
                });
                resolve(engines);
            };

            request.onerror = () => {
                Utils.logError(request.error, 'Failed to get engines');
                reject(new Error('Failed to retrieve search engines'));
            };
        });
    }

    /**
     * Get specific search engine by ID
     * @param {string} id - Engine ID
     * @returns {Promise<Object|null>} Search engine or null
     */
    async getEngine(id) {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('engines');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
                Utils.logError(request.error, 'Failed to get engine');
                reject(new Error('Failed to retrieve search engine'));
            };
        });
    }

    /**
     * Get enabled search engines
     * @returns {Promise<Array>} Array of enabled search engines
     */
    async getEnabledEngines() {
        const engines = await this.getAllEngines();
        return engines.filter(engine => engine.enabled);
    }

    /**
     * Get default search engine
     * @returns {Promise<Object|null>} Default search engine or null
     */
    async getDefaultEngine() {
        const engines = await this.getAllEngines();
        return engines.find(engine => engine.isDefault) || null;
    }

    /**
     * Set default search engine
     * @param {string} id - Engine ID to set as default
     * @returns {Promise<void>}
     */
    async setDefaultEngine(id) {
        await this.ensureDb();
        
        // First, remove default from all engines
        const engines = await this.getAllEngines();
        const updates = engines.map(engine => 
            this.updateEngine(engine.id, { isDefault: engine.id === id })
        );
        
        await Promise.all(updates);
    }

    // ==================== PREFERENCES OPERATIONS ====================

    /**
     * Update user preferences
     * @param {Object} preferences - Preferences object
     * @returns {Promise<void>}
     */
    async updatePreferences(preferences) {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('preferences', 'readwrite');
            const prefData = {
                key: 'userPreferences',
                ...preferences,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(prefData);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                Utils.logError(request.error, 'Failed to update preferences');
                reject(new Error('Failed to update preferences'));
            };
        });
    }

    /**
     * Get user preferences
     * @returns {Promise<Object>} User preferences
     */
    async getPreferences() {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('preferences');
            const request = store.get('userPreferences');

            request.onsuccess = () => {
                const prefs = request.result || {};
                // Return default preferences merged with stored preferences
                const defaultPrefs = {
                    defaultEngine: 'google',
                    theme: 'light',
                    resultsPerPage: 10,
                    openInNewTab: true,
                    showPreviews: true,
                    autoComplete: true,
                    enableHistory: true,
                    maxHistoryItems: 1000
                };
                resolve({ ...defaultPrefs, ...prefs });
            };

            request.onerror = () => {
                Utils.logError(request.error, 'Failed to get preferences');
                reject(new Error('Failed to retrieve preferences'));
            };
        });
    }

    // ==================== SEARCH HISTORY OPERATIONS ====================

    /**
     * Add search to history
     * @param {string} query - Search query
     * @param {string} engine - Engine ID used
     * @returns {Promise<void>}
     */
    async addSearchHistory(query, engine) {
        await this.ensureDb();
        
        const preferences = await this.getPreferences();
        if (!preferences.enableHistory) return;

        return new Promise((resolve, reject) => {
            const store = this.getStore('searchHistory', 'readwrite');
            const historyData = {
                query: query.trim(),
                engine,
                timestamp: new Date().toISOString(),
                resultsCount: 0 // Will be updated when results are fetched
            };

            const request = store.add(historyData);

            request.onsuccess = () => {
                // Clean up old history entries if needed
                this.cleanupHistory();
                resolve();
            };

            request.onerror = () => {
                Utils.logError(request.error, 'Failed to add search history');
                reject(new Error('Failed to add search history'));
            };
        });
    }

    /**
     * Get search history
     * @param {number} limit - Maximum number of entries to return
     * @returns {Promise<Array>} Array of search history entries
     */
    async getSearchHistory(limit = 100) {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('searchHistory');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev'); // Newest first

            const results = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => {
                Utils.logError(request.error, 'Failed to get search history');
                reject(new Error('Failed to retrieve search history'));
            };
        });
    }

    /**
     * Clear all search history
     * @returns {Promise<void>}
     */
    async clearSearchHistory() {
        await this.ensureDb();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('searchHistory', 'readwrite');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => {
                Utils.logError(request.error, 'Failed to clear search history');
                reject(new Error('Failed to clear search history'));
            };
        });
    }

    /**
     * Clean up old history entries based on preferences
     * @private
     */
    async cleanupHistory() {
        try {
            const preferences = await this.getPreferences();
            const maxItems = preferences.maxHistoryItems || 1000;
            
            const store = this.getStore('searchHistory', 'readwrite');
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
                const totalCount = countRequest.result;
                if (totalCount > maxItems) {
                    const deleteCount = totalCount - maxItems;
                    const index = store.index('timestamp');
                    const request = index.openCursor(); // Oldest first
                    
                    let deletedCount = 0;
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor && deletedCount < deleteCount) {
                            cursor.delete();
                            deletedCount++;
                            cursor.continue();
                        }
                    };
                }
            };
        } catch (error) {
            Utils.logError(error, 'History cleanup failed');
        }
    }

    // ==================== DATA EXPORT/IMPORT ====================

    /**
     * Export all application data
     * @returns {Promise<Object>} Exported data
     */
    async exportData() {
        await this.ensureDb();
        
        const [engines, preferences] = await Promise.all([
            this.getAllEngines(),
            this.getPreferences()
        ]);

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            engines: engines.map(engine => ({
                id: engine.id,
                name: engine.name,
                url: engine.url,
                icon: engine.icon,
                color: engine.color,
                enabled: engine.enabled,
                isDefault: engine.isDefault,
                sortOrder: engine.sortOrder
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
    }

    /**
     * Import application data
     * @param {Object} data - Data to import
     * @param {boolean} replaceExisting - Whether to replace existing data
     * @returns {Promise<void>}
     */
    async importData(data, replaceExisting = false) {
        await this.ensureDb();
        
        if (!Utils.isValidConfig(data)) {
            throw new Error('Invalid configuration format');
        }

        // Clear existing data if replacing
        if (replaceExisting) {
            const store = this.getStore('engines', 'readwrite');
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error('Failed to clear existing engines'));
            });
        }

        // Import engines
        if (data.engines && Array.isArray(data.engines)) {
            for (const engine of data.engines) {
                try {
                    await this.addEngine(engine);
                } catch (error) {
                    Utils.logError(error, `Failed to import engine: ${engine.name}`);
                }
            }
        }

        // Import preferences
        if (data.preferences) {
            await this.updatePreferences(data.preferences);
        }
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Database statistics
     */
    async getStats() {
        await this.ensureDb();
        
        const [engineCount, historyCount] = await Promise.all([
            this.getObjectCount('engines'),
            this.getObjectCount('searchHistory')
        ]);

        return {
            engines: engineCount,
            searchHistory: historyCount,
            dbSize: await this.estimateDbSize()
        };
    }

    /**
     * Get count of objects in a store
     * @param {string} storeName - Store name
     * @returns {Promise<number>} Object count
     * @private
     */
    async getObjectCount(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                Utils.logError(request.error, `Failed to count objects in ${storeName}`);
                resolve(0);
            };
        });
    }

    /**
     * Estimate database size (rough approximation)
     * @returns {Promise<string>} Estimated size in KB/MB
     * @private
     */
    async estimateDbSize() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                
                if (usage > 1024 * 1024) {
                    return `${(usage / (1024 * 1024)).toFixed(2)} MB`;
                } else {
                    return `${(usage / 1024).toFixed(2)} KB`;
                }
            }
            return 'Unknown';
        } catch {
            return 'Unknown';
        }
    }
}