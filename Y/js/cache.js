import { appConfig } from './config.js';

// Cache Manager Class
export class CacheManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.maxCacheSize = 50;
    }

    // Set cache with expiry
    set(key, data, expiry = appConfig.cacheExpiry) {
        const timestamp = Date.now();
        
        this.cache.set(key, data);
        this.cacheTimestamps.set(key, timestamp);
        
        // Clean up old entries if cache is too large
        if (this.cache.size > this.maxCacheSize) {
            this.cleanup();
        }
        
        // Save to localStorage for persistence
        this.saveToStorage(key, data, timestamp);
    }

    // Get from cache
    get(key) {
        const timestamp = this.cacheTimestamps.get(key);
        
        if (!timestamp) {
            // Try to load from localStorage
            return this.loadFromStorage(key);
        }
        
        // Check if expired
        if (Date.now() - timestamp > appConfig.cacheExpiry) {
            this.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    // Check if key exists and is not expired
    has(key) {
        const timestamp = this.cacheTimestamps.get(key);
        
        if (!timestamp) {
            // Check localStorage
            const stored = this.loadFromStorage(key);
            return stored !== null;
        }
        
        return Date.now() - timestamp <= appConfig.cacheExpiry;
    }

    // Delete from cache
    delete(key) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        localStorage.removeItem(`cache_${key}`);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        this.cacheTimestamps.clear();
        
        // Clear localStorage cache
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    }

    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, timestamp] of this.cacheTimestamps) {
            if (now - timestamp > appConfig.cacheExpiry) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.delete(key));
        
        // If still too large, remove oldest entries
        if (this.cache.size > this.maxCacheSize) {
            const sortedEntries = Array.from(this.cacheTimestamps.entries())
                .sort((a, b) => a[1] - b[1]);
            
            const toRemove = sortedEntries.slice(0, this.cache.size - this.maxCacheSize);
            toRemove.forEach(([key]) => this.delete(key));
        }
    }

    // Save to localStorage
    saveToStorage(key, data, timestamp) {
        try {
            const cacheData = {
                data: data,
                timestamp: timestamp
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    }

    // Load from localStorage
    loadFromStorage(key) {
        try {
            const stored = localStorage.getItem(`cache_${key}`);
            if (!stored) return null;
            
            const cacheData = JSON.parse(stored);
            
            // Check if expired
            if (Date.now() - cacheData.timestamp > appConfig.cacheExpiry) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            // Load into memory cache
            this.cache.set(key, cacheData.data);
            this.cacheTimestamps.set(key, cacheData.timestamp);
            
            return cacheData.data;
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
            return null;
        }
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create global cache manager instance
export const cacheManager = new CacheManager();

// Cache keys constants
export const CACHE_KEYS = {
    VOUCHERS: 'vouchers',
    TECHNICIANS: 'technicians',
    MONTHLY_TOTALS: 'monthly_totals',
    ANALYTICS_DATA: 'analytics_data',
    USER_PROFILE: 'user_profile'
};

// Utility functions for common caching patterns
export const cacheUtils = {
    // Cache with automatic refresh
    async getOrFetch(key, fetchFunction, expiry = appConfig.cacheExpiry) {
        const cached = cacheManager.get(key);
        if (cached) {
            return cached;
        }
        
        try {
            const data = await fetchFunction();
            cacheManager.set(key, data, expiry);
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Invalidate cache by pattern
    invalidatePattern(pattern) {
        const stats = cacheManager.getStats();
        stats.keys.forEach(key => {
            if (key.includes(pattern)) {
                cacheManager.delete(key);
            }
        });
    },

    // Preload data
    async preload(key, fetchFunction) {
        try {
            const data = await fetchFunction();
            cacheManager.set(key, data);
            return data;
        } catch (error) {
            console.warn(`Failed to preload ${key}:`, error);
            return null;
        }
    }
};

export default cacheManager;

