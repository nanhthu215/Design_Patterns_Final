/**
 * backend/controllers/ReviewController.js
 * ✅ OBSERVER PATTERN: Broadcasts review changes to all connected WebSocket clients
 */

class ReviewController {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  /**
   * POST /api/reviews - Create new review
   * ✅ OBSERVER: Broadcasts to WebSocket clients
   */
  async create(req, res, next) {
    try {
      const { productId, customerEmail, customerName, rating, title, comment } = req.body;

      if (!productId || !customerEmail || !customerName || !comment) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      const review = await this.reviewRepository.create({
        productId: Number(productId),
        customerEmail,
        customerName,
        rating: rating || 0,
        title: title || '',
        comment,
      });

      // ✅ OBSERVER PATTERN: BROADCAST to WebSocket clients
      try {
        const { broadcastReview } = require('../index');
        broadcastReview(productId, {
          type: 'review:new',
          data: review,
          timestamp: new Date().toISOString(),
        });
      } catch (wsError) {
        console.error('⚠️ WebSocket broadcast error:', wsError.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reviews/product/:productId - Get product reviews
   */
  async getByProductId(req, res, next) {
    try {
      const { productId } = req.params;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 100);

      const result = await this.reviewRepository.findByProductId(productId, { page, limit });

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reviews/:id - Get single review
   */
  async getById(req, res, next) {
    try {
      const review = await this.reviewRepository.findById(req.params.id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      return res.json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/reviews/:id - Update review
   * ✅ OBSERVER: Broadcasts update to WebSocket clients
   */
  async update(req, res, next) {
    try {
      const { rating, title, comment } = req.body;

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      const updateData = {};
      if (rating !== undefined) updateData.rating = rating;
      if (title !== undefined) updateData.title = title;
      if (comment !== undefined) updateData.comment = comment;

      const review = await this.reviewRepository.update(req.params.id, updateData);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      // ✅ OBSERVER PATTERN: BROADCAST update
      try {
        const { broadcastReview } = require('../index');
        broadcastReview(review.productId, {
          type: 'review:updated',
          data: review,
          timestamp: new Date().toISOString(),
        });
      } catch (wsError) {
        console.error('⚠️ WebSocket broadcast error:', wsError.message);
      }

      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/reviews/:id - Delete review
   * ✅ OBSERVER: Broadcasts deletion to WebSocket clients
   */
  async delete(req, res, next) {
    try {
      const review = await this.reviewRepository.findById(req.params.id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      await this.reviewRepository.delete(req.params.id);

      // ✅ OBSERVER PATTERN: BROADCAST deletion
      try {
        const { broadcastReview } = require('../index');
        broadcastReview(review.productId, {
          type: 'review:deleted',
          data: { id: req.params.id, productId: review.productId },
          timestamp: new Date().toISOString(),
        });
      } catch (wsError) {
        console.error('⚠️ WebSocket broadcast error:', wsError.message);
      }

      return res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reviews/product/:productId/rating - Get product rating
   */
  async getProductRating(req, res, next) {
    try {
      const rating = await this.reviewRepository.getProductRating(req.params.productId);
      return res.json({ success: true, data: rating });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reviews/product/:productId/distribution - Get rating distribution
   */
  async getRatingDistribution(req, res, next) {
    try {
      const distribution = await this.reviewRepository.getRatingDistribution(req.params.productId);
      return res.json({ success: true, data: distribution });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;