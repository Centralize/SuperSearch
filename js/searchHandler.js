/**
 * SuperSearch - Search Handler
 * Handles search operations and result processing
 */

class SearchHandler {
    constructor(engineManager, dbManager) {
        this.engineManager = engineManager;
        this.dbManager = dbManager;
        this.currentSearchId = null;
        this.searchResults = new Map();
        this.searchTimeouts = new Map();
    }

    /**
     * Perform search across multiple engines
     * @param {string} query - Search query
     * @param {Array} engines - Array of engines to search (optional)
     * @returns {Promise<Object>} Search results grouped by engine
     */
    async search(query, engines = null) {
        try {
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Search query is required');
            }

            const searchQuery = query.trim();
            const searchId = Utils.generateId();
            this.currentSearchId = searchId;

            // Use provided engines or get active engines
            const searchEngines = engines || this.engineManager.getActiveEngines();
            
            if (searchEngines.length === 0) {
                throw new Error('No search engines selected');
            }

            // Clear previous results
            this.searchResults.clear();

            // Add to search history if enabled
            await this.addToHistory(searchQuery, searchEngines);

            // Start search on all engines
            const searchPromises = searchEngines.map(engine => 
                this.searchEngine(engine, searchQuery, searchId)
            );

            // Return immediately with search ID, results will be processed asynchronously
            Promise.allSettled(searchPromises).then(results => {
                this.processSearchResults(searchId, results);
            });

            return {
                searchId,
                query: searchQuery,
                engines: searchEngines,
                status: 'started'
            };

        } catch (error) {
            Utils.logError(error, 'Search failed');
            throw error;
        }
    }

    /**
     * Search a single engine
     * @param {Object} engine - Search engine configuration
     * @param {string} query - Search query
     * @param {string} searchId - Search ID
     * @returns {Promise<Object>} Search result
     * @private
     */
    async searchEngine(engine, query, searchId) {
        try {
            const searchUrl = this.buildSearchUrl(engine, query);
            
            // For web-based searches, we'll open in new tab/window
            // In a real implementation, you might use a backend proxy or CORS-enabled API
            const result = {
                engineId: engine.id,
                engineName: engine.name,
                query,
                url: searchUrl,
                timestamp: new Date().toISOString(),
                status: 'ready',
                openMethod: 'external' // Opens in new tab/window
            };

            // Store result
            this.searchResults.set(engine.id, result);

            // Emit search result event
            this.emitSearchResult(searchId, engine.id, result);

            return result;

        } catch (error) {
            Utils.logError(error, `Search failed for engine: ${engine.name}`);
            
            const errorResult = {
                engineId: engine.id,
                engineName: engine.name,
                query,
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            };

            this.searchResults.set(engine.id, errorResult);
            this.emitSearchResult(searchId, engine.id, errorResult);

            return errorResult;
        }
    }

    /**
     * Build search URL from engine template and query
     * @param {Object} engine - Search engine configuration
     * @param {string} query - Search query
     * @returns {string} Complete search URL
     */
    buildSearchUrl(engine, query) {
        if (!engine || !engine.url || !query) {
            throw new Error('Invalid engine or query');
        }

        return Utils.buildSearchUrl(engine.url, query);
    }

    /**
     * Open search results in browser
     * @param {string} engineId - Engine ID
     * @param {string} query - Search query
     * @returns {Promise<void>}
     */
    async openSearch(engineId, query) {
        try {
            const engine = this.engineManager.getEngine(engineId);
            if (!engine) {
                throw new Error('Search engine not found');
            }

            const searchUrl = this.buildSearchUrl(engine, query);
            
            // Get user preferences for opening behavior
            const preferences = await this.dbManager.getPreferences();
            const target = preferences.openInNewTab ? '_blank' : '_self';
            
            window.open(searchUrl, target);
            
            // Add to search history
            await this.addToHistory(query, [engine]);

        } catch (error) {
            Utils.logError(error, 'Failed to open search');
            Utils.showNotification('Failed to open search', 'danger');
        }
    }

    /**
     * Quick search using default engine
     * @param {string} query - Search query
     * @returns {Promise<void>}
     */
    async quickSearch(query) {
        try {
            const defaultEngine = this.engineManager.getDefaultEngine();
            if (!defaultEngine) {
                throw new Error('No default search engine configured');
            }

            await this.openSearch(defaultEngine.id, query);
        } catch (error) {
            Utils.logError(error, 'Quick search failed');
            Utils.showNotification('Quick search failed', 'danger');
        }
    }

    /**
     * Search multiple engines and open all results
     * @param {string} query - Search query
     * @param {Array} engineIds - Array of engine IDs to search
     * @returns {Promise<void>}
     */
    async searchMultiple(query, engineIds = null) {
        try {
            const engines = engineIds 
                ? engineIds.map(id => this.engineManager.getEngine(id)).filter(Boolean)
                : this.engineManager.getActiveEngines();

            if (engines.length === 0) {
                throw new Error('No search engines selected');
            }

            // Get user preferences
            const preferences = await this.dbManager.getPreferences();
            const target = preferences.openInNewTab ? '_blank' : '_self';

            // Open search on all engines
            engines.forEach(engine => {
                const searchUrl = this.buildSearchUrl(engine, query);
                setTimeout(() => {
                    window.open(searchUrl, target);
                }, engines.indexOf(engine) * 100); // Stagger opening to avoid popup blocking
            });

            // Add to search history
            await this.addToHistory(query, engines);

            Utils.showNotification(`Opened search on ${engines.length} engines`, 'success');

        } catch (error) {
            Utils.logError(error, 'Multiple search failed');
            Utils.showNotification('Multiple search failed', 'danger');
        }
    }

    /**
     * Get search suggestions based on history
     * @param {string} query - Partial query
     * @param {number} limit - Maximum suggestions to return
     * @returns {Promise<Array>} Array of suggestions
     */
    async getSearchSuggestions(query, limit = 5) {
        try {
            if (!query || query.length < 2) {
                return [];
            }

            const history = await this.dbManager.getSearchHistory(100);
            const searchTerm = query.toLowerCase();
            
            // Filter and score suggestions
            const suggestions = history
                .filter(item => item.query.toLowerCase().includes(searchTerm))
                .map(item => ({
                    query: item.query,
                    timestamp: item.timestamp,
                    score: this.calculateSuggestionScore(item.query, query)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(item => item.query);

            // Remove duplicates while preserving order
            return [...new Set(suggestions)];

        } catch (error) {
            Utils.logError(error, 'Failed to get search suggestions');
            return [];
        }
    }

    /**
     * Calculate suggestion score based on relevance
     * @param {string} suggestion - Suggestion text
     * @param {string} query - User query
     * @returns {number} Relevance score
     * @private
     */
    calculateSuggestionScore(suggestion, query) {
        const suggestionLower = suggestion.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // Exact match gets highest score
        if (suggestionLower === queryLower) {
            return 100;
        }
        
        // Starts with query gets high score
        if (suggestionLower.startsWith(queryLower)) {
            return 80;
        }
        
        // Contains query gets medium score
        if (suggestionLower.includes(queryLower)) {
            return 60;
        }
        
        // Word boundary match gets lower score
        const words = queryLower.split(' ');
        let wordMatches = 0;
        for (const word of words) {
            if (suggestionLower.includes(word)) {
                wordMatches++;
            }
        }
        
        return (wordMatches / words.length) * 40;
    }

    /**
     * Add search to history
     * @param {string} query - Search query
     * @param {Array} engines - Engines used for search
     * @returns {Promise<void>}
     * @private
     */
    async addToHistory(query, engines) {
        try {
            const preferences = await this.dbManager.getPreferences();
            if (!preferences.enableHistory) {
                return;
            }

            // Add each engine search to history
            for (const engine of engines) {
                await this.dbManager.addSearchHistory(query, engine.id);
            }

        } catch (error) {
            Utils.logError(error, 'Failed to add to search history');
        }
    }

    /**
     * Process search results after all engines complete
     * @param {string} searchId - Search ID
     * @param {Array} results - Array of settled promises
     * @private
     */
    processSearchResults(searchId, results) {
        if (this.currentSearchId !== searchId) {
            return; // Ignore outdated results
        }

        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;

        // Emit completion event
        this.emitSearchComplete(searchId, {
            total: results.length,
            successful,
            failed,
            results: Array.from(this.searchResults.values())
        });
    }

    /**
     * Emit search result event
     * @param {string} searchId - Search ID
     * @param {string} engineId - Engine ID
     * @param {Object} result - Search result
     * @private
     */
    emitSearchResult(searchId, engineId, result) {
        const event = new CustomEvent('searchResult', {
            detail: {
                searchId,
                engineId,
                result
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Emit search complete event
     * @param {string} searchId - Search ID
     * @param {Object} summary - Search summary
     * @private
     */
    emitSearchComplete(searchId, summary) {
        const event = new CustomEvent('searchComplete', {
            detail: {
                searchId,
                summary
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Cancel current search
     */
    cancelSearch() {
        this.currentSearchId = null;
        this.searchResults.clear();
        
        // Clear any pending timeouts
        this.searchTimeouts.forEach(timeout => clearTimeout(timeout));
        this.searchTimeouts.clear();
    }

    /**
     * Get current search results
     * @returns {Map} Current search results
     */
    getCurrentResults() {
        return new Map(this.searchResults);
    }

    /**
     * Clear search results
     */
    clearResults() {
        this.searchResults.clear();
        this.currentSearchId = null;
    }

    /**
     * Validate search query
     * @param {string} query - Query to validate
     * @returns {Object} Validation result
     */
    validateQuery(query) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!query || typeof query !== 'string') {
            result.valid = false;
            result.errors.push('Query must be a non-empty string');
            return result;
        }

        const trimmedQuery = query.trim();
        
        if (trimmedQuery.length === 0) {
            result.valid = false;
            result.errors.push('Query cannot be empty');
        }

        if (trimmedQuery.length > 1000) {
            result.valid = false;
            result.errors.push('Query is too long (maximum 1000 characters)');
        }

        if (trimmedQuery.length < 2) {
            result.warnings.push('Very short queries may not return good results');
        }

        // Check for potentially problematic characters
        const problematicChars = /[<>]/;
        if (problematicChars.test(trimmedQuery)) {
            result.warnings.push('Query contains special characters that may affect results');
        }

        return result;
    }

    /**
     * Get popular search queries from history
     * @param {number} limit - Maximum queries to return
     * @returns {Promise<Array>} Popular queries
     */
    async getPopularQueries(limit = 10) {
        try {
            const history = await this.dbManager.getSearchHistory(500);
            
            // Count query frequency
            const queryCount = {};
            history.forEach(item => {
                const query = item.query.toLowerCase();
                queryCount[query] = (queryCount[query] || 0) + 1;
            });

            // Sort by frequency and return top queries
            return Object.entries(queryCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([query, count]) => ({ query, count }));

        } catch (error) {
            Utils.logError(error, 'Failed to get popular queries');
            return [];
        }
    }

    /**
     * Export search history
     * @returns {Promise<Object>} Search history data
     */
    async exportSearchHistory() {
        try {
            const history = await this.dbManager.getSearchHistory();
            return {
                exportedAt: new Date().toISOString(),
                totalEntries: history.length,
                history: history.map(item => ({
                    query: item.query,
                    engine: item.engine,
                    timestamp: item.timestamp
                }))
            };
        } catch (error) {
            Utils.logError(error, 'Failed to export search history');
            throw error;
        }
    }
}