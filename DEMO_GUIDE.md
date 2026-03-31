# 🎤 Hướng Dẫn Demo & Thuyết Trình Design Patterns

> File này giúp bạn biết **demo cái gì, ở đâu, mở file nào, thao tác gì** trên web để chứng minh từng Design Pattern hoạt động.

---

## 🚀 Khởi động ứng dụng

```bash
# Terminal 1 – Backend (port 3001)
cd backend
npm install
npm start

# Terminal 2 – Frontend (port 3000)
cd frontend
npm install
npm start
```

Mở trình duyệt: `http://localhost:3000`

---

## 1. Factory Pattern – Tạo đối tượng sản phẩm

### 📂 Vị trí code

| File | Đường dẫn |
|---|---|
| **ProductFactory** | `backend/services/ProductFactory.js` |
| **Nơi gọi Factory** | `backend/controllers/ProductController.js` → method `create()` |

### 🖥️ Cách demo

1. Mở trang **Admin** (`/admin`) → vào phần **Quản lý sản phẩm**
2. Bấm **Thêm sản phẩm mới**
3. Chọn loại sản phẩm: **Coffee** / **Accessory** / **Combo**
4. Bấm **Lưu** → sản phẩm được tạo với thuộc tính riêng (SKU prefix, giá mặc định khác nhau)
5. **Mở Console backend** để thấy log: sản phẩm Coffee sẽ có SKU bắt đầu `COF-`, Accessory là `ACC-`, Combo là `CMB-`

### 🔍 Mở code cho thầy xem

Mở file `backend/services/ProductFactory.js`:
```
- Dòng 3:  static createProduct(type, payload) → điểm vào chính
- Dòng 4:  switch (type) → logic quyết định tạo loại nào
- Dòng 5-12:  case 'coffee' → trả về object với category='coffee', sku='COF-...'
- Dòng 13-17: case 'accessory' → sku='ACC-...'
- Dòng 18-22: case 'combo' → sku='CMB-...'
- Dòng 23-27: default → sku='PRD-...'
```

### ❓ Câu thầy có thể hỏi

**Q: Tại sao dùng Factory Pattern ở đây?**
> Vì mỗi loại sản phẩm (coffee, accessory, combo) có thuộc tính khác nhau (SKU prefix, giá mặc định, description mặc định). Factory đóng gói logic khởi tạo, client chỉ cần gọi `ProductFactory.createProduct('coffee', data)` mà không cần biết chi tiết bên trong.

**Q: Factory Pattern khác gì so với dùng `new` trực tiếp?**
> `new` bắt client phải biết chính xác class nào cần tạo. Factory ẩn logic đó đi – client chỉ truyền `type` string, Factory tự quyết định tạo object nào. Khi thêm loại sản phẩm mới (VD: "gift set"), chỉ cần thêm 1 case trong Factory, không sửa code client.

**Q: Đây là Simple Factory hay Factory Method?**
> Đây là **Simple Factory** (Static Factory Method) vì dùng 1 static method `createProduct()` với switch/case. Factory Method sẽ cần abstract class + subclass cho mỗi loại Factory.

---

## 2. Singleton Pattern – Quản lý giỏ hàng

### 📂 Vị trí code

| File | Đường dẫn |
|---|---|
| **CartService (core, thuần OOP)** | `frontend/src/core/services/CartService.js` |
| **CartStore interface** | `frontend/src/core/interfaces/CartStore.js` |
| **LocalStorageAdapter** | `frontend/src/core/adapters/LocalStorageAdapter.js` |
| **CartContext (React wrapper)** | `frontend/src/contexts/CartContext.jsx` |
| **Backend Singleton generic** | `backend/core/patterns/Singleton.js` |

### 🖥️ Cách demo

1. Mở trang web → thêm 1 sản phẩm vào giỏ hàng
2. **Mở DevTools (F12)** → Console
3. Gõ vào Console:
   ```javascript
   // Chứng minh Singleton: 2 lần gọi getInstance() trả về CÙNG 1 object
   const a = window.__cartService;  // (hoặc import trực tiếp)
   const b = window.__cartService;
   console.log(a === b);  // true → cùng 1 instance
   ```
4. **Demo cross-tab**: Mở 2 tab cùng website → thêm sản phẩm ở tab 1 → tab 2 tự động cập nhật (vì cùng 1 Singleton + localStorage sync)

### 🔍 Mở code cho thầy xem

