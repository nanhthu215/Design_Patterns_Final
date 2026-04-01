# Đặc Tả Chi Tiết Sơ Đồ Lớp (Class Diagram Specification)

Tài liệu này cung cấp các thông số kỹ thuật (UML ready) cho từng lớp trong các Design Patterns của dự án. Bạn có thể sử dụng thông tin này để vẽ sơ đồ lớp hoàn chỉnh.

---

## 1. Factory Pattern – Khởi tạo sản phẩm

**Mục tiêu:** Tạo các đối tượng sản phẩm khác nhau (`Coffee`, `Accessory`, v.v.) mà không làm lộ logic khởi tạo cho Client.

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/services/ProductFactory.js` | `ProductFactory` | **Creator** | Chứa phương thức tĩnh để khởi tạo sản phẩm dựa trên `type`. |
| `backend/models/Product.js` | `Product` | **Product Interface** | Định nghĩa cấu trúc dữ liệu chuẩn cho mọi loại sản phẩm. |

### Thông số kỹ thuật (UML Specs)
#### **Class: ProductFactory**
- **Methods:**
    - `+createProduct(type: String, payload: Object): Object`

#### **Class: Product (Data Structure)**
- **Attributes:**
    - `+category: String`
    - `+name: String`
    - `+price: Number`
    - `+sku: String` (Mã sản phẩm)
    - `+stock: Boolean`

### Mối quan hệ (Relationships)
- **Dependency:** `ProductFactory` --> `Product` (Factory tạo ra thực thể Product).

---

## 2. Singleton Pattern – Quản lý trạng thái duy nhất

**Mục tiêu:** Đảm bảo chỉ có một instance duy nhất (ví dụ: Giỏ hàng, Cache) hoạt động trong toàn bộ hệ thống.

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `frontend/src/core/services/CartService.js` | `CartService` | **Singleton** | Quản lý logic giỏ hàng tập trung cho cả ứng dụng. |
| `backend/services/DataStorageService.js` | `ConnectionPoolManager`| **Singleton** | Quản lý tập hợp các kết nối Database (MongoDB). |
| `backend/services/DataStorageService.js` | `CacheManager` | **Singleton** | Quản lý bộ nhớ đệm (In-memory cache). |

### Thông số kỹ thuật (UML Specs)
#### **Class: CartService**
- **Attributes:**
    - `-instance: CartService` (Static)
    - `-storage: CartStore` (Static - Adapter)
    - `-observers: Map<String, Function[]>` (Static)
- **Methods:**
    - `+getInstance(): CartService` (Static)
    - `+setStorage(storage: CartStore)` (Static)
    - `+addToCart(payload: Object): Promise<void>`
    - `+getItems(): Promise<Array>`
    - `+clearCart(): Promise<void>`

### Mối quan hệ (Relationships)
- **Self-Association:** `CartService` --> `CartService` (Giữ instance tĩnh của chính nó).

---

## 3. Observer Pattern – Thông báo thay đổi

**Mục tiêu:** Cập nhật UI ngay lập tức khi dữ liệu giỏ hàng thay đổi mà không gây phụ thuộc chéo.

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/core/patterns/Observer.js` | `Observer` | **Subject (Base)** | Lớp cơ sở chứa tập hợp các listeners và hàm notify. |
| `frontend/src/core/services/CartService.js` | `CartService` | **Concrete Subject** | Thông báo cho UI khi người dùng thêm/xóa sản phẩm. |
| `frontend/src/contexts/CartContext.jsx` | `CartProvider` | **Observer** | Lắng nghe thông báo và gọi `setItems()` để re-render UI. |

### Thông số kỹ thuật (UML Specs)
#### **Class: Observer (Base Subject)**
- **Attributes:**
    - `-listeners: Set<Function>`
- **Methods:**
    - `+subscribe(callback: Function): Function` (Trả về hàm unsubscribe)
    - `+notify(data: Any): void`

### Mối quan hệ (Relationships)
- **Dependency:** `CartService` ..> `CartProvider` (Thông báo qua hàm callback).

---

## 4. Strategy Pattern – Xử lý đa chiến thuật (Thanh toán)

