/**
 * Search Handler Module
 *
 * Handles search operations across multiple search engines.
 * Manages URL building, search execution, and result aggregation.
 *
 * @author SuperSearch Team
 * @version 1.0.0
 */

export class SearchHandler {
    constructor(searchEngineManager) {
        this.searchEngineManager = searchEngineManager;
        this.activeSearches = new Map();
        this.searchTimeout = 10000; // 10 seconds timeout
    }

    /**
     * Perform search across multiple engines
     * @param {string} query - Search query
     * @param {Array} engines - Array of engine objects or IDs
     * @returns {Promise<Array>} Array of search results
     */
    async search(query, engines) {
        console.log(`🔎 SearchHandler: Searching for "${query}" across ${engines.length} engines`);

        if (!query || !query.trim()) {
            throw new Error('Search query cannot be empty');
        }

        if (!engines || engines.length === 0) {
            throw new Error('No search engines provided');
        }

        const searchId = this.generateSearchId();
        const sanitizedQuery = this.sanitizeQuery(query.trim());

        try {
            // Get full engine objects if only IDs were provided
            const fullEngines = await this.resolveEngines(engines);

            // Execute searches in parallel
            const searchPromises = fullEngines.map(engine =>
                this.searchSingleEngine(searchId, sanitizedQuery, engine)
            );

            // Wait for all searches to complete
            const results = await Promise.allSettled(searchPromises);

            // Process results
            const processedResults = results.map((result, index) => {
                const engine = fullEngines[index];

                if (result.status === 'fulfilled') {
                    return {
                        engine: engine.name,
                        engineId: engine.id,
                        query: sanitizedQuery,
                        results: result.value,
                        timestamp: new Date().toISOString(),
                        success: true
                    };
                } else {
                    console.error(`Search failed for ${engine.name}:`, result.reason);
                    return {
                        engine: engine.name,
                        engineId: engine.id,
                        query: sanitizedQuery,
                        error: result.reason.message || 'Search failed',
                        timestamp: new Date().toISOString(),
                        success: false
                    };
                }
            });

            // Save search to history
            await this.saveSearchHistory(sanitizedQuery, fullEngines);

            console.log(`✅ SearchHandler: Search completed for "${query}"`);
            return processedResults;

        } catch (error) {
            console.error('SearchHandler: Search operation failed:', error);
            throw error;
        } finally {
            // Clean up active search
            this.activeSearches.delete(searchId);
        }
    }

    /**
     * Search a single engine
     * @private
     * @param {string} searchId - Unique search identifier
     * @param {string} query - Sanitized search query
     * @param {Object} engine - Engine configuration
     * @returns {Promise<Array>} Search results
     */
    async searchSingleEngine(searchId, query, engine) {
        const searchUrl = this.buildSearchUrl(query, engine);

        console.log(`🔍 Searching ${engine.name}: ${searchUrl}`);

        // Store active search for potential cancellation
        const controller = new AbortController();
        this.activeSearches.set(searchId, controller);

        try {
            // Since we can't directly scrape search results due to CORS,
            // we'll simulate the search by opening the URL in a new tab
            // and returning a placeholder result

            // In a real implementation, this would require a backend service
            // or browser extension to bypass CORS restrictions

            const searchResult = {
                url: searchUrl,
                engine: engine.name,
                query: query,
                timestamp: new Date().toISOString(),
                method: 'redirect' // Indicates this opens in new tab
            };

            return [searchResult];

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Search was cancelled');
            }
            throw new Error(`Failed to search ${engine.name}: ${error.message}`);
        }
    }

    /**
     * Build search URL for an engine
     * @param {string} query - Search query
     * @param {Object} engine - Engine configuration
     * @returns {string} Complete search URL
     */
    buildSearchUrl(query, engine) {
        if (!engine.url) {
            throw new Error(`Engine ${engine.name} has no URL template`);
        }

        // Encode the query for URL safety
        const encodedQuery = encodeURIComponent(query);

        // Replace placeholder in URL template
        const searchUrl = engine.url.replace('{query}', encodedQuery);

        // Validate the resulting URL
        try {
            new URL(searchUrl);
            return searchUrl;
        } catch (error) {
            throw new Error(`Invalid search URL generated for ${engine.name}: ${searchUrl}`);
        }
    }

    /**
     * Sanitize search query
     * @private
     * @param {string} query - Raw search query
     * @returns {string} Sanitized query
     */
    sanitizeQuery(query) {
        // Remove potentially dangerous characters
        return query
            .replace(/[<>]/g, '') // Remove HTML brackets
            .replace(/['"]/g, '') // Remove quotes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Resolve engine objects from IDs or objects
     * @private
     * @param {Array} engines - Array of engine IDs or objects
     * @returns {Promise<Array>} Array of full engine objects
     */
    async resolveEngines(engines) {
        const resolvedEngines = [];

        for (const engine of engines) {
            if (typeof engine === 'string') {
                // Engine ID provided, need to fetch full object
                try {
                    const fullEngine = await this.searchEngineManager.getEngine(engine);
                    resolvedEngines.push(fullEngine);
                } catch (error) {
                    console.warn(`Failed to resolve engine ${engine}:`, error);
                }
            } else if (engine && engine.id) {
                // Full engine object provided
                resolvedEngines.push(engine);
            }
        }

        return resolvedEngines;
    }

    /**
     * Generate unique search ID
     * @private
     * @returns {string} Unique search identifier
     */
    generateSearchId() {
        return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cancel active search
     * @param {string} searchId - Search ID to cancel
     */
    cancelSearch(searchId) {
        const controller = this.activeSearches.get(searchId);
        if (controller) {
            controller.abort();
            this.activeSearches.delete(searchId);
            console.log(`🚫 SearchHandler: Cancelled search ${searchId}`);
        }
    }

    /**
     * Cancel all active searches
     */
    cancelAllSearches() {
        for (const [searchId, controller] of this.activeSearches) {
            controller.abort();
        }
        this.activeSearches.clear();
        console.log('🚫 SearchHandler: Cancelled all active searches');
    }

    /**
     * Open search results in new tabs
     * @param {Array} results - Search results
     */
    openSearchResults(results) {
        results.forEach(result => {
            if (result.success && result.results) {
                result.results.forEach(searchResult => {
                    if (searchResult.url) {
                        window.open(searchResult.url, '_blank', 'noopener,noreferrer');
                    }
                });
            }
        });
    }

    /**
     * Get search statistics
     * @returns {Object} Search statistics
     */
    getSearchStats() {
        return {
            activeSearches: this.activeSearches.size,
            searchTimeout: this.searchTimeout
        };
    }

    /**
     * Save search to history
     * @private
     */
    async saveSearchHistory(query, engines) {
        try {
            const historyItem = {
                query: query,
                engines: engines.map(engine => engine.name),
                engineIds: engines.map(engine => engine.id),
                timestamp: new Date().toISOString(),
                id: Date.now() // Simple ID generation
            };

            await this.database.create('searchHistory', historyItem);
            console.log(`📝 SearchHandler: Saved search history for "${query}"`);

        } catch (error) {
            console.warn('SearchHandler: Failed to save search history:', error);
            // Don't throw error - search history is not critical
        }
    }
}
