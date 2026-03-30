/**
 * backend/core/adapters/MemoryStorageAdapter.js
 * 🔗 ADAPTER - In-memory storage implementation
 * 
 * Adapts IStorage interface to a simple in-memory Map.
 * Works in any JavaScript environment (Node.js, browsers, etc.)
 * Perfect for testing and non-persistent scenarios.
 */

const IStorage = require('../interfaces/Storage');
const Singleton = require('../patterns/Singleton');

class MemoryStorageAdapter extends IStorage {
  #cache = new Map();

  /**
   * Create instance - use getInstance for singleton
   */
  constructor() {
    super();
    console.log('✅ [MemoryStorageAdapter] Created');
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    return Singleton.getInstance(MemoryStorageAdapter);
  }

  /**
   * Get value from memory
   */
  async get(key) {
    try {
      const value = this.#cache.get(key);
      return value || null;
    } catch (error) {
      console.error('❌ [MemoryStorageAdapter] Get failed:', error.message);
      return null;
    }
  }

  /**
   * Set value in memory
   */
  async set(key, value) {
    try {
      this.#cache.set(key, value);
    } catch (error) {
      console.error('❌ [MemoryStorageAdapter] Set failed:', error.message);
    }
  }

  /**
   * Remove value from memory
   */
  async remove(key) {
    try {
      this.#cache.delete(key);
    } catch (error) {
      console.error('❌ [MemoryStorageAdapter] Remove failed:', error.message);
    }
  }

  /**
   * Clear all memory storage
   */
  async clear() {
    try {
      this.#cache.clear();
    } catch (error) {
      console.error('❌ [MemoryStorageAdapter] Clear failed:', error.message);
    }
  }

  /**
   * Get all stored data (for debugging)
   */
  getAll() {
    return Object.fromEntries(this.#cache);
  }

  /**
   * Reset to empty state (for testing)
   */
  reset() {
    this.#cache.clear();
  }
}

module.exports = MemoryStorageAdapter;
