# 📦 DATA STORAGE & EXPORT PATTERNS - UML & IMPLEMENTATION

**Generated**: March 30, 2026  
**Patterns**: DAO (Data Access Object) + Strategy Pattern for Export

---

## 📋 TABLE OF CONTENTS

1. [Data Storage Pattern (DAO + Caching)](#data-storage-pattern)
2. [Data Export Pattern (Strategy)](#data-export-pattern)
3. [Integration Examples](#integration-examples)
4. [Performance Optimization](#performance-optimization)
5. [Best Practices](#best-practices)

---

# 🗄️ Data Storage Pattern

## Overview

**Pattern Combination:**
- ✅ **DAO Pattern** (Data Access Object) - Encapsulate database operations
- ✅ **Singleton Pattern** - ConnectionPoolManager & CacheManager
- ✅ **Template Method Pattern** - BaseDAO with common operations
- ✅ **Strategy Pattern** - Different query strategies

## UML Class Diagram

```
ConnectionPoolManager (Singleton)
├─ getInstance() → ConnectionPoolManager (single instance)
├─ getConnection(dbName) → DatabaseConnection
├─ closeAll() → void
└─ getStats() → Object

CacheManager (Singleton)
├─ getInstance() → CacheManager
├─ set(key, value, ttl) → void
├─ get(key) → Any (or null if expired)
├─ delete(key) → boolean
├─ clear() → void
└─ cleanup() → void (auto removes expired entries)

BaseDAO
├─ PRIVATE:
│  ├─ #model: mongoose.Model
│  ├─ #cacheManager: CacheManager
│  ├─ #connectionPool: ConnectionPoolManager
│  ├─ #cacheEnabled: boolean
│  └─ #cacheTTL: Number (milliseconds)
│
├─ PUBLIC:
│  ├─ find(query, options) → Promise<Array>
│  ├─ findOne(query, options) → Promise<Object>
│  ├─ findById(id, options) → Promise<Object>
│  ├─ create(data, bulk) → Promise<Object|Array>
│  ├─ update(id, data) → Promise<Object>
│  ├─ delete(id) → Promise<Object>
│  ├─ count(query) → Promise<Number>
│  ├─ aggregate(pipeline) → Promise<Array>
│  ├─ setCacheEnabled(enabled) → void
│  └─ getStats() → Object
│
└─ SPECIALIZED DAOs:
   ├─ OrderDAO - orders with customer details, revenue stats
   ├─ ProductDAO - products by category, price range, trending
   ├─ CustomerDAO - customers with orders, loyalty stats
   └─ ReviewDAO - reviews with ratings, top reviews
```

---

## Complete Implementation

### 1. ConnectionPoolManager (Singleton)

```javascript
/**
 * ConnectionPoolManager - Singleton Pattern
 * Purpose: Manage database connections efficiently (connection pooling)
 * File: backend/core/services/ConnectionPoolManager.js
 */

class ConnectionPoolManager {
  static #instance = null;

  // PRIVATE ATTRIBUTES
  #connections = new Map();
  #maxConnections = 10;
  #connectionTimeout = 30000; // 30 seconds
  #connectionStats = new Map();
  #reconnectAttempts = 3;
  #reconnectDelay = 5000; // 5 seconds

  // PRIVATE CONSTRUCTOR
  private constructor() {
    this.#connections = new Map();
    this.#connectionStats = new Map();
    
    // Monitor connections
    this.#startConnectionMonitor();
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (ConnectionPoolManager.#instance === null) {
      ConnectionPoolManager.#instance = new ConnectionPoolManager();
      console.log('✅ ConnectionPoolManager Singleton created');
    }
    return ConnectionPoolManager.#instance;
  }

  /**
   * Get or create database connection
   * Purpose: Reuse existing connections or create new ones
   */
  async getConnection(dbName, connectionString) {
    // Check if connection exists and is valid
    if (this.#connections.has(dbName)) {
      const connection = this.#connections.get(dbName);
      
      if (connection.readyState === 1) { // Connected
        this.#updateConnectionStats(dbName, 'reused');
        console.log(`♻️ Reused connection for: ${dbName}`);
        return connection;
      }

      // Remove stale connection
      this.#connections.delete(dbName);
      this.#connectionStats.delete(dbName);
    }

    // Check pool size
    if (this.#connections.size >= this.#maxConnections) {
      throw new Error(`❌ Maximum connection pool size reached: ${this.#maxConnections}`);
    }

    try {
      // Create new connection
      console.log(`🔌 Creating new connection for: ${dbName}`);

      // Using mongoose as example
      const mongoose = require('mongoose');
      const connection = await mongoose.createConnection(connectionString, {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: this.#connectionTimeout,
        socketTimeoutMS: this.#connectionTimeout,
        bufferCommands: false,
        bufferMaxEntries: 0,
      });

      // Store connection
      this.#connections.set(dbName, connection);
      this.#connectionStats.set(dbName, {
        createdAt: new Date(),
        usageCount: 1,
        lastUsed: new Date(),
        errors: 0
      });

      // Setup event handlers
      this.#setupConnectionEventHandlers(dbName, connection);

      console.log(`✅ Connection created for: ${dbName}`);
      return connection;

    } catch (error) {
      console.error(`❌ Failed to connect to ${dbName}:`, error.message);
      throw error;
    }
  }

  /**
   * Close specific connection
   */
  async closeConnection(dbName) {
    if (this.#connections.has(dbName)) {
      const connection = this.#connections.get(dbName);
      await connection.close();
      this.#connections.delete(dbName);
      this.#connectionStats.delete(dbName);
      console.log(`✅ Connection closed: ${dbName}`);
    }
  }

  /**
   * Close all connections
   */
  async closeAll() {
    console.log('🔴 Closing all connections...');
    
    for (const [dbName, connection] of this.#connections) {
      try {
        await connection.close();
        console.log(`✅ Closed: ${dbName}`);
      } catch (error) {
        console.error(`❌ Error closing ${dbName}:`, error);
      }
    }

    this.#connections.clear();
    this.#connectionStats.clear();
    console.log('✅ All connections closed');
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {};
    
    for (const [dbName, connection] of this.#connections) {
      const connStats = this.#connectionStats.get(dbName) || {};
      
      stats[dbName] = {
        isConnected: connection.readyState === 1,
        readyState: connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        host: connection.host,
        port: connection.port,
        database: connection.db?.getName?.(),
        createdAt: connStats.createdAt,
        usageCount: connStats.usageCount,
        lastUsed: connStats.lastUsed,
        errors: connStats.errors,
        uptime: connStats.createdAt ? Date.now() - connStats.createdAt.getTime() : 0
      };
    }

    return {
      activeConnections: this.#connections.size,
      maxConnections: this.#maxConnections,
      details: stats
    };
  }

  /**
   * Get connection health
   */
  getHealth() {
    const stats = this.getStats();
    const totalConnections = stats.activeConnections;
    const healthyConnections = Object.values(stats.details || {})
      .filter(conn => conn.isConnected).length;

    return {
      healthy: healthyConnections === totalConnections,
      activeConnections: healthyConnections,
      totalConnections,
      healthPercentage: totalConnections > 0 ? (healthyConnections / totalConnections) * 100 : 0
    };
  }

  // ========== PRIVATE METHODS ==========

  #setupConnectionEventHandlers(dbName, connection) {
    // Handle connection errors
    connection.on('error', (error) => {
      console.error(`❌ Connection error for ${dbName}:`, error);
      const stats = this.#connectionStats.get(dbName);
      if (stats) stats.errors++;
      
      this.#attemptReconnect(dbName);
    });

    // Handle disconnection
    connection.on('disconnected', () => {
      console.warn(`⚠️ Disconnected from ${dbName}`);
      this.#connections.delete(dbName);
    });

    // Handle reconnection
    connection.on('reconnected', () => {
      console.log(`✅ Reconnected to ${dbName}`);
    });
  }

  #attemptReconnect(dbName) {
    // Automatic reconnection with exponential backoff
    const stats = this.#connectionStats.get(dbName);
    if (!stats) return;

    if (stats.reconnectAttempts < this.#reconnectAttempts) {
      const delay = this.#reconnectDelay * Math.pow(2, stats.reconnectAttempts || 0);
      console.log(`🔄 Reconnecting to ${dbName} in ${delay}ms...`);
      
      setTimeout(() => {
        // Mongoose handles this automatically
      }, delay);
    }
  }

  #updateConnectionStats(dbName, action) {
    const stats = this.#connectionStats.get(dbName);
    if (stats) {
      if (action === 'reused') {
        stats.usageCount++;
        stats.lastUsed = new Date();
      }
    }
  }

  #startConnectionMonitor() {
    // Monitor connections every 30 seconds
    setInterval(() => {
      const health = this.getHealth();
      if (health.healthPercentage < 100) {
        console.warn(`⚠️ Connection health: ${health.healthPercentage.toFixed(2)}%`);
      }
    }, 30000);
  }
}

