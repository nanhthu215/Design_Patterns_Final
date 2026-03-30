# BACKEND ARCHITECTURE - UML CLASS DIAGRAM

This file contains Mermaid diagrams for visualizing the backend codebase structure.

---

## 1. MODELS LAYER - Data Structures

```mermaid
classDiagram
    class Customer {
        +String firstName
        +String lastName
        +String fullName
        +String email
        +String password
        +String phone
        +String gender
        +Date dateOfBirth
        +String avatarUrl
        +Address[] addresses
        +PaymentMethod[] paymentMethods
        +String status
        +String role
        +String provider
        +Loyalty loyalty
        +Date createdAt
        +Date updatedAt
        +save() void
        +toObject() Object
    }

    class Address {
        +String label
        +String type
        +Boolean isDefault
        +String fullName
        +String phone
        +String addressLine1
        +String addressLine2
        +String ward
        +String district
        +String city
        +String country
    }

    class PaymentMethod {
        +String type
        +Boolean isDefault
        +String provider
        +String accountNumber
        +String accountName
        +String brand
        +String last4
    }

    class Loyalty {
        +Number totalEarned
        +Number currentPoints
        +String tier
        +Date lastAccrualAt
        +LoyaltyHistoryItem[] history
    }

    class Product {
        +Number id
        +String name
        +String imageUrl
        +String description
        +String category
        +Boolean stock
        +String sku
        +Number price
        +Number quantity
        +String status
        +Variant[] variants
        +Date createdAt
        +Date updatedAt
        +save() void
    }

    class Variant {
        +String name
        +VariantOption[] options
    }

    class VariantOption {
        +String label
        +Number priceDelta
    }

    class Order {
        +String id
        +String displayCode
        +ObjectId customerId
        +String customerEmail
        +String customerName
        +OrderItem[] items
        +Number subtotal
        +Number shippingFee
        +Number discount
        +Number pointsUsed
        +Number pointsEarned
        +Number tax
        +Number total
        +String status
        +String paymentMethod
        +String paymentStatus
        +Address shippingAddress
        +Date createdAt
    }

    class OrderItem {
        +Mixed productId
        +String name
        +String sku
        +Number price
        +Number qty
        +Mixed variant
    }

    class Review {
        +Number productId
        +String customerEmail
        +String customerName
        +Number rating
        +String title
        +String comment
        +Date createdAt
        +Date updatedAt
    }

    class DiscountCode {
        +String code
        +String type
        +Number discountPercent
        +Number discountAmount
        +Number maxUses
        +Number usedCount
        +Boolean isActive
        +Date createdAt
    }

    Customer "1" *-- "*" Address
    Customer "1" *-- "*" PaymentMethod
    Customer "1" *-- "1" Loyalty
    Product "1" *-- "*" Variant
    Variant "1" *-- "*" VariantOption
    Order "1" *-- "*" OrderItem
```

---

## 2. REPOSITORY & ADAPTER LAYER

```mermaid
classDiagram
    class Repository {
        <<interface>>
        +find() Promise
        +findOne() Promise
        +findById() Promise
        +create() Promise
        +update() Promise
        +delete() Promise
        +count() Promise
        +exists() Promise
    }

    class MongooseRepositoryAdapter {
        -Mongoose.Model model
        -String name
        +find() Promise
        +findOne() Promise
        +findById() Promise
        +create() Promise
        +update() Promise
        +delete() Promise
        +count() Promise
        +aggregate() Promise
        #_buildMongooseCriteria() Object
    }

    class ProductRepository {
        -MongooseRepositoryAdapter adapter
        -Mongoose.Model model
        +findPaginated() Promise
        +findById() Promise
        +create() Promise
        +update() Promise
        +delete() Promise
        #_buildCriteria() Object
        #_buildSort() Object
    }

    class OrderRepository {
        -MongooseRepositoryAdapter adapter
        -Mongoose.Model Order
        -Mongoose.Model Customer
        -DAOFactory daoFactory
        -OrderDAO orderDAO
        +findPaginated() Promise
        +findById() Promise
        +findByCustomerId() Promise
        +create() Promise
        +update() Promise
        +updateStatus() Promise
    }

    class ReviewRepository {
        -MongooseRepositoryAdapter adapter
        +create() Promise
        +findByProductId() Promise
        +findById() Promise
        +update() Promise
        +delete() Promise
        +getProductRating() Promise
    }

    class CustomerRepository {
        -Mongoose.Model Customer
        +findAll() Promise
        +findById() Promise
        +findByEmail() Promise
        +create() Promise
        +update() Promise
        +updateAvatar() Promise
    }

    class CategoryRepository {
        -MongooseRepositoryAdapter adapter
        +getAllCategories() Promise
        +getByCategory() Promise
        +getCategoryStats() Promise
        +updateCategory() Promise
    }

    class DiscountCodeRepository {
        -Mongoose.Model DiscountCode
        +findAll() Promise
        +findById() Promise
        +findByCode() Promise
        +create() Promise
        +update() Promise
        +validate() Promise
    }

    class AuthRepository {
        +findByEmail() Promise
        +findById() Promise
        +createCustomer() Promise
        +verifyPassword() Promise
        +hashPassword() Promise
        +generateToken() String
    }

    Repository <|-- MongooseRepositoryAdapter
    MongooseRepositoryAdapter <-- ProductRepository
    MongooseRepositoryAdapter <-- OrderRepository
    MongooseRepositoryAdapter <-- ReviewRepository
    MongooseRepositoryAdapter <-- CategoryRepository
```

---

## 3. CONTROLLER & SERVICE LAYER

```mermaid
classDiagram
    class ProductController {
        -ProductRepository productRepository
        +getAll() Promise
        +getOne() Promise
        +create() Promise
        +update() Promise
        +delete() Promise
        +getReviews() Promise
    }

    class OrderController {
        -OrderRepository orderRepository
        -Mailer mailer
        -LoyaltyUtils loyaltyUtils
        -DataExportService exportService
        -PaymentProcessor paymentProcessor
        +getAll() Promise
        +getOne() Promise
        +create() Promise
        +update() Promise
        +delete() Promise
        #_formatVnd() String
        #_sendOrderConfirmationEmail() void
    }

    class ReviewController {
        -ReviewRepository reviewRepository
        -ReviewObserver reviewObserver
        +create() Promise
        +getById() Promise
        +getByProductId() Promise
        +update() Promise
        +delete() Promise
    }

    class CustomerController {
        -CustomerRepository customerRepository
        +getAll() Promise
        +getOne() Promise
        +create() Promise
        +update() Promise
        +getNewUserStats() Promise
    }

    class AuthController {
        -AuthRepository authRepository
        -Mailer mailer
        +register() Promise
        +login() Promise
        +forgotPassword() Promise
        +resetPassword() Promise
    }

    class CategoryController {
        -CategoryRepository categoryRepository
        +getAll() Promise
        +getByCategory() Promise
        +getSuggestions() Promise
    }

    ProductController --> ProductRepository
    OrderController --> OrderRepository
    OrderController --> PaymentProcessor
    OrderController --> DataExportService
    ReviewController --> ReviewRepository
    ReviewController --> ReviewObserver
    CustomerController --> CustomerRepository
    AuthController --> AuthRepository
    CategoryController --> CategoryRepository
```

---

## 4. PATTERN IMPLEMENTATIONS - Singleton & Observer

```mermaid
classDiagram
    class Singleton {
        -Map #instances
        +getInstance() Object
        +reset() void
        +getAllInstances() Map
    }

    class Observer {
        -Set listeners
        +subscribe() Function
        +unsubscribe() void
        +notify() void
        +clear() void
        +getListenerCount() Number
    }

    class CartService {
        -CartService #instance
        -IStorage #storage
        -String #currentUserEmail
        -Object[] #items
        -Observer #userObserver
        +getInstance()$ CartService
        +setStorage()$ void
        +setCurrentUser()$ void
        +addItem() Promise
        +removeItem() Promise
        +getCart() Promise
        +subscribe() Function
    }

    class ReviewObserver {
        -ReviewObserver #instance
        -Map #productSubscriptions
        +getInstance()$ ReviewObserver
        +subscribeToProduct() Function
        +broadcastNewReview() void
        +broadcastUpdateReview() void
        +broadcastDeleteReview() void
    }

    Singleton <|.. CartService
    Singleton <|.. ReviewObserver
    CartService *-- Observer
    ReviewObserver *-- Observer
```

---

## 5. STRATEGY PATTERN - Payment Processing

```mermaid
classDiagram
    class PaymentStrategy {
        <<abstract>>
        +processPayment() Promise
        +validatePaymentDetails() Boolean
        +refund() Promise
    }

    class PaymentProcessor {
        -PaymentStrategy strategy
        +setStrategy() void
        +getStrategyByType() PaymentStrategy
        +processPayment() Promise
        +refundPayment() Promise
    }

    class CreditCardPayment {
        -String paymentMethod
        +validatePaymentDetails() Boolean
        +processPayment() Promise
        +refund() Promise
        #_generateTransactionId() String
        #_simulatePaymentProcessing() Promise
    }

    class BankTransferPayment {
        -String paymentMethod
        +validatePaymentDetails() Boolean
        +processPayment() Promise
        +refund() Promise
        #_generateTransactionId() String
    }

    class EWalletPayment {
        -String paymentMethod
        -String[] supportedWallets
        +validatePaymentDetails() Boolean
        +processPayment() Promise
        +refund() Promise
    }

    PaymentStrategy <|-- CreditCardPayment
    PaymentStrategy <|-- BankTransferPayment
    PaymentStrategy <|-- EWalletPayment
    PaymentProcessor --> PaymentStrategy
    PaymentProcessor --> CreditCardPayment
    PaymentProcessor --> BankTransferPayment
    PaymentProcessor --> EWalletPayment
```

---

## 6. STRATEGY PATTERN - Data Export

```mermaid
classDiagram
    class ExportStrategy {
        <<abstract>>
        +export() Promise
        +getContentType() String
        +getFileExtension() String
    }

    class DataExportService {
        +export() Promise
        +CSV
        +JSON
        +XML
        +Excel
    }

    class CSVExportStrategy {
        +export() Promise
        +getContentType() String
        +getFileExtension() String
    }

    class JSONExportStrategy {
        +export() Promise
        +getContentType() String
        +getFileExtension() String
    }

    class XMLExportStrategy {
        +export() Promise
        +getContentType() String
        #_escapeXml() String
    }

    class ExcelExportStrategy {
        +export() Promise
        +getContentType() String
        #_createEmptyExcel() String
    }

    ExportStrategy <|-- CSVExportStrategy
    ExportStrategy <|-- JSONExportStrategy
    ExportStrategy <|-- XMLExportStrategy
    ExportStrategy <|-- ExcelExportStrategy
    DataExportService --> ExportStrategy
```

---

## 7. ADAPTER PATTERN - Storage & WebSocket

```mermaid
classDiagram
    class IStorage {
        <<interface>>
        +get() Promise
        +set() Promise
        +remove() Promise
        +clear() Promise
    }

    class MemoryStorageAdapter {
        -Map #cache
        +get() Promise
        +set() Promise
        +remove() Promise
        +clear() Promise
        +getInstance()$ MemoryStorageAdapter
        +getAll() Object
        +reset() void
    }

    class LocalStorageAdapter {
        +get() Promise
        +set() Promise
        +remove() Promise
        +clear() Promise
    }

    class WebSocketAdapter {
        -WebSocket.Server #wss
        -ReviewObserver #reviewObserver
        -Map #clientsByProduct
        +constructor() void
        #_setupConnections() void
        #_handleConnection() void
        #_broadcastToClients() void
    }

    IStorage <|-- MemoryStorageAdapter
    IStorage <|-- LocalStorageAdapter
    CartService --> IStorage
    WebSocketAdapter --> ReviewObserver
```

---

## 8. DAO PATTERN & CONNECTION POOLING

```mermaid
classDiagram
    class ConnectionPoolManager {
        -Map connections
        -Number maxConnections
        -Number connectionTimeout
        +getConnection() Promise
        +closeAll() Promise
        +getStats() Object
    }

    class CacheManager {
        -Map cache
        -Number defaultTTL
        +get() Promise
        +set() Promise
        +delete() Promise
        +clear() Promise
        +getStats() Object
    }

    class DAOFactory {
        +createDAO() DAO
    }

    class OrderDAO {
        -Mongoose.Model model
        -Mongoose.Model customer
        -CacheManager cache
        +findById() Promise
        +findByCustomerId() Promise
        +create() Promise
        +update() Promise
        #_invalidateCache() void
    }

    class DataStorageService {
        +ConnectionPoolManager connectionPool
        +CacheManager cacheManager
        +DAOFactory daoFactory
    }

    DataStorageService *-- ConnectionPoolManager
    DataStorageService *-- CacheManager
    DataStorageService *-- DAOFactory
    DAOFactory --> OrderDAO
    OrderDAO --> CacheManager
```

---

## 9. COMPLETE APPLICATION ARCHITECTURE - High Level

```mermaid
graph TB
    subgraph HTTP["HTTP Request Layer"]
        PC["ProductController"]
        OC["OrderController"]
        RC["ReviewController"]
        CC["CustomerController"]
        AC["AuthController"]
    end

    subgraph Repository["Repository Layer"]
        PR["ProductRepository"]
        OR["OrderRepository"]
        RR["ReviewRepository"]
        CR["CustomerRepository"]
        CAR["CategoryRepository"]
    end

    subgraph Adapter["Adapter Layer"]
        MRA["MongooseRepositoryAdapter"]
        DSS["DataStorageService"]
    end

    subgraph Database["Data Layer"]
        MongoDB["MongoDB"]
    end

    subgraph Services["Business Services"]
        PP["PaymentProcessor"]
        DES["DataExportService"]
        CS["CartService"]
        RO["ReviewObserver"]
    end

    subgraph Patterns["Core Patterns"]
        Singleton["Singleton Pattern"]
        Observer["Observer Pattern"]
        Strategy["Strategy Pattern"]
        Adapter["Adapter Pattern"]
    end

    subgraph External["External Services"]
        Email["Email Service"]
        WS["WebSocket"]
        Auth["Auth/JWT"]
    end

    PC --> PR
    OC --> OR
    RC --> RR
    CC --> CR
    AC --> Auth

    PR --> MRA
    OR --> MRA
    RR --> MRA
    CR --> MRA
    CAR --> MRA

    MRA --> MongoDB
    DSS --> MongoDB

    OC --> PP
    OC --> DES
    RC --> RO
    CS -.-> Observer
    RO -.-> Observer

    PP -.-> Strategy
    DES -.-> Strategy

    CartService -.-> Singleton
    RO -.-> Singleton

    OC --> Email
    RC --> WS
    Auth --> Auth

    style HTTP fill:#e1f5ff
    style Repository fill:#c8e6c9
    style Adapter fill:#fff9c4
    style Database fill:#f8bbd0
    style Services fill:#e1bee7
    style Patterns fill:#ffe0b2
    style External fill:#b2dfdb
```

---

## 10. DEPENDENCY INJECTION FLOW

```mermaid
graph LR
    A["Application Start"]
    A --> DB["Connect to MongoDB"]
    DB --> MM["Load Mongoose Models"]
    MM --> RA["Create RepositoryAdapters"]
    RA --> R["Create Repositories"]
    R --> C["Create Controllers"]
    C --> S["Create Services"]
    S --> E["Register Express Routes"]
    E --> L["Start Listening"]

    style A fill:#fff9c4
    style DB fill:#f8bbd0
    style MM fill:#f8bbd0
    style RA fill:#fff9c4
    style R fill:#c8e6c9
    style C fill:#e1f5ff
    style S fill:#e1bee7
    style E fill:#b2dfdb
    style L fill:#c8e6c9
```

