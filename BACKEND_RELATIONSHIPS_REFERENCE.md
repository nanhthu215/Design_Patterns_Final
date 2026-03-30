# BACKEND RELATIONSHIPS QUICK REFERENCE

**Generated**: March 30, 2026

---

## QUICK CLASS LOOKUP TABLE

| Class | File | Type | Primary Purpose |
|-------|------|------|-----------------|
| **Customer** | models/Customer.js | Model | User account data |
| **Product** | models/Product.js | Model | Product catalog |
| **Order** | models/Order.js | Model | Purchase orders |
| **Review** | models/Review.js | Model | Product reviews |
| **DiscountCode** | models/DiscountCode.js | Model | Promotional codes |
| **ProductRepository** | repositories/ProductRepository.js | Repository | Product data access |
| **OrderRepository** | repositories/OrderRepository.js | Repository | Order data access + DAO pattern |
| **ReviewRepository** | repositories/ReviewRepository.js | Repository | Review data access |
| **CustomerRepository** | repositories/CustomerRepository.js | Repository | Customer data access |
| **AccountRepository** | repositories/AccountRepository.js | Repository | Account settings |
| **DiscountCodeRepository** | repositories/DiscountCodeRepository.js | Repository | Discount code data access |
| **CategoryRepository** | repositories/CategoryRepository.js | Repository | Category aggregation |
| **AuthRepository** | repositories/AuthRepository.js | Repository | Authentication data |
| **AddressRepository** | repositories/AddressRepository.js | Repository | Geographic API caching |
| **ProductController** | controllers/ProductController.js | Controller | Product HTTP endpoints |
| **OrderController** | controllers/OrderController.js | Controller | Order HTTP endpoints |
| **ReviewController** | controllers/ReviewController.js | Controller | Review HTTP endpoints |
| **CustomerController** | controllers/CustomerController.js | Controller | Customer HTTP endpoints |
| **AuthController** | controllers/AuthController.js | Controller | Auth HTTP endpoints |
| **CategoryController** | controllers/CategoryController.js | Controller | Category HTTP endpoints |
| **DiscountCodeController** | controllers/DiscountCodeController.js | Controller | Discount HTTP endpoints |
| **Repository** | core/interfaces/Repository.js | Interface | Abstract data access contract |
| **IStorage** | core/interfaces/Storage.js | Interface | Abstract storage contract |
| **MongooseRepositoryAdapter** | core/adapters/MongooseRepositoryAdapter.js | Adapter | Mongoose implementation of Repository |
| **MemoryStorageAdapter** | core/adapters/MemoryStorageAdapter.js | Adapter | In-memory implementation of IStorage |
| **LocalStorageAdapter** | core/adapters/LocalStorageAdapter.js | Adapter | Browser localStorage implementation |
| **WebSocketAdapter** | core/adapters/WebSocketAdapter.js | Adapter | WebSocket server integration |
| **Singleton** | core/patterns/Singleton.js | Pattern | Singleton instance management |
| **Observer** | core/patterns/Observer.js | Pattern | Pub-Sub pattern implementation |
| **CartService** | core/services/CartService.js | Service | Shopping cart (Singleton + Observer) |
| **ReviewObserver** | core/services/ReviewObserver.js | Service | Review broadcasts (Singleton) |
| **PaymentStrategy** | strategies/PaymentStrategy.js | Strategy | Abstract payment interface |
| **PaymentProcessor** | strategies/PaymentProcessor.js | Strategy | Payment strategy context |
| **CreditCardPayment** | strategies/CreditCardPayment.js | Strategy | Credit card payment |
| **BankTransferPayment** | strategies/BankTransferPayment.js | Strategy | Bank transfer payment |
| **EWalletPayment** | strategies/EWalletPayment.js | Strategy | E-wallet payment |
| **ExportStrategy** | services/DataExportService.js | Strategy | Abstract export interface |
| **CSVExportStrategy** | services/DataExportService.js | Strategy | CSV export |
| **JSONExportStrategy** | services/DataExportService.js | Strategy | JSON export |
| **XMLExportStrategy** | services/DataExportService.js | Strategy | XML export |
| **ExcelExportStrategy** | services/DataExportService.js | Strategy | Excel export |
| **DataExportService** | services/DataExportService.js | Service | Multi-format export coordinator |
| **ProductFactory** | services/ProductFactory.js | Factory | Product object creation |
| **ConnectionPoolManager** | services/DataStorageService.js | Singleton | DB connection pooling |
| **CacheManager** | services/DataStorageService.js | Singleton | TTL-based caching |
| **DAOFactory** | services/DataStorageService.js | Factory | DAO object creation |
| **OrderDAO** | services/DataStorageService.js | DAO | Order data access with caching |

---

## CLASS INHERITANCE TREE (Relationships)

### Extends Relationships
```
Repository (abstract)
├── MongooseRepositoryAdapter

IStorage (abstract)
├── MemoryStorageAdapter
└── LocalStorageAdapter

PaymentStrategy (abstract)
├── CreditCardPayment
├── BankTransferPayment
└── EWalletPayment

ExportStrategy (abstract)
├── CSVExportStrategy
├── JSONExportStrategy
├── XMLExportStrategy
└── ExcelExportStrategy
```

---

## COMPOSITION & AGGREGATION MATRIX

### Has-A Relationships (Strong Ownership)

| Parent Class | Property | Type | Child Class | Purpose |
|---|---|---|---|---|
| ProductController | productRepository | 🔒 | ProductRepository | CRUD operations |
| OrderController | orderRepository | 🔒 | OrderRepository | Order management |
| OrderController | paymentProcessor | 🔒 | PaymentProcessor | Process payments |
| OrderController | exportService | 🔒 | DataExportService | Export orders |
| ReviewController | reviewRepository | 🔒 | ReviewRepository | Manage reviews |
| ReviewController | reviewObserver | 🔒 | ReviewObserver | Broadcast updates |
| CustomerController | customerRepository | 🔒 | CustomerRepository | Customer data |
| AuthController | authRepository | 🔒 | AuthRepository | Auth operations |
| CategoryController | categoryRepository | 🔒 | CategoryRepository | Category data |
| DiscountCodeController | discountCodeRepository | 🔒 | DiscountCodeRepository | Discount data |
| ProductRepository | adapter | 🔒 | MongooseRepositoryAdapter | DB access |
| OrderRepository | adapter | 🔒 | MongooseRepositoryAdapter | DB access |
| OrderRepository | daoFactory | 🔒 | DAOFactory | DAO creation |
| OrderRepository | orderDAO | 🔒 | OrderDAO | Cached queries |
| ReviewRepository | adapter | 🔒 | MongooseRepositoryAdapter | DB access |
| CategoryRepository | adapter | 🔒 | MongooseRepositoryAdapter | DB access |
| CartService | #userObserver | 🔒 | Observer | Event pub-sub |
| ReviewObserver | #productSubscriptions | 🔍 | Map\<string, Observer\> | Product listeners |
| PaymentProcessor | strategy | 🔄 | PaymentStrategy | Runtime delegation |
| WebSocketAdapter | #reviewObserver | 🔒 | ReviewObserver | Review broadcasts |
| WebSocketAdapter | #clientsByProduct | 🔍 | Map\<string, Set\> | Connected clients |
| DataStorageService | connectionPool | 🔒 | ConnectionPoolManager | DB connections |
| DataStorageService | cacheManager | 🔒 | CacheManager | Data caching |
| OrderDAO | cache | 🔒 | CacheManager | Query caching |
| Customer | addresses[] | 📦 | Address[] | Embedded document |
| Customer | paymentMethods[] | 📦 | PaymentMethod[] | Embedded document |
| Customer | loyalty | 📦 | Loyalty | Embedded object |
| Loyalty | history[] | 📦 | LoyaltyHistoryItem[] | Embedded document |
| Product | variants[] | 📦 | Variant[] | Embedded document |
| Variant | options[] | 📦 | VariantOption[] | Embedded array |
| Order | items[] | 📦 | OrderItem[] | Embedded document |
| Order | shippingActivity[] | 📦 | ShippingActivity[] | Embedded document |