module.exports = ConnectionPoolManager;
```

### 2. CacheManager (Singleton)

```javascript
/**
 * CacheManager - Singleton Pattern
 * Purpose: Cache database query results with TTL (Time To Live)
 * File: backend/core/services/CacheManager.js
 */

class CacheManager {
  static #instance = null;

  // PRIVATE ATTRIBUTES
  #cache = new Map();
  #defaultTTL = 300000; // 5 minutes
  #maxEntries = 10000;
  #cleanupInterval = 300000; // 5 minutes
  #stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };

  // PRIVATE CONSTRUCTOR
  private constructor() {
    this.#cache = new Map();
    this.#startCleanupTimer();
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (CacheManager.#instance === null) {
      CacheManager.#instance = new CacheManager();
      console.log('✅ CacheManager Singleton created');
    }
    return CacheManager.#instance;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, value, ttl = this.#defaultTTL) {
    // Check cache size (LRU eviction if needed)
    if (this.#cache.size >= this.#maxEntries) {
      this.#evictOldest();
    }

    const expiry = Date.now() + ttl;
    const entry = {
      value,
      expiry,
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date()
    };

    this.#cache.set(key, entry);
    this.#stats.sets++;

    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
    return this;
  }

  /**
   * Get cache entry
   * Returns null if expired or not found
   */
  get(key) {
    const entry = this.#cache.get(key);

    if (!entry) {
      this.#stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.#cache.delete(key);
      this.#stats.misses++;
      console.log(`⏰ Cache expired: ${key}`);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.#stats.hits++;

    console.log(`✅ Cache hit: ${key}`);
    return entry.value;
  }

  /**
   * Check if key exists (without updating stats)
   */
  has(key) {
    const entry = this.#cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.#cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(key) {
    const deleted = this.#cache.delete(key);
    if (deleted) {
      this.#stats.deletes++;
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.#cache.size;
    this.#cache.clear();
    this.#stats.deletes += size;
    console.log(`🗑️ Cache cleared (${size} entries)`);
    return this;
  }

  /**
   * Clear cache entries matching pattern
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of this.#cache.keys()) {
      if (regex.test(key)) {
        this.#cache.delete(key);
        deleted++;
      }
    }

    this.#stats.deletes += deleted;
    console.log(`🗑️ Deleted ${deleted} entries matching pattern: ${pattern}`);
    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.#cache) {
      if (now > entry.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    const hitRate = this.#stats.hits + this.#stats.misses > 0
      ? (this.#stats.hits / (this.#stats.hits + this.#stats.misses)) * 100
      : 0;

    return {
      totalEntries: this.#cache.size,
      validEntries,
      expiredEntries,
      maxEntries: this.#maxEntries,
      memoryUsage: this.#estimateMemoryUsage(),
      hits: this.#stats.hits,
      misses: this.#stats.misses,
      hitRate: hitRate.toFixed(2) + '%',
      sets: this.#stats.sets,
      deletes: this.#stats.deletes,
      evictions: this.#stats.evictions
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.#cache) {
      if (now > entry.expiry) {
        this.#cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleanup: Removed ${cleaned} expired entries`);
    }

    return cleaned;
  }

  // ========== PRIVATE METHODS ==========

  #evictOldest() {
    // LRU (Least Recently Used) eviction
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.#cache) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.#cache.delete(oldestKey);
      this.#stats.evictions++;
      console.log(`⚠️ LRU Evicted: ${oldestKey}`);
    }
  }

  #startCleanupTimer() {
    // Auto cleanup expired entries periodically
    setInterval(() => {
      this.cleanup();
    }, this.#cleanupInterval);
  }

  #estimateMemoryUsage() {
    // Rough estimate in MB
    let size = 0;
    for (const [key, entry] of this.#cache) {
      size += key.length + JSON.stringify(entry.value).length;
    }
    return (size / 1024 / 1024).toFixed(2) + ' MB';
  }
}

module.exports = CacheManager;
```

### 3. BaseDAO (Template Method Pattern)

```javascript
/**
 * BaseDAO - Template Method & DAO Pattern
 * Purpose: Common database operation interface with caching
 * File: backend/core/services/BaseDAO.js
 */

const CacheManager = require('./CacheManager');
const ConnectionPoolManager = require('./ConnectionPoolManager');

class BaseDAO {
  // PROTECTED ATTRIBUTES
  _model;
  _cacheManager;
  _connectionPool;
  _cacheEnabled;
  _cacheTTL;
  _collectionName;

  constructor(model, options = {}) {
    this._model = model;
    this._cacheManager = CacheManager.getInstance();
    this._connectionPool = ConnectionPoolManager.getInstance();
    this._cacheEnabled = options.cacheEnabled !== false;
    this._cacheTTL = options.cacheTTL || 300000; // 5 minutes default
    this._collectionName = model.collection?.name || 'unknown';

    console.log(`📦 BaseDAO initialized for collection: ${this._collectionName}`);
  }

  // ========== READ OPERATIONS (with caching) ==========

  /**
   * Find documents matching query
   */
  async find(query = {}, options = {}) {
    const cacheKey = this._generateCacheKey('find', { query, options });
    
    return this._executeWithCache(cacheKey, async () => {
      console.log(`🔍 Finding in ${this._collectionName}:`, query);
      
      try {
        const result = await this._model
          .find(query, null, options)
          .lean() // Return plain objects (faster)
          .exec();
        
        console.log(`✅ Found ${result.length} documents`);
        return result;
      } catch (error) {
        console.error(`❌ Find error:`, error);
        throw error;
      }
    });
  }

  /**
   * Find single document
   */
  async findOne(query = {}, options = {}) {
    const cacheKey = this._generateCacheKey('findOne', { query, options });

    return this._executeWithCache(cacheKey, async () => {
      console.log(`🔍 Finding one in ${this._collectionName}:`, query);
      
      return this._model
        .findOne(query, null, options)
        .lean()
        .exec();
    });
  }

  /**
   * Find by ID
   */
  async findById(id, options = {}) {
    const cacheKey = this._generateCacheKey('findById', { id });

    return this._executeWithCache(cacheKey, async () => {
      return this._model
        .findById(id, null, options)
        .lean()
        .exec();
    });
  }

  /**
   * Count documents
   */
  async count(query = {}) {
    const cacheKey = this._generateCacheKey('count', { query });

    return this._executeWithCache(cacheKey, async () => {
      return this._model.countDocuments(query);
    });
  }

  /**
   * Aggregate with pipeline
   */
  async aggregate(pipeline = [], options = {}) {
    const cacheKey = this._generateCacheKey('aggregate', { pipeline });

    return this._executeWithCache(cacheKey, async () => {
      console.log(`📊 Aggregating ${this._collectionName}...`);
      return this._model.aggregate(pipeline, options);
    });
  }

  // ========== WRITE OPERATIONS (cache invalidation) ==========

  /**
   * Create document
   */
  async create(data, bulk = false) {
    try {
      let result;

      if (bulk && Array.isArray(data)) {
        result = await this._model.insertMany(data);
        console.log(`✅ Created ${data.length} documents`);
      } else {
        result = await this._model.create(data);
        console.log(`✅ Created 1 document`);
      }

      // Invalidate cache
      this._invalidateCache();
      return result;

    } catch (error) {
      console.error(`❌ Create error:`, error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async update(id, data, options = {}) {
    try {
      const result = await this._model.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        ...options
      }).lean();

      console.log(`✅ Updated document: ${id}`);

      // Invalidate cache
      this._invalidateCache();
      return result;

    } catch (error) {
      console.error(`❌ Update error:`, error);
      throw error;
    }
  }

  /**
   * Update many documents
   */
  async updateMany(filter, update, options = {}) {
    try {
      const result = await this._model.updateMany(filter, update, options);
      
      console.log(`✅ Updated ${result.modifiedCount} documents`);

      // Invalidate cache
      this._invalidateCache();
      return result;

    } catch (error) {
      console.error(`❌ UpdateMany error:`, error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async delete(id) {
    try {
      const result = await this._model.findByIdAndDelete(id);
      
      console.log(`✅ Deleted document: ${id}`);

      // Invalidate cache
      this._invalidateCache();
      return result;

    } catch (error) {
      console.error(`❌ Delete error:`, error);
      throw error;
    }
  }

  /**
   * Delete many documents
   */
  async deleteMany(filter) {
    try {
      const result = await this._model.deleteMany(filter);
      
      console.log(`✅ Deleted ${result.deletedCount} documents`);

      // Invalidate cache
      this._invalidateCache();
      return result;

    } catch (error) {
      console.error(`❌ DeleteMany error:`, error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get collection statistics
   */
  getStats() {
    return {
      collection: this._collectionName,
      cacheEnabled: this._cacheEnabled,
      cacheTTL: `${this._cacheTTL / 1000}s`,
      cacheStats: this._cacheManager.getStats(),
      connectionStats: this._connectionPool.getStats()
    };
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled) {
    this._cacheEnabled = enabled;
    if (!enabled) {
      this._invalidateCache();
    }
  }

  /**
   * Set cache TTL
   */
  setCacheTTL(ttl) {
    this._cacheTTL = ttl;
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Generate cache key from operation and parameters
   */
  _generateCacheKey(operation, params = {}) {
    const hash = JSON.stringify(params);
    return `${this._collectionName}:${operation}:${hash}`;
  }

  /**
   * Execute query with caching
   */
  async _executeWithCache(cacheKey, operation) {
    if (this._cacheEnabled) {
      const cached = this._cacheManager.get(cacheKey);
      if (cached !== null) {
        console.log(`💾 Cache hit for ${cacheKey}`);
        return cached;
      }
    }

    // Execute operation (cache miss)
    const result = await operation();

    // Cache result
    if (this._cacheEnabled) {
      this._cacheManager.set(cacheKey, result, this._cacheTTL);
    }

    return result;
  }

  /**
   * Invalidate all cache for this collection
   */
  _invalidateCache() {
    if (!this._cacheEnabled) return;

    const pattern = `^${this._collectionName}:`;
    const deleted = this._cacheManager.deletePattern(pattern);
    console.log(`🔄 Invalidated ${deleted} cache entries`);
  }
}

module.exports = BaseDAO;
```

### 4. Specialized DAOs

```javascript
/**
 * OrderDAO - Specialized DAO for Orders
 * File: backend/services/OrderDAO.js
 */

const BaseDAO = require('./BaseDAO');

class OrderDAO extends BaseDAO {
  constructor(orderModel, customerModel) {
    super(orderModel, {
      cacheEnabled: true,
      cacheTTL: 600000 // 10 minutes (longer for order data)
    });
    this._customerModel = customerModel;
  }

  /**
   * Find orders with customer details
   */
  async findOrdersWithCustomers(query = {}, options = {}) {
    const cacheKey = this._generateCacheKey('findOrdersWithCustomers', { query });

    return this._executeWithCache(cacheKey, async () => {
      console.log(`📦 Finding orders with customer details...`);
      
      return this._model
        .find(query, null, options)
        .populate('customerId', 'firstName lastName email phone')
        .lean()
        .exec();
    });
  }

  /**
   * Get order statistics
   */
  async getOrderStats(timeRange = 'all') {
    const cacheKey = this._generateCacheKey('getOrderStats', { timeRange });

    return this._executeWithCache(cacheKey, async () => {
      console.log(`📊 Computing order statistics for: ${timeRange}`);
      
      const now = new Date();
      let startDate = new Date(0);

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const pipeline = [
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
            minOrderValue: { $min: '$total' },
            maxOrderValue: { $max: '$total' }
          }
        }
      ];

      const stats = await this._model.aggregate(pipeline);
      return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        minOrderValue: 0,
        maxOrderValue: 0
      };
    });
  }

  /**
   * Get top customers by order count
   */
  async getTopCustomers(limit = 10) {
    const cacheKey = this._generateCacheKey('getTopCustomers', { limit });

    return this._executeWithCache(cacheKey, async () => {
      const pipeline = [
        {
          $group: {
            _id: '$customerId',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$total' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer'
          }
        }
      ];

      return this._model.aggregate(pipeline);
    });
  }

  /**
   * Get order status breakdown
   */
  async getStatusBreakdown() {
    const cacheKey = this._generateCacheKey('getStatusBreakdown', {});

    return this._executeWithCache(cacheKey, async () => {
      const pipeline = [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        },
        { $sort: { count: -1 } }
      ];

      return this._model.aggregate(pipeline);
    });
  }
}

module.exports = OrderDAO;
```

---

# 📤 Data Export Pattern

## Overview

**Pattern**: Strategy Pattern
- ✅ **ExportStrategy** (Abstract base class)
- ✅ **Multiple Concrete Strategies** (CSV, JSON, XML, Excel, PDF)
- ✅ **ExportStrategyFactory** (Creation)
- ✅ **DataExportService** (Context/Manager)

## UML Class Diagram

```
ExportStrategy (Abstract)
├─ +export(data, options): Promise<string|Buffer>
├─ +getContentType(): String
└─ +getFileExtension(): String

CSVExportStrategy
├─ +export() - comma/tab separated values
├─ +getContentType() - text/csv
└─ +getFileExtension() - csv

JSONExportStrategy
├─ +export() - JSON format
├─ +getContentType() - application/json
└─ +getFileExtension() - json

XMLExportStrategy
├─ +export() - XML format
├─ +getContentType() - application/xml
└─ +getFileExtension() - xml

ExcelExportStrategy
├─ +export() - Excel format
├─ +getContentType() - application/vnd.ms-excel
└─ +getFileExtension() - xls

PDFExportStrategy
├─ +export() - PDF format  
├─ +getContentType() - application/pdf
└─ +getFileExtension() - pdf

Factory
├─ +createStrategy(format): ExportStrategy
└─ +getSupportedFormats(): Array

DataExportService (Context)
├─ -strategies: Map
├─ +exportData(data, format, options): ExportResult
├─ +registerStrategy(format, strategy): void
├─ +getSupportedFormats(): Array
└─ +batchExport(data, formats): Promise<Array>
```

## Complete Implementation

### Base Strategy & Concrete Strategies

```javascript
/**
 * ExportStrategy - Abstract Base Class
 * File: backend/strategies/ExportStrategy.js
 */

class ExportStrategy {
  /**
   * Export data to specific format
   * Must be implemented by subclasses
   */
  async export(data, options = {}) {
    throw new Error('❌ export() must be implemented by subclass');
  }

  /**
   * Get HTTP content type
   */
  getContentType() {
    throw new Error('❌ getContentType() must be implemented by subclass');
  }

  /**
   * Get file extension
   */
  getFileExtension() {
    throw new Error('❌ getFileExtension() must be implemented by subclass');
  }

  /**
   * Get display name
   */
  getDisplayName() {
    throw new Error('❌ getDisplayName() must be implemented by subclass');
  }

  /**
   * Validate data for export
   */
  validateData(data) {
    if (!Array.isArray(data)) {
      throw new Error('❌ Data must be an array');
    }
    return true;
  }

  /**
   * Get estimated file size
   */
  getEstimatedSize(data) {
    return JSON.stringify(data).length;
  }
}

module.exports = ExportStrategy;

/**
 * CSVExportStrategy
 * File: backend/strategies/CSVExportStrategy.js
 */

const ExportStrategy = require('./ExportStrategy');

class CSVExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    console.log(`📄 Exporting to CSV...`);
    
    this.validateData(data);

    const {
      headers = null,
      delimiter = ',',
      includeHeader = true,
      escapeQuotes = true
    } = options;

    if (data.length === 0) {
      return '';
    }

    // Auto-detect headers from first object
    const csvHeaders = headers || Object.keys(data[0]);

    // Convert rows
    const rows = data.map(item => {
      return csvHeaders.map(header => {
        const value = item[header] !== undefined ? item[header] : '';
        const stringValue = String(value).trim();

        // Escape values with special characters
        if (escapeQuotes && (stringValue.includes(delimiter) || 
                            stringValue.includes('"') || 
                            stringValue.includes('\n'))) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      }).join(delimiter);
    });

    // Combine header + rows
    const csv = includeHeader
      ? [csvHeaders.join(delimiter), ...rows].join('\n')
      : rows.join('\n');

    console.log(`✅ CSV export complete: ${data.length} rows`);
    return csv;
  }

  getContentType() {
    return 'text/csv; charset=utf-8';
  }

  getFileExtension() {
    return 'csv';
  }

  getDisplayName() {
    return 'CSV (Comma-Separated Values)';
  }
}

module.exports = CSVExportStrategy;

/**
 * JSONExportStrategy
 * File: backend/strategies/JSONExportStrategy.js
 */

class JSONExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    console.log(`📄 Exporting to JSON...`);
    
    this.validateData(data);

    const {
      pretty = true,
      rootKey = null,
      metadata = true
    } = options;

    let exportData = data;

    // Add metadata
    if (metadata) {
      exportData = {
        meta: {
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          version: '1.0'
        },
        data: data
      };
    }

    // Wrap in root key
    if (rootKey && !metadata) {
      exportData = { [rootKey]: data };
    }

    const json = JSON.stringify(exportData, null, pretty ? 2 : 0);

    console.log(`✅ JSON export complete: ${data.length} records`);
    return json;
  }

  getContentType() {
    return 'application/json; charset=utf-8';
  }

  getFileExtension() {
    return 'json';
  }

  getDisplayName() {
    return 'JSON (JavaScript Object Notation)';
  }
}

module.exports = JSONExportStrategy;

/**
 * XMLExportStrategy
 * File: backend/strategies/XMLExportStrategy.js
 */

class XMLExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    console.log(`📄 Exporting to XML...`);
    
    this.validateData(data);

    const {
      rootElement = 'data',
      itemElement = 'item',
      encoding = 'UTF-8',
      includeDeclaration = true
    } = options;

    if (data.length === 0) {
      return `<${rootElement}></${rootElement}>`;
    }

    // Build items
    const items = data.map(item => {
      const properties = Object.entries(item)
        .map(([key, value]) => {
          const tagName = this._sanitizeTagName(key);
          const escapedValue = this._escapeXml(String(value));
          return `    <${tagName}>${escapedValue}</${tagName}>`;
        })
        .join('\n');

      return `  <${itemElement}>\n${properties}\n  </${itemElement}>`;
    }).join('\n');

    // Build XML
    let xml = '';
    if (includeDeclaration) {
      xml += `<?xml version="1.0" encoding="${encoding}"?>\n`;
    }
    xml += `<${rootElement}>\n${items}\n</${rootElement}>`;

    console.log(`✅ XML export complete: ${data.length} items`);
    return xml;
  }

  getContentType() {
    return 'application/xml; charset=utf-8';
  }

  getFileExtension() {
    return 'xml';
  }

  getDisplayName() {
    return 'XML (eXtensible Markup Language)';
  }

  // ====== PRIVATE HELPERS ======

  _escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      const map = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;'
      };
      return map[c] || c;
    });
  }

  _sanitizeTagName(name) {
    return name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^[0-9]/, '_$&');
  }
}

