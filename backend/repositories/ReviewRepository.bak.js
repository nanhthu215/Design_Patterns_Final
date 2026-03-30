/**
 * backend/repositories/ReviewRepository.js
 * Repository pattern for Review CRUD operations
 */

class ReviewRepository {
  constructor(ReviewModel) {
    this.Review = ReviewModel;
  }

  async create(reviewData) {
    try {
      const review = await this.Review.create(reviewData);
      return review.toObject ? review.toObject() : review;
    } catch (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  async findByProductId(productId, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      const reviews = await this.Review.find({ productId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.Review.countDocuments({ productId });

      return {
        data: reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Failed to find reviews: ${error.message}`);
    }
  }

  async findById(reviewId) {
    try {
      return await this.Review.findById(reviewId).lean();
    } catch (error) {
      throw new Error(`Failed to find review: ${error.message}`);
    }
  }

  async update(reviewId, updateData) {
    try {
      const updated = await this.Review.findByIdAndUpdate(reviewId, updateData, { new: true });
      return updated ? (updated.toObject ? updated.toObject() : updated) : null;
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  async delete(reviewId) {
    try {
      return await this.Review.findByIdAndDelete(reviewId);
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  async getProductRating(productId) {
    try {
      const result = await this.Review.aggregate([
        { $match: { productId: Number(productId) } },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            maxRating: { $max: '$rating' },
            minRating: { $min: '$rating' },
          },
        },
      ]);

      return result.length > 0
        ? result[0]
        : {
            _id: productId,
            averageRating: 0,
            totalReviews: 0,
            maxRating: 0,
            minRating: 0,
          };
    } catch (error) {
      throw new Error(`Failed to get product rating: ${error.message}`);
    }
  }

  async getRatingDistribution(productId) {
    try {
      const distribution = await this.Review.aggregate([
        { $match: { productId: Number(productId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      return distribution;
    } catch (error) {
      throw new Error(`Failed to get rating distribution: ${error.message}`);
    }
  }
}

module.exports = ReviewRepository;