/**
 * 📍 DESIGN PATTERNS MAP - Chỉ rõ vị trí từng pattern
 * ================================================================
 */

// ✅ SINGLETON PATTERN
// ====================

// 1. Backend - CartService (Pure)
//    📁 backend/core/services/CartService.js
//    ✨ Instance: CartService.getInstance()
//    💾 Storage: Injected via CartService.setStorage()
//    📝 Methods: getItems(), addToCart(), removeFromCart(), clearCart(), subscribe()

// 2. Backend - ReviewObserver (Pure)
//    📁 backend/core/services/ReviewObserver.js
//    ✨ Instance: ReviewObserver.getInstance()
//    📡 Observer: subscribeToProduct(), broadcastNewReview(), etc.

// 3. Frontend - CartService (Pure)
//    📁 frontend/src/core/services/CartService.js
//    ✨ Instance: CartService.getInstance()
//    💾 Storage: Injected via CartService.setStorage()
//    📝 Same pure service, reused for frontend

// 4. Generic Singleton Factory (Pure)
//    📁 backend/core/patterns/Singleton.js
//    ✨ Usage: Singleton.getInstance(TargetClass, ...args)
//    🏭 Reusable for any class


// ✅ OBSERVER PATTERN
// ===================

// 1. Pure Observer (Generic)
//    📁 backend/core/patterns/Observer.js
//    🎯 Methods: subscribe(), unsubscribe(), notify(), clear()
//    👁️ Used by: ReviewObserver, CartService

// 2. ReviewObserver (Specialized)
//    📁 backend/core/services/ReviewObserver.js
//    🎯 Event Types: subscribeToProduct(), broadcastNewReview(), broadcastUpdateReview()
//    📡 Usage: routes/review.js → ReviewController → ReviewObserver

// 3. CartService (Observer pattern)
//    📁 frontend/src/core/services/CartService.js
//    🎯 Methods: subscribe() → returns unsubscribe function
//    📡 Notified when: addToCart(), removeFromCart(), clearCart(), updateQuantity()

// 4. Browser Storage Events (Native Observer)
//    📁 frontend/src/core/adapters/LocalStorageAdapter.js
//    🔔 Event: 'storage' event across browser tabs
//    📡 Syncs cart when user switches tabs/windows


// ✅ ADAPTER PATTERN
// ==================

// BACKEND ADAPTERS - Framework Bridge Layer

// 1. MongooseRepositoryAdapter
//    📁 backend/core/adapters/MongooseRepositoryAdapter.js
//    🔗 Bridge: Pure Repository Interface → Mongoose Model
//    🎯 Usage: ProductRepository, OrderRepository, ReviewRepository, CategoryRepository
//    ✨ Key Feature: _buildMongooseCriteria() converts pure descriptions to Mongoose operators
//    ❌ NO Mongoose ops here: ProductRepository, OrderRepository, etc.
//    ✅ ALL Mongoose ops here: MongooseRepositoryAdapter._buildMongooseCriteria()

// 2. WebSocketAdapter
//    📁 backend/core/adapters/WebSocketAdapter.js
//    🔗 Bridge: Pure ReviewObserver → Express WebSocket Server
//    🎯 Usage: backend/index.js → new WebSocketAdapter(httpServer, reviewObserver)
//    📡 Connects: Pure Observer → WS events → Frontend

// 3. MemoryStorageAdapter
//    📁 backend/core/adapters/MemoryStorageAdapter.js
//    🔗 Bridge: Pure Storage Interface → In-memory Map
//    🎯 Usage: Backend server (non-persistent storage)

// 4. LocalStorageAdapter (Backend)
//    📁 backend/core/adapters/LocalStorageAdapter.js
//    🔗 Bridge: Pure Storage Interface → Node.js LocalStorage library
//    🎯 Usage: Not used in backend, but available for Node.js environments

// FRONTEND ADAPTERS - Framework Bridge Layer

// 5. LocalStorageAdapter (Frontend)
//    📁 frontend/src/core/adapters/LocalStorageAdapter.js
//    🔗 Bridge: Pure CartStore Interface → Browser localStorage
//    🎯 Usage: CartService.setStorage(new LocalStorageAdapter())
//    💾 Storage: localStorage.getItem(), localStorage.setItem()
//    🔔 Sync: window.addEventListener('storage', ...)


// ✅ REPOSITORY PATTERN
// =====================

// BACKEND REPOSITORIES - Pure Business Logic (No Mongoose operators)

// 1. ProductRepository (Pure)
//    📁 backend/repositories/ProductRepository.js
//    🎯 Methods: findPaginated(), findById(), create(), update(), delete()
//    🔍 Search: search(), findByCategory()
//    📊 Aggregation: _getSoldStatsViaAdapter()
//    🏗️ Adapter: MongooseRepositoryAdapter

// 2. OrderRepository (Pure)
//    📁 backend/repositories/OrderRepository.js
//    🎯 Methods: findPaginated(), findById(), create(), update(), delete()
//    🔍 Filters: findByStatus(), findByCustomerEmail(), findByCustomerId()
//    📊 Stats: getOrderStats()
//    🏗️ Adapter: MongooseRepositoryAdapter + DAO caching