module.exports = XMLExportStrategy;

/**
 * PD FExportStrategy
 * File: backend/strategies/PDFExportStrategy.js
 */

const PDFDocument = require('pdfkit');

class PDFExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    console.log(`📄 Exporting to PDF...`);
    
    this.validateData(data);

    const {
      title = 'Export',
      fontSize = 10,
      includeMetadata = true
    } = options;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4' });
        const chunks = [];

        // Collect PDF data
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdf = Buffer.concat(chunks);
          console.log(`✅ PDF export complete: ${data.length} records`);
          resolve(pdf);
        });

        // Add title
        doc.fontSize(16).text(title, { align: 'center' });
        doc.moveDown();

        // Add metadata
        if (includeMetadata) {
          doc.fontSize(8).fillColor('gray')
            .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
          doc.moveDown();
        }

        // Add table headers
        const headers = Object.keys(data[0]);
        const columnWidth = 540 / headers.length;

        doc.fontSize(fontSize).fillColor('black');
        
        // Header row
        headers.forEach((header, i) => {
          doc.text(header, 50 + i * columnWidth, doc.y, {
            width: columnWidth - 10,
            align: 'left'
          });
        });

        doc.moveTo(50, doc.y).lineTo(590, doc.y).stroke();
        doc.moveDown();

        // Data rows
        data.forEach(item => {
          let yPosition = doc.y;

          headers.forEach((header, i) => {
            const value = String(item[header] || '').substring(0, 50);
            doc.text(value, 50 + i * columnWidth, yPosition, {
              width: columnWidth - 10,
              align: 'left'
            });
          });

          doc.moveDown();

          // New page if needed
          if (doc.y > 700) {
            doc.addPage();
            yPosition = doc.y;
          }
        });

        doc.end();

      } catch (error) {
        console.error(`❌ PDF export error:`, error);
        reject(error);
      }
    });
  }

  getContentType() {
    return 'application/pdf';
  }

  getFileExtension() {
    return 'pdf';
  }

  getDisplayName() {
    return 'PDF (Portable Document Format)';
  }
}

