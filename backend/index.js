// backend/server.js (hoặc index.js tuỳ bạn đang đặt tên gì)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/database");
const http = require("http");
const net = require("net");
const WebSocket = require("ws");


const app = express();
const START_PORT = Number(process.env.PORT) || 3001; // port khởi đầu

connectDB();

// ================== MIDDLEWARE CHUNG ==================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin (mobile apps, curl) và mọi localhost/127.0.0.1 cho dev
    if (!origin || /(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    // Allow explicit origins defined via env (comma-separated)
    const allowed = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});

// ================== ROUTES ==================
const accountRoutes = require("./routes/account");
const apiRouter = require("./routes/index");

// route cập nhật tài khoản
app.use("/api/account", accountRoutes);

// các route API còn lại (/api/auth, /api/products, ...)
app.use("/api", apiRouter);

// Routes đơn giản
app.get("/", (req, res) => {
  res.send("Hello from Backend!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ================== WEBSOCKET CHO REVIEWS ==================
const server = http.createServer(app); // thay vì app.listen trực tiếp

// Tạo WebSocket server gắn vào cùng HTTP server
const wss = new WebSocket.Server({ server });

// (optional) lưu client theo product để broadcast
const clientsByProduct = new Map(); // productId -> Set<WebSocket>

wss.on("connection", (ws, req) => {
  // URL dạng: /ws/products/:id/reviews
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean); // ["ws","products",":id","reviews"]

  let productId = null;
  if (parts[0] === "ws" && parts[1] === "products" && parts[3] === "reviews") {
    productId = parts[2];
  }

  console.log("🔌 Reviews WS connected:", url.pathname, "productId =", productId);

  // Lưu client vào map theo productId (để sau broadcast review mới)
  if (productId) {
    if (!clientsByProduct.has(productId)) {
      clientsByProduct.set(productId, new Set());
    }
    clientsByProduct.get(productId).add(ws);
  }

  // Gửi message chào để FE biết connect OK
  ws.send(
    JSON.stringify({
      type: "hello",
      message: "Connected to reviews WebSocket",
      productId,
    })
  );

  ws.on("message", (msg) => {
    console.log("📨 WS message from client:", msg.toString());
    // tuỳ m, có thể cho client gửi "ping" hoặc gì đó, ở đây t chỉ log
  });

  ws.on("close", () => {
    console.log("❌ Reviews WS disconnected:", productId);
    if (productId && clientsByProduct.has(productId)) {
      const set = clientsByProduct.get(productId);
      set.delete(ws);
      if (!set.size) clientsByProduct.delete(productId);
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ Reviews WS error:", err.message);
  });
});

// Helper broadcast review mới cho tất cả client đang xem cùng product
function broadcastReview(productId, review) {
  const set = clientsByProduct.get(String(productId));
  if (!set) return;

  const payload = JSON.stringify({
    type: "review:new",
    payload: review,
  });

  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Cho chỗ khác xài (controller reviews)
module.exports.broadcastReview = broadcastReview;

// ================== GLOBAL ERROR HANDLER ==================
const { errorHandler } = require("./middleware/errorHandler");

// 404 handler - must be before error handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler - must be last
app.use(errorHandler);

// ================== START SERVER ==================
const findAvailablePort = (port) =>
  new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(findAvailablePort(port + 1));
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        tester
          .once("close", () => resolve(port))
          .close();
      })
      .listen(port);
  });

(async () => {
  try {
    const freePort = await findAvailablePort(START_PORT);
    server.listen(freePort, () => {
      console.log(`🚀 HTTP + WS server is running at http://localhost:${freePort}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("❌ Không tìm được port trống:", err);
    process.exit(1);
  }
})();