// 3. ReviewRepository (Pure)
//    📁 backend/repositories/ReviewRepository.js
//    🎯 Methods: create(), findByProductId(), findById(), update(), delete()
//    📊 Rating: getProductRating(), getRatingDistribution()
//    🏆 Trending: getTopRatedProducts()
//    🏗️ Adapter: MongooseRepositoryAdapter

// 4. CategoryRepository (Pure)
//    📁 backend/repositories/CategoryRepository.js
//    🎯 Methods: getAllCategories(), getByCategory(), getCategoryStats()
//    🏪 Operations: updateCategory(), deleteCategory()
//    🏪 Advanced: getCategoriesWithCounts(), getCategoriesByPriceRange(), getTrendingCategories()
//    🏗️ Adapter: MongooseRepositoryAdapter


// ✅ FACTORY PATTERN
// ==================

// 1. ProductFactory
//    📁 backend/services/ProductFactory.js
//    🏭 Method: createProduct(data)
//    🎯 Usage: ProductRepository.create() → ProductFactory.createProduct()
//    🧮 Normalizes product data before saving

// 2. DAOFactory
//    📁 backend/services/DataStorageService.js
//    🏭 Method: createDAO(type, ...models)
//    🎯 Usage: OrderRepository → DAOFactory.createDAO()
//    💾 Creates: Order DAO with caching enabled


// ✅ DAO PATTERN (Data Access Object)
// ====================================

// 1. OrderDAO
//    📁 backend/services/DataStorageService.js
//    🎯 Methods: findById() with caching
//    💾 Cache: Stores results for performance
//    🔄 Usage: OrderRepository → OrderDAO.findById()


// ✅ DEPENDENCY INJECTION PATTERN
// ================================

// 1. CartService (Frontend)
//    📁 frontend/src/core/services/CartService.js
//    💉 Injected: Storage adapter via CartService.setStorage()
//    🎯 In CartContext.jsx: CartService.setStorage(new LocalStorageAdapter())
//    ✨ No hardcoded localStorage, storage is swappable

// 2. ReviewController
//    📁 backend/controllers/ReviewController.js
//    💉 Injected: ReviewObserver via constructor
//    🎯 In routes/review.js: new ReviewController(reviewRepository, reviewObserver)
//    ✨ No hardcoded observer, can mock for testing

// 3. CartService (Backend)
//    📁 backend/core/services/CartService.js
//    💉 Injected: Storage adapter via CartService.setStorage()
//    🎯 In index.js: CartService.setStorage(MemoryStorageAdapter.getInstance())
//    ✨ Can swap between MemoryStorageAdapter, LocalStorageAdapter, etc.

// 4. WebSocketAdapter
//    📁 backend/core/adapters/WebSocketAdapter.js
//    💉 Injected: ReviewObserver via constructor
//    🎯 In index.js: new WebSocketAdapter(httpServer, reviewObserver)
//    ✨ Observer can be mocked, replaced, or extended


// ✅ INTERFACE/CONTRACT PATTERN
// ===============================

// 1. Repository Interface
//    📁 backend/core/interfaces/Repository.js
//    📝 Contract: find(), findOne(), findById(), create(), update(), delete(), count(), exists(), aggregate()
//    🏗️ Implemented by: MongooseRepositoryAdapter

// 2. Storage Interface
//    📁 backend/core/interfaces/Storage.js
//    📝 Contract: get(), set(), remove(), clear()
//    🏗️ Implemented by: MemoryStorageAdapter, LocalStorageAdapter

// 3. CartStore Interface
//    📁 frontend/src/core/interfaces/CartStore.js
//    📝 Contract: getItems(), setItems(), clear(), subscribe()
//    🏗️ Implemented by: LocalStorageAdapter


// ✅ STRATEGY PATTERN
// ===================

// 1. Payment Strategies
//    📁 backend/strategies/PaymentStrategy.js, BankTransferPayment.js, CreditCardPayment.js, EWalletPayment.js
//    🎯 Strategy classes: Different payment methods
//    🏭 Factory: PaymentProcessor selectStrategy(type)
//    💳 Usage: OrderController → PaymentProcessor.processPayment(strategy)


// 📍 HIERARCHICAL VIEW - Where Everything Lives
// ===============================================

