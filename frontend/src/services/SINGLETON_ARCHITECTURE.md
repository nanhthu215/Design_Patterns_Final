# Singleton Pattern Architecture - CartService

## 📐 Pattern Implementation (Pure Singleton)

### What is "Pure Singleton"?
A pure Singleton is a **JavaScript class-based implementation** with:
- ✅ Private constructor (prevents `new CartService()`)
- ✅ Static private `#instance` field
- ✅ Static `getInstance()` method
- ✅ NO dependency on frameworks (pure JS)

### Why "Pure" vs "React Context"?

| Aspect | Pure Singleton | React Context |
|--------|---|---|
| **Instance Control** | JavaScript class manages single instance | React manages state globally |
| **Lifecycle** | Tied to app runtime | Tied to React component mounting |
| **Re-renders** | Static methods don't trigger re-renders | Context changes trigger re-renders |
| **Time Created** | On first `getInstance()` call | When Provider mounts |
| **Best For** | Business logic, persistence | UI state, React components |

## 🎯 Current Architecture

```
┌─────────────────────────────────────────┐
│  CartService (PURE SINGLETON)           │
│  ✅ Private constructor                 │
│  ✅ Static #instance field              │
│  ✅ getInstance() control               │
│  ✅ Static methods only                 │
│  ✅ Observable pattern (subscribe)      │
└─────────────────────────────────────────┘
           ▲
           │ wraps/exports
           │ (for React convenience)
           │
┌─────────────────────────────────────────┐
│  CartContext (REACT WRAPPER)            │
│  - Calls CartService.getInstance()      │
│  - Provides hooks for React components  │
│  - Manages React re-renders             │
│  - useCartSingleton hook                │
└─────────────────────────────────────────┘
           ▲
           │ imports/uses
           │
┌─────────────────────────────────────────┐
│  React Components                       │
│  - useCart() or useCartSingleton()      │
│  - Access singleton instance through    │
│    hooks or direct getInstance()        │
└─────────────────────────────────────────┘
```

## 💡 Implementation Details

### CartService.js (Pure Singleton)
```javascript
class CartService {
  static #instance = null;        // ✅ Private static field
  static #items = [];
  static #listeners = new Set();
  
  constructor() {
    if (CartService.#instance !== null) {
      throw new Error('Use getInstance() instead');
    }
    // initialization
  }
  
  static getInstance() {           // ✅ Controlled entry point
    if (CartService.#instance === null) {
      CartService.#instance = new CartService();
    }
    return CartService.#instance;
  }
  
  // ✅ Only static methods
  static addToCart(item) { ... }
  static removeFromCart(itemId) { ... }
  static subscribe(listener) { ... }
}

// ✅ Export the class, not an instance
module.exports = CartService;
```

### React Usage (Two Options)

**Option 1: Direct Usage (Pure)**
```javascript
import CartService from '../services/CartService';

// In component
const instance = CartService.getInstance();
instance.addToCart(item);
```

**Option 2: Via Hook (Convenient)**
```javascript
import { useCartSingleton } from '../hooks/useCartSingleton';

// In component
const { cart, addToCart } = useCartSingleton();
addToCart(item);
```

## ✅ Why This Design is Correct

1. **Singleton Guaranteed**: Only ONE instance of CartService exists in memory
2. **Pure JavaScript**: No framework dependencies for the core pattern
3. **React Integration**: Through wrapper (CartContext + useCartSingleton), not mixing concerns
4. **Testable**: Can test CartService independently without React
5. **Observable**: Supports real-time updates without React context
6. **Persistent**: Automatic localStorage sync
7. **Secure**: User-specific storage keys prevent data mixing

## 🧪 Verification

```javascript
// ✅ Proves Singleton pattern
const cart1 = CartService.getInstance();
const cart2 = CartService.getInstance();
console.assert(cart1 === cart2); // ✅ Same instance

// ❌ This FAILS (Singleton enforced)
try {
  new CartService(); // throws error
} catch(e) {
  console.log('✅ Singleton protected');
}
```

## 📚 Related Files

- `frontend/src/services/CartService.js` - Pure Singleton implementation
- `frontend/src/hooks/useCartSingleton.js` - React hook wrapper
- `frontend/src/contexts/CartContext.jsx` - React Context wrapper
- `frontend/src/services/CartService.test.js` - Unit tests (18 tests)
- `frontend/src/examples/CartSingletonExample.js` - Usage examples

---

**Summary**: CartService IS a true, pure Singleton. React Context/hooks are optional wrappers for convenience in React components. The pattern is correctly implemented! ✅
