/**
 * backend/core/services/CartService.js
 * 🟢 PURE - Singleton pattern with dependency injection
 * 
 * ✅ NO localStorage coupling
 * ✅ NO browser APIs
 * ✅ Framework-agnostic
 * ✅ Storage injected at runtime
 */

const Observer = require('../patterns/Observer');

class CartService {
  static #instance = null;
  static #storage = null; // Will be injected
  static #currentUserEmail = null;

  #items = [];
  #userObserver = null;

  /**
   * Private constructor - use getInstance()
   */
  constructor() {
    if (CartService.#instance !== null) {
      throw new Error('❌ CartService is Singleton. Use getInstance() instead');
    }
    this.#userObserver = new Observer();
    console.log('✅ [CartService] Singleton instance created');
  }

  /**
   * ✅ PURE: Get singleton instance
   */
  static getInstance() {
    if (CartService.#instance === null) {
      CartService.#instance = new CartService();
    }
    return CartService.#instance;
  }

  /**
   * ✅ DEPENDENCY INJECTION: Set storage implementation
   * Can be localStorage, Redis, memory, etc.
   * @param {IStorage} storage - Storage implementation
   */
  static setStorage(storage) {
    if (!storage || typeof storage.get !== 'function') {
      throw new Error('❌ Invalid storage implementation');
    }
    CartService.#storage = storage;
    console.log('✅ [CartService] Storage injected:', storage.constructor.name);
  }

  /**
   * ✅ PURE: Set current user (for multi-user support)
   * @param {string} email - User email
   */
  static async setCurrentUser(email) {
    CartService.#currentUserEmail = email;
    const instance = CartService.getInstance();
    await instance.#loadFromStorage();
    console.log(`✅ [CartService] User switched to: ${email}`);
  }

  /**
   * ✅ PURE: Load cart from storage
   */
  async #loadFromStorage() {
    if (!CartService.#storage) {
      console.warn('⚠️ [CartService] Storage not configured, using empty cart');
      this.#items = [];
      return;
    }

    try {
      const storageKey = this.#getStorageKey();
      const data = await CartService.#storage.get(storageKey);
      this.#items = data ? JSON.parse(data) : [];
      console.log(`📦 [CartService] Loaded ${this.#items.length} items`);
    } catch (error) {
      console.error('❌ [CartService] Load failed:', error.message);
      this.#items = [];
    }
  }

  /**
   * ✅ PURE: Save cart to storage
   */
  async #saveToStorage() {
    if (!CartService.#storage) {
      console.warn('⚠️ [CartService] Storage not configured, skipping save');
      return;
    }

    try {
      const storageKey = this.#getStorageKey();
      await CartService.#storage.set(storageKey, JSON.stringify(this.#items));
      console.log('💾 [CartService] Saved to storage');
      this.#userObserver.notify({ type: 'cart:changed', data: this.#items });
    } catch (error) {
      console.error('❌ [CartService] Save failed:', error.message);
    }
  }

  /**
   * ✅ PURE: Get storage key (user-specific)
   */
  #getStorageKey() {
    const user = CartService.#currentUserEmail || 'anonymous';
    return `cart-items-${user.toLowerCase()}`;
  }

  /**
   * ✅ PURE: Add item to cart
   */
  async addToCart(item) {
    if (!item || !item.id) {
      throw new Error('❌ Item must have id property');
    }

    const existing = this.#items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      this.#items.push({ ...item, quantity: item.quantity || 1 });
    }

    await this.#saveToStorage();
    console.log(`➕ [CartService] Added: ${item.id}`);
  }

  /**
   * ✅ PURE: Remove item from cart
   */
  async removeFromCart(itemId) {
    const index = this.#items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.#items.splice(index, 1);
      await this.#saveToStorage();
      console.log(`➖ [CartService] Removed: ${itemId}`);
    }
  }

  /**
   * ✅ PURE: Update item quantity
   */
  async updateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      await this.removeFromCart(itemId);
      return;
    }

    const item = this.#items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      await this.#saveToStorage();
      console.log(`🔄 [CartService] Updated quantity: ${itemId} -> ${quantity}`);
    }
  }

  /**
   * ✅ PURE: Get all items
   */
  getItems() {
    return [...this.#items]; // ✅ Return copy to prevent external mutation
  }

  /**
   * ✅ PURE: Get cart total
   */
  getTotal() {
    return this.#items.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
  }

  /**
   * ✅ PURE: Clear cart
   */
  async clearCart() {
    this.#items = [];
    await this.#saveToStorage();
    console.log('🧹 [CartService] Cart cleared');
  }

  /**
   * ✅ PURE: Subscribe to cart changes
   */
  subscribe(callback) {
    return this.#userObserver.subscribe(callback);
  }

  /**
   * ✅ PURE: Check if item exists in cart
   */
  hasItem(itemId) {
    return this.#items.some(i => i.id === itemId);
  }

  /**
   * ✅ PURE: Get item count
   */
  getItemCount() {
    return this.#items.length;
  }
}

module.exports = CartService;
