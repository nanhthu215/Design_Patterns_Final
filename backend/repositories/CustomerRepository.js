/**
 * CustomerRepository - Data access layer for Customer operations
 */
class CustomerRepository {
  constructor(CustomerModel) {
    this.Customer = CustomerModel;
  }

  /**
   * Find all customers with pagination
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, sort = "-createdAt", search = "" } = options;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { email: regex },
        { fullName: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    const docs = await this.Customer
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Customer.countDocuments(query);

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find customer by ID
   */
  async findById(customerId) {
    return await this.Customer.findById(customerId).lean();
  }

  /**
   * Find customer by email
   */
  async findByEmail(email) {
    return await this.Customer.findOne({ email: email.toLowerCase() }).lean();
  }

  /**
   * Create new customer
   */
  async create(customerData) {
    const customer = await this.Customer.create(customerData);
    return customer.toObject ? customer.toObject() : customer;
  }

  /**
   * Update customer information
   */
  async update(customerId, updateData) {
    // Prevent updating certain fields
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.password;

    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Update customer avatar
   */
  async updateAvatar(customerId, avatarUrl) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { avatarUrl },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Update customer loyalty points
   */
  async updateLoyalty(customerId, loyaltyData) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { loyalty: loyaltyData },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Delete customer (soft delete)
   */
  async delete(customerId) {
    return await this.Customer.findByIdAndDelete(customerId);
  }

  /**
   * Get customer with populated orders
   */
  async findWithOrders(customerId) {
    return await this.Customer
      .findById(customerId)
      .populate("orders")
      .lean();
  }

  /**
   * Get new users created in date range
   */
  async getNewUserStats(startDate, endDate) {
    const stats = await this.Customer.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return stats;
  }

  /**
   * Get customer statistics for dashboard
   */
  async getDashboardStats() {
    const totalCustomers = await this.Customer.countDocuments();
    
    const newUsersThisMonth = await this.Customer.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const stats = await this.Customer.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$loyalty.currentPoints" },
          totalEarned: { $sum: "$loyalty.totalEarned" },
          avgPoints: { $avg: "$loyalty.currentPoints" },
        },
      },
    ]);

    return {
      totalCustomers,
      newUsersThisMonth,
      loyaltyStats: stats.length > 0 ? stats[0] : {
        totalPoints: 0,
        totalEarned: 0,
        avgPoints: 0,
      },
    };
  }

  /**
   * Add address to customer
   */
  async addAddress(customerId, addressData) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $push: { addresses: addressData } },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Update customer address
   */
  async updateAddress(customerId, addressId, addressData) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $set: { "addresses.$[elem]": addressData } },
      { arrayFilters: [{ "elem._id": addressId }], new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Delete customer address
   */
  async deleteAddress(customerId, addressId) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(customerId, methodData) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $push: { paymentMethods: methodData } },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Delete payment method from customer
   */
  async deletePaymentMethod(customerId, methodId) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $pull: { paymentMethods: { _id: methodId } } },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Search customers by email or name
   */
  async search(query, limit = 10) {
    const regex = new RegExp(query, "i");
    
    return await this.Customer
      .find({
        $or: [
          { email: regex },
          { fullName: regex },
          { firstName: regex },
          { lastName: regex },
        ],
      })
      .limit(limit)
      .lean();
  }

  /**
   * Get customers by status
   */
  async findByStatus(status, options = {}) {
    const { page = 1, limit = 20, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const docs = await this.Customer
      .find({ status })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Customer.countDocuments({ status });

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(customerId, productId) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $addToSet: { wishlist: productId } },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(customerId, productId) {
    const updated = await this.Customer.findByIdAndUpdate(
      customerId,
      { $pull: { wishlist: productId } },
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }
}

module.exports = CustomerRepository;