Mở file `frontend/src/core/services/CartService.js`:
```
- Dòng 7:   static #instance = null      → biến private static giữ instance duy nhất
- Dòng 8:   static #storage = null       → storage adapter (Dependency Injection)
- Dòng 9:   static #observers = new Map() → observer list (kết hợp Observer Pattern)
- Dòng 18:  static getInstance()          → luôn trả về cùng 1 instance
- Dòng 19:  if (!CartService.#instance)   → lazy initialization: chỉ tạo khi cần
- Dòng 20:  CartService.#instance = new CartService()  → tạo lần đầu
```

### ❓ Câu thầy có thể hỏi

**Q: Tại sao giỏ hàng cần Singleton?**
> Vì trong 1 phiên làm việc, user chỉ có 1 giỏ hàng. Nếu tạo nhiều instance CartService, mỗi component sẽ có data giỏ hàng riêng → không đồng bộ. Singleton đảm bảo mọi component (NavBar badge, CartPage, CheckoutPage) đều truy cập CÙNG 1 nguồn dữ liệu.

**Q: Singleton có nhược điểm gì không?**
> Khó test (vì global state), khó reset giữa các test case. Trong project này, em giải quyết bằng cách thêm method `reset()` để clear instance khi cần test. Ngoài ra em dùng Dependency Injection cho storage adapter → có thể inject Mock storage khi test.

**Q: Làm sao đảm bảo chỉ có 1 instance?**
> Dùng `static #instance` (private) + `getInstance()`. Constructor không throw error nhưng `getInstance()` kiểm tra `if (!CartService.#instance)` trước khi tạo mới. `#` là JavaScript private field – không truy cập được từ bên ngoài.

---

## 3. Observer Pattern – Cập nhật giao diện giỏ hàng

### 📂 Vị trí code

| File | Đường dẫn |
|---|---|
| **Observer (generic, backend)** | `backend/core/patterns/Observer.js` |
| **CartService (Subject)** | `frontend/src/core/services/CartService.js` → method `subscribe()` + `_notifyObservers()` |
| **CartContext (Observer/Subscriber)** | `frontend/src/contexts/CartContext.jsx` → `useEffect` subscribe |
| **ReviewObserver** | `backend/core/services/ReviewObserver.js` |
| **ReviewController** | `backend/controllers/ReviewController.js` |

### 🖥️ Cách demo

**Demo 1: Giỏ hàng auto-update (chính)**
1. Mở trang chủ → nhìn vào **icon giỏ hàng trên NavBar** (hiện số 0)
2. Vào trang sản phẩm → bấm **"Thêm vào giỏ"**
3. **Ngay lập tức**, badge trên NavBar cập nhật thành **1** → KHÔNG cần reload trang
4. Thêm tiếp → badge tăng lên 2, 3...
5. Vào trang `/cart` → xóa 1 item → badge tự giảm

**Giải thích lúc demo:**
> "Khi em bấm 'Thêm vào giỏ', CartService gọi `_notifyObservers(items)`. CartContext đã subscribe vào CartService từ trước, nên nó nhận được items mới → gọi `setItems()` → React tự re-render NavBar badge."

**Demo 2: Review Observer (nâng cao, nếu thầy hỏi thêm)**
1. Mở 2 tab: tab 1 ở trang chi tiết sản phẩm, tab 2 cùng sản phẩm
2. Ở tab 1, viết 1 review + rating → Submit
3. Tab 2 nhận review mới qua WebSocket (Observer broadcast)

### 🔍 Mở code cho thầy xem

**File 1: Observer thuần** – `backend/core/patterns/Observer.js`:
```
- Dòng 5:   this.listeners = new Set()    → tập hợp các observer
- Dòng 9:   subscribe(callback)           → đăng ký observer
- Dòng 14:  notify(data)                  → thông báo TẤT CẢ observers
- Dòng 16:  for (const listener of this.listeners) { listener(data) }
```

**File 2: CartService (Subject)** – `frontend/src/core/services/CartService.js`:
```
- Dòng 206: subscribe(callback)           → đăng ký callback vào #observers Map
- Dòng 215: _notifyObservers(items)       → gọi tất cả callback khi cart thay đổi
```

**File 3: CartContext (Observer)** – `frontend/src/contexts/CartContext.jsx`:
```
- Dòng 42:  const unsubscribe = cartService.subscribe((updatedItems) => {
- Dòng 43:    setItems(updatedItems);      → React re-render khi nhận data mới
- Dòng 44:  });
- Dòng 45:  return unsubscribe;            → cleanup khi component unmount
```

### ❓ Câu thầy có thể hỏi

