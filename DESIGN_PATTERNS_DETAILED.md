# 🎨 DESIGN PATTERNS - UML CLASS DIAGRAMS & IMPLEMENTATION DETAILS

**Generated**: March 30, 2026  
**Focus**: 4 core design patterns với chi tiết attributes, methods, relationships

---

## 📋 TABLE OF CONTENTS

1. [Factory Pattern](#factory-pattern)
2. [Singleton Pattern](#singleton-pattern)
3. [Observer Pattern](#observer-pattern)
4. [Strategy Pattern](#strategy-pattern)
5. [Implementation Guide](#implementation-guide)
6. [Pattern Interactions](#pattern-interactions)

---

## 📌 OVERVIEW

| Pattern | Purpose | Main Class | File Location |
|---------|---------|-----------|---|
| **Factory** | Tạo đối tượng sản phẩm với thuộc tính riêng | ProductFactory | `backend/services/ProductFactory.js` |
| **Singleton** | Một phiên bản giỏ hàng duy nhất | CartService | `backend/core/services/CartService.js` |
| **Observer** | Tự động cập nhật UI khi giỏ thay đổi | Observer + CartService | `backend/core/patterns/Observer.js` |
| **Strategy** | Đa hình thức thanh toán | PaymentStrategy | `backend/strategies/` |

---

# Factory Pattern

## 🏭 Tạo Đối Tượng Sản Phẩm

### UML Class Diagram

```
ProductFactory (Static)
├─ createProduct(data) → Product
├─ createProductWithVariants(data) → Product
├─ createFeaturedProduct(data) → Product
├─ verifyProductData(data) → boolean
└─ enrichProductMetadata(product) → Product

Product
├─ id, name, price, quantity
├─ description, category, status
├─ variants[] (Variant[])
└─ timestamps (createdAt, updatedAt)

Variant
├─ name: String
├─ options[] (VariantOption[])
└─ priceDelta per option

VariantOption
├─ label: String
└─ priceDelta: Number
```

### Chi Tiết Implementations

#### **Class: ProductFactory**
**File**: `backend/services/ProductFactory.js`

```javascript
class ProductFactory {
  // Static Methods - Không cần instance
  static createProduct(data) {
    // Purpose: Tạo sản phẩm cơ bản
    // Validate dữ liệu
    if (!this._validateProductData(data)) {
      throw new Error('Invalid product data');
    }
    
    // Tạo product object
    const product = new Product();
    product.id = data.id;
    product.name = data.name;
    product.price = data.price;
    product.category = data.category;
    product.description = data.description;
    
    // Set default values
    product.status = data.status || 'Draft';
    product.quantity = data.quantity || 0;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    
    return product;
  }

  static createProductWithVariants(data) {
    // Purpose: Tạo sản phẩm với variants (kích cỡ, màu sắc, etc.)
    const product = this.createProduct(data);
    
    if (data.variants && Array.isArray(data.variants)) {
      product.variants = data.variants.map(v => ({
        name: v.name,
        options: v.options.map(opt => ({
          label: opt.label,
          priceDelta: opt.priceDelta || 0
        }))
      }));
    }
    
    // Calculate variant prices
    this._calculateVariantPrices(product.variants);
    
    return product;
  }

  static createFeaturedProduct(data) {
    // Purpose: Tạo sản phẩm nổi bật với metadata
    const product = this.createProductWithVariants(data);
    
    // Enrich metadata
    this.enrichProductMetadata(product);
    
    return product;
  }

  static verifyProductData(data) {
    // Purpose: Xác minh dữ liệu trước khi tạo
    return this._validateProductStructure(data) &&
           ProductValidator.validateName(data.name) &&
           ProductValidator.validatePrice(data.price) &&
           ProductValidator.validateCategory(data.category);
  }

  static enrichProductMetadata(product) {
    // Purpose: Thêm thông tin bổ sung
    product.seoTitle = product.name;
    product.slug = product.name.toLowerCase().replace(/\s+/g, '-');
    product.tags = this._extractTags(product.category);
    product.isFeatured = true;
    
    return product;
  }

  // Private Helper Methods
  static _validateProductStructure(data) {
    return data && 
           typeof data.name === 'string' &&
           typeof data.price === 'number' &&
           typeof data.category === 'string';
  }

  static _setDefaultValues(product) {
    if (!product.description) product.description = '';
    if (!product.quantity) product.quantity = 0;
    if (!product.status) product.status = 'Draft';
  }

  static _calculateVariantPrices(variants) {
    // Tính giá cuối cùng của từng variant
    variants?.forEach(variant => {
      variant.options?.forEach(option => {
        option.finalPrice = basePrice + option.priceDelta;
      });
    });
  }
}
```

#### **Class: ProductValidator**
**File**: `backend/services/ProductFactory.js` (hoặc tách riêng)

```javascript
class ProductValidator {
  static validateName(name) {
    // ✅ Tên phải: string, 3-100 ký tự, không null
    return typeof name === 'string' && 
           name.length >= 3 && 
           name.length <= 100;
  }

  static validatePrice(price) {
    // ✅ Giá phải: number, > 0, ≤ 999,999,999 VND
    return typeof price === 'number' && 
           price > 0 && 
           price <= 999999999;
  }

  static validateCategory(category) {
    // ✅ Danh mục phải: string, trong whitelist
    const validCategories = ['Electronics', 'Clothing', 'Books', ...];
    return validCategories.includes(category);
  }

  static validateSKU(sku) {
    // ✅ SKU phải: unique, format xyz-abc-123
    const skuRegex = /^[A-Z]{3}-[A-Z]{3}-\d{3}$/;
    return skuRegex.test(sku);
  }

  static validateVariants(variants) {
    // ✅ Variants phải: array, mỗi item có name + options
    if (!Array.isArray(variants)) return false;
    return variants.every(v => v.name && Array.isArray(v.options));
  }
}
```

#### **Class: ProductBuilder** (Optional - Builder Pattern)
**Purpose**: Tạo sản phẩm từng bước (fluent interface)

```javascript
class ProductBuilder {
  constructor() {
    this.product = new Product();
  }

  withName(name) {
    if (!ProductValidator.validateName(name)) {
      throw new Error('Invalid name');
    }
    this.product.name = name;
    return this; // Return this để chain methods
  }

  withPrice(price) {
    if (!ProductValidator.validatePrice(price)) {
      throw new Error('Invalid price');
    }
    this.product.price = price;
    return this;
  }

  withCategory(category) {
    if (!ProductValidator.validateCategory(category)) {
      throw new Error('Invalid category');
    }
    this.product.category = category;
    return this;
  }

  withVariants(variants) {
    if (!ProductValidator.validateVariants(variants)) {
      throw new Error('Invalid variants');
    }
    this.product.variants = variants;
    return this;
  }

  withDescription(description) {
    this.product.description = description;
    return this;
  }

  build() {
    // Final validation before returning
    if (!this.product.name || !this.product.price || !this.product.category) {
      throw new Error('Missing required fields');
    }
    
    this.product.createdAt = new Date();
    this.product.updatedAt = new Date();
    
    return this.product;
  }
}
```

### Usage Example

```javascript
// Cách 1: Dùng Factory - Simple
const product1 = ProductFactory.createProduct({
  id: 1,
  name: 'iPhone 15',
  price: 999,
  category: 'Electronics',
  description: 'Latest iPhone'
});

// Cách 2: Factory with Variants
const product2 = ProductFactory.createProductWithVariants({
  id: 2,
  name: 'T-Shirt',
  price: 50,
  category: 'Clothing',
  variants: [
    {
      name: 'Size',
      options: [
        { label: 'Small', priceDelta: 0 },
        { label: 'Large', priceDelta: 10 }
      ]
    },
    {
      name: 'Color',
      options: [
        { label: 'Red', priceDelta: 0 },
        { label: 'Blue', priceDelta: 0 }
      ]
    }
  ]
});

// Cách 3: Builder Pattern - Fluent
const product3 = new ProductBuilder()
  .withName('Laptop')
  .withPrice(1200)
  .withCategory('Electronics')
  .withDescription('High-performance laptop')
  .withVariants([...])
  .build();

// Validate trước tạo
if (ProductFactory.verifyProductData(productData)) {
  const validProduct = ProductFactory.createFeaturedProduct(productData);
}
```

### Benefits

✅ **Encapsulation**: Logic tạo đối tượng tập trung 1 chỗ
✅ **Validation**: Tự động kiểm tra dữ liệu
✅ **Flexibility**: Dễ thêm loại sản phẩm mới
✅ **Reusability**: Tái sử dụng cho nhiều quá trình tạo
✅ **Consistency**: Tất cả sản phẩm đều đúng format

---

# Singleton Pattern

## 🛒 Một Giỏ Hàng Duy Nhất

### UML Class Diagram

```
CartService (Singleton)
├─ STATIC:
│  └─ getInstance() → CartService (chỉ 1 instance)
│
├─ PRIVATE ATTRIBUTES:
│  ├─ #instance: CartService
│  ├─ #storage: IStorage (injected)
│  ├─ #currentUser: string
│  ├─ #items: CartItem[]
│  ├─ #userObserver: Observer
│  ├─ #watchers: Map<email, observers>
│  └─ #lastUpdated: Date
│
├─ PUBLIC METHODS:
│  ├─ getInstance(): CartService
│  ├─ setStorage(storage): void
│  ├─ setCurrentUser(userId): void
│  ├─ addToCart(product): void
│  ├─ removeFromCart(productId): void
│  ├─ updateQuantity(productId, qty): void
│  ├─ getItems(): CartItem[]
│  ├─ getTotal(): Number
│  ├─ getItemCount(): Number
│  ├─ clearCart(): void
│  ├─ isEmpty(): boolean
│  ├─ hasItem(productId): boolean
│  ├─ subscribe(callback): Function
│  └─ unsubscribe(callback): Function
│
└─ PRIVATE METHODS:
   ├─ #notifySubscribers(): void
   ├─ #saveToStorage(): void
   └─ #loadFromStorage(): void
```

### Chi Tiết Implementation

#### **Class: CartService**
**File**: `backend/core/services/CartService.js`

```javascript
class CartService {
  // PRIVATE STATIC - Chỉ 1 instance
  static #instance = null;

  // PRIVATE INSTANCE ATTRIBUTES
  #storage;
  #currentUser;
  #items = [];
  #userObserver;
  #watchers = new Map(); // Per-user watchers
  #lastUpdated;

  // PRIVATE CONSTRUCTOR - Không thể new CartService()
  private constructor() {
    this.#items = [];
    this.#userObserver = new Observer();
    this.#currentUser = null;
    this.#lastUpdated = new Date();
  }

  // ========== STATIC SINGLETON METHODS ==========

  static getInstance() {
    // Purpose: Lấy instance duy nhất
    if (CartService.#instance === null) {
      CartService.#instance = new CartService();
      console.log('✅ CartService Singleton created');
    }
    return CartService.#instance;
  }

  // ========== SETUP & CONFIGURATION ==========

  setStorage(storageAdapter) {
    // Purpose: Inject storage adapter (no hardcoding)
    if (!storageAdapter || typeof storageAdapter.get !== 'function') {
      throw new Error('Invalid storage adapter');
    }
    this.#storage = storageAdapter;
    this.#loadFromStorage();
    console.log('✅ Storage adapter injected:', storageAdapter.constructor.name);
    return this;
  }

  setCurrentUser(userId) {
    // Purpose: Thiết lập user hiện tại cho multi-user support
    if (!userId) {
      console.warn('⚠️ Setting currentUser to null');
    }
    this.#currentUser = userId;
    console.log(`👤 Current user set: ${userId}`);
    
    // Load user's cart if exists
    if (userId) {
      this.#loadFromStorage();
    }
    return this;
  }

  // ========== CART OPERATIONS ==========

  addToCart(product) {
    // Purpose: Thêm sản phẩm vào giỏ
    // Validate
    if (!product || !product.id) {
      throw new Error('Invalid product');
    }

    // Check if exists
    const existingItem = this.#items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if product already in cart
      existingItem.quantity += (product.quantity || 1);
      existingItem.subtotal = existingItem.price * existingItem.quantity;
      console.log(`🔄 Updated quantity for ${product.name}: ${existingItem.quantity}`);
    } else {
      // Add new item
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        variant: product.variant || null,
        subtotal: product.price * (product.quantity || 1),
        addedAt: new Date()
      };
      
      this.#items.push(cartItem);
      console.log(`✅ Added ${product.name} to cart`);
    }

    this.#lastUpdated = new Date();
    this.#saveToStorage();
    this.#notifySubscribers(); // Notify all observers
    
    return this;
  }

  removeFromCart(productId) {
    // Purpose: Xóa sản phẩm khỏi giỏ
    const initialCount = this.#items.length;
    this.#items = this.#items.filter(item => item.productId !== productId);
    
    if (this.#items.length < initialCount) {
      console.log(`✅ Removed product from cart`);
      this.#lastUpdated = new Date();
      this.#saveToStorage();
      this.#notifySubscribers();
    } else {
      console.warn('⚠️ Product not found in cart');
    }
    
    return this;
  }

  updateQuantity(productId, quantity) {
    // Purpose: Cập nhật số lượng sản phẩm
    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    const item = this.#items.find(item => item.productId === productId);
    
    if (!item) {
      console.warn('⚠️ Product not found in cart');
      return this;
    }

    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    
    this.#lastUpdated = new Date();
    this.#saveToStorage();
    this.#notifySubscribers();
    
    console.log(`✅ Updated quantity to ${quantity}`);
    return this;
  }

  // ========== CART QUERIES ==========

  getItems() {
    // Purpose: Lấy danh sách items
    return [...this.#items]; // Return copy, not reference
  }

  getTotal() {
    // Purpose: Tính tổng giá
    return this.#items.reduce((total, item) => total + item.subtotal, 0);
  }

  getItemCount() {
    // Purpose: Đếm tổng số sản phẩm
    return this.#items.reduce((count, item) => count + item.quantity, 0);
  }

  isEmpty() {
    // Purpose: Kiểm tra giỏ có trống không
    return this.#items.length === 0;
  }

  hasItem(productId) {
    // Purpose: Kiểm tra sản phẩm có trong giỏ không
    return this.#items.some(item => item.productId === productId);
  }

  clearCart() {
    // Purpose: Xóa tất cả items
    this.#items = [];
    this.#lastUpdated = new Date();
    this.#saveToStorage();
    this.#notifySubscribers();
    console.log('✅ Cart cleared');
    return this;
  }

  // ========== OBSERVER PATTERN INTEGRATION ==========

  subscribe(callback) {
    // Purpose: Subscribe vào cart changes
    // Return unsubscribe function
    return this.#userObserver.subscribe(callback);
  }

  unsubscribe(callback) {
    // Purpose: Unsubscribe khỏi cart changes
    return this.#userObserver.unsubscribe(callback);
  }

  #notifySubscribers() {
    // Purpose: Thông báo tất cả subscribers về thay đổi
    const data = {
      items: this.getItems(),
      total: this.getTotal(),
      itemCount: this.getItemCount(),
      isEmpty: this.isEmpty(),
      lastUpdated: this.#lastUpdated,
      user: this.#currentUser
    };

    // Notify in next tick to avoid sync issues
    setTimeout(() => {
      this.#userObserver.notify(data);
    }, 0);
  }

  // ========== STORAGE INTEGRATION ==========

  #saveToStorage() {
    // Purpose: Lưu giỏ vào storage
    if (!this.#storage) {
      console.warn('⚠️ Storage not configured');
      return;
    }

    const cartData = {
      items: this.#items,
      user: this.#currentUser,
      lastUpdated: this.#lastUpdated.toISOString()
    };

    try {
      this.#storage.set(`cart:${this.#currentUser}`, JSON.stringify(cartData));
      console.log('💾 Cart saved to storage');
    } catch (error) {
      console.error('❌ Save to storage failed:', error);
    }
  }

  #loadFromStorage() {
    // Purpose: Load giỏ từ storage
    if (!this.#storage || !this.#currentUser) {
      return;
    }

    try {
      const cartData = this.#storage.get(`cart:${this.#currentUser}`);
      if (cartData) {
        const parsed = JSON.parse(cartData);
        this.#items = parsed.items || [];
        console.log('📂 Cart loaded from storage');
      }
    } catch (error) {
      console.error('❌ Load from storage failed:', error);
      this.#items = [];
    }
  }

  // ========== DEBUG/UTILITY ==========

  getDebugInfo() {
    return {
      instance: 'CartService',
      currentUser: this.#currentUser,
      itemsCount: this.#items.length,
      total: this.getTotal(),
      subscribers: this.#userObserver.getSubscriberCount(),
      lastUpdated: this.#lastUpdated
    };
  }
}
```

### Usage Example

```javascript
// ✅ SINGLETON: Luôn lấy cùng 1 instance
const cart1 = CartService.getInstance();
const cart2 = CartService.getInstance();
console.log(cart1 === cart2); // true - Same instance!

// Setup với Storage Adapter (Dependency Injection)
const cart = CartService.getInstance();
cart.setStorage(new MemoryStorageAdapter()); // Hoặc LocalStorageAdapter
cart.setCurrentUser('user@email.com');

// Add products
cart.addToCart({ id: 1, name: 'iPhone', price: 999 });
cart.addToCart({ id: 2, name: 'Case', price: 29 });

// Subscribe to changes
const unsubscribe = cart.subscribe(data => {
  console.log('🛒 Cart updated:', data.itemCount, 'items');
  console.log('💰 Total:', data.total);
});

// Update quantity
cart.updateQuantity(1, 2);

// Unsubscribe
unsubscribe();

// Clear
cart.clearCart();
```

### Key Benefits

✅ **One Instance**: Chỉ có 1 giỏ hàng cho toàn ứng dụng
✅ **Thread-Safe**: Không có duplicate data
✅ **DI Support**: Storage adapter injected (extensible)
✅ **Cross-Tab Sync**: Nếu dùng LocalStorageAdapter
✅ **Observer Integration**: Tự động notify khi thay đổi
✅ **95/100 Pure**: Không hardcode framework

---

# Observer Pattern

## 📢 Tự Động Cập Nhật UI

### UML Class Diagram

```
Observer (Generic Pub-Sub)
├─ subscribers: Function[]
├─ subscribe(callback) → Function (unsubscribe handle)
├─ unsubscribe(callback) → void
├─ notify(data) → void
├─ getSubscriberCount() → Number
├─ pause() → void
└─ resume() → void

CartService
├─ #userObserver: Observer (internal)
└─ +subscribe(callback): Function
└─ +unsubscribe(callback): Function

UICartComponent (React)
├─ -cartService: CartService
├─ -itemsCount: Number
├─ -cartTotal: Number
├─ onComponentMount() → void (subscribe)
├─ handleCartUpdate(data) → void
├─ updateCartBadge() → void
└─ render() → JSX

ReviewObserver (Singleton)
├─ #productSubscriptions: Map<productId, Observer>
├─ subscribeToProduct(productId, callback)
├─ broadcastNewReview(productId, review)
├─ broadcastUpdateReview(productId, review)
└─ broadcastDeleteReview(productId, reviewId)
```

### Chi Tiết Implementation

#### **Class: Observer** (Generic Pub-Sub Pattern)
**File**: `backend/core/patterns/Observer.js`

```javascript
class Observer {
  #subscribers = [];
  #silent = false;
  #maxSubscribers = 1000; // Prevent memory leaks

  constructor() {
    this.#subscribers = [];
    this.#silent = false;
  }

  subscribe(callback) {
    // Purpose: Thêm callback vào danh sách subscribers
    // Return: Hàm để unsubscribe
    
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (this.#subscribers.length >= this.#maxSubscribers) {
      console.warn('⚠️ Max subscribers reached');
      return () => {}; // Return empty unsubscribe
    }

    this.#subscribers.push(callback);
    console.log(`✅ Subscriber added. Total: ${this.#subscribers.length}`);

    // Return unsubscribe function
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    // Purpose: Xóa callback khỏi danh sách
    const initialLength = this.#subscribers.length;
    
    this.#subscribers = this.#subscribers.filter(
      fn => fn !== callback
    );

    if (this.#subscribers.length < initialLength) {
      console.log(`✅ Subscriber removed. Total: ${this.#subscribers.length}`);
    }
  }

  notify(data) {
    // Purpose: Gọi tất cả callbacks với data
    if (this.#silent) {
      console.log('🔇 Notifications paused');
      return;
    }

    console.log(`📢 Notifying ${this.#subscribers.length} subscribers...`);
    
    this.#subscribers.forEach((callback, index) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Subscriber ${index} error:`, error);
        // Don't stop other subscribers
      }
    });
  }

  clear() {
    // Purpose: Xóa tất cả subscribers
    this.#subscribers = [];
    console.log('✅ All subscribers cleared');
  }

  getSubscriberCount() {
    // Purpose: Lấy số lượng subscribers
    return this.#subscribers.length;
  }

  pause() {
    // Purpose: Tạm dừng notifications
    this.#silent = true;
    console.log('⏸️ Observer paused');
  }

  resume() {
    // Purpose: Tiếp tục notifications
    this.#silent = false;
    console.log('▶️ Observer resumed');
  }
}
```

#### **Class: UICartComponent** (React Component)
**File**: `frontend/src/components/UICartComponent.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import CartService from '../services/CartService';

