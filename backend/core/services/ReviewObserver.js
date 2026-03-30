/**
 * backend/core/services/ReviewObserver.js
 * 🟢 PURE - WebSocket review observer (framework-agnostic)
 * 
 * ✅ NO React dependencies
 * ✅ NO Express dependencies
 * ✅ Works in any environment
 * ✅ Can be wrapped later with adapters
 */

const Observer = require('../patterns/Observer');

class ReviewObserver {
  static #instance = null;
  #productSubscriptions = new Map(); // productId -> Observer instance

  /**
   * Private constructor - use getInstance()
   */
  constructor() {
    if (ReviewObserver.#instance !== null) {
      throw new Error('❌ ReviewObserver is Singleton');
    }
    console.log('✅ [ReviewObserver] Singleton instance created');
  }

  /**
   * ✅ PURE: Get singleton instance
   */
  static getInstance() {
    if (ReviewObserver.#instance === null) {
      ReviewObserver.#instance = new ReviewObserver();
    }
    return ReviewObserver.#instance;
  }

  /**
   * ✅ PURE: Subscribe to reviews for a product
   * @param {string|number} productId - Product ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToProduct(productId, callback) {
    const observer = this.#getOrCreateObserver(productId);
    return observer.subscribe(callback);
  }

  /**
   * ✅ PURE: Broadcast new review
   * @param {string|number} productId - Product ID
   * @param {Object} review - Review data
   */
  broadcastNewReview(productId, review) {
    const observer = this.#getOrCreateObserver(productId);
    observer.notify({
      type: 'review:new',
      data: review,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * ✅ PURE: Broadcast updated review
   */
  broadcastUpdateReview(productId, review) {
    const observer = this.#getOrCreateObserver(productId);
    observer.notify({
      type: 'review:updated',
      data: review,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * ✅ PURE: Broadcast deleted review
   */
  broadcastDeleteReview(productId, reviewId) {
    const observer = this.#getOrCreateObserver(productId);
    observer.notify({
      type: 'review:deleted',
      data: { id: reviewId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * ✅ PURE: Get or create observer for product
   */
  #getOrCreateObserver(productId) {
    const key = String(productId);

    if (!this.#productSubscriptions.has(key)) {
      this.#productSubscriptions.set(key, new Observer());
      console.log(`✅ [ReviewObserver] Created observer for product: ${productId}`);
    }

    return this.#productSubscriptions.get(key);
  }

  /**
   * ✅ PURE: Unsubscribe from product
   */
  unsubscribeFromProduct(productId) {
    const key = String(productId);
    this.#productSubscriptions.delete(key);
    console.log(`❌ [ReviewObserver] Unsubscribed from product: ${productId}`);
  }

  /**
   * ✅ PURE: Get subscription count for product
   */
  getSubscriptionCount(productId) {
    const key = String(productId);
    const observer = this.#productSubscriptions.get(key);
    return observer ? observer.getListenerCount() : 0;
  }

  /**
   * ✅ PURE: Get all subscribed products
   */
  getSubscribedProducts() {
    return Array.from(this.#productSubscriptions.keys());
  }

  /**
   * ✅ PURE: Clear all subscriptions
   */
  clearAll() {
    this.#productSubscriptions.clear();
    console.log('🧹 [ReviewObserver] All subscriptions cleared');
  }
}

module.exports = ReviewObserver;
