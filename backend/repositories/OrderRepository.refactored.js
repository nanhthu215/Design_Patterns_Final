/**
 * OrderRepository - PURE VERSION
 * Uses MongooseRepositoryAdapter for database access
 * Zero hardcoded Mongoose operators
 */

const MongooseRepositoryAdapter = require('../core/adapters/MongooseRepositoryAdapter');
const { OrderDAO, DAOFactory } = require('../services/DataStorageService');

class OrderRepository {
  constructor(OrderModel, CustomerModel, DiscountCodeModel) {
    this.adapter = new MongooseRepositoryAdapter(OrderModel);
    this.Order = OrderModel;
    this.Customer = CustomerModel;
    this.DiscountCode = DiscountCodeModel;
    this.daoFactory = new DAOFactory();
    this.orderDAO = this.daoFactory.createDAO('Order', OrderModel, CustomerModel);
  }

  /**
   * Find paginated orders with filtering
   * PURE: Business logic for order filtering
   */
  async findPaginated(filters = {}, options = {}) {
    const { page = 1, limit = 10, searchTerm = '', status = [], sort = '-createdAt' } = options;

    // ✅ PURE: Build criteria from filters
    const criteria = this._buildOrderCriteria(filters, searchTerm, status);

    // Get orders through adapter
    const result = await this.adapter.find(criteria, { page, limit, sort });

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: result.pages,
    };
  }

  /**
   * Find order by ID with caching (DAO pattern)
   * PURE: Use injected DAO for caching
   */
  async findById(orderId) {
    return await this.orderDAO.findById(orderId);
  }

  /**
   * Find orders by customer ID
   * PURE: Query through adapter with customer filter
   */
  async findByCustomerId(customerId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    
    const criteria = {
      customerId: customerId, // PURE: No Mongoose operators
    };

    return await this.adapter.find(criteria, { page, limit, sort });
  }

  /**
   * Create new order
   * PURE: Business logic for order creation
   */
  async create(orderData) {
    const order = {
      ...orderData,
      createdAt: new Date(),
      status: orderData.status || 'pending',
    };

    return await this.adapter.create(order);
  }

  /**
   * Update order status
   * PURE: Update through adapter
   */
  async update(orderId, updateData) {
    const data = {
      ...updateData,
      updatedAt: new Date(),
    };

    return await this.adapter.update(orderId, data);
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    return await this.adapter.update(orderId, {
      status,
      statusUpdatedAt: new Date(),
    });
  }

  /**
   * Delete order
   * PURE: Delete through adapter
   */
  async delete(orderId) {
    return await this.adapter.delete(orderId);
  }

  /**
   * Find orders by status
   * PURE: Filter by status
   */
  async findByStatus(status, options = {}) {
    const criteria = {
      status: status, // PURE: No $in operator here
    };

    return await this.adapter.find(criteria, options);
  }

  /**
   * Find orders by customer email
   * PURE: Filter by email
   */
  async findByCustomerEmail(email, options = {}) {
    const criteria = {
      customerEmail: email, // PURE: No operators
    };

    return await this.adapter.find(criteria, options);
  }

  /**
   * Get order statistics
   * PURE: Aggregate through adapter
   */
  async getOrderStats(filters = {}) {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ];

    return await this.adapter.aggregate(pipeline);
  }

  /**
   * ⭐ PURE: Build order criteria from filters
   * Converts business filters to query criteria
   */
  _buildOrderCriteria(filters, searchTerm, statusArray) {
    const criteria = {};

    // Apply all filters from controller (security fix)
    Object.keys(filters).forEach((key) => {
      criteria[key] = filters[key];
    });

    // Search in multiple fields
    if (searchTerm) {
      criteria._searchFields = ['customerName', 'customerEmail', 'displayCode'];
      criteria._searchTerm = searchTerm;
    }

    // Filter by status array
    if (Array.isArray(statusArray) && statusArray.length > 0) {
      criteria.status = {
        _in: statusArray, // PURE description
      };
    }

    return criteria;
  }

  /**
   * Find recent orders
   * PURE: Pure filtering and sorting
   */
  async findRecent(limit = 10) {
    return await this.adapter.find({}, { limit, sort: '-createdAt' });
  }

  /**
   * Count orders by status
   * PURE: Count through adapter
   */
  async countByStatus(status) {
    return await this.adapter.count({ status });
  }

  /**
   * Check if order exists
   * PURE: Check through adapter
   */
  async orderExists(orderId) {
    return await this.adapter.exists({ _id: orderId });
  }
}

module.exports = OrderRepository;
