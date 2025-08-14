/**
 * Database Manager Module
 *
 * Handles all IndexedDB operations for the SuperSearch application.
 * Provides a comprehensive wrapper around IndexedDB with error handling,
 * transactions, and CRUD operations.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'SuperSearchDB';
        this.version = 2; // Updated to match existing database
        this.isInitialized = false;
        this.initPromise = null;

        // Database schema configuration
        this.schema = {
            engines: {
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'name', keyPath: 'name', unique: false },
                    { name: 'isActive', keyPath: 'isActive', unique: false },
                    { name: 'isDefault', keyPath: 'isDefault', unique: false },
                    { name: 'category', keyPath: 'category', unique: false }
                ]
            },
            preferences: {
                keyPath: 'key',
                autoIncrement: false,
                indexes: [
                    { name: 'category', keyPath: 'category', unique: false }
                ]
            },
            searchHistory: {
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'query', keyPath: 'query', unique: false },
                    { name: 'timestamp', keyPath: 'timestamp', unique: false },
                    { name: 'engines', keyPath: 'engines', unique: false, multiEntry: true }
                ]
            },
            metadata: {
                keyPath: 'key',
                autoIncrement: false,
                indexes: []
            }
        };
    }

    /**
     * Initialize the database connection and create object stores
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._performInit();
        return this.initPromise;
    }

    /**
     * Internal initialization method
     * @private
     */
    async _performInit() {
        try {
            console.log('📊 DatabaseManager: Initializing IndexedDB...');

            // Check if IndexedDB is supported
            if (!window.indexedDB) {
                throw new Error('IndexedDB is not supported in this browser');
            }

            this.db = await this._openDatabase();
            this.isInitialized = true;

            console.log('✅ DatabaseManager: IndexedDB initialized successfully');

            // Initialize metadata
            await this._initializeMetadata();

        } catch (error) {
            console.error('❌ DatabaseManager: Failed to initialize:', error);
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    /**
     * Open the IndexedDB database
     * @private
     * @returns {Promise<IDBDatabase>}
     */
    _openDatabase() {
        return new Promise((resolve, reject) => {
            // First, check if database exists and get its version
            const checkRequest = indexedDB.open(this.dbName);

            checkRequest.onsuccess = () => {
                const existingDb = checkRequest.result;
                const existingVersion = existingDb.version;
                existingDb.close();

                // Use the higher version to avoid conflicts
                const targetVersion = Math.max(this.version, existingVersion);

                const request = indexedDB.open(this.dbName, targetVersion);

                request.onerror = () => {
                    reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
                };

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    this._createObjectStores(db, event.oldVersion);
                };
            };

            checkRequest.onerror = () => {
                // Database doesn't exist, create it with our version
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => {
                    reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
                };

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    this._createObjectStores(db, event.oldVersion);
                };
            };
        });
    }

    /**
     * Create object stores and indexes
     * @private
     * @param {IDBDatabase} db
     * @param {number} oldVersion
     */
    _createObjectStores(db, oldVersion = 0) {
        console.log(`📊 DatabaseManager: Creating object stores (upgrading from version ${oldVersion})...`);

        Object.entries(this.schema).forEach(([storeName, config]) => {
            // Only create/recreate stores that don't exist or need updates
            if (!db.objectStoreNames.contains(storeName)) {
                // Create new object store
                const store = db.createObjectStore(storeName, {
                    keyPath: config.keyPath,
                    autoIncrement: config.autoIncrement
                });

                // Create indexes
                config.indexes.forEach(index => {
                    store.createIndex(index.name, index.keyPath, {
                        unique: index.unique || false,
                        multiEntry: index.multiEntry || false
                    });
                });

                console.log(`✅ Created object store: ${storeName}`);
            } else {
                console.log(`ℹ️ Object store already exists: ${storeName}`);
            }
        });
    }

    /**
     * Initialize database metadata
     * @private
     */
    async _initializeMetadata() {
        const metadata = {
            key: 'app_info',
            version: '1.0.0',
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString()
        };

        try {
            await this.get('metadata', 'app_info');
        } catch (error) {
            // Metadata doesn't exist, create it
            await this.create('metadata', metadata);
        }

        // Update last accessed time
        await this.update('metadata', 'app_info', { lastAccessed: new Date().toISOString() });
    }

    /**
     * Ensure database is initialized before operations
     * @private
     */
    async _ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
    }

    /**
     * Get a transaction for the specified stores
     * @private
     * @param {string|string[]} storeNames
     * @param {string} mode - 'readonly' or 'readwrite'
     * @returns {IDBTransaction}
     */
    _getTransaction(storeNames, mode = 'readonly') {
        const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
        return this.db.transaction(stores, mode);
    }

    /**
     * Execute a database operation with error handling
     * @private
     * @param {Function} operation
     * @returns {Promise<any>}
     */
    _executeOperation(operation) {
        return new Promise((resolve, reject) => {
            try {
                const request = operation();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(request.error?.message || 'Database operation failed'));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Check if a value is a valid IndexedDB key
     * @private
     * @param {any} value
     * @returns {boolean}
     */
    _isValidIndexKey(value) {
        // IndexedDB keys must be: number, string, Date, or Array
        // Boolean values are not valid keys for IndexedDB
        if (value === null || value === undefined) {
            return false;
        }

        const type = typeof value;
        return type === 'number' ||
               type === 'string' ||
               value instanceof Date ||
               Array.isArray(value);
    }

    // ========================================
    // CRUD Operations
    // ========================================

    /**
     * Create a new record in the specified store
     * @param {string} storeName
     * @param {Object} data
     * @returns {Promise<any>}
     */
    async create(storeName, data) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        return this._executeOperation(() => store.add(data));
    }

    /**
     * Read a record by key from the specified store
     * @param {string} storeName
     * @param {any} key
     * @returns {Promise<any>}
     */
    async get(storeName, key) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        const result = await this._executeOperation(() => store.get(key));

        if (!result) {
            throw new Error(`Record with key '${key}' not found in store '${storeName}'`);
        }

        return result;
    }

    /**
     * Update a record in the specified store
     * @param {string} storeName
     * @param {any} key
     * @param {Object} updates
     * @returns {Promise<any>}
     */
    async update(storeName, key, updates) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Get existing record
        const existing = await this._executeOperation(() => store.get(key));
        if (!existing) {
            throw new Error(`Record with key '${key}' not found in store '${storeName}'`);
        }

        // Merge updates with existing data
        const updated = { ...existing, ...updates };

        return this._executeOperation(() => store.put(updated));
    }

    /**
     * Delete a record from the specified store
     * @param {string} storeName
     * @param {any} key
     * @returns {Promise<void>}
     */
    async delete(storeName, key) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        return this._executeOperation(() => store.delete(key));
    }

    /**
     * Get all records from the specified store
     * @param {string} storeName
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        return this._executeOperation(() => store.getAll());
    }

    /**
     * Count records in the specified store
     * @param {string} storeName
     * @returns {Promise<number>}
     */
    async count(storeName) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        return this._executeOperation(() => store.count());
    }

    /**
     * Clear all records from the specified store
     * @param {string} storeName
     * @returns {Promise<void>}
     */
    async clear(storeName) {
        await this._ensureInitialized();

        const transaction = this._getTransaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        return this._executeOperation(() => store.clear());
    }

    // ========================================
    // Query Operations
    // ========================================

    /**
     * Find records by index
     * @param {string} storeName
     * @param {string} indexName
     * @param {any} value
     * @returns {Promise<Array>}
     */
    async findByIndex(storeName, indexName, value) {
        await this._ensureInitialized();

        try {
            const transaction = this._getTransaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);

            // Check if index exists before trying to access it
            if (!store.indexNames.contains(indexName)) {
                console.warn(`DatabaseManager: Index '${indexName}' not found in store '${storeName}'. Available indexes:`, Array.from(store.indexNames));
                // Fallback to getting all records and filtering manually
                const allRecords = await this._executeOperation(() => store.getAll());
                return allRecords.filter(record => record[indexName] === value);
            }

            // Validate the key value for IndexedDB
            if (!this._isValidIndexKey(value)) {
                console.warn(`DatabaseManager: Invalid key value for index query: ${value}. Falling back to manual filtering.`);
                const allRecords = await this._executeOperation(() => store.getAll());
                return allRecords.filter(record => record[indexName] === value);
            }

            const index = store.index(indexName);
            return this._executeOperation(() => index.getAll(value));

        } catch (error) {
            console.error(`DatabaseManager: Error in findByIndex for ${storeName}.${indexName}:`, error);
            // Fallback to manual filtering if index query fails
            try {
                const allRecords = await this.getAll(storeName);
                return allRecords.filter(record => record[indexName] === value);
            } catch (fallbackError) {
                console.error(`DatabaseManager: Fallback also failed:`, fallbackError);
                throw error;
            }
        }
    }

    /**
     * Find records with a cursor for complex queries
     * @param {string} storeName
     * @param {Function} filterFn - Function to filter records
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async findWhere(storeName, filterFn, options = {}) {
        await this._ensureInitialized();

        const { limit = null, offset = 0 } = options;
        const results = [];
        let count = 0;
        let skipped = 0;

        const transaction = this._getTransaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;

                if (!cursor) {
                    resolve(results);
                    return;
                }

                if (skipped < offset) {
                    skipped++;
                    cursor.continue();
                    return;
                }

                if (filterFn(cursor.value)) {
                    results.push(cursor.value);
                    count++;

                    if (limit && count >= limit) {
                        resolve(results);
                        return;
                    }
                }

                cursor.continue();
            };

            request.onerror = () => {
                reject(new Error(request.error?.message || 'Cursor operation failed'));
            };
        });
    }

    // ========================================
    // Specialized Methods
    // ========================================

    /**
     * Load search history with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async loadSearchHistory(options = {}) {
        const { limit = 50, query = null } = options;

        if (query) {
            return this.findWhere('searchHistory',
                record => record.query.toLowerCase().includes(query.toLowerCase()),
                { limit }
            );
        }

        // Get recent history, sorted by timestamp
        const allHistory = await this.getAll('searchHistory');
        return allHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Save search query to history
     * @param {string} query
     * @param {Array} engines
     * @returns {Promise<void>}
     */
    async saveSearchHistory(query, engines) {
        const historyEntry = {
            query: query.trim(),
            engines: engines.map(e => e.id || e),
            timestamp: new Date().toISOString(),
            results_count: 0 // Will be updated when results are received
        };

        return this.create('searchHistory', historyEntry);
    }

    /**
     * Get active search engines
     * @returns {Promise<Array>}
     */
    async getActiveEngines() {
        try {
            // Use findWhere instead of findByIndex for boolean values
            return this.findWhere('engines', engine => engine.isActive === true);
        } catch (error) {
            console.warn('Failed to get active engines, falling back to all engines:', error);
            // Fallback to getting all engines and filtering
            const allEngines = await this.getAll('engines');
            return allEngines.filter(engine => engine.isActive === true);
        }
    }

    /**
     * Get default search engine
     * @returns {Promise<Object|null>}
     */
    async getDefaultEngine() {
        try {
            // Use findWhere instead of findByIndex for boolean values
            const defaultEngines = await this.findWhere('engines', engine => engine.isDefault === true);
            return defaultEngines.length > 0 ? defaultEngines[0] : null;
        } catch (error) {
            console.warn('Failed to get default engine, falling back to all engines:', error);
            // Fallback to getting all engines and filtering
            const allEngines = await this.getAll('engines');
            const defaultEngines = allEngines.filter(engine => engine.isDefault === true);
            return defaultEngines.length > 0 ? defaultEngines[0] : null;
        }
    }

    /**
     * Set default search engine
     * @param {string} engineId
     * @returns {Promise<void>}
     */
    async setDefaultEngine(engineId) {
        // First, remove default flag from all engines
        const allEngines = await this.getAll('engines');
        const transaction = this._getTransaction('engines', 'readwrite');
        const store = transaction.objectStore('engines');

        for (const engine of allEngines) {
            if (engine.isDefault) {
                await this._executeOperation(() =>
                    store.put({ ...engine, isDefault: false })
                );
            }
        }

        // Set the new default engine
        const targetEngine = await this.get('engines', engineId);
        await this.update('engines', engineId, { isDefault: true, isActive: true });
    }

    /**
     * Get user preference
     * @param {string} key
     * @param {any} defaultValue
     * @returns {Promise<any>}
     */
    async getPreference(key, defaultValue = null) {
        try {
            const pref = await this.get('preferences', key);
            return pref.value;
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * Set user preference
     * @param {string} key
     * @param {any} value
     * @param {string} category
     * @returns {Promise<void>}
     */
    async setPreference(key, value, category = 'general') {
        const preference = {
            key,
            value,
            category,
            updated: new Date().toISOString()
        };

        try {
            await this.get('preferences', key);
            return this.update('preferences', key, preference);
        } catch (error) {
            return this.create('preferences', preference);
        }
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('📊 DatabaseManager: Database connection closed');
        }
    }

    /**
     * Delete the entire database (for testing/reset purposes)
     * @returns {Promise<void>}
     */
    async deleteDatabase() {
        console.log('🗑️ DatabaseManager: Deleting database...');

        this.close();

        // Reset initialization state
        this.isInitialized = false;
        this.initPromise = null;

        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            let isResolved = false;

            // Set a timeout to handle blocked deletion
            const timeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    console.warn('⚠️ DatabaseManager: Database deletion timed out, attempting force clear');
                    // Try to clear data instead of deleting database
                    this._forceClearDatabase().then(resolve).catch(reject);
                }
            }, 5000); // 5 second timeout

            deleteRequest.onsuccess = () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    console.log('✅ DatabaseManager: Database deleted successfully');
                    resolve();
                }
            };

            deleteRequest.onerror = () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    console.error('❌ DatabaseManager: Failed to delete database');
                    reject(new Error('Failed to delete database'));
                }
            };

            deleteRequest.onblocked = () => {
                console.warn('⚠️ DatabaseManager: Database deletion blocked, trying alternative approach...');
                // Don't reject immediately, let the timeout handle it
                setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(timeout);
                        console.log('🔄 DatabaseManager: Attempting to clear database data instead...');
                        this._forceClearDatabase().then(resolve).catch(reject);
                    }
                }, 1000); // Wait 1 second before trying alternative
            };
        });
    }

    /**
     * Force clear all data from database when deletion is blocked
     * @private
     * @returns {Promise<void>}
     */
    async _forceClearDatabase() {
        console.log('🧹 DatabaseManager: Force clearing database data...');

        try {
            // Reinitialize the database connection if needed
            if (!this.db) {
                await this.init();
            }

            // Clear all object stores
            const storeNames = Object.keys(this.stores);
            for (const storeName of storeNames) {
                try {
                    await this.clear(storeName);
                    console.log(`✅ Cleared store: ${storeName}`);
                } catch (error) {
                    console.warn(`Failed to clear store ${storeName}:`, error);
                }
            }

            console.log('✅ DatabaseManager: Database data cleared successfully');
        } catch (error) {
            console.error('❌ DatabaseManager: Failed to force clear database:', error);
            throw new Error(`Failed to clear database data: ${error.message}`);
        }
    }

    /**
     * Reset and recreate the database with current schema
     * @returns {Promise<void>}
     */
    async resetDatabase() {
        console.log('🔄 DatabaseManager: Resetting database...');

        try {
            await this.deleteDatabase();
            await this.init();
            console.log('✅ DatabaseManager: Database reset successfully');
        } catch (error) {
            console.error('DatabaseManager: Reset database error:', error);
            throw error;
        }
    }

    /**
     * Diagnose database issues and provide information
     * @returns {Promise<Object>} Diagnostic information
     */
    async diagnoseDatabase() {
        const diagnosis = {
            isInitialized: this.isInitialized,
            dbExists: !!this.db,
            version: this.db ? this.db.version : null,
            expectedVersion: this.dbVersion,
            stores: {},
            issues: []
        };

        try {
            if (!this.db) {
                diagnosis.issues.push('Database connection not established');
                return diagnosis;
            }

            // Check each store
            for (const [storeName, config] of Object.entries(this.schema)) {
                const storeInfo = {
                    exists: this.db.objectStoreNames.contains(storeName),
                    indexes: [],
                    missingIndexes: []
                };

                if (storeInfo.exists) {
                    // Get store in a transaction to check indexes
                    try {
                        const transaction = this.db.transaction([storeName], 'readonly');
                        const store = transaction.objectStore(storeName);

                        storeInfo.indexes = Array.from(store.indexNames);

                        // Check for missing indexes
                        config.indexes.forEach(expectedIndex => {
                            if (!store.indexNames.contains(expectedIndex.name)) {
                                storeInfo.missingIndexes.push(expectedIndex.name);
                                diagnosis.issues.push(`Missing index '${expectedIndex.name}' in store '${storeName}'`);
                            }
                        });

                    } catch (error) {
                        diagnosis.issues.push(`Error accessing store '${storeName}': ${error.message}`);
                    }
                } else {
                    diagnosis.issues.push(`Missing object store '${storeName}'`);
                }

                diagnosis.stores[storeName] = storeInfo;
            }

            // Check version mismatch
            if (this.db.version !== this.dbVersion) {
                diagnosis.issues.push(`Version mismatch: expected ${this.dbVersion}, got ${this.db.version}`);
            }

        } catch (error) {
            diagnosis.issues.push(`Diagnosis error: ${error.message}`);
        }

        return diagnosis;
    }
}