module.exports = PDFExportStrategy;
```

### Factory & Service

```javascript
/**
 * ExportStrategyFactory
 * File: backend/strategies/ExportStrategyFactory.js
 */

const CSVExportStrategy = require('./CSVExportStrategy');
const JSONExportStrategy = require('./JSONExportStrategy');
const XMLExportStrategy = require('./XMLExportStrategy');
const PDFExportStrategy = require('./PDFExportStrategy');

class ExportStrategyFactory {
  static #strategies = {
    'csv': CSVExportStrategy,
    'json': JSONExportStrategy,
    'xml': XMLExportStrategy,
    'pdf': PDFExportStrategy
  };

  /**
   * Create strategy by format
   */
  static createStrategy(format) {
    const StrategyClass = this.#strategies[format.toLowerCase()];

    if (!StrategyClass) {
      throw new Error(`❌ Unsupported format: ${format}. Supported: ${this.getSupportedFormats().join(', ')}`);
    }

    return new StrategyClass();
  }

  /**
   * Get all supported formats
   */
  static getSupportedFormats() {
    return Object.keys(this.#strategies);
  }

  /**
   * Register custom strategy
   */
  static registerStrategy(format, StrategyClass) {
    this.#strategies[format.toLowerCase()] = StrategyClass;
    console.log(`✅ Registered strategy: ${format}`);
  }

  /**
   * Get strategy info
   */
  static getStrategyInfo(format) {
    const strategy = this.createStrategy(format);
    return {
      format,
      displayName: strategy.getDisplayName(),
      fileExtension: strategy.getFileExtension(),
      contentType: strategy.getContentType()
    };
  }
}