---

## 11. DATA FLOW - Order Creation

```mermaid
sequenceDiagram
    Client->>OrderController: POST /api/orders
    OrderController->>OrderRepository: create(orderData)
    OrderRepository->>MongooseRepositoryAdapter: create(data)
    MongooseRepositoryAdapter->>MongoDB: db.orders.insert()
    MongoDB-->>MongooseRepositoryAdapter: Order created
    MongooseRepositoryAdapter-->>OrderRepository: order document
    OrderRepository-->>OrderController: order
    OrderController->>PaymentProcessor: processPayment()
    PaymentProcessor->>CreditCardPayment: processPayment()
    CreditCardPayment-->>PaymentProcessor: transaction success
    PaymentProcessor-->>OrderController: payment result
    OrderController->>Mailer: sendOrderConfirmation()
    Mailer-->>OrderController: email sent
    OrderController-->>Client: response with order & transaction ID
```

---

## 12. DATA FLOW - Review Broadcasting

```mermaid
sequenceDiagram
    Client1->>ReviewController: POST /api/reviews
    ReviewController->>ReviewRepository: create(reviewData)
    ReviewRepository->>MongoDB: db.reviews.insert()
    MongoDB-->>ReviewRepository: review created
    ReviewRepository-->>ReviewController: review
    ReviewController->>ReviewObserver: broadcastNewReview()
    ReviewObserver->>Observer: notify(reviewData)
    Observer->>WebSocketAdapter: broadcast to clients
    WebSocketAdapter->>Client2: WebSocket message
    WebSocketAdapter->>Client3: WebSocket message
    ReviewController-->>Client1: response created
```

---

## 13. CACHING STRATEGY - Order DAO

```mermaid
graph TB
    Req["Request findById(orderId)"]
    Req --> Cache{"In Cache?"}
    Cache -->|Yes| Return1["Return cached data"]
    Cache -->|No| DB["Query MongoDB"]
    DB --> Store["Store in CacheManager"]
    Store --> Return2["Return data"]
    
    Timeout["Cache TTL expires"] --> Invalidate["Mark for refresh"]
    Update["Update called"] --> InvalidateCache["Invalidate cache entry"]

    Return1 --> Client["Client receives data"]
    Return2 --> Client
    
    style Req fill:#e1f5ff
    style Cache fill:#fff9c4
    style DB fill:#f8bbd0
    style Store fill:#c8e6c9
    style Client fill:#b2dfdb
```

---

## 14. SERVICE INJECTION POINTS

```mermaid
graph TB
    subgraph Controllers["Controllers (HTTP)"]
        PC["ProductController<br/>+productRepository"]
        OC["OrderController<br/>+orderRepository<br/>+paymentProcessor<br/>+mailer"]
        RC["ReviewController<br/>+reviewRepository<br/>+reviewObserver"]
        CC["CustomerController<br/>+customerRepository"]
    end

    subgraph Repositories["Repositories (Data)"]
        PR["ProductRepository<br/>+adapter"]
        OR["OrderRepository<br/>+adapter<br/>+daoFactory"]
        RR["ReviewRepository<br/>+adapter"]
        CR["CustomerRepository"]
    end

    subgraph Services["Services (Business)"]
        PP["PaymentProcessor<br/>+strategy"]
        CS["CartService<br/>+storage"]
        RO["ReviewObserver<br/>+subscriptions"]
    end

    PC -->|inject| PR
    OC -->|inject| OR
    OC -->|inject| PP
    RC -->|inject| RR
    RC -->|inject| RO
    CC -->|inject| CR
    
    CS -->|inject via<br/>setStorage| "IStorage"
    
    style Controllers fill:#e1f5ff
    style Repositories fill:#c8e6c9
    style Services fill:#e1bee7
```

---

**All diagrams are ready for integration into UML design documents and architecture reviews.**