**Q: Observer Pattern giải quyết vấn đề gì?**
> Giải quyết vấn đề **loose coupling** (ghép nối lỏng). CartService (Subject) không cần biết có bao nhiêu component đang lắng nghe. Nó chỉ gọi `notify()`, ai đã `subscribe()` thì tự nhận. NavBar, CartPage, CheckoutPage đều subscribe độc lập → thêm/xóa component không ảnh hưởng CartService.

**Q: Observer có khác gì Event Emitter / Pub-Sub?**
> Về mặt cốt lõi, chúng cùng ý tưởng. Observer Pattern là tên gọi trong GoF, Pub/Sub thường có thêm "topic/channel" trung gian. Event Emitter của Node.js là 1 implementation cụ thể. Trong project này, em implement thuần theo GoF: Subject giữ list Observers, gọi `notify()` khi state thay đổi.

**Q: Nếu không dùng Observer thì sao?**
> Phải dùng **polling** (kiểm tra liên tục mỗi X giây) hoặc phải truyền callback props xuống từng component → code phức tạp, khó bảo trì. Observer cho phép decouple hoàn toàn – thêm component mới chỉ cần `subscribe()`.

---

## 4. Strategy Pattern – Quản lý phương thức thanh toán

### 📂 Vị trí code

| File | Đường dẫn |
|---|---|
| **PaymentStrategy (abstract)** | `backend/strategies/PaymentStrategy.js` |
| **CreditCardPayment** | `backend/strategies/CreditCardPayment.js` |
| **BankTransferPayment** | `backend/strategies/BankTransferPayment.js` |
| **EWalletPayment** | `backend/strategies/EWalletPayment.js` |
| **PaymentProcessor (context)** | `backend/strategies/PaymentProcessor.js` |
| **Nơi gọi Strategy** | `backend/controllers/OrderController.js` → method `create()` dòng ~336 |
| **Frontend gửi paymentMethod** | `frontend/src/pages/Checkout/CheckoutPage.jsx` → dòng 330, 413 |

### 🖥️ Cách demo

1. Thêm vài sản phẩm vào giỏ → vào trang **Checkout** (`/checkout`)
2. Ở phần **Payment Method**, chọn:
   - **COD** (thanh toán khi nhận hàng)
   - **VNPay / Chuyển khoản / Thẻ tín dụng / Ví điện tử** (tùy UI config)
3. Bấm **Đặt hàng**
4. **Mở Console backend** → thấy log:
   ```
   Processing payment with strategy: credit_card
   Transaction ID: CC_1711817397000_abc123
   Payment completed: { success: true, amount: 150000 }
   ```
5. **Thay đổi phương thức** → đặt thêm 1 đơn → Console hiện strategy khác (`bank_transfer` hoặc `ewallet`)

**Giải thích lúc demo:**
> "Khi user chọn phương thức thanh toán ở frontend, giá trị paymentMethod được gửi lên backend. OrderController gọi `PaymentProcessor.processPayment(paymentMethod, details, amount)`. PaymentProcessor tự động chọn strategy tương ứng (CreditCard / BankTransfer / EWallet) và delegate việc xử lý cho strategy đó. Không cần if/else dài."

### 🔍 Mở code cho thầy xem

**File 1: PaymentStrategy (abstract)** – `backend/strategies/PaymentStrategy.js`:
```
- Dòng 3:  processPayment()     → throw Error (buộc subclass phải override)
- Dòng 6:  validatePaymentDetails() → throw Error
- Dòng 9:  refund()             → throw Error
→ 3 method abstract, giống interface trong Java
```

**File 2: CreditCardPayment (concrete)** – `backend/strategies/CreditCardPayment.js`:
```
- Dòng 3:  extends PaymentStrategy          → kế thừa abstract class
- Dòng 7:  validatePaymentDetails(details)  → kiểm tra cardNumber, expiryDate, CVV
- Dòng 24: processPayment(details, amount)  → validate + simulate + trả kết quả
```

**File 3: PaymentProcessor (context)** – `backend/strategies/PaymentProcessor.js`:
```
- Dòng 5:  this.strategy = strategy         → giữ reference tới strategy hiện tại
- Dòng 10: setStrategy(strategy)            → thay đổi strategy runtime
- Dòng 15: getStrategyByType(method)        → switch → return new CreditCard/BankTransfer/EWallet
- Dòng 30: processPayment(method, details, amount) → chọn strategy + delegate
```