🔒 = Strong ownership (composition)  
🔄 = Runtime delegation (flexible)  
🔍 = Collection/Map  
📦 = Embedded document (Mongoose sub-schema)

---

## DEPENDENCY RELATIONSHIPS (Uses)

### Controllers → Repositories
```
ProductController
  ├─> ProductRepository
  │    └─> MongooseRepositoryAdapter
  │         └─> Product Model
  
OrderController
  ├─> OrderRepository
  │    ├─> MongooseRepositoryAdapter
  │    └─> DAOFactory
  ├─> PaymentProcessor
  │    ├─> CreditCardPayment
  │    ├─> BankTransferPayment
  │    └─> EWalletPayment
  └─> DataExportService
```

### Services Use Adapters
```
CartService
  └─> IStorage (injected)
      ├─> MemoryStorageAdapter
      └─> LocalStorageAdapter

ReviewObserver
  └─> Observer

WebSocketAdapter
  └─> ReviewObserver
      └─> Observer
```

### Repositories → Adapters → Models
```
ProductRepository
  └─> MongooseRepositoryAdapter
      └─> Product Model (Mongoose)
      
OrderRepository
  └─> MongooseRepositoryAdapter
      └─> Order Model (Mongoose)
      
ReviewRepository
  └─> MongooseRepositoryAdapter
      └─> Review Model (Mongoose)
      
CustomerRepository
  └─> Customer Model (Direct Mongoose)
```

---

## STRATEGY PATTERN IMPLEMENTATIONS

### Payment Strategies
```
PaymentProcessor (Context)
  ├─> PaymentStrategy (Abstract)
  │    ├─> CreditCardPayment
  │    │    • validateCardNumber()
  │    │    • validateExpiry()
  │    │    • validateCVV()
  │    │    • processPayment()
  │    │    • refund()
  │    │
  │    ├─> BankTransferPayment
  │    │    • validateAccountNumber()
  │    │    • validateBankCode()
  │    │    • processPayment()
  │    │    • refund()
  │    │
  │    └─> EWalletPayment
  │         • validateWalletType()
  │         • validateEmail/Phone()
  │         • processPayment()
  │         • refund()
```

### Export Strategies
```
DataExportService (Context)
  └─> ExportStrategy (Abstract)
      ├─> CSVExportStrategy
      │    → export() → CSV string
      │    → getContentType() → "text/csv"
      │
      ├─> JSONExportStrategy
      │    → export() → JSON string
      │    → getContentType() → "application/json"
      │
      ├─> XMLExportStrategy
      │    → export() → XML string
      │    → getContentType() → "application/xml"
      │
      └─> ExcelExportStrategy
           → export() → Excel XML
           → getContentType() → "application/vnd.ms-excel"
```

---

## SINGLETON PATTERN INSTANCES

| Singleton | File | Purpose | Access |
|-----------|------|---------|--------|
| **Singleton** | core/patterns/Singleton.js | Manages singleton instances | `Singleton.getInstance(Class)` |
| **CartService** | core/services/CartService.js | Global shopping cart | `CartService.getInstance()` |
| **ReviewObserver** | core/services/ReviewObserver.js | Global review broadcaster | `ReviewObserver.getInstance()` |
| **ConnectionPoolManager** | services/DataStorageService.js | DB connection pool | `new ConnectionPoolManager()` (auto-singleton) |
| **CacheManager** | services/DataStorageService.js | Global cache | `new CacheManager()` (auto-singleton) |
| **MemoryStorageAdapter** | core/adapters/MemoryStorageAdapter.js | In-memory storage | `MemoryStorageAdapter.getInstance()` |

---

## DEPENDENCY INJECTION POINTS

### Constructor Injection
```javascript
// Controllers receiving repositories
new ProductController(productRepository)
new OrderController(orderRepository, mailer, loyaltyUtils)
new ReviewController(reviewRepository, reviewObserver)
new CustomerController(customerRepository)
new AuthController(authRepository)

// Repositories receiving models
new ProductRepository(ProductModel)
new OrderRepository(OrderModel, CustomerModel, DiscountCodeModel)
new ReviewRepository(ReviewModel)

// Adapters receiving models
new MongooseRepositoryAdapter(ProductModel)
```

### Static Method Injection
```javascript
// CartService
CartService.setStorage(storage)  // Inject IStorage implementation
CartService.setCurrentUser(email)

// Factory pattern
DAOFactory.createDAO('Order', OrderModel, CustomerModel)
```

### Factory Pattern Injection
```javascript
// PaymentProcessor selects strategy by method type
const strategy = paymentProcessor.getStrategyByType('credit_card')

// DataExportService selects export format
const exporter = new CSVExportStrategy()
```

---

## DATABASE REFERENCE RELATIONSHIPS (Foreign Keys)

| Collection | Field | References | Type |
|-----------|-------|-----------|------|
| Orders | customerId | Customer._id | ObjectId (1:N) |
| Reviews | productId | Product.id | Number (1:N) |

---

## EMBEDDED DOCUMENT RELATIONSHIPS (Denormalization)

| Parent | Embedded Document | Type | Example |
|--------|------------------|------|---------|
| Customer | addresses | Address[] | Multiple shipping/billing addresses |
| Customer | paymentMethods | PaymentMethod[] | Multiple payment cards/accounts |
| Customer | loyalty | Loyalty | Single loyalty profile with history |
| Customer | loyalty.history | LoyaltyHistoryItem[] | Points transaction log |
| Product | variants | Variant[] | Product variants (sizes, colors) |
| Variant | options | VariantOption[] | Variant options (individual sizes) |
| Order | items | OrderItem[] | Multiple purchased items |
| Order | shippingActivity | ShippingActivity[] | Multiple status updates |

---

## SERVICE LAYER ARCHITECTURE

```
┌─────────────────────────────────────────┐
│      EXTERNAL SERVICES                  │
│  Email Service, JWT, Payment Gateway    │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│      CONTROLLERS (HTTP Layer)           │
│  ProductController, OrderController,... │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│      BUSINESS LOGIC / SERVICES          │
│  • PaymentProcessor (Strategy)          │
│  • DataExportService (Strategy)         │
│  • CartService (Singleton + Observer)   │
│  • ReviewObserver (Singleton)           │
│  • ProductFactory (Factory)             │
│  • DAOFactory (Factory)                 │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│      REPOSITORIES (Data Access)         │
│  ProductRepository, OrderRepository,... │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│      ADAPTERS (Framework Bridge)        │
│  • MongooseRepositoryAdapter            │
│  • MemoryStorageAdapter                 │
│  • LocalStorageAdapter                  │
│  • WebSocketAdapter                     │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│      MONGOOSE MODELS / MongoDB          │
│  Customer, Product, Order, Review,...   │
└─────────────────────────────────────────┘
```

---

## OBSERVER PATTERN IMPLEMENTATIONS

### 1. ReviewObserver (Global Broadcast)
```
ReviewController
    ↓
ReviewObserver.broadcastNewReview()
    ↓ (calls Observer.notify())
Observer.notify()
    ↓ (notifies all listeners)
WebSocketAdapter.broadcastToClients()
    ↓
Browser WebSocket clients receive update
```

### 2. CartService Observer (User-Specific)
```
CartService#addItem()
    ↓
CartService#saveToStorage()
    ↓
CartService#userObserver.notify()
    ↓
subscribe() callback functions
    ↓
Frontend cart UI updates
```

---

## ADAPTER PATTERN RELATIONSHIPS

### Storage Adapter
```
CartService (depends on IStorage interface)
    ↓
setStorage() injection
    ↓
├─> MemoryStorageAdapter (for testing/in-memory)
└─> LocalStorageAdapter (for browser)
```

### Repository Adapter
```
ProductRepository, OrderRepository, etc. (use Repository interface)
    ↓
MongooseRepositoryAdapter (implements Repository)
    ↓
Mongoose Models → MongoDB
```

### WebSocket Adapter
```
Express HTTP Server
    ↓
WebSocketAdapter wraps WebSocket.Server
    ↓
Connected to ReviewObserver
    ↓
Forwards observer notifications to WebSocket clients
```

---

## TRANSACTION & STATE FLOW