// backend/
//   ├── core/
//   │   ├── interfaces/
//   │   │   ├── Repository.js ........................ INTERFACE ✓
//   │   │   └── Storage.js ........................... INTERFACE ✓
//   │   ├── patterns/
//   │   │   ├── Singleton.js ......................... SINGLETON (Generic) ✓
//   │   │   └── Observer.js .......................... OBSERVER (Generic) ✓
//   │   ├── services/
//   │   │   ├── CartService.js ....................... SINGLETON + OBSERVER + DEPENDENCY INJECTION ✓
//   │   │   └── ReviewObserver.js .................... SINGLETON + OBSERVER ✓
//   │   └── adapters/
//   │       ├── MongooseRepositoryAdapter.js ......... ADAPTER + REPOSITORY ✓
//   │       ├── WebSocketAdapter.js .................. ADAPTER ✓
//   │       ├── MemoryStorageAdapter.js .............. ADAPTER ✓
//   │       └── LocalStorageAdapter.js ............... ADAPTER ✓
//   ├── repositories/
//   │   ├── ProductRepository.js ..................... REPOSITORY ✓
//   │   ├── OrderRepository.js ....................... REPOSITORY + DAO ✓
//   │   ├── ReviewRepository.js ...................... REPOSITORY ✓
//   │   └── CategoryRepository.js .................... REPOSITORY ✓
//   ├── controllers/
//   │   └── ReviewController.js ...................... DEPENDENCY INJECTION ✓
//   ├── services/
//   │   ├── ProductFactory.js ........................ FACTORY ✓
//   │   └── DataStorageService.js .................... FACTORY + DAO ✓
//   ├── strategies/
//   │   ├── PaymentStrategy.js ....................... STRATEGY (Interface) ✓
//   │   ├── BankTransferPayment.js ................... STRATEGY ✓
//   │   ├── CreditCardPayment.js ..................... STRATEGY ✓
//   │   └── EWalletPayment.js ........................ STRATEGY ✓
//   ├── routes/
//   │   ├── review.js ............................... USES: ReviewObserver + ReviewController (Dependency Injection) ✓
//   │   └── products.js ............................. USES: ProductRepository ✓
//   └── index.js ................................... INITIALIZATION: CartService, ReviewObserver, WebSocketAdapter (Dependency Injection Setup) ✓

// frontend/src/
//   ├── core/
//   │   ├── interfaces/
//   │   │   └── CartStore.js ......................... INTERFACE ✓
//   │   ├── services/
//   │   │   └── CartService.js ....................... SINGLETON + OBSERVER + DEPENDENCY INJECTION ✓
//   │   └── adapters/
//   │       └── LocalStorageAdapter.js ............... ADAPTER ✓
//   └── contexts/
//       └── CartContext.jsx .......................... USES: CartService (Singleton) + Dependency Injection ✓


// 🎯 QUICK LOOKUP TABLE
// =====================

console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                       DESIGN PATTERNS LOCATION MAP                             ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ PATTERN              │ BACKEND LOCATION                    │ STATUS            ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Singleton            │ core/services/CartService.js        │ ✅ Pure           ║
║                      │ core/services/ReviewObserver.js     │ ✅ Pure           ║
║                      │ core/patterns/Singleton.js          │ ✅ Generic        ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Observer             │ core/patterns/Observer.js           │ ✅ Generic        ║
║                      │ core/services/ReviewObserver.js     │ ✅ Specialized    ║
║                      │ core/services/CartService.js        │ ✅ Specialized    ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Repository           │ repositories/ProductRepository.js   │ ✅ Pure           ║
║                      │ repositories/OrderRepository.js     │ ✅ Pure           ║
║                      │ repositories/ReviewRepository.js    │ ✅ Pure           ║
║                      │ repositories/CategoryRepository.js  │ ✅ Pure           ║
║                      │ core/interfaces/Repository.js       │ ✅ Interface      ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Adapter              │ core/adapters/MongooseRepositoryAdp │ ✅ Pure           ║
║                      │ core/adapters/WebSocketAdapter.js   │ ✅ Pure           ║
║                      │ core/adapters/MemoryStorageAdapter  │ ✅ Pure           ║
║                      │ core/adapters/LocalStorageAdapter   │ ✅ Pure           ║
║                      │ core/interfaces/Storage.js          │ ✅ Interface      ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Factory              │ services/ProductFactory.js          │ ✅ Pure           ║
║                      │ services/DataStorageService.js (DAO)│ ✅ Pure           ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Strategy             │ strategies/PaymentStrategy.js       │ ✅ Pure           ║
║                      │ strategies/BankTransferPayment.js   │ ✅ Pure           ║
║                      │ strategies/CreditCardPayment.js     │ ✅ Pure           ║
║                      │ strategies/EWalletPayment.js        │ ✅ Pure           ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ Dependency Injection │ controllers/ReviewController.js     │ ✅ Pure           ║
║                      │ routes/review.js                    │ ✅ Setup          ║
║                      │ index.js                            │ ✅ Setup          ║
╠══════════════════════╪═════════════════════════════════════╪═══════════════════╣
║ DAO                  │ services/DataStorageService.js      │ ✅ Pure           ║
║                      │ repositories/OrderRepository.js (use)                  ║
╚══════════════════════╧═════════════════════════════════════╧═══════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                       FRONTEND PATTERNS                                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Singleton            │ src/core/services/CartService.js    │ ✅ Pure           ║
║ Observer             │ src/core/services/CartService.js    │ ✅ Pure           ║
║ Adapter              │ src/core/adapters/LocalStorageAdp   │ ✅ Pure           ║
║                      │ src/core/interfaces/CartStore.js    │ ✅ Interface      ║
║ Dependency Injection │ src/contexts/CartContext.jsx        │ ✅ Setup          ║
╚═══════════════════════╧═════════════════════════════════════╧═══════════════════╝
`);
