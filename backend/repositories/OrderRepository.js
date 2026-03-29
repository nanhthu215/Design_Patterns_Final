/**
 * OrderRepository - Data access layer for Order operations
 */
class OrderRepository {
  constructor(OrderModel, CustomerModel, DiscountCodeModel) {
    this.Order = OrderModel;
    this.Customer = CustomerModel;
    this.DiscountCode = DiscountCodeModel;
  }

  /**
   * Find paginated orders
   */
  async findPaginated(filters = {}, options = {}) {
    const { page = 1, limit = 10, searchTerm = "", status = [], sort = "-createdAt" } = options;

    const skip = (page - 1) * limit;

    // Build query
    const where = {};

    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      where.$or = [
        { "customerName": regex },
        { "customerEmail": regex },
        { "displayCode": regex },
      ];
    }

    if (Array.isArray(status) && status.length > 0) {
      where.status = { $in: status };
    }

    // Execute query
    const docs = await this.Order.find(where).sort(sort).skip(skip).limit(limit).lean();

    const total = await this.Order.countDocuments(where);

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find order by ID
   */
  async findById(orderId) {
    return await this.Order.findById(orderId).lean();
  }

  /**
   * Find orders by customer ID with pagination
   */
  async findByCustomerId(customerId, options = {}) {
    const { page = 1, limit = 10, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const docs = await this.Order
      .find({ customerId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Order.countDocuments({ customerId });

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create new order
   */
  async create(orderData) {
    const order = await this.Order.create(orderData);
    return order.toObject ? order.toObject() : order;
  }

  /**
   * Update order status and metadata
   */
  async updateStatus(orderId, status, updateData = {}) {
    const updated = await this.Order.findByIdAndUpdate(
      orderId,
      { status, ...updateData },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Update order information
   */
  async update(orderId, updateData) {
    const updated = await this.Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Get order with customer details populated
   */
  async findWithCustomer(orderId) {
    return await this.Order.findById(orderId).populate("customerId").lean();
  }

  /**
   * Get orders by status
   */
  async findByStatus(status, options = {}) {
    const { page = 1, limit = 10, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const docs = await this.Order
      .find({ status })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Order.countDocuments({ status });

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get order statistics (for dashboard)
   */
  async getStatistics(timeRange = "all") {
    const now = new Date();
    let startDate = null;

    if (timeRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const matchStage = startDate
      ? { createdAt: { $gte: startDate } }
      : {};

    const stats = await this.Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageOrder: { $avg: "$totalAmount" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrder: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    };
  }

  /**
   * Delete order
   */
  async delete(orderId) {
    return await this.Order.findByIdAndDelete(orderId);
  }

  /**
   * Check if discount code exists and is valid
   */
  async validateDiscountCode(code) {
    return await this.DiscountCode.findOne({
      code,
      isActive: true,
      expiryDate: { $gte: new Date() },
    }).lean();
  }

  /**
   * Increment discount code usage
   */
  async incrementDiscountUsage(codeId) {
    return await this.DiscountCode.findByIdAndUpdate(
      codeId,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
  }

  /**
   * Find orders for export (CSV/PDF)
   */
  async findForExport(filters = {}, sort = "-createdAt") {
    const { status = [], dateFrom = null, dateTo = null } = filters;

    const where = {};

    if (Array.isArray(status) && status.length > 0) {
      where.status = { $in: status };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.$gte = new Date(dateFrom);
      if (dateTo) where.createdAt.$lte = new Date(dateTo);
    }

    return await this.Order.find(where).sort(sort).lean();
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics() {
    const totalOrders = await this.Order.countDocuments();
    const completedOrders = await this.Order.countDocuments({ status: "completed" });
    const pendingOrders = await this.Order.countDocuments({ status: { $in: ["pending", "processing"] } });

    const statsData = await this.getStatistics("month");

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders: await this.Order.countDocuments({ status: "cancelled" }),
      monthlyRevenue: statsData.totalRevenue || 0,
      monthlyOrders: statsData.totalOrders || 0,
      averageOrderValue: statsData.averageOrder || 0,
    };
  }
}

module.exports = OrderRepository;