### Order Creation Flow
```
1. Client: POST /api/orders
2. OrderController.create()
3. OrderRepository.create() → MongoDB insert
4. OrderDAO caches the order
5. PaymentProcessor.processPayment()
   └─> Select strategy: CreditCardPayment
   └─> Process payment
6. OrderController._sendConfirmationEmail()
7. Return response with order & transaction ID
```

### Review Creation & Broadcasting
```
1. Client1: POST /api/reviews
2. ReviewController.create()
3. ReviewRepository.create() → MongoDB insert
4. ReviewObserver.broadcastNewReview()
   └─> Observer.notify()
   └─> All subscribed callbacks execute
5. WebSocketAdapter broadcasts to all connected clients (Client2, Client3, ...)
6. Chrome/Firefox WebSocket receives message
7. Frontend React/Vue component updates
8. Browser shows review in real-time
```

---

## ERROR HANDLING FLOW

```
HTTP Request
    ↓
Controller validation
    ├─ 400: Invalid input
    └─ 200: Proceed
    ↓
Repository query
    ├─ Database error → 500: Server error
    ├─ Not found → 404: Not found
    └─ Success
    ↓
Business logic (payment, export, etc.)
    ├─ Validation error → 400: Bad request
    ├─ Processing error → 500: Server error
    └─ Success
    ↓
Response
    ├─ 201: Created
    ├─ 200: OK
    └─ Error response
```

---

## CACHING LAYERS

```
OrderDAO
  ├─ Layer 1: In-Memory Cache (CacheManager)
  │  └─ TTL: Configurable (usually 5-60 minutes)
  │
  └─ Layer 2: Database (MongoDB)
     └─ Persistent storage

AddressRepository
  └─ API Response Cache
     ├─ Countries cache
     ├─ Cities cache
     ├─ Districts cache
     └─ Wards cache
     └─ TTL: 24 hours
```

---

## COMPLETE FLOW CHART: FROM REQUEST TO RESPONSE

```
HTTP Client
    │
    ├─ [1] Send Request
    │
    ↓
Express Router
    │
    ├─ [2] Route matching
    │
    ↓
Controller
    ├─ [3] Parse request
    ├─ [4] Validate input
    │
    ↓
Service Layer (optional)
    ├─ [5] Business logic
    ├─ [6] Transformation
    │
    ↓
Repository
    ├─ [7] Build query
    ├─ [8] Execute via adapter
    │
    ↓
Adapter Layer
    ├─ [9] Convert to framework-specific code
    ├─ [10] Execute Mongoose operations
    │
    ↓
MongoDB
    ├─ [11] Database operation
    |
    ↓ [12] Return data
    ├─ Optional: Check cache
    ├─ Optional: Store in cache
    │
    ↓
Service Layer (processing result)
    ├─ [13] Format response
    ├─ [14] Trigger events (broadcast)
    │
    ↓
Controller (prepare response)
    ├─ [15] HTTP status code
    ├─ [16] JSON format
    │
    ↓
HTTP Response
    └─ [17] Send to client
```

---

## QUICK REFERENCE: WHICH CLASS TO USE WHEN

### I need to fetch products
→ Use `ProductController` → `ProductRepository` → `MongooseRepositoryAdapter`

### I need to process a payment
→ Use `PaymentProcessor` → Strategy (select based on payment method)

### I need to export order data
→ Use `DataExportService` → Strategy (select based on format)

### I need to cache order data
→ Use `OrderDAO` (via `OrderRepository`)

### I need to notify clients about new reviews
→ Use `ReviewObserver` → broadcast via `WebSocketAdapter`

### I need to manage shopping cart
→ Use `CartService` (inject `MemoryStorageAdapter` or `LocalStorageAdapter`)

### I need to validate a discount code
→ Use `DiscountCodeController` → `DiscountCodeRepository`

### I need to authenticate user
→ Use `AuthController` → `AuthRepository` → bcrypt + JWT

### I need to add a product
→ Use `ProductFactory` → create normalized object → `ProductRepository`

### I need geographic data (countries, cities)
→ Use `AddressRepository` (has built-in caching)

---

**End of Relationships Reference Guide**
