/**
 * backend/core/adapters/LocalStorageAdapter.js
 * 🔗 ADAPTER - Browser localStorage implementation
 * 
 * Adapts IStorage interface to browser localStorage.
 * Works in browser environments only.
 */

const IStorage = require('../interfaces/Storage');

class LocalStorageAdapter extends IStorage {
  /**
   * Get value from localStorage
   */
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ [LocalStorageAdapter] Get failed:', error.message);
      return null;
    }
  }

  /**
   * Set value in localStorage
   */
  async set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('❌ [LocalStorageAdapter] Set failed:', error.message);
    }
  }

  /**
   * Remove value from localStorage
   */
  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('❌ [LocalStorageAdapter] Remove failed:', error.message);
    }
  }

  /**
   * Clear all localStorage
   */
  async clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('❌ [LocalStorageAdapter] Clear failed:', error.message);
    }
  }
}

module.exports = LocalStorageAdapter;
