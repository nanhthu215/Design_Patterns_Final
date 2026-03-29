/**
 * DiscountCodeRepository - Data access layer for Discount Code operations
 */
class DiscountCodeRepository {
  constructor(DiscountCodeModel) {
    this.DiscountCode = DiscountCodeModel;
  }

  /**
   * Find all discount codes with pagination
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const docs = await this.DiscountCode
      .find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.DiscountCode.countDocuments();

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find public discount codes (active and not expired)
   */
  async findPublic() {
    return await this.DiscountCode.find({
      isActive: true,
      expiryDate: { $gte: new Date() },
    }).lean();
  }

  /**
   * Find discount code by code string
   */
  async findByCode(code) {
    return await this.DiscountCode.findOne({ code }).lean();
  }

  /**
   * Find discount code by ID
   */
  async findById(id) {
    return await this.DiscountCode.findById(id).lean();
  }

  /**
   * Create new discount code
   */
  async create(codeData) {
    const code = await this.DiscountCode.create(codeData);
    return code.toObject ? code.toObject() : code;
  }

  /**
   * Update discount code
   */
  async update(id, updateData) {
    const updated = await this.DiscountCode.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return updated ? (updated.toObject ? updated.toObject() : updated) : null;
  }

  /**
   * Delete discount code
   */
  async delete(id) {
    return await this.DiscountCode.findByIdAndDelete(id);
  }

  /**
   * Validate discount code (check if valid and not expired)
   */
  async validate(code) {
    const discountCode = await this.DiscountCode.findOne({
      code,
      isActive: true,
      expiryDate: { $gte: new Date() },
    }).lean();

    if (!discountCode) {
      return { valid: false, reason: "Code not found or expired" };
    }

    // Check if usage limit exceeded
    if (
      discountCode.maxUsageLimit &&
      discountCode.usageCount >= discountCode.maxUsageLimit
    ) {
      return { valid: false, reason: "Usage limit exceeded" };
    }

    return {
      valid: true,
      discount: discountCode,
    };
  }

  /**
   * Increment usage count for a discount code
   */
  async incrementUsage(codeId) {
    return await this.DiscountCode.findByIdAndUpdate(
      codeId,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
  }

  /**
   * Get discount code statistics
   */
  async getStats() {
    const stats = await this.DiscountCode.aggregate([
      {
        $group: {
          _id: null,
          totalCodes: { $sum: 1 },
          activeCodes: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
          totalUsed: { $sum: "$usageCount" },
          avgDiscount: { $avg: "$discountPercent" },
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : { totalCodes: 0, activeCodes: 0 };
  }

  /**
   * Find expired codes that should be deactivated
   */
  async findExpiredCodes() {
    return await this.DiscountCode.find({
      expiryDate: { $lt: new Date() },
      isActive: true,
    }).lean();
  }

  /**
   * Deactivate expired codes
   */
  async deactivateExpiredCodes() {
    return await this.DiscountCode.updateMany(
      {
        expiryDate: { $lt: new Date() },
        isActive: true,
      },
      { isActive: false }
    );
  }
}

module.exports = DiscountCodeRepository;
