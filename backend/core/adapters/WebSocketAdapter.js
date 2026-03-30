/**
 * backend/core/adapters/WebSocketAdapter.js
 * 🔗 ADAPTER - WebSocket server integration
 * 
 * Adapts ReviewObserver to Express/WebSocket server.
 * This is where framework coupling happens (Express/WebSocket).
 * The pattern itself (ReviewObserver) remains pure.
 */

const WebSocket = require('ws');

class WebSocketAdapter {
  #wss = null;
  #reviewObserver = null;
  #clientsByProduct = new Map(); // productId -> Set<WebSocket>

  /**
   * Create adapter instance
   * @param {http.Server} httpServer - Node.js HTTP server
   * @param {ReviewObserver} reviewObserver - Pure observer instance
   */
  constructor(httpServer, reviewObserver) {
    this.#wss = new WebSocket.Server({ server: httpServer });
    this.#reviewObserver = reviewObserver;

    this.#setupConnections();
    console.log('✅ [WebSocketAdapter] Created and connected to HTTP server');
  }

  /**
   * Setup WebSocket connection handler
   */
  #setupConnections() {
    this.#wss.on('connection', (ws, req) => {
      this.#handleConnection(ws, req);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  #handleConnection(ws, req) {
    try {
      // Parse URL: /ws/products/:id/reviews
      const url = new URL(req.url, `http://localhost:${process.env.PORT || 3001}`);
      const parts = url.pathname.split('/').filter(Boolean);

      // Check if it's a reviews route
      if (parts[0] === 'ws' && parts[1] === 'products' && parts[3] === 'reviews') {
        const productId = parts[2];
        this.#handleReviewsConnection(ws, productId);
      } else {
        ws.close(1000, 'Unknown route');
      }
    } catch (error) {
      console.error('❌ [WebSocketAdapter] Connection error:', error.message);
      ws.close(1011, 'Connection error');
    }
  }

  /**
   * Handle reviews WebSocket connection
   */
  #handleReviewsConnection(ws, productId) {
    console.log(`🔌 [WebSocketAdapter] Reviews connection for product ${productId}`);

    // Track client
    if (!this.#clientsByProduct.has(productId)) {
      this.#clientsByProduct.set(productId, new Set());
    }
    this.#clientsByProduct.get(productId).add(ws);

    // Subscribe to observer
    const unsubscribe = this.#reviewObserver.subscribeToProduct(productId, (data) => {
      this.#broadcastToClients(productId, data);
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to reviews WebSocket',
        productId,
        timestamp: new Date().toISOString(),
      })
    );

    // Handle messages from client (ping/pong)
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('❌ [WebSocketAdapter] Message error:', error.message);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`❌ [WebSocketAdapter] Disconnected from product ${productId}`);
      
      // Clean up client
      const clients = this.#clientsByProduct.get(productId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.#clientsByProduct.delete(productId);
          this.#reviewObserver.unsubscribeFromProduct(productId);
        }
      }

      // Unsubscribe
      unsubscribe();
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`⚠️  [WebSocketAdapter] Error for product ${productId}:`, error.message);
    });
  }

  /**
   * Broadcast message to all clients watching product
   */
  #broadcastToClients(productId, data) {
    const clients = this.#clientsByProduct.get(productId);
    if (!clients) return;

    const payload = JSON.stringify(data);
    let successCount = 0;

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        successCount++;
      }
    }

    console.log(`📡 [WebSocketAdapter] Broadcasted to ${successCount} clients for product ${productId}`);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    let totalConnections = 0;
    const productStats = {};

    for (const [productId, clients] of this.#clientsByProduct.entries()) {
      const count = clients.size;
      productStats[productId] = count;
      totalConnections += count;
    }

    return {
      totalConnections,
      activeProducts: this.#clientsByProduct.size,
      byProduct: productStats,
    };
  }

  /**
   * Close all connections
   */
  close() {
    this.#wss.close();
    this.#clientsByProduct.clear();
    console.log('🧹 [WebSocketAdapter] Closed all connections');
  }
}

module.exports = WebSocketAdapter;