class UICartComponent extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      itemsCount: 0,
      cartTotal: 0,
      cartItems: [],
      isLoading: false
    };

    this.cartService = CartService.getInstance();
    this.unsubscribe = null;
  }

  componentDidMount() {
    // Purpose: Setup observer subscription khi component mount
    console.log('🔗 UICartComponent mounted - subscribing to cart changes');
    
    // Subscribe to cart changes
    this.unsubscribe = this.cartService.subscribe(
      this.handleCartUpdate.bind(this)
    );

    // Load initial cart state
    this.updateCartDisplay();
  }

  componentWillUnmount() {
    // Purpose: Cleanup subscription khi component unmount
    console.log('🔗 UICartComponent unmounted - unsubscribing');
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleCartUpdate(data) {
    // Purpose: Handle cart update notifications
    console.log('🛒 Cart update received:', data);
    
    // Update state - triggers re-render
    this.setState({
      itemsCount: data.itemCount,
      cartTotal: data.total,
      cartItems: data.items,
      isLoading: false
    });

    // Trigger UI updates
    this.updateCartBadge();
    this.updateCartTotal();
  }

  updateCartDisplay() {
    // Purpose: Get current cart state
    const cart = this.cartService.getItems();
    const total = this.cartService.getTotal();
    const count = this.cartService.getItemCount();

    this.setState({
      cartItems: cart,
      cartTotal: total,
      itemsCount: count
    });
  }

  updateCartBadge() {
    // Purpose: Update badge showing item count
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = this.state.itemsCount;
      badge.classList.add('updated'); // Trigger animation
    }
  }

  updateCartTotal() {
    // Purpose: Update display of total price
    const totalDisplay = document.querySelector('.cart-total');
    if (totalDisplay) {
      totalDisplay.textContent = `$${this.state.cartTotal.toFixed(2)}`;
      totalDisplay.classList.add('updated');
    }
  }

  render() {
    const { itemsCount, cartTotal, cartItems } = this.state;

    return (
      <div className="cart-container">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <span className="cart-badge">{itemsCount}</span>
        </div>

        {cartItems.length === 0 ? (
          <p className="empty-cart">Your cart is empty</p>
        ) : (
          <>
            <ul className="cart-items">
              {cartItems.map((item, index) => (
                <li key={index} className="cart-item">
                  <span>{item.name}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>${item.price}</span>
                  <button onClick={() => this.removeItem(item.productId)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="cart-total">
              Total: ${cartTotal.toFixed(2)}
            </div>

            <button className="checkout-btn">Proceed to Checkout</button>
          </>
        )}
      </div>
    );
  }

  removeItem(productId) {
    // Purpose: Remove item from cart
    // CartService will notify us through observer
    this.cartService.removeFromCart(productId);
    // No need to setState - observer will notify and update
  }
}

export default UICartComponent;
```

#### **Class: ReviewObserver** (Real-time Reviews)
**File**: `backend/core/services/ReviewObserver.js`

```javascript
class ReviewObserver {
  static #instance = null;
  #productSubscriptions = new Map();

  private constructor() {
    this.#productSubscriptions = new Map();
  }

  static getInstance() {
    if (!ReviewObserver.#instance) {
      ReviewObserver.#instance = new ReviewObserver();
    }
    return ReviewObserver.#instance;
  }

  subscribeToProduct(productId, callback) {
    // Purpose: Subscribe to reviews for specific product
    if (!this.#productSubscriptions.has(productId)) {
      this.#productSubscriptions.set(productId, new Observer());
    }

    const observer = this.#productSubscriptions.get(productId);
    return observer.subscribe(callback);
  }

  broadcastNewReview(productId, review) {
    // Purpose: Broadcast new review to all watchers
    console.log(`✅ Broadcasting new review for product ${productId}`);
    
    const observer = this.#productSubscriptions.get(productId);
    if (observer) {
      observer.notify({
        type: 'new',
        review: review,
        timestamp: new Date()
      });
    }
  }

  broadcastUpdateReview(productId, review) {
    // Purpose: Broadcast review update
    const observer = this.#productSubscriptions.get(productId);
    if (observer) {
      observer.notify({
        type: 'update',
        review: review,
        timestamp: new Date()
      });
    }
  }

  broadcastDeleteReview(productId, reviewId) {
    // Purpose: Broadcast review deletion
    const observer = this.#productSubscriptions.get(productId);
    if (observer) {
      observer.notify({
        type: 'delete',
        reviewId: reviewId,
        timestamp: new Date()
      });
    }
  }
}
```

### Usage Example

```javascript
// CartService + Observer Pattern
const cart = CartService.getInstance();
cart.setCurrentUser('user@email.com');

// Subscribe to cart changes
const unsubscribe = cart.subscribe(data => {
  console.log('🛒 Cart changed!');
  console.log('Items:', data.itemCount);
  console.log('Total:', data.total);
  
  // Update UI
  document.querySelector('.cart-badge').textContent = data.itemCount;
});

// When user adds product
cart.addToCart({ id: 1, name: 'iPhone', price: 999 });
// ➜ Automatically notifies observer
// ➜ UI updates instantly

// ReviewObserver Pattern
const reviewObserver = ReviewObserver.getInstance();

// Subscribe to product reviews
const unsubscribeReview = reviewObserver.subscribeToProduct(123, (data) => {
  console.log('New review:', data.review);
  // Update reviews UI in real-time
});

// When new review is posted
reviewObserver.broadcastNewReview(123, newReviewData);
// ➜ All subscribers are notified instantly
```

### Benefits

✅ **Decoupling**: UI không phụ thuộc vào CartService
✅ **Real-time**: Tự động update khi data thay đổi
✅ **Multi-Subscriber**: Nhiều consumers có thể subscribe
✅ **Flexible**: Dễ thêm/xóa watchers
✅ **WebSocket Ready**: Có thể integrate với real-time updates

---

# Strategy Pattern

## 💳 Đa Hình Thức Thanh Toán

### UML Class Diagram

```
PaymentStrategy (Abstract Base)
├─ +processPayment(order, details): Promise<boolean>
├─ +validatePaymentDetails(details): Promise<boolean>
├─ +refund(transactionId): Promise<boolean>
├─ +getPaymentMethodName(): String
├─ +getPaymentIcon(): String
└─ +getFee(amount): Number

CreditCardPayment EXTENDS PaymentStrategy
├─ cardNumber: String
├─ expiryDate: String
├─ cvv: String
├─ cardholderName: String
├─ #_encryptCardInfo(card): String
├─ #_generateTransactionId(): String
└─ #_validateCardFormat(card): boolean

BankTransferPayment EXTENDS PaymentStrategy
├─ bankCode: String
├─ accountNumber: String
├─ transferNotes: String
├─ #_generateBankCode(): String
└─ #_verifyAccountExists(account): Promise<boolean>

EWalletPayment EXTENDS PaymentStrategy
├─ walletProvider: String
├─ walletId: String
├─ supportedWallets: String[]
├─ #_validateWalletProvider(provider): boolean
└─ #_checkWalletBalance(amount): Promise<boolean>

PaymentProcessor (Context)
├─ strategy: PaymentStrategy
├─ +setStrategy(paymentType): void
├─ +processPayment(order, details): Promise<boolean>
├─ +validatePayment(details): Promise<boolean>
├─ +refundPayment(transactionId): Promise<boolean>
└─ +getAvailablePaymentMethods(): String[]

PaymentFactory (Static)
├─ +createPaymentProcessor(): PaymentProcessor
├─ +getPaymentStrategy(type): PaymentStrategy
└─ +isSupportedPaymentMethod(method): boolean
```

### Chi Tiết Implementation

#### **Abstract Class: PaymentStrategy**
**File**: `backend/strategies/PaymentStrategy.js`

```javascript
class PaymentStrategy {
  // Abstract class - cannot be instantiated

  async processPayment(order, details) {
    // Purpose: Process payment using specific method
    throw new Error('processPayment() must be implemented');
  }

  async validatePaymentDetails(details) {
    // Purpose: Validate payment details format
    throw new Error('validatePaymentDetails() must be implemented');
  }

  async refund(transactionId) {
    // Purpose: Refund a transaction
    throw new Error('refund() must be implemented');
  }

  getPaymentMethodName() {
    // Purpose: Get display name
    throw new Error('getPaymentMethodName() must be implemented');
  }

  getPaymentIcon() {
    // Purpose: Get icon URL
    throw new Error('getPaymentIcon() must be implemented');
  }

  getFee(amount) {
    // Purpose: Calculate transaction fee
    throw new Error('getFee() must be implemented');
  }
}
```

#### **Concrete Class: CreditCardPayment**
**File**: `backend/strategies/CreditCardPayment.js`

```javascript
class CreditCardPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'credit_card';
  }

  async processPayment(order, cardDetails) {
    // Purpose: Process credit card payment
    console.log('💳 Processing credit card payment...');

    try {
      // Validate card details
      if (!await this.validatePaymentDetails(cardDetails)) {
        throw new Error('Invalid card details');
      }

      // Encrypt sensitive data
      const encryptedCard = this._encryptCardInfo({
        number: cardDetails.cardNumber,
        expiry: cardDetails.expiryDate,
        cvv: cardDetails.cvv
      });

      // Call payment gateway (e.g., Stripe, Payment Gateway)
      const transactionId = this._generateTransactionId();
      
      // Simulate API call to payment processor
      const paymentGatewayResponse = await this._callPaymentGateway({
        amount: order.total,
        currency: order.currency,
        cardToken: encryptedCard,
        orderId: order.id,
        description: `Order ${order.displayCode}`,
        cardholderName: cardDetails.cardholderName
      });

      if (paymentGatewayResponse.success) {
        console.log('✅ Credit card payment successful');
        console.log('Transaction ID:', transactionId);
        
        return {
          success: true,
          transactionId: transactionId,
          method: 'credit_card',
          amount: order.total,
          timestamp: new Date()
        };
      } else {
        throw new Error(paymentGatewayResponse.error || 'Payment failed');
      }

    } catch (error) {
      console.error('❌ Credit card payment failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validatePaymentDetails(details) {
    // Purpose: Validate credit card format
    const cardNumberRegex = /^\d{13,19}$/; // Luhn check can be added
    const expiryRegex = /^\d{2}\/\d{2}$/; // MM/YY format
    const cvvRegex = /^\d{3,4}$/;

    const isValid = 
      cardNumberRegex.test(details.cardNumber) &&
      expiryRegex.test(details.expiryDate) &&
      cvvRegex.test(details.cvv) &&
      details.cardholderName &&
      this._luhnCheck(details.cardNumber);

    if (!isValid) {
      console.warn('❌ Invalid card details');
    }

    return isValid;
  }

  async refund(transactionId) {
    // Purpose: Refund credit card transaction
    console.log(`💰 Refunding transaction: ${transactionId}`);

    try {
      const refundResponse = await this._callPaymentGateway({
        action: 'refund',
        transactionId: transactionId
      });

      if (refundResponse.success) {
        console.log('✅ Refund processed successfully');
        return { success: true, refundId: refundResponse.refundId };
      } else {
        throw new Error(refundResponse.error || 'Refund failed');
      }
    } catch (error) {
      console.error('❌ Refund failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  getPaymentMethodName() {
    return 'Credit Card (Visa, Mastercard, Amex)';
  }

  getPaymentIcon() {
    return '/images/payment-icons/credit-card.svg';
  }

  getFee(amount) {
    // 2.9% + $0.30 per transaction
    return (amount * 0.029) + 0.30;
  }

  // ======== PRIVATE HELPERS ========

  _encryptCardInfo(card) {
    // Purpose: Encrypt card info (should use real encryption like RSA)
    // This is a simplified example
    const encrypted = Buffer.from(JSON.stringify(card))
      .toString('base64');
    
    console.log('🔐 Card info encrypted');
    return encrypted;
  }

  _generateTransactionId() {
    // Purpose: Generate unique transaction ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`.toUpperCase();
  }

  _validateCardFormat(card) {
    // Purpose: Basic format validation
    return /^\d{13,19}$/.test(card.number);
  }

  _luhnCheck(cardNumber) {
    // Purpose: Validate card number using Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  async _callPaymentGateway(payload) {
    // Purpose: Call actual payment gateway API
    // This would integrate with real payment processor
    console.log('🌐 Calling payment gateway with:', payload);
    
    // Simulated response
    return {
      success: true,
      refundId: null,
      // Real implementation would make HTTP request to payment provider
    };
  }
}
```

#### **Concrete Class: BankTransferPayment**
**File**: `backend/strategies/BankTransferPayment.js`

```javascript
class BankTransferPayment extends PaymentStrategy {
  async processPayment(order, bankDetails) {
    // Purpose: Process bank transfer payment
    console.log('🏦 Processing bank transfer...');

    if (!await this.validatePaymentDetails(bankDetails)) {
      throw new Error('Invalid bank details');
    }

    const customBankCode = this._generateBankCode();
    
    const bankTransferInfo = {
      bankCode: customBankCode,
      orderAmount: order.total,
      orderId: order.displayCode,
      recipientName: 'CoffeeStore Payment',
      accountNumber: process.env.BANK_ACCOUNT,
      bankName: process.env.BANK_NAME,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    console.log('✅ Bank transfer info generated:', bankTransferInfo);

    return {
      success: true,
      method: 'bank_transfer',
      transferInfo: bankTransferInfo,
      amount: order.total,
      status: 'pending_verification'
    };
  }

  async validatePaymentDetails(details) {
    // Purpose: Validate bank account
    if (!details.bankCode || !details.accountNumber) {
      return false;
    }

    const accountExists = await this._verifyAccountExists(
      details.accountNumber
    );

    return accountExists;
  }

  async refund(transactionId) {
    // Purpose: Refund bank transfer (manual process usually)
    console.log('💰 Bank refund initiated for:', transactionId);
    // Bank refunds are typically manual
    return {
      success: true,
      message: 'Refund will be processed within 3-5 business days'
    };
  }

  getPaymentMethodName() {
    return 'Bank Transfer (Vietnam)';
  }

  getPaymentIcon() {
    return '/images/payment-icons/bank-transfer.svg';
  }

  getFee(amount) {
    // No fee for bank transfer
    return 0;
  }

  // ======== PRIVATE HELPERS ========

  _generateBankCode() {
    // Purpose: Generate unique bank transfer code
    const prefix = 'BT'; // Bank Transfer
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return `${prefix}${timestamp}${random}`;
  }

  async _verifyAccountExists(accountNumber) {
    // Purpose: Verify account at bank
    // Would call bank's verification API
    console.log('🔍 Verifying account:', accountNumber);
    return true; // Simulated
  }
}
```

#### **Concrete Class: EWalletPayment**
**File**: `backend/strategies/EWalletPayment.js`

```javascript
class EWalletPayment extends PaymentStrategy {
  #supportedWallets = ['Momo', 'ZaloPay', 'PayPal'];

  async processPayment(order, walletDetails) {
    // Purpose: Process e-wallet payment
    console.log(`💳 Processing ${walletDetails.provider} payment...`);

    if (!await this.validatePaymentDetails(walletDetails)) {
      throw new Error('Invalid wallet details');
    }

    switch (walletDetails.provider) {
      case 'Momo':
        return await this._processMomo(order);
      case 'ZaloPay':
        return await this._processZaloPay(order);
      case 'PayPal':
        return await this._processPayPal(order);
      default:
        throw new Error(`Unsupported wallet: ${walletDetails.provider}`);
    }
  }

  async validatePaymentDetails(details) {
    // Purpose: Validate wallet provider
    const isValid = this._validateWalletProvider(details.provider) &&
                    await this._checkWalletBalance(details.balance);

    return isValid;
  }

  async refund(transactionId) {
    // Purpose: Refund e-wallet transaction
    console.log('💰 E-wallet refund for:', transactionId);
    return { success: true, refundId: null };
  }

  getPaymentMethodName() {
    return `E-Wallet (${this.#supportedWallets.join(', ')})`;
  }

  getPaymentIcon() {
    return '/images/payment-icons/ewallet.svg';
  }

  getFee(amount) {
    // 1-2% fee depending on wallet
    return amount * 0.015;
  }

  // ======== PRIVATE HELPERS ========

  _validateWalletProvider(provider) {
    return this.#supportedWallets.includes(provider);
  }

  async _checkWalletBalance(balance) {
    // Purpose:Check sufficient balance
    return balance >= 0;
  }

  async _processMomo(order) {
    console.log('🟣 Processing Momo payment');
    return {
      success: true,
      provider: 'Momo',
      method: 'ewallet',
      transactionId: `MOMO-${Date.now()}`
    };
  }

  async _processZaloPay(order) {
    console.log('🟢 Processing ZaloPay payment');
    return {
      success: true,
      provider: 'ZaloPay',
      method: 'ewallet',
      transactionId: `ZP-${Date.now()}`
    };
  }

  async _processPayPal(order) {
    console.log('🔵 Processing PayPal payment');
    return {
      success: true,
      provider: 'PayPal',
      method: 'ewallet',
      transactionId: `PP-${Date.now()}`
    };
  }
}
```

#### **Class: PaymentProcessor** (Context/Strategy Selector)
**File**: `backend/strategies/PaymentProcessor.js`

```javascript
class PaymentProcessor {
  #strategy = null;
  #strategies = new Map();

  constructor() {
    // Register all available strategies
    this.#strategies.set('credit_card', CreditCardPayment);
    this.#strategies.set('bank_transfer', BankTransferPayment);
    this.#strategies.set('ewallet', EWalletPayment);
  }

  setStrategy(paymentType) {
    // Purpose: Select strategy at runtime
    if (!this.#strategies.has(paymentType)) {
      throw new Error(`Payment method not supported: ${paymentType}`);
    }

    const StrategyClass = this.#strategies.get(paymentType);
    this.#strategy = new StrategyClass();
    
    console.log(`✅ Strategy selected: ${paymentType}`);
  }

  selectStrategy(paymentType) {
    // Purpose: Select strategy and return this for chaining
    this.setStrategy(paymentType);
    return this;
  }

  async processPayment(order, details) {
    // Purpose: Delegate to current strategy
    if (!this.#strategy) {
      throw new Error('No payment strategy selected');
    }

    return await this.#strategy.processPayment(order, details);
  }

  async validatePayment(details) {
    if (!this.#strategy) {
      throw new Error('No payment strategy selected');
    }

    return await this.#strategy.validatePaymentDetails(details);
  }

  async refundPayment(transactionId) {
    if (!this.#strategy) {
      throw new Error('No payment strategy selected');
    }

    return await this.#strategy.refund(transactionId);
  }

  getAvailablePaymentMethods() {
    return Array.from(this.#strategies.keys());
  }

  getPaymentMethodInfo() {
    if (!this.#strategy) {
      throw new Error('No strategy selected');
    }

    return {
      name: this.#strategy.getPaymentMethodName(),
      icon: this.#strategy.getPaymentIcon(),
      fee: (amount) => this.#strategy.getFee(amount)
    };
  }
}
```

#### **Class: PaymentFactory** (Creation & Configuration)
**File**: `backend/strategies/PaymentProcessor.js`

```javascript
class PaymentFactory {
  static createPaymentProcessor() {
    // Purpose: Create configured processor
    return new PaymentProcessor();
  }

  static getPaymentStrategy(type) {
    // Purpose: Get strategy without processor
    const processor = new PaymentProcessor();
    processor.setStrategy(type);
    return processor;
  }

  static isSupportedPaymentMethod(method) {
    // Purpose: Check if payment method is supported
    const supported = ['credit_card', 'bank_transfer', 'ewallet'];
    return supported.includes(method);
  }

  static getPaymentMethods() {
    // Purpose: Get all supported payment methods
    const processor = new PaymentProcessor();
    return processor.getAvailablePaymentMethods();
  }
}
```

### Usage Example

```javascript
// Create payment processor
const paymentProcessor = PaymentFactory.createPaymentProcessor();

// Available payment methods
console.log('Available methods:', PaymentFactory.getPaymentMethods());
// ['credit_card', 'bank_transfer', 'ewallet']

// ========== CREDIT CARD PAYMENT ==========
paymentProcessor.selectStrategy('credit_card');

const cardResult = await paymentProcessor.processPayment(
  order,
  {
    cardNumber: '4532015112830366',
    expiryDate: '12/25',
    cvv: '123',
    cardholderName: 'John Doe'
  }
);
// ✅ Payment processed successfully
// ➜ Returns: { success: true, transactionId: '...', method: 'credit_card' }

// ========== BANK TRANSFER ==========
paymentProcessor.selectStrategy('bank_transfer');

const bankResult = await paymentProcessor.processPayment(
  order,
  {
    bankCode: 'VCB',
    accountNumber: '1234567890'
  }
);
// ✅ Bank transfer info generated
// ➜ Returns: transfer details for 24-hour window

// ========== E-WALLET ==========
paymentProcessor.selectStrategy('ewallet');

const walletResult = await paymentProcessor.processPayment(
  order,
  {
    provider: 'Momo',
    balance: 5000000
  }
);
// ✅ Momo payment processed
// ➜ Returns: { success: true, provider: 'Momo', transactionId: '...' }

// ========== REFUND ==========
paymentProcessor.selectStrategy('credit_card');
const refund = await paymentProcessor.refundPayment(transactionId);
// ✅ Refunded successfully
```

### Benefits

✅ **Open/Closed Principle**: Dễ thêm payment method mới
✅ **No If-Else**: Không có switch/case lớn
✅ **Runtime Selection**: Chọn payment method lúc runtime
✅ **Testable**: Mỗi strategy có thể test riêng
✅ **Maintainable**: Mỗi payment method tách riêng

---

# Implementation Guide

## 🛠️ Integration Steps

### 1️⃣ Factory Pattern - Product Creation

```javascript
// In ProductController.js
async createProduct(req, res) {
  const { name, price, category, variants } = req.body;

  // Validate using factory
  if (!ProductFactory.verifyProductData(req.body)) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  // Create product using factory
  const product = ProductFactory.createProductWithVariants(req.body);

  // Save to database
  const saved = await productRepository.create(product);

  res.json({ success: true, product: saved });
}
```

### 2️⃣ Singleton Pattern - Cart Management

```javascript
// In CartContext.jsx
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);

  useEffect(() => {
    // Get singleton instance
    const cartService = CartService.getInstance();
    
    // Setup storage
    cartService.setStorage(new LocalStorageAdapter());
    cartService.setCurrentUser(userId);
    
    // Subscribe to changes
    const unsubscribe = cartService.subscribe(data => {
      setCart(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
}
```

### 3️⃣ Observer Pattern - UI Updates

```javascript
// In ShoppingCartUI.jsx
function ShoppingCartUI() {
  const cart = useContext(CartContext);

  if (!cart) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Cart ({cart.itemCount} items)</h2>
      <ul>
        {cart.items.map(item => (
          <li key={item.productId}>
            {item.name} x{item.quantity} - ${item.subtotal}
          </li>
        ))}
      </ul>
      <p>Total: ${cart.total}</p>
    </div>
  );
}
```

### 4️⃣ Strategy Pattern - Payment Processing

```javascript
// In OrderController.js
async checkout(req, res) {
  const { paymentMethod, paymentDetails } = req.body;

  try {
    // Create processor and select strategy
    const processor = PaymentFactory.createPaymentProcessor();
    processor.selectStrategy(paymentMethod);

    // Process payment
    const result = await processor.processPayment(order, paymentDetails);

    if (result.success) {
      // Save order with payment info
      order.paymentStatus = 'paid';
      order.transactionId = result.transactionId;
      await orderRepository.create(order);

      res.json({ success: true, order });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

# Pattern Interactions

## 🔄 How Patterns Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPPING FLOW                                │
└─────────────────────────────────────────────────────────────────┘

1. FACTORY PATTERN: Create products
   ProductFactory.createProduct(productData)
        ↓
   Product object with all attributes

2. USER ADDS TO CART → SINGLETON PATTERN
   CartService.getInstance().addToCart(product)
        ↓
   Only one instance - ensures cart consistency

3. CART CHANGES → OBSERVER PATTERN
   CartService notifies all subscribers
        ↓
   UICartComponent re-renders automatically

4. USER CHECKOUT → STRATEGY PATTERN
   PaymentProcessor.selectStrategy('credit_card')
   processor.processPayment(order, cardDetails)
        ↓
   Different payment handlers for each method


EXAMPLE FLOW:
═════════════════════════════════════════════════════════════════

User clicks "Add to Cart"
  │
  ├─ Factory: ProductFactory.createProduct() ✅
  │          Creates product with full details
  │
  ├─ Singleton: CartService.getInstance() ✅
  │             Gets the only cart instance
  │
  ├─ Singleton Add: cart.addToCart(product) ✅
  │                Adds to the cart
  │
  ├─ Observer: #notifySubscribers() ✅
  │            Notifies all UI listeners
  │
  └─ UI Update: UICartComponent re-renders ✅
               Shows new item count and total


User clicks "Checkout with Credit Card"
  │
  ├─ Strategy Select: PaymentProcessor.selectStrategy('credit_card') ✅
  │
  ├─ Validate: strategy.validatePaymentDetails(cardData) ✅
  │
  ├─ Process: strategy.processPayment(order, cardData) ✅
  │           CreditCardPayment handles the transaction
  │
  └─ Result: Order saved, user redirected ✅
```

---

## 📊 SUMMARY TABLE

| Pattern | Purpose | Key Class | Benefit |
|---------|---------|-----------|---------|
| **Factory** | Encapsulate object creation | ProductFactory | Consistent product creation |
| **Singleton** | One shared instance | CartService | Single source of truth |
| **Observer** | Notify on state changes | Observer + CartService | Real-time UI updates |
| **Strategy** | Select algorithm at runtime | PaymentProcessor + PaymentStrategy | Flexible payment methods |

---

**✅ All 4 Design Patterns documented with complete UML diagrams, attributes, methods, and implementation examples!**
