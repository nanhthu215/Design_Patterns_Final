/**
 * backend/core/patterns/Singleton.js
 * 🟢 PURE - Generic Singleton pattern (framework-agnostic)
 * 
 * Ensures only ONE instance of a class exists.
 * Works in Node.js, browsers, or any JavaScript environment.
 */

class Singleton {
  static #instances = new Map();

  /**
   * Get or create singleton instance
   * @param {Function} TargetClass - Class to instantiate once
   * @param {...any} args - Constructor arguments
   * @returns {Object} Singleton instance
   */
  static getInstance(TargetClass, ...args) {
    const className = TargetClass.name;

    if (!Singleton.#instances.has(className)) {
      const instance = new TargetClass(...args);
      Singleton.#instances.set(className, instance);
      console.log(`✅ [Singleton] Created instance: ${className}`);
    }

    return Singleton.#instances.get(className);
  }

  /**
   * Force create new instance (for testing)
   * @param {Function} TargetClass - Class to reset
   */
  static reset(TargetClass) {
    const className = TargetClass.name;
    Singleton.#instances.delete(className);
    console.log(`🔄 [Singleton] Reset instance: ${className}`);
  }

  /**
   * Get all active instances
   * @returns {Map} All singleton instances
   */
  static getAllInstances() {
    return new Map(Singleton.#instances);
  }
}

module.exports = Singleton;
