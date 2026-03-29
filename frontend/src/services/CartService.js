/**
 * ✅ SINGLETON PATTERN - True Implementation for Shopping Cart Management
 * frontend/src/services/CartService.js
 * 
 * Ensures only ONE instance of CartService exists throughout the application lifecycle
 * Manages cart state with persistence and real-time cross-tab synchronization
 */

class CartService {
  // ✅ Static property to hold the single instance
  static #instance = null;

  // ✅ Static property to hold cart items
  static #items = [];

  // ✅ Storage key for persistence
  static #STORAGE_KEY = 'cart-items-singleton';

  // ✅ Observer listeners for state changes
  static #listeners = new Set();

  /**
   * ✅ SINGLETON: Private constructor prevents instantiation
   * Only getInstance() can create instance
   */
  constructor() {
    if (CartService.#instance !== null) {
      throw new Error('❌ CartService is a Singleton. Use getInstance() instead of new CartService()');
    }
    this.#init();
  }

  /**
   * ✅ SINGLETON: getInstance() - Returns the single instance
   * Creates instance on first call, returns same instance on subsequent calls
   */
  static getInstance() {
    if (CartService.#instance === null) {
      CartService.#instance = new CartService();
      CartService.#loadFromStorage();
      CartService.#setupStorageListener();
    }
    return CartService.#instance;
  }

