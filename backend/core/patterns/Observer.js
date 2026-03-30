/**
 * backend/core/patterns/Observer.js
 * 🟢 PURE - Generic Observer pattern (framework-agnostic)
 * 
 * Implements Subject-Observer pattern for decoupled event handling.
 * Works without React, Express, or any framework.
 */

class Observer {
  /**
   * Create new Observer instance
   */
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Subscribe observer to events
   * @param {Function} callback - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.listeners.add(callback);
    console.log(`✅ [Observer] Listener subscribed. Total: ${this.listeners.size}`);

    // Return unsubscribe function
    return () => this.unsubscribe(callback);
  }

  /**
   * Unsubscribe observer from events
   * @param {Function} callback - Listener function to remove
   */
  unsubscribe(callback) {
    this.listeners.delete(callback);
    console.log(`❌ [Observer] Listener unsubscribed. Total: ${this.listeners.size}`);
  }

  /**
   * Notify all observers
   * @param {any} data - Data to pass to observers
   */
  notify(data) {
    console.log(`📢 [Observer] Notifying ${this.listeners.size} listeners`);

    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error('❌ [Observer] Error in listener:', error.message);
      }
    }
  }

  /**
   * Remove all listeners
   */
  clear() {
    this.listeners.clear();
    console.log('🧹 [Observer] All listeners cleared');
  }

  /**
   * Get number of listeners
   */
  getListenerCount() {
    return this.listeners.size;
  }
}

module.exports = Observer;