module.exports = ExportStrategyFactory;

/**
 * DataExportService
 * File: backend/services/DataExportService.js
 */

const ExportStrategyFactory = require('../strategies/ExportStrategyFactory');

class DataExportService {
  constructor() {
    this.customStrategies = new Map();
  }

  /**
   * Register custom export strategy
   */
  registerStrategy(format, strategy) {
    if (typeof strategy.export !== 'function') {
      throw new Error('❌ Strategy must have export() method');
    }

    this.customStrategies.set(format.toLowerCase(), strategy);
    console.log(`✅ Custom strategy registered: ${format}`);
  }

  /**
   * Export data to specific format
   */
  async exportData(data, format, options = {}) {
    console.log(`📦 Exporting ${data.length} records to ${format}...`);

    try {
      // Get strategy (custom or factory)
      const strategy = this.customStrategies.get(format.toLowerCase()) ||
                      ExportStrategyFactory.createStrategy(format);

      // Validate data
      strategy.validateData(data);

      // Export
      const exportedData = await strategy.export(data, options);

      // Return result
      const result = {
        data: exportedData,
        format: format.toLowerCase(),
        contentType: strategy.getContentType(),
        fileExtension: strategy.getFileExtension(),
        recordCount: data.length,
        estimatedSize: strategy.getEstimatedSize(data),
        timestamp: new Date(),
        filename: this._generateFilename(options.filename, strategy.getFileExtension())
      };

      console.log(`✅ Export complete: ${result.filename}`);
      return result;

    } catch (error) {
      console.error(`❌ Export error:`, error);
      throw error;
    }
  }

