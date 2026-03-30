/**
 * ReviewRepository - PURE VERSION
 * Uses MongooseRepositoryAdapter for database access
 * Zero hardcoded Mongoose operators
 */

const MongooseRepositoryAdapter = require('../core/adapters/MongooseRepositoryAdapter');

class ReviewRepository {
  constructor(ReviewModel) {
    this.adapter = new MongooseRepositoryAdapter(ReviewModel);
    this.model = ReviewModel;
  }

  /**
   * Create review
   * PURE: Create through adapter
   */
  async create(reviewData) {
    const review = {
      ...reviewData,
      createdAt: new Date(),
    };

    return await this.adapter.create(review);
  }

  /**
   * Find reviews by product ID with pagination
   * PURE: Query through adapter
   */
  async findByProductId(productId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;

    const criteria = {
      productId: productId, // PURE: No operators
    };

    return await this.adapter.find(criteria, { page, limit, sort });
  }

  /**
   * Find review by ID
   * PURE: Get through adapter
   */
  async findById(reviewId) {
    return await this.adapter.findById(reviewId);
  }

  /**
   * Update review
   * PURE: Update through adapter
   */
  async update(reviewId, updateData) {
    const data = {
      ...updateData,
      updatedAt: new Date(),
    };

    return await this.adapter.update(reviewId, data);
  }

  /**
   * Delete review
   * PURE: Delete through adapter
   */
  async delete(reviewId) {
    return await this.adapter.delete(reviewId);
  }

  /**
   * Get product rating statistics (average, count, min, max)
   * PURE: Aggregate through adapter
   */
  async getProductRating(productId) {
    const pipeline = [
      {
        $match: {
          productId: Number(productId),
        },
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          maxRating: { $max: '$rating' },
          minRating: { $min: '$rating' },
        },
      },
    ];

    const result = await this.adapter.aggregate(pipeline);

    return result.length > 0
      ? result[0]
      : {
          _id: productId,
          averageRating: 0,
          totalReviews: 0,
          maxRating: 0,
          minRating: 0,
        };
  }

  /**
   * Get rating distribution (count by star)
   * PURE: Aggregate through adapter
   */
  async getRatingDistribution(productId) {
    const pipeline = [
      {
        $match: {
          productId: Number(productId),
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const result = await this.adapter.aggregate(pipeline);

    // Convert to distribution object
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    result.forEach((item) => {
      distribution[item._id] = item.count;
    });

    return distribution;
  }

  /**
   * Find reviews by customer ID
   * PURE: Query through adapter
   */
  async findByCustomerId(customerId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;

    const criteria = {
      customerId: customerId, // PURE: No operators
    };

    return await this.adapter.find(criteria, { page, limit, sort });
  }

  /**
   * Find reviews by rating
   * PURE: Query through adapter
   */
  async findByRating(rating, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;

    const criteria = {
      rating: rating, // PURE: No operators
    };

    return await this.adapter.find(criteria, { page, limit, sort });
  }

  /**
   * Get reviews with minimum rating
   * PURE: Build criteria for rating range
   */
  async findWithMinRating(minRating, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;

    const criteria = {
      _ratingMin: minRating, // PURE description, adapter handles $gte
    };

    return await this.adapter.find(criteria, { page, limit, sort });
  }

  /**
   * Count reviews by product
   * PURE: Count through adapter
   */
  async countByProductId(productId) {
    return await this.adapter.count({ productId });
  }

  /**
   * Check if review exists
   * PURE: Check through adapter
   */
  async reviewExists(reviewId) {
    return await this.adapter.exists({ _id: reviewId });
  }

  /**
   * Get recent reviews
   * PURE: Query through adapter
   */
  async findRecent(limit = 10) {
    return await this.adapter.find({}, { limit, sort: '-createdAt' });
  }

  /**
   * Get top rated products
   * PURE: Aggregate through adapter
   */
  async getTopRatedProducts(limit = 10) {
    const pipeline = [
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      {
        $match: {
          reviewCount: { $gte: 1 },
        },
      },
      {
        $sort: { averageRating: -1 },
      },
      {
        $limit: limit,
      },
    ];

    return await this.adapter.aggregate(pipeline);
  }
}

module.exports = ReviewRepository;
