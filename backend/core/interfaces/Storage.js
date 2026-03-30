/**
 * backend/core/interfaces/Storage.js
 * 🟢 PURE - Storage interface (framework-agnostic)
 * 
 * Defines contract for any storage implementation.
 * Can be localStorage, Redis, memory store, etc.
 */

class IStorage {
  /**
   * Get value from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored value
   */
  async get(key) {
    throw new Error('get() must be implemented');
  }

  /**
   * Set value in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    throw new Error('set() must be implemented');
  }

  /**
   * Remove value from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    throw new Error('remove() must be implemented');
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('clear() must be implemented');
  }
}

module.exports = IStorage;