  /**
   * Export to multiple formats
   */
  async batchExport(data, formats = ['json', 'csv'], options = {}) {
    console.log(`📦 Batch exporting to: ${formats.join(', ')}`);

    const results = [];

    for (const format of formats) {
      try {
        const result = await this.exportData(data, format, options);
        results.push(result);
      } catch (error) {
        console.error(`⚠️ Format ${format} failed:`, error.message);
        results.push({
          format,
          error: error.message,
          success: false
        });
      }
    }

    console.log(`✅ Batch export complete: ${results.filter(r => !r.error).length}/${formats.length} successful`);
    return results;
  }

  /**
   * Get all supported formats
   */
  getSupportedFormats() {
    const factoryFormats = ExportStrategyFactory.getSupportedFormats();
    const customFormats = Array.from(this.customStrategies.keys());
    return [...new Set([...factoryFormats, ...customFormats])];
  }

  /**
   * Get format information
   */
  getFormatInfo(format) {
    return ExportStrategyFactory.getStrategyInfo(format);
  }

  /**
   * Get all formats info
   */
  getAllFormatsInfo() {
    return this.getSupportedFormats()
      .map(format => this.getFormatInfo(format));
  }

  // ====== PRIVATE METHODS ======

  _generateFilename(baseName, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const name = baseName || 'export';
    return `${name}_${timestamp}.${extension}`;
  }
}