**Mục tiêu:** Cho phép người dùng chuyển đổi phương thức thanh toán linh hoạt tại thời điểm chạy.

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/strategies/PaymentProcessor.js` | `PaymentProcessor` | **Context** | Lớp trung gian thực thi thanh toán dựa trên Strategy đã chọn. |
| `backend/strategies/PaymentStrategy.js` | `PaymentStrategy` | **Strategy (Abs)**| Giao diện chung cho mọi loại thanh toán. |
| `backend/strategies/CreditCardPayment.js`| `CreditCardPayment` | **Concrete Strat**| Xử lý thanh toán thẻ tín dụng. |

### Thông số kỹ thuật (UML Specs)
#### **Class: PaymentProcessor**
- **Attributes:**
    - `-strategy: PaymentStrategy`
- **Methods:**
    - `+setStrategy(strategy: PaymentStrategy): void`
    - `+processPayment(method: String, details: Object, amount: Number): Promise`

#### **Class: PaymentStrategy (Abstract)**
- **Methods:**
    - `+processPayment(details: Object, amount: Number): Promise` (Abstract)
    - `+validateDetails(details: Object): Boolean` (Abstract)

### Mối quan hệ (Relationships)
- **Aggregation:** `PaymentProcessor` <>-- `PaymentStrategy` (Context chứa Strategy).
- **Inheritance:** `CreditCardPayment` --|> `PaymentStrategy`.

---

## 5. Adapter Pattern – Tương thích cơ sở dữ liệu

**Mục tiêu:** Kết nối tầng Repository thuần túy (Pure) với thư viện Mongoose (Specific).

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/interfaces/Repository.js` | `Repository` | **Target** | Interface chuẩn cho mọi thao tác truy xuất dữ liệu. |
| `backend/core/adapters/MongooseRepositoryAdapter.js`| `MongooseRepositoryAdapter`| **Adapter** | Chuyển đổi lệnh gọi tầng Repository sang lệnh Mongoose. |

### Thông số kỹ thuật (UML Specs)
#### **Class: MongooseRepositoryAdapter**
- **Attributes:**
    - `-model: Mongoose.Model`
- **Methods:**
    - `+find(criteria: Object, options: Object): Promise`
    - `+create(data: Object): Promise`
    - `-_buildMongooseCriteria(pureCriteria: Object): Object` (Private)

### Mối quan hệ (Relationships)
- **Realization:** `MongooseRepositoryAdapter` ..|> `Repository`.

---

## 6. Repository Pattern – Trừu tượng hóa truy cập dữ liệu

**Mục tiêu:** Tách biệt logic nghiệp vụ khỏi tầng persistence (DB).

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/repositories/ProductRepository.js`| `ProductRepository` | **Concrete Repos**| Cung cấp các hàm `findPaginated`, `findById` cho Product. |
| `backend/repositories/OrderRepository.js` | `OrderRepository` | **Concrete Repos**| Cung cấp logic lưu trữ và thống kê đơn hàng. |

### Thông số kỹ thuật (UML Specs)
- **Methods (ProductRepository):**
    - `+findPaginated(filters: Object, pagination: Object): Promise`
    - `+findById(id: String): Promise`

### Mối quan hệ (Relationships)
- **Association:** `ProductRepository` --> `MongooseRepositoryAdapter` (Sử dụng adapter để truy vấn).

---

## 7. Template Method Pattern – Tái sử dụng quy trình (DAO)

**Mục tiêu:** Định nghĩa khung (Template) cho tầng DAO, các lớp con chỉ việc bổ sung các chi tiết cụ thể.

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/services/DataStorageService.js` | `BaseDAO` | **Abstract Class** | Chứa quy trình CRUD + Logic tự động xóa Cache. |
| `backend/services/DataStorageService.js` | `OrderDAO` | **Concrete Class** | Hiện thực các hàm thống kê chuyên biệt cho Order. |

### Thông số kỹ thuật (UML Specs)
#### **Class: BaseDAO**
- **Methods:**
    - `+find(query: Object): Promise` (Template Method)
    - `#_invalidateCache(): void` (Hook Method)

### Mối quan hệ (Relationships)
- **Inheritance:** `OrderDAO` --|> `BaseDAO`.

---

## 8. Strategy Pattern – Xuất báo cáo đa dạng

**Mục tiêu:** Hỗ trợ xuất dữ liệu ra nhiều định dạng file khác nhau.

| Tệp tin (File Path) | Lớp (Class/Object) | Vai trò UML | Chức năng chính |
|---|---|---|---|
| `backend/services/DataExportService.js` | `DataExportService` | **Context** | Điều phối quá trình xuất file. |
| `backend/services/DataExportService.js` | `ExportStrategy` | **Strategy (Abs)**| Interface cho các định dạng CSV, JSON, XML. |

### Thông số kỹ thuật (UML Specs)
- **Methods (ExportStrategy):**
    - `+export(data: Array, options: Object): Promise<String>`
    - `+getContentType(): String`

### Mối quan hệ (Relationships)
- **Aggregation:** `DataExportService` <>-- `ExportStrategy`.
- **Inheritance:** `CSVExportStrategy` --|> `ExportStrategy`.