**File 4: OrderController (client)** – `backend/controllers/OrderController.js`:
```
- Dòng ~336: const paymentResult = await this.paymentProcessor.processPayment(
               paymentMethod, paymentDetails, totalAmount
             );
→ Đây là nơi Strategy được SỬ DỤNG thực tế trong luồng đặt hàng
```

### ❓ Câu thầy có thể hỏi

**Q: Tại sao dùng Strategy Pattern cho thanh toán?**
> Vì có nhiều phương thức thanh toán (thẻ, chuyển khoản, ví điện tử), mỗi phương thức có logic validate và xử lý riêng. Nếu dùng if/else trong OrderController thì code rất dài và khó mở rộng. Strategy tách logic riêng → mỗi strategy 1 class → thêm phương thức mới chỉ cần tạo class mới.

**Q: Strategy khác gì Factory?**
> **Factory** tập trung vào việc **TẠO** object – quyết định tạo loại nào. **Strategy** tập trung vào việc **THAY ĐỔI HÀNH VI** tại runtime – cùng 1 method `processPayment()` nhưng chạy logic khác nhau tùy strategy được chọn. Trong project này, Factory tạo sản phẩm, Strategy xử lý thanh toán – 2 mục đích khác nhau.

**Q: Nếu muốn thêm phương thức thanh toán mới (VD: COD) thì làm sao?**
> 1. Tạo file `CodPayment.js` extends `PaymentStrategy`, implement 3 methods
> 2. Thêm 1 case `'cod'` trong `PaymentProcessor.getStrategyByType()`
> 3. Xong – không sửa bất kỳ code cũ nào khác → đúng nguyên tắc **Open/Closed Principle**

---

## 5. Mẫu bổ sung: Lưu trữ & Xuất dữ liệu

### 📂 Vị trí code

| File | Đường dẫn |
|---|---|
| **BaseDAO + CacheManager** | `backend/services/DataStorageService.js` |
| **ExportStrategy + 4 strategies** | `backend/services/DataExportService.js` |
| **Route export** | `backend/routes/orders.js` → `GET /export` |

### 🖥️ Cách demo

**Export dữ liệu:**
1. Mở trình duyệt, gõ: `http://localhost:3001/api/orders/export?format=csv`
2. Dữ liệu trả về dạng CSV
3. Đổi thành `?format=json` → trả JSON
4. Đổi thành `?format=xml` → trả XML
5. **Giải thích**: "Cùng 1 API endpoint, chỉ thay đổi param `format` → backend tự chọn ExportStrategy tương ứng. Đây cũng là Strategy Pattern."

### ❓ Câu thầy có thể hỏi

**Q: Data Storage dùng pattern gì?**
> Dùng **DAO Pattern** (Data Access Object) + **Repository Pattern** + **Singleton** (CacheManager, ConnectionPoolManager). BaseDAO có sẵn caching – đọc thì cache, ghi thì invalidate cache. OrderDAO kế thừa BaseDAO và thêm methods riêng.

---

## 📋 Tóm tắt nhanh – Bảng cheat sheet

| Khi thầy hỏi | Mở file | Demo trên web |
|---|---|---|
| "Factory ở đâu?" | `backend/services/ProductFactory.js` | Admin → Thêm sản phẩm |
| "Singleton ở đâu?" | `frontend/src/core/services/CartService.js` | F12 Console: `a === b` |
| "Observer ở đâu?" | `backend/core/patterns/Observer.js` + `CartContext.jsx` | Thêm SP → badge tự update |
| "Strategy ở đâu?" | `backend/strategies/` (5 files) | Checkout → chọn thanh toán khác nhau |
| "Export dữ liệu?" | `backend/services/DataExportService.js` | URL: `/api/orders/export?format=csv` |

---

## 🎯 Tips khi thuyết trình

1. **Mở sẵn các file** trong VS Code trước khi lên bảng – đừng để thầy chờ tìm file
2. **Chạy sẵn backend + frontend** trước giờ demo
3. **Thêm sẵn vài sản phẩm** trong database để demo không bị trống
4. **Mở DevTools Console** sẵn để thầy thấy log backend
5. Khi giải thích pattern, luôn nói: **"Vấn đề → Giải pháp → Lợi ích"**
   - VD: "Vấn đề: nhiều loại thanh toán, logic khác nhau → Giải pháp: Strategy Pattern → Lợi ích: dễ mở rộng, tuân thủ Open/Closed Principle"
6. Nếu thầy hỏi câu không biết → trả lời: "Em sẽ tìm hiểu thêm" – đừng bịa
