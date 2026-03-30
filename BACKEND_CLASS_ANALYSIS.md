# BACKEND CODEBASE - COMPREHENSIVE CLASS ANALYSIS

**Generated**: March 30, 2026  
**Focus**: UML-ready architecture with all classes, attributes, methods, and relationships

---

## TABLE OF CONTENTS
1. [Models (Data Layer)](#models)
2. [Repositories (Data Access Layer)](#repositories)
3. [Controllers (Business Logic/HTTP Layer)](#controllers)
4. [Services (Business Services)](#services)
5. [Core Patterns (Design Patterns)](#core-patterns)
6. [Adapters (Framework Integration)](#adapters)
7. [Interfaces (Contracts)](#interfaces)
8. [Strategies (Strategy Pattern)](#strategies)
9. [Relationships Summary](#relationships-summary)

---

# MODELS (Data Layer)
Mongoose schemas representing domain entities

## 1. Customer Model
**File**: `backend/models/Customer.js`  
**Type**: Mongoose Schema

### Attributes:
```
- firstName: String (required, trimmed)
- lastName: String (required, trimmed)
- fullName: String (required, trimmed)
- email: String (required, unique, lowercase, trimmed)
- password: String (optional, for local auth)
- phone: String (trimmed)
- gender: String (enum: 'male' | 'female' | 'other', default: 'other')
- dateOfBirth: Date
- avatarUrl: String
- addresses: Address[] (embedded sub-documents)
  ├─ label: String
  ├─ type: String (enum: 'shipping' | 'billing', default: 'shipping')
  ├─ isDefault: Boolean (default: false)
  ├─ fullName: String
  ├─ phone: String
  ├─ addressLine1: String
  ├─ addressLine2: String
  ├─ ward: String
  ├─ district: String
  ├─ city: String
  ├─ provinceCode: String
  ├─ postalCode: String
  ├─ country: String (default: 'VN')
  └─ notes: String
- paymentMethods: PaymentMethod[] (embedded sub-documents)
  ├─ type: String (enum: 'cash' | 'card' | 'bank' | 'momo' | 'zaloPay')
  ├─ isDefault: Boolean (default: false)
  ├─ provider: String
  ├─ accountNumber: String
  ├─ accountName: String
  ├─ brand: String
  ├─ last4: String
  └─ card: { brand: String, last4: String }
- status: String (enum: 'active' | 'inactive' | 'banned', default: 'active')
- role: String (enum: 'customer' | 'admin', default: 'customer')
- provider: String (enum: 'local' | 'google', default: 'local')
- loyalty: {
    ├─ totalEarned: Number (default: 0)
    ├─ currentPoints: Number (default: 0)
    ├─ tier: String (enum: 'bronze' | 'silver' | 'gold' | 'platinum', default: 'bronze')
    ├─ lastAccrualAt: Date
    └─ history: [{
        ├─ orderId: String
        ├─ orderDate: Date
        ├─ type: String (enum: 'earned' | 'used')
        ├─ points: Number
        ├─ description: String
        └─ createdAt: Date
      }]
  }
- createdAt: Date (auto)
- updatedAt: Date (auto)
```

### Methods:
```
(Mongoose auto-generated CRUD methods)
- save()
- findById()
- findOne()
- find()
- findByIdAndUpdate()
- findByIdAndDelete()
- toObject() -> Customer (plain object)
```

---

## 2. Product Model
**File**: `backend/models/Product.js`  
**Type**: Mongoose Schema

### Attributes:
```
- id: Number (unique, indexed)
- name: String (required, trimmed)
- imageUrl: String (required)
- description: String (default: '')
- category: String (required)
- stock: Boolean (default: true)
- sku: String (required, unique, trimmed)
- price: Number (required, min: 0)
- quantity: Number (required, min: 0, default: 0)
- status: String (enum: 'Publish' | 'Inactive' | 'Draft', default: 'Publish')
- variants: VariantOption[] (embedded sub-documents)
  ├─ name: String (required, trimmed)
  └─ options: [{
      ├─ label: String (required, trimmed)
      └─ priceDelta: Number (default: 0, min: 0)
    }]
- createdAt: Date (auto: Date.now)
- updatedAt: Date (auto: Date.now)
```

### Methods:
```
- save() -> triggers pre-hook to update updatedAt
- pre('save') -> updates updatedAt to current Date.now()
```

---

## 3. Order Model
**File**: `backend/models/Order.js`  
**Type**: Mongoose Schema

### Attributes:
```
- id: String (required, unique)
- displayCode: String (unique, auto-generated 4-char alphanumeric)
- customerId: ObjectId (ref: 'Customer')
- customerEmail: String (required, lowercase, trimmed)
- customerName: String
- customerPhone: String
- items: OrderItem[] (embedded sub-documents)
  ├─ productId: Mixed (required)
  ├─ name: String (required)
  ├─ sku: String
  ├─ price: Number (required, min: 0)
  ├─ qty: Number (required, min: 1, default: 1)
  ├─ quantity: Number (min: 1)
  └─ variant: Mixed (default: null)
- subtotal: Number (required, min: 0)
- shippingFee: Number (default: 0, min: 0)
- discount: Number (default: 0, min: 0)
- pointsUsed: Number (default: 0, min: 0)
- pointsEarned: Number (default: 0, min: 0)
- tax: Number (default: 0, min: 0)
- total: Number (required, min: 0)
- currency: String (default: 'VND')
- status: String (enum: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded', default: 'pending')
- paymentMethod: String (enum: 'cod' | 'card' | 'bank' | 'cash' | 'vnpay' | 'momo' | 'zaloPay' | 'bank-transfer', default: 'cod')
- paymentStatus: String (enum: 'pending' | 'paid' | 'failed' | 'refunded', default: 'pending')
- shippingAddress: Address (embedded)
- billingAddress: Address (embedded)
- shippingActivity: ShippingActivity[] (embedded sub-documents)
  ├─ status: String
  ├─ description: String
  ├─ date: String
  ├─ time: String
  └─ completed: Boolean (default: false)
- createdAt: Date (auto)
- updatedAt: Date (auto)
```

### Methods:
```
(Mongoose auto-generated CRUD methods)
- save()
- findById()
- findOne()
- find()
- findByIdAndUpdate()
- findByIdAndDelete()
```

---

## 4. Review Model
**File**: `backend/models/Review.js`  
**Type**: Mongoose Schema

### Attributes:
```
- productId: Number (required, indexed)
- customerEmail: String (required, trimmed)
- customerName: String (required, trimmed)
- rating: Number (min: 1, max: 5, optional)
- title: String (trimmed)
- comment: String (required, trimmed)
- createdAt: Date (auto)
- updatedAt: Date (auto)
```

### Methods:
```
(Mongoose auto-generated CRUD methods)
- save()
- findById()
- findOne()
- find()
- findByIdAndUpdate()
- findByIdAndDelete()
```

---

## 5. DiscountCode Model
**File**: `backend/models/DiscountCode.js`  
**Type**: Mongoose Schema

### Attributes:
```
- code: String (required, unique, 5 chars, uppercase, trimmed)
- type: String (enum: 'percent' | 'amount')
- discountPercent: Number (default: 0, min: 0, max: 100)
- discountAmount: Number (default: 0, min: 0)
- maxUses: Number (default: 10, min: 1, max: 10)
- usedCount: Number (default: 0, min: 0)
- isActive: Boolean (default: true)
- createdAt: Date (auto)
- updatedAt: Date (auto)
```

### Methods:
```
(Mongoose auto-generated CRUD methods)
- save()
- findById()
- findOne()
- find()
- findByIdAndUpdate()
- findByIdAndDelete()
```

---

# REPOSITORIES (Data Access Layer)
Abstract repositories using adapters for database operations

## 1. ProductRepository
**File**: `backend/repositories/ProductRepository.js`  
**Pattern**: Repository Pattern + Adapter Pattern  
**Base Class**: None (standalone)

### Attributes:
```
- adapter: MongooseRepositoryAdapter
- model: Mongoose.Model<Product>
```

### Methods:
```
// Constructor
+ constructor(ProductModel?: Mongoose.Model) -> ProductRepository

// CRUD Operations
+ async findPaginated(filters: Object, pagination: Object, sortBy: string)
  -> { data: Product[], pagination: { page, limit, total, totalPages } }
+ async findById(id: string | number) -> Product | null
+ async create(productData: Object) -> Product
+ async update(id: string, updateData: Object) -> Product | null
+ async delete(id: string) -> boolean
+ async count(criteria: Object) -> number

// Helper Methods
# async _buildCriteria(filters: Object) -> Object (PURE criteria)
# async _buildSort(sortBy: string) -> Object
# async _getSoldStatsViaAdapter() -> Array<{ _id, soldCount }>
```

---

## 2. CustomerRepository
**File**: `backend/repositories/CustomerRepository.js`  
**Pattern**: Repository Pattern  
**Base Class**: None (standalone)

### Attributes:
```
- Customer: Mongoose.Model<Customer>
```

### Methods:
```
// Constructor
+ constructor(CustomerModel: Mongoose.Model) -> CustomerRepository

// Pagination & Query
+ async findAll(options?: Object) -> { data: Customer[], total, page, limit, totalPages }
+ async findById(customerId: ObjectId | string) -> Customer | null
+ async findByEmail(email: string) -> Customer | null

// CRUD Operations
+ async create(customerData: Object) -> Customer
+ async update(customerId: ObjectId, updateData: Object) -> Customer | null
+ async updateAvatar(customerId: ObjectId, avatarUrl: string) -> Customer | null

// Loyalty Operations
+ async updateLoyaltyPoints(customerId: ObjectId, points: number) -> Customer | null
+ async addLoyaltyHistory(customerId: ObjectId, history: Object) -> Customer | null

// Statistics
+ async getNewUserStats(startDate: Date, endDate: Date) -> Object
```

---

## 3. OrderRepository
**File**: `backend/repositories/OrderRepository.js`  
**Pattern**: Repository Pattern + Adapter Pattern + DAO Pattern  
**Base Class**: None (standalone)

### Attributes:
```
- adapter: MongooseRepositoryAdapter
- Order: Mongoose.Model<Order>
- Customer: Mongoose.Model<Customer>
- DiscountCode: Mongoose.Model<DiscountCode>
- daoFactory: DAOFactory
- orderDAO: OrderDAO (with caching)
```

### Methods:
```
// Constructor
+ constructor(OrderModel?, CustomerModel?, DiscountCodeModel?) -> OrderRepository

// Query Operations
+ async findPaginated(filters?: Object, options?: Object)
  -> { data: Order[], total, page, limit, totalPages }
+ async findById(orderId: ObjectId) -> Order | null (cached via DAO)
+ async findByCustomerId(customerId: ObjectId, options?: Object)
  -> { data: Order[], total, page, limit, totalPages }

// CRUD Operations
+ async create(orderData: Object) -> Order
+ async update(orderId: ObjectId, updateData: Object) -> Order | null
+ async updateStatus(orderId: ObjectId, status: string) -> Order | null
+ async delete(orderId: ObjectId) -> boolean

// Business Logic
+ async calculateShippingFee(details: Object) -> number
+ async applyDiscount(orderId: ObjectId, discountCode: string) -> Order | null

// Helper Methods
# async _buildOrderCriteria(filters: Object, searchTerm: string, status: []) -> Object
```

---

## 4. ReviewRepository
**File**: `backend/repositories/ReviewRepository.js`  
**Pattern**: Repository Pattern + Adapter Pattern

### Attributes:
```
- adapter: MongooseRepositoryAdapter
- model: Mongoose.Model<Review>
```

### Methods:
```
// Constructor
+ constructor(ReviewModel?: Mongoose.Model) -> ReviewRepository

// CRUD Operations
+ async create(reviewData: Object) -> Review
+ async findById(reviewId: ObjectId) -> Review | null
+ async update(reviewId: ObjectId, updateData: Object) -> Review | null
+ async delete(reviewId: ObjectId) -> boolean

// Query Operations
+ async findByProductId(productId: number, options?: Object)
  -> { data: Review[], page, limit, total, totalPages }

// Analytics
+ async getProductRating(productId: number)
  -> { _id, averageRating, totalReviews, maxRating, minRating }
```

---

## 5. DiscountCodeRepository
**File**: `backend/repositories/DiscountCodeRepository.js`  
**Pattern**: Repository Pattern

### Attributes:
```
- DiscountCode: Mongoose.Model<DiscountCode>
```

### Methods:
```
// Constructor
+ constructor(DiscountCodeModel: Mongoose.Model) -> DiscountCodeRepository

// Query
+ async findAll(options?: Object) -> { data: DiscountCode[], total, page, limit, totalPages }
+ async findById(id: ObjectId) -> DiscountCode | null
+ async findByCode(code: string) -> DiscountCode | null
+ async findPublic() -> DiscountCode[] (active & not expired)

// CRUD
+ async create(codeData: Object) -> DiscountCode
+ async update(id: ObjectId, updateData: Object) -> DiscountCode | null
+ async delete(id: ObjectId) -> DiscountCode | null

// Validation
+ async validate(code: string) -> { valid: boolean, reason?: string, discount: Object }
```

---

## 6. CategoryRepository
**File**: `backend/repositories/CategoryRepository.js`  
**Pattern**: Repository Pattern + Adapter Pattern

### Attributes:
```
- adapter: MongooseRepositoryAdapter
- model: Mongoose.Model<Product>
```

### Methods:
```
// Constructor
+ constructor(ProductModel?: Mongoose.Model) -> CategoryRepository

// Query
+ async getAllCategories() -> string[]
+ async getByCategory(category: string, options?: Object)
  -> { data: Product[], total, page, limit, totalPages }

// Analytics
+ async getCategoryStats(category: string)
  -> { _id, count, avgPrice, minPrice, maxPrice, totalSold }
+ async getCategoriesWithCounts() -> Category[]

// Management
+ async updateCategory(oldName: string, newName: string) -> Object
+ async categoryExists(category: string) -> boolean

// Suggestions
+ async getCategorySuggestions(query: string, limit: number) -> string[]

// Helper Methods
# async _buildCategoryFilter(category: string) -> Object (PURE)
```

---

## 7. AuthRepository
**File**: `backend/repositories/AuthRepository.js`  
**Pattern**: Repository Pattern

### Attributes:
```
- (No attributes - static client-based methods)
```

### Methods:
```
// Query
+ async findByEmail(email: string) -> Customer | null
+ async findById(id: ObjectId) -> Customer | null
+ async emailExists(email: string) -> boolean

// CRUD
+ async createCustomer(data: Object) -> Customer
+ async updateCustomer(id: ObjectId, updateData: Object) -> Customer | null

// Security
+ async verifyPassword(plainPassword: string, hashedPassword: string) -> boolean
+ async hashPassword(password: string) -> string
+ generateToken(userId: ObjectId, expiresIn?: string) -> string (JWT)

// Password Reset
+ async saveResetOtp(customerId: ObjectId, otp: string, expiresIn?: number) -> Customer | null
```

---

## 8. CustomerRepository (Additional)
**File**: `backend/repositories/CustomerRepository.js`

### Methods (continued):
```
// Account Stats
+ async getNewUserStats(startDate: Date, endDate: Date) -> { count, growth }
```

---

## 9. AccountRepository
**File**: `backend/repositories/AccountRepository.js`  
**Pattern**: Repository Pattern

### Attributes:
```
- Customer: Mongoose.Model<Customer>
```

### Methods:
```
// Constructor
+ constructor(CustomerModel: Mongoose.Model) -> AccountRepository

// Account Management
+ async getAccount(customerId: ObjectId) -> Customer | null
+ async updateProfile(customerId: ObjectId, profileData: Object) -> Customer | null
+ async updateAvatar(customerId: ObjectId, avatarUrl: string) -> Customer | null

// Preferences & Consents
+ async updatePreferences(customerId: ObjectId, preferences: Object) -> Customer | null
+ async updateConsents(customerId: ObjectId, consents: Object) -> Customer | null

// Data Access
+ async getAddresses(customerId: ObjectId) -> Address[]
+ async getPaymentMethods(customerId: ObjectId) -> PaymentMethod[]
+ async getWishlist(customerId: ObjectId) -> Product[]

// Statistics
+ async getAccountStats(customerId: ObjectId)
  -> { totalOrders, totalSpent, loyaltyPoints, memberSince, status }
```

---

## 10. AddressRepository
**File**: `backend/repositories/AddressRepository.js`  
**Pattern**: Repository Pattern + API Integration

### Attributes:
```
- cache: { countries: {data, time}, cities: {}, districts: {}, wards: {} }
- CACHE_DURATION: number (24 hours in ms)
- GEONAMES_USERNAME: string
```

### Methods:
```
// Constructor
+ constructor() -> AddressRepository

// HTTP Utilities
+ makeRequest(url: string, options?: Object) -> Promise<Object>
+ getCached(key: string, cacheObj: Object) -> any | null
+ setCached(key: string, data: any, cacheObj: Object) -> void

// Geographic Data
+ async getCountries() -> { code, name, code3 }[]
+ async getCitiesByCountry(countryCode: string) -> { code, name }[]
+ async getDistrictsByCity(cityCode: string) -> { code, name }[]
+ async getWardsByDistrict(districtCode: string) -> { code, name }[]
```

---

# CONTROLLERS (Business Logic/HTTP Layer)
Handle HTTP requests and business logic

## 1. ProductController
**File**: `backend/controllers/ProductController.js`  
**Pattern**: Controller Pattern

### Attributes:
```
- productRepository: ProductRepository
```

### Methods:
```
// Constructor
+ constructor(productRepository: ProductRepository) -> ProductController

// CRUD Operations
+ async getAll(req, res, next) -> res.json({ success, data: Product[], pagination })
+ async getOne(req, res, next) -> res.json({ success, data: Product })
+ async create(req, res, next) -> res.status(201).json({ success, data: Product })
+ async update(req, res, next) -> res.json({ success, data: Product })
+ async delete(req, res, next) -> res.json({ success })

// Related Data
+ async getReviews(req, res, next) -> res.json({ success, data: Review[], pagination })
+ async searchByName(req, res, next) -> res.json({ success, data: Product[] })
```

---

## 2. OrderController
**File**: `backend/controllers/OrderController.js`  
**Pattern**: Controller Pattern

### Attributes:
```
- orderRepository: OrderRepository
- mailer: Mailer (email service)
- loyaltyUtils: Object (loyalty utils)
- exportService: DataExportService
- paymentProcessor: PaymentProcessor
```

### Methods:
```
// Constructor
+ constructor(orderRepository, mailer, loyaltyUtils) -> OrderController

// CRUD Operations
+ async getAll(req, res, next) -> res.json({ success, data: Order[], pagination })
+ async getOne(req, res, next) -> res.json({ success, data: Order })
+ async create(req, res, next) -> res.status(201).json({ success, data: Order })
+ async update(req, res, next) -> res.json({ success, data: Order })
+ async updateStatus(req, res, next) -> res.json({ success, data: Order })
+ async delete(req, res, next) -> res.json({ success })

// Query Operations
+ async getByCustomerId(req, res, next) -> res.json({ success, data: Order[], pagination })
+ async searchOrders(req, res, next) -> res.json({ success, data: Order[] })

// Export
+ async exportOrders(req, res, next) -> res.attachment('orders.csv')

// Helper Methods
# _formatVnd(amount: number) -> string
# async _sendOrderConfirmationEmail(order: Order) -> void
# async _sendShippingNotification(order: Order, status: string) -> void
```

---

## 3. CustomerController
**File**: `backend/controllers/CustomerController.js`  
**Pattern**: Controller Pattern

### Attributes:
```
- customerRepository: CustomerRepository
```

### Methods:
```
// Constructor
+ constructor(customerRepository: CustomerRepository) -> CustomerController

// CRUD Operations
+ async getAll(req, res, next) -> res.json({ success, data: Customer[], pagination })
+ async getOne(req, res, next) -> res.json({ success, data: Customer })
+ async create(req, res, next) -> res.status(201).json({ success, data: Customer })
+ async update(req, res, next) -> res.json({ success, data: Customer })
+ async delete(req, res, next) -> res.json({ success })

// Statistics
+ async getNewUserStats(req, res, next) -> res.json({ success, data: stats, period })

// Health Check
+ ping(req, res) -> res.json({ success: true, message: 'pong' })

// Helper Methods
# _toUserPayload(doc: Customer) -> Object
```

---

## 4. ReviewController
**File**: `backend/controllers/ReviewController.js`  
**Pattern**: Controller Pattern + Observer Pattern

### Attributes:
```
- reviewRepository: ReviewRepository
- reviewObserver: ReviewObserver (via Observer pattern)
```

### Methods:
```
// Constructor
+ constructor(reviewRepository, reviewObserver) -> ReviewController

// CRUD Operations
+ async create(req, res, next) -> res.status(201).json({ success, data: Review })
+ async getById(req, res, next) -> res.json({ success, data: Review })
+ async getByProductId(req, res, next) -> res.json({ success, data: Review[], pagination })
+ async update(req, res, next) -> res.json({ success, data: Review })
+ async delete(req, res, next) -> res.json({ success })

// Observer Pattern
- Broadcasts new/updated/deleted reviews via ReviewObserver
```

---

## 5. AuthController
**File**: `backend/controllers/AuthController.js`  
**Pattern**: Controller Pattern

### Attributes:
```
- authRepository: AuthRepository
- mailer: Mailer (email service)
```

### Methods:
```
// Constructor
+ constructor(authRepository: AuthRepository) -> AuthController

// Authentication
+ async register(req, res, next) -> res.status(201).json({ success, data: Customer, token })
+ async login(req, res, next) -> res.json({ success, data: Customer, token })
+ async logout(req, res, next) -> res.json({ success })

// Password Management
+ async forgotPassword(req, res, next) -> res.json({ success })
+ async resetPassword(req, res, next) -> res.json({ success })

// OAuth
+ async googleCallback(req, res, next) -> res.redirect with token

// Email Verification
+ async sendVerificationEmail(req, res, next) -> res.json({ success })

// Helper Methods
# _toUserPayload(doc: Customer) -> Object
# async _sendTempPasswordEmail(toEmail: string, tempPassword: string) -> void
# async _sendResetOtpEmail(toEmail: string, otp: string) -> void
```

---

## 6. DiscountCodeController
**File**: `backend/controllers/DiscountCodeController.js`  
**Pattern**: Controller Pattern

### Attributes:
```
- discountCodeRepository: DiscountCodeRepository
```

### Methods:
```
// Constructor
+ constructor(discountCodeRepository) -> DiscountCodeController

// Query
+ async validate(req, res, next) -> res.json({ success, data: { code, discountPercent } })
+ async getPublic(req, res, next) -> res.json({ success, data: DiscountCode[] })
+ async getAll(req, res, next) -> res.json({ success, data: DiscountCode[], pagination })
+ async getOne(req, res, next) -> res.json({ success, data: DiscountCode })

// Management (admin only)
+ async create(req, res, next) -> res.status(201).json({ success, data: DiscountCode })
+ async update(req, res, next) -> res.json({ success, data: DiscountCode })
+ async delete(req, res, next) -> res.json({ success })
```

---

## 7. CategoryController
**File**: `backend/controllers/CategoryController.js`  
**Pattern**: Controller Pattern

### Attributes:
```
- categoryRepository: CategoryRepository
```

### Methods:
```
// Constructor
+ constructor(categoryRepository) -> CategoryController

// Query
+ async getAll(req, res, next) -> res.json({ success, data: string[] | Category[] })
+ async getByCategory(req, res, next) -> res.json({ success, category, stats, data, pagination })
+ async search(req, res, next) -> res.json({ success, data: Product[], pagination })
+ async getSuggestions(req, res, next) -> res.json({ success, data: string[] })
+ async getStats(req, res, next) -> res.json({ success, data: { count, avgPrice, etc } })

// Management (admin only)
+ async create(req, res, next) -> res.status(201).json({ success, data: Category })
+ async update(req, res, next) -> res.json({ success, data: Category })
```

---

# SERVICES (Business Services)

## 1. DataExportService
**File**: `backend/services/DataExportService.js`  
**Pattern**: Strategy Pattern (multiple export formats)

### Attributes:
```
(Abstract base - no instances)
```

### Methods:
```
+ async export(data: Array, options?: Object) -> string | Buffer
+ getContentType() -> string
+ getFileExtension() -> string
+ _escapeXml(unsafe: string) -> string (for XML strategy)
```

### Subclasses:

#### ExportStrategy (Abstract Base)
```
+ async export(data: Array, options?: Object) -> string | Buffer
+ getContentType() -> string
+ getFileExtension() -> string
```

#### CSVExportStrategy extends ExportStrategy
```
+ async export(data: Array, options?: Object) -> string (CSV content)
+ getContentType() -> "text/csv"
+ getFileExtension() -> "csv"
```

#### JSONExportStrategy extends ExportStrategy
```
+ async export(data: Array, options?: Object) -> string (JSON content)
+ getContentType() -> "application/json"
+ getFileExtension() -> "json"
```

#### XMLExportStrategy extends ExportStrategy
```
+ async export(data: Array, options?: Object) -> string (XML content)
+ getContentType() -> "application/xml"
+ getFileExtension() -> "xml"
# _escapeXml(unsafe: string) -> string
```

#### ExcelExportStrategy extends ExportStrategy
```
+ async export(data: Array, options?: Object) -> string (Excel XML)
+ getContentType() -> "application/vnd.ms-excel"
+ getFileExtension() -> "xlsx"
# _createEmptyExcel(sheetName: string) -> string
```

---

## 2. DataStorageService
**File**: `backend/services/DataStorageService.js`  
**Pattern**: DAO Pattern + Singleton Pattern + Connection Pooling

### ConnectionPoolManager (Singleton)
```
Attributes:
- connections: Map<string, Connection>
- maxConnections: number = 10
- connectionTimeout: number = 30000

Methods:
+ constructor() -> ConnectionPoolManager (singleton)
+ async getConnection(dbName: string, connectionString: string) -> Connection
+ async closeAll() -> void
+ getStats() -> Object
```

### CacheManager (Singleton)
```
Attributes:
- cache: Map<string, {data, ttl}>
- defaultTTL: number

Methods:
+ constructor() -> CacheManager (singleton)
+ async get(key: string) -> any
+ async set(key: string, value: any, ttl?: number) -> void
+ async delete(key: string) -> void
+ async clear() -> void
+ getStats() -> Object
```

### DAOFactory
```
Methods:
+ createDAO(modelName: string, Model: Mongoose.Model, ...args) -> DAO
```

### OrderDAO
```
Attributes:
- model: Mongoose.Model<Order>
- customer: Mongoose.Model<Customer>
- cache: CacheManager

Methods:
+ async findById(id: ObjectId) -> Order | null (with caching)
+ async findByCustomerId(customerId: ObjectId) -> Order[]
+ async create(data: Object) -> Order
+ async update(id: ObjectId, data: Object) -> Order | null
# async _invalidateCache(orderId: ObjectId) -> void
```

---

## 3. ProductFactory
**File**: `backend/services/ProductFactory.js`  
**Pattern**: Factory Pattern

### Attributes:
```
(Static class - no instances)
```

### Methods:
```
+ static createProduct(type: string, payload?: Object) -> Product
  - type: 'coffee' | 'accessory' | 'combo' | default
  - Returns normalized Product object with defaults
```

---

# CORE PATTERNS (Design Patterns)

## 1. Singleton
**File**: `backend/core/patterns/Singleton.js`  
**Pattern**: Singleton Pattern

### Attributes:
```
- #instances: Map<string, Object> (private static)
```

### Methods:
```
+ static getInstance(TargetClass: Function, ...args: any) -> Object
  - Returns existing instance or creates new one
  - Stores in static #instances map
+ static reset(TargetClass: Function) -> void
+ static getAllInstances() -> Map<string, Object>
```

---

## 2. Observer
**File**: `backend/core/patterns/Observer.js`  
**Pattern**: Observer/Pub-Sub Pattern

### Attributes:
```
- listeners: Set<Function>
```

### Methods:
```
+ constructor() -> Observer
+ subscribe(callback: Function) -> Function (unsubscribe function)
+ unsubscribe(callback: Function) -> void
+ notify(data: any) -> void (broadcasts to all listeners)
+ clear() -> void
+ getListenerCount() -> number
```

---

# ADAPTERS (Framework Integration)
Bridges between pure patterns and external frameworks

## 1. MongooseRepositoryAdapter extends Repository
**File**: `backend/core/adapters/MongooseRepositoryAdapter.js`

### Attributes:
```
- model: Mongoose.Model
- name: string
```

### Methods:
```
+ constructor(mongooseModel: Mongoose.Model) -> MongooseRepositoryAdapter

// Repository Interface Implementation
+ async find(criteria: Object, options?: Object) -> { data, total, page, limit, pages }
+ async findOne(criteria: Object) -> Object | null
+ async findById(id: string | ObjectId) -> Object | null
+ async create(data: Object) -> Object
+ async update(id: string | ObjectId, data: Object) -> Object | null
+ async delete(id: string | ObjectId) -> boolean
+ async count(criteria: Object) -> number
+ async exists(criteria: Object) -> boolean
+ async aggregate(pipeline: Array) -> Array

// Helper Methods
# _buildMongooseCriteria(criteria: Object) -> Object (converts pure criteria to Mongoose operators)
```

---

## 2. MemoryStorageAdapter extends IStorage
**File**: `backend/core/adapters/MemoryStorageAdapter.js`

### Attributes:
```
- #cache: Map<string, any> (private)
```

### Methods:
```
+ constructor() -> MemoryStorageAdapter

// Storage Interface Implementation
+ async get(key: string) -> any | null
+ async set(key: string, value: any) -> void
+ async remove(key: string) -> void
+ async clear() -> void

// Debugging
+ getAll() -> Object
+ reset() -> void

// Singleton
+ static getInstance() -> MemoryStorageAdapter (singleton)
```

---

## 3. LocalStorageAdapter extends IStorage
**File**: `backend/core/adapters/LocalStorageAdapter.js`

### Attributes:
```
(Uses browser localStorage - no local attributes)
```

### Methods:
```
// Storage Interface Implementation
+ async get(key: string) -> any | null
+ async set(key: string, value: any) -> void
+ async remove(key: string) -> void
+ async clear() -> void
```

---

## 4. WebSocketAdapter
**File**: `backend/core/adapters/WebSocketAdapter.js`

### Attributes:
```
- #wss: WebSocket.Server (private)
- #reviewObserver: ReviewObserver (private)
- #clientsByProduct: Map<string, Set<WebSocket>> (private)
```

### Methods:
```
+ constructor(httpServer: http.Server, reviewObserver: ReviewObserver) -> WebSocketAdapter

// Connection Management
# #setupConnections() -> void
# #handleConnection(ws: WebSocket, req: Request) -> void
# #handleReviewsConnection(ws: WebSocket, productId: string) -> void
# #broadcastToClients(productId: string, data: Object) -> void
```

---

# INTERFACES (Contracts)

## 1. Repository
**File**: `backend/core/interfaces/Repository.js`  
**Pattern**: Abstract Base Class / Interface

### Methods:
```
+ async find(criteria: Object, options?: Object) -> Promise<Object>
+ async findOne(criteria: Object) -> Promise<Object | null>
+ async findById(id: string | number) -> Promise<Object | null>
+ async create(data: Object) -> Promise<Object>
+ async update(id: string | number, data: Object) -> Promise<Object>
+ async delete(id: string | number) -> Promise<boolean>
+ async count(criteria: Object) -> Promise<number>
+ async exists(criteria: Object) -> Promise<boolean>
```

---

## 2. Storage (IStorage)
**File**: `backend/core/interfaces/Storage.js`  
**Pattern**: Abstract Base Class / Interface

### Methods:
```
+ async get(key: string) -> Promise<any>
+ async set(key: string, value: any) -> Promise<void>
+ async remove(key: string) -> Promise<void>
+ async clear() -> Promise<void>
```

---

# STRATEGIES (Strategy Pattern)
Payment processing strategies

## 1. PaymentStrategy (Abstract Base)
**File**: `backend/strategies/PaymentStrategy.js`

### Methods:
```
+ async processPayment(paymentDetails: Object, amount: number) -> Object
+ validatePaymentDetails(paymentDetails: Object) -> boolean
+ async refund(transactionId: string, amount: number) -> Object
```

---

## 2. PaymentProcessor (Context)
**File**: `backend/strategies/PaymentProcessor.js`

### Attributes:
```
- strategy: PaymentStrategy | null
```

### Methods:
```
+ constructor(strategy?: PaymentStrategy) -> PaymentProcessor

// Strategy Management
+ setStrategy(strategy: PaymentStrategy) -> void
+ getStrategyByType(paymentMethod: string) -> PaymentStrategy

// Payment Operations
+ async processPayment(paymentMethod: string, paymentDetails: Object, amount: number)
  -> { success: boolean, transactionId?: string, error?: string }
+ async refundPayment(transactionId: string, amount: number)
  -> { success: boolean, refundId?: string, error?: string }
```

---

## 3. CreditCardPayment extends PaymentStrategy
**File**: `backend/strategies/CreditCardPayment.js`

### Attributes:
```
- paymentMethod: string = 'credit_card'
```

### Methods:
```
+ constructor() -> CreditCardPayment

+ validatePaymentDetails(paymentDetails: { cardNumber, expiryDate, cvv, cardholderName })
  -> boolean (throws on validation error)

+ async processPayment(paymentDetails: Object, amount: number)
  -> { success, transactionId, paymentMethod, amount, timestamp, last4Digits, status }

+ async refund(transactionId: string, amount: number)
  -> { success, refundId, originalTransaction, amount, timestamp, status }

# _generateTransactionId() -> string
# async _simulatePaymentProcessing() -> Promise<void>
```

---

## 4. BankTransferPayment extends PaymentStrategy
**File**: `backend/strategies/BankTransferPayment.js`

### Attributes:
```
- paymentMethod: string = 'bank_transfer'
```

### Methods:
```
+ constructor() -> BankTransferPayment

+ validatePaymentDetails(paymentDetails: { accountNumber, bankCode, accountHolderName })
  -> boolean

+ async processPayment(paymentDetails: Object, amount: number)
  -> { success, transactionId, paymentMethod, amount, timestamp, accountNumber, status, estimatedCompletion }

+ async refund(transactionId: string, amount: number)
  -> { success, refundId, originalTransaction, amount, timestamp, status }

# _generateTransactionId() -> string
# async _simulatePaymentProcessing() -> Promise<void>
```

---

## 5. EWalletPayment extends PaymentStrategy
**File**: `backend/strategies/EWalletPayment.js`

### Attributes:
```
- paymentMethod: string = 'ewallet'
- supportedWallets: string[] = ['PayPal', 'Google Pay', 'Apple Pay', 'Momo', 'ZaloPay', 'VNPay']
```

### Methods:
```
+ constructor() -> EWalletPayment

+ validatePaymentDetails(paymentDetails: { walletType, walletEmail, walletPhone })
  -> boolean

+ async processPayment(paymentDetails: Object, amount: number)
  -> { success, transactionId, paymentMethod, walletType, amount, timestamp, walletEmail, status, processingTime }

+ async refund(transactionId: string, amount: number)
  -> { success, refundId, originalTransaction, amount, timestamp, status }

# _isValidEmail(email: string) -> boolean
# _isValidPhone(phone: string) -> boolean
# _generateTransactionId() -> string
# async _simulatePaymentProcessing() -> Promise<void>
```

---

# CORE SERVICES (Business Services)

## 1. CartService (Singleton + Observer)
**File**: `backend/core/services/CartService.js`

### Attributes:
```
- #instance: CartService (static private)
- #storage: IStorage (static private - injected)
- #currentUserEmail: string (static private)
- #items: Object[] (private)
- #userObserver: Observer (private)
```

### Methods:
```
+ constructor() -> CartService (private - use getInstance)

// Singleton
+ static getInstance() -> CartService
+ static setStorage(storage: IStorage) -> void
+ static async setCurrentUser(email: string) -> void

// Cart Operations
+ async addItem(item: Object) -> void
+ async removeItem(itemId: string) -> void
+ async updateItem(itemId: string, updates: Object) -> void
+ async clear() -> void

// Data Access
+ async getCart() -> Object[]
+ async getItemCount() -> number

// Observer
+ subscribe(callback: Function) -> Function (unsubscribe)

// Helper Methods
# async #loadFromStorage() -> void
# async #saveToStorage() -> void
# #getStorageKey() -> string
```

---

## 2. ReviewObserver (Singleton + Observer)
**File**: `backend/core/services/ReviewObserver.js`

### Attributes:
```
- #instance: ReviewObserver (static private)
- #productSubscriptions: Map<string, Observer> (private)
```

### Methods:
```
+ constructor() -> ReviewObserver (private - use getInstance)

// Singleton
+ static getInstance() -> ReviewObserver

// Subscriptions
+ subscribeToProduct(productId: string | number, callback: Function) -> Function (unsubscribe)
+ unsubscribeFromProduct(productId: string | number, callback: Function) -> void

// Broadcasting
+ broadcastNewReview(productId: string | number, review: Object) -> void
+ broadcastUpdateReview(productId: string | number, review: Object) -> void
+ broadcastDeleteReview(productId: string | number, reviewId: string | ObjectId) -> void

// Helper Methods
# #getOrCreateObserver(productId: string | number) -> Observer
```

---

# RELATIONSHIPS SUMMARY

## Inheritance (extends)
```
CreditCardPayment extends PaymentStrategy
BankTransferPayment extends PaymentStrategy
EWalletPayment extends PaymentStrategy

CSVExportStrategy extends ExportStrategy
JSONExportStrategy extends ExportStrategy
XMLExportStrategy extends ExportStrategy
ExcelExportStrategy extends ExportStrategy

MongooseRepositoryAdapter extends Repository
MemoryStorageAdapter extends IStorage
LocalStorageAdapter extends IStorage
```

---

## Composition (has-a / strong ownership)
```
ProductController has-a ProductRepository
  └─ ProductRepository has-a MongooseRepositoryAdapter
      └─ MongooseRepositoryAdapter has-a Mongoose.Model<Product>

OrderController has-a OrderRepository
  ├─ OrderRepository has-a MongooseRepositoryAdapter
  ├─ OrderRepository has-a DAOFactory
  └─ OrderRepository has-a OrderDAO

CustomerController has-a CustomerRepository

ReviewController has-a ReviewRepository
  ├─ ReviewRepository has-a MongooseRepositoryAdapter
  └─ ReviewController has-a ReviewObserver (Observer Pattern)

DiscountCodeController has-a DiscountCodeRepository

CategoryController has-a CategoryRepository
  └─ CategoryRepository has-a MongooseRepositoryAdapter

AuthController has-a AuthRepository

AccountRepository has-a Mongoose.Model<Customer>

OrderController has-a DataExportService
OrderController has-a PaymentProcessor

CartService has-a IStorage (injected, Strategy Pattern)
CartService has-a Observer (private #userObserver)

ReviewObserver has-a Map<productId, Observer>

PaymentProcessor has-a PaymentStrategy (runtime delegation)

WebSocketAdapter has-a Mongoose.WebSocket.Server
WebSocketAdapter has-a ReviewObserver
```

---

## Association (uses / depends on)
```
ProductController uses ProductRepository
ProductRepository uses MongooseRepositoryAdapter
MongooseRepositoryAdapter uses Mongoose.Model

OrderController uses OrderRepository, PaymentProcessor, DataExportService, Mailer
OrderRepository uses MongooseRepositoryAdapter, DAOFactory
DAOFactory creates OrderDAO

ReviewController uses ReviewRepository, ReviewObserver
ReviewObserver broadcasts to WebSocketAdapter

AuthController uses AuthRepository, Mailer
AuthRepository uses Mongoose.Model, bcrypt, jsonwebtoken

CustomerController uses CustomerRepository
CustomerRepository uses Mongoose.Model

CategoryController uses CategoryRepository
CategoryRepository uses MongooseRepositoryAdapter

DiscountCodeController uses DiscountCodeRepository

PaymentProcessor uses CreditCardPayment, BankTransferPayment, EWalletPayment

CartService uses MemoryStorageAdapter or LocalStorageAdapter (injected)

DataExportService uses CSVExportStrategy, JSONExportStrategy, XMLExportStrategy, ExcelExportStrategy
```

---

## Dependency Injection
```
Controllers receive repositories via constructor injection
Repositories receive Mongoose models via constructor injection (with auto-require fallback)
CartService receives IStorage implementation via static setStorage()
ReviewObserver injected into ReviewController
WebSocketAdapter receives ReviewObserver via constructor
PaymentProcessor creates strategies on-demand based on payment method type
```

---

## Design Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Singleton** | Singleton.js, CartService, ReviewObserver, CacheManager, ConnectionPoolManager | Ensure single instance, resource management |
| **Observer** | Observer.js, ReviewObserver, CartService | Event pub-sub, loose coupling |
| **Repository** | Repository.js + all *Repository.js | Abstract data access layer |
| **Factory** | ProductFactory, DAOFactory | Create objects with default values |
| **Strategy** | PaymentStrategy + implementations, ExportStrategy + implementations | Runtime algorithm selection |
| **Adapter** | MongooseRepositoryAdapter, MemoryStorageAdapter, LocalStorageAdapter, WebSocketAdapter | Adapt interface to framework |
| **DAO** | OrderDAO, DataStorageService | Data access with caching |
| **Connection Pool** | ConnectionPoolManager | Resource pooling |
| **MVC** | Controllers + Repositories + Models | Separation of concerns |

---

## Database References (FK Relationships)
```
Order.customerId -> Customer._id (ObjectId reference)
Review.productId -> Product.id (Number reference)
```

---

## Embedded Documents (Denormalization)
```
Customer embeds:
  - Address[] (shipping/billing)
  - PaymentMethod[]
  - Loyalty { currentPoints, totalEarned, tier, history[] }

Order embeds:
  - OrderItem[]
  - Address (shipping & billing)
  - ShippingActivity[]

Product embeds:
  - VariantOption[]
```

---

## Data Flow Diagram

```
HTTP Request
    ↓
Controller (ProductController, OrderController, etc.)
    ↓
Repository (ProductRepository, OrderRepository, etc.)
    ↓
Adapter (MongooseRepositoryAdapter)
    ↓
Mongoose Model
    ↓
MongoDB

Event Broadcasting (Observer Pattern):
ReviewController.create()
    ↓
ReviewObserver.broadcastNewReview()
    ↓
WebSocketAdapter (sends to connected clients)
    ↓
Browser WebSocket clients
```

---

## Service Layer Integration

```
OrderController uses:
  - OrderRepository (data access)
  - PaymentProcessor (payment strategy selection)
  - DataExportService (export strategies)
  - Mailer (email service)
  - LoyaltyUtils (point calculations)

CartService uses:
  - MemoryStorageAdapter or LocalStorageAdapter (storage strategy)
  - Observer (for cart change notifications)

ReviewObserver uses:
  - Observer (internal pub-sub)
  - WebSocketAdapter (broadcast to clients)

AuthController uses:
  - AuthRepository (authentication data)
  - Bcrypt (password hashing)
  - JWT (token generation)
  - Mailer (email verification)
```

---

## Transaction & Business Logic Flow

```
Order Creation Flow:
1. OrderController.create()
2. OrderRepository.create()
3. MongooseRepositoryAdapter.create()
4. Order model saved to MongoDB
5. PaymentProcessor.processPayment() (selected strategy)
6. Mailer._sendOrderConfirmationEmail()
7. Loyalty points calculated & stored
8. Response sent to client

Review Creation Flow:
1. ReviewController.create()
2. ReviewRepository.create()
3. MongooseRepositoryAdapter.create()
4. Review model saved to MongoDB
5. ReviewObserver.broadcastNewReview()
6. WebSocketAdapter broadcasts to clients
7. Response sent to client
```

---

## Error Handling & Validation

```
Controllers validate input:
  ✓ Review: rating must be 1-5
  ✓ DiscountCode: code format validation
  ✓ Payment: strategy-specific validation

Repositories handle database errors:
  ✓ Connection failures
  ✓ Query errors
  ✓ Data validation errors

Adapters convert errors to meaningful messages:
  ✓ MongooseRepositoryAdapter wraps Mongoose errors
```

---

## Caching Strategy

```
DataStorageService.CacheManager:
  - Cache for Order data (DAO pattern)
  - Cache for geographic data (AddressRepository)
  - TTL-based expiration

One-level cache per entity
```

---

This document provides a complete UML-ready analysis for creating class diagrams, understanding dependencies, and refactoring strategies.