  /**
   * Initialize CartService
   */
  #init() {
    console.log('✅ [CartService Singleton] Initialized - Single instance created');
  }

  /**
   * Load cart items from localStorage on init
   */
  static #loadFromStorage() {
    try {
      const stored = localStorage.getItem(CartService.#STORAGE_KEY);
      CartService.#items = stored ? JSON.parse(stored) : [];
      console.log(`📦 [CartService] Loaded ${CartService.#items.length} items from storage`);
    } catch (error) {
      console.error('❌ [CartService] Error loading from storage:', error);
      CartService.#items = [];
    }
  }

  /**
   * Save cart items to localStorage
   */
  static #saveToStorage() {
    try {
      localStorage.setItem(CartService.#STORAGE_KEY, JSON.stringify(CartService.#items));
    } catch (error) {
      console.error('❌ [CartService] Error saving to storage:', error);
    }
  }

  /**
   * ✅ OBSERVER PATTERN: Setup cross-tab synchronization via storage events
   */
  static #setupStorageListener() {
    const handleStorageChange = (event) => {
      if (event.key === CartService.#STORAGE_KEY && event.newValue) {
        try {
          CartService.#items = JSON.parse(event.newValue);
          console.log('🔄 [CartService Observer] Cart synced from another tab');
          CartService.#notifyListeners('CART_SYNCED', CartService.#items);
        } catch (error) {
          console.error('❌ [CartService Observer] Sync error:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    console.log('👁️ [CartService Observer] Storage listener attached');
  }

  /**
   * ✅ OBSERVER PATTERN: Subscribe to cart changes
   * @param {Function} callback - Function to call when cart updates
   * @returns {Function} Unsubscribe function
   */
  static subscribe(callback) {
    CartService.#listeners.add(callback);
    console.log(`📍 [CartService] Listener added (total: ${CartService.#listeners.size})`);

    // Return unsubscribe function
    return () => {
      CartService.#listeners.delete(callback);
      console.log(`📍 [CartService] Listener removed (total: ${CartService.#listeners.size})`);
    };
  }

  /**
   * Notify all observers of state change
   */
  static #notifyListeners(type, data) {
    CartService.#listeners.forEach((callback) => {
      try {
        callback({ type, data });
      } catch (error) {
        console.error('❌ [CartService Observer] Callback error:', error);
      }
    });
  }

  /**
   * Get all cart items
   */
  static getItems() {
    return [...CartService.#items]; // Return copy to prevent external mutation
  }

  /**
   * Get cart item count
   */
  static getItemCount() {
    return CartService.#items.length;
  }

  /**
   * Get total quantity of all items
   */
  static getTotalQuantity() {
    return CartService.#items.reduce((sum, item) => sum + (item.qty || 1), 0);
  }

  /**
   * Add item to cart
   */
  static addToCart(payload) {
    if (!payload || !payload.productId) {
      console.error('❌ [CartService] Invalid payload');
      return null;
    }

    const key = payload.key || `${payload.productId}-${payload.variant?.name || 'default'}`;
    const existing = CartService.#items.find((it) => it.key === key);

    if (existing) {
      // ✅ Increment quantity if item exists
      existing.qty = (existing.qty || 1) + (payload.qty || 1);
      console.log(`➕ [CartService] Increased qty for ${key}`);
    } else {
      // ✅ Add new item
      CartService.#items.push({
        key,
        ...payload,
        qty: payload.qty || 1,
      });
      console.log(`✅ [CartService] Added item: ${key}`);
    }

    CartService.#saveToStorage();
    CartService.#notifyListeners('ITEM_ADDED', CartService.#items);
    return CartService.getItems();
  }

  /**
   * Remove item from cart
   */
  static removeFromCart(key) {
    const initialLength = CartService.#items.length;
    CartService.#items = CartService.#items.filter((it) => it.key !== key);

    if (CartService.#items.length < initialLength) {
      console.log(`🗑️ [CartService] Removed item: ${key}`);
      CartService.#saveToStorage();
      CartService.#notifyListeners('ITEM_REMOVED', CartService.#items);
    }
    return CartService.getItems();
  }

  /**
   * Update item quantity
   */
  static updateQty(key, newQty) {
    const item = CartService.#items.find((it) => it.key === key);

    if (!item) {
      console.error(`❌ [CartService] Item not found: ${key}`);
      return null;
    }

    if (newQty <= 0) {
      return CartService.removeFromCart(key);
    }

    item.qty = newQty;
    console.log(`📝 [CartService] Updated qty for ${key} to ${newQty}`);
    CartService.#saveToStorage();
    CartService.#notifyListeners('QTY_UPDATED', CartService.#items);
    return CartService.getItems();
  }

  /**
   * Clear all items from cart
   */
  static clearCart() {
    CartService.#items = [];
    console.log('🧹 [CartService] Cart cleared');
    CartService.#saveToStorage();
    CartService.#notifyListeners('CART_CLEARED', []);
    return [];
  }

  /**
   * Get single item
   */
  static findItem(key) {
    return CartService.#items.find((it) => it.key === key) || null;
  }

  /**
   * Update item variant (change option)
   */
  static updateItemVariant(key, variantData) {
    const item = CartService.#items.find((it) => it.key === key);

    if (!item) {
      console.error(`❌ [CartService] Item not found: ${key}`);
      return null;
    }

    Object.assign(item, variantData);
    console.log(`🎨 [CartService] Updated variant for ${key}`);
    CartService.#saveToStorage();
    CartService.#notifyListeners('VARIANT_UPDATED', CartService.#items);
    return CartService.getItems();
  }

  /**
   * Get cart summary (total price, total items, etc)
   */
  static getCartSummary() {
    const totalItems = CartService.getTotalQuantity();
    const totalPrice = CartService.#items.reduce(
      (sum, item) => sum + ((item.price || 0) * (item.qty || 1)),
      0
    );

    return {
      itemCount: CartService.getItemCount(),
      totalQuantity: totalItems,
      totalPrice,
      isEmpty: CartService.#items.length === 0,
    };
  }

  /**
   * Verify single instance (for debugging)
   */
  static verifyInstance() {
    const instance = CartService.getInstance();
    console.log('🔐 [CartService Singleton Verification]', {
      isSingleton: CartService.#instance === instance,
      instanceExists: CartService.#instance !== null,
      itemsCount: CartService.#items.length,
      listenersCount: CartService.#listeners.size,
    });
    return CartService.#instance === instance;
  }
}

export default CartService;