module.exports = DataExportService;
```

---

# Integration Examples

## Backend Controller

```javascript
/**
 * ExportController
 * File: backend/controllers/ExportController.js
 */

const DataExportService = require('../services/DataExportService');
const OrderDAO = require('../services/OrderDAO');

class ExportController {
  constructor() {
    this.exportService = new DataExportService();
  }

  /**
   * Export orders
   * GET /api/export/orders?format=csv&timeRange=month
   */
  async exportOrders(req, res) {
    try {
      const { format = 'json', timeRange = 'all' } = req.query;

      // Use DAO to fetch data
      const orderDAO = new OrderDAO(Order, Customer);
      const orders = await orderDAO.find({ createdAt: { $gte: ... } });

      // Export using service
      const result = await this.exportService.exportData(
        orders,
        format,
        { filename: 'orders' }
      );

      // Send file
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Export products
   */
  async exportProducts(req, res) {
    try {
      const { format = 'csv' } = req.query;

      const productDAO = new ProductDAO(Product);
      const products = await productDAO.find();

      const result = await this.exportService.exportData(products, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get supported formats
   * GET /api/export/formats
   */
  async getFormats(req, res) {
    const formats = this.exportService.getAllFormatsInfo();
    res.json({ formats });
  }

  /**
   * Batch export
   * POST /api/export/batch
   */
  async batchExport(req, res) {
    try {
      const { dataType = 'products', formats = ['json', 'csv'] } = req.body;

      // Get data
      const data = await this._fetchData(dataType);

      // Export to multiple formats
      const results = await this.exportService.batchExport(data, formats);

      res.json(results);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async _fetchData(dataType) {
    switch (dataType) {
      case 'orders':
        return await OrderDAO.find();
      case 'products':
        return await ProductDAO.find();
      case 'customers':
        return await CustomerDAO.find();
      default:
        throw new Error('Unknown data type');
    }
  }
}

module.exports = ExportController;
```

---

## Usage Examples

### Storage Pattern

```javascript
// 1. Using DAOs
const OrderDAO = require('./services/OrderDAO');
const orderDAO = new OrderDAO(OrderModel, CustomerModel);

// Find with caching
const orders = await orderDAO.find({ status: 'completed' });

// Create (cache invalidated)
await orderDAO.create({ customerId: '123', total: 100 });

// Get stats
const stats = await orderDAO.getOrderStats('month');
console.log('Total revenue:', stats.totalRevenue);

// 2. Connection Pool Management
const ConnectionPoolManager = require('./services/ConnectionPoolManager');
const poolManager = ConnectionPoolManager.getInstance();

const dbConnection = await poolManager.getConnection('mainDb', 'mongodb://localhost:27017/coffee');
console.log('Connected:', poolManager.getHealth());

// 3. Cache Management
const CacheManager = require('./services/CacheManager');
const cache = CacheManager.getInstance();

cache.set('user:123', { name: 'John', email: 'john@example.com' }, 300000);
const user = cache.get('user:123');
console.log('Cache stats:', cache.getStats());
```

### Export Pattern

```javascript
// 1. Single format export
const DataExportService = require('./services/DataExportService');
const exportService = new DataExportService();

const products = await Product.find();

const csvResult = await exportService.exportData(products, 'csv', {
  headers: ['_id', 'name', 'price', 'category'],
  filename: 'products'
});

// 2. Multiple format export
const results = await exportService.batchExport(products, ['csv', 'json', 'xml', 'pdf']);

results.forEach(r => {
  if (r.success) {
    console.log(`✅ ${r.format}: ${r.filename}`);
  } else {
    console.log(`❌ ${r.format}: ${r.error}`);
  }
});

// 3. Custom strategy
class CustomExportStrategy extends ExportStrategy {
  async export(data, options) {
    return data.map(item => `${item.id}|${item.name}`).join('\n');
  }
  getContentType() { return 'text/plain'; }
  getFileExtension() { return 'txt'; }
  getDisplayName() { return 'Custom Text Format'; }
}

exportService.registerStrategy('custom', new CustomExportStrategy());
const customResult = await exportService.exportData(products, 'custom');
```

---

## Best Practices

### Data Storage

✅ **Use appropriate cache TTL**
- Products: 5-15 minutes (frequently accessed, rarely changes)
- Orders: 10-30 minutes (moderate access)
- Cart: 1-2 minutes (frequently changes)
- Settings: 1 hour (rarely changes)

✅ **Invalidate cache strategically**
- On writes (create, update, delete)
- Use pattern matching for bulk invalidation
- Consider time-based expiration

✅ **Monitor connection pool**
- Check health regularly
- Alert on high error rates
- Monitor pool utilization

### Data Export

✅ **Choose right format**
- CSV: Large datasets, Excel compatibility
- JSON: APIs, nested data
- XML: Legacy systems, complex structures
- PDF: Reports, presentations

✅ **Optimize for performance**
- Stream large datasets instead of buffering
- Implement pagination
- Use batch export carefully

✅ **Handle large exports**
- Implement chunking
- Compress output
- Add progress tracking

---

**✅ Complete Data Storage & Export documentation with UML diagrams and full implementation!**
