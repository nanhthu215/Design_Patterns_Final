const Review = require('../models/Review');
const Product = require('../models/Product');
const { ProductFactory } = require('../strategies/ProductFactory');
/**
 * ProductController - Business logic layer cho Products
 * Xử lý HTTP requests và gọi Repository
 */
class ProductController {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * GET /api/products - Lấy danh sách sản phẩm với filters và pagination
   */
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category,
        inStock,
        status,
        minPrice,
        maxPrice,
        sortBy,
      } = req.query;

      const filters = {
        search,
        category,
        inStock,
        status,
        minPrice,
        maxPrice,
      };

      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };

      const result = await this.productRepository.findPaginated(
        filters,
        pagination,
        sortBy
      );

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo method mới (thêm vào class)
    async createWithFactory(req, res, next) {
        try {
            const { type = 'generic', ...productData } = req.body;

            // ✅ Use Factory Pattern
            const product = ProductFactory.createProduct(type, productData);

            // Validate product
            product.validate();

            // Save to database
            const saved = await this.productRepository.create(product);

            res.status(201).json({
            success: true,
            data: saved,
            message: `${type} product created successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

  /**
   * GET /api/products/:id - Lấy chi tiết một sản phẩm
   */
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const product = await this.productRepository.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      const transformedProduct = {
        id: product.id || product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        description: product.description,
        category: product.category,
        stock: product.stock,
        sku: product.sku,
        price: product.price,
        quantity: product.quantity,
        status: product.status,
        variants: product.variants || [],
      };

      res.json({
        success: true,
        data: transformedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id/reviews - Lấy reviews của sản phẩm
   */
  async getReviews(req, res, next) {
    try {
      const { id } = req.params;
      let productIdNum = Number(id);

      if (Number.isNaN(productIdNum)) {
        const product = await Product.findById(id).select('id');
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
        productIdNum = product.id;
      }

      const reviews = await Review.find({ productId: productIdNum })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/:id/reviews - Tạo review
   */
  async createReview(req, res, next) {
    try {
      const { id } = req.params;
      let productIdNum = Number(id);

      if (Number.isNaN(productIdNum)) {
        const product = await Product.findById(id).select('id');
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
        productIdNum = product.id;
      }

      const { rating, comment, customerName, customerEmail, title } = req.body;

      // Validation
      if (rating != null) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5',
          });
        }
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Comment is required',
        });
      }

      if (
        !customerName ||
        !customerName.trim() ||
        !customerEmail ||
        !customerEmail.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'customerName and customerEmail are required',
        });
      }

      const reviewData = {
        productId: productIdNum,
        comment: comment.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        title: (title || '').trim(),
      };

      if (rating != null) {
        reviewData.rating = rating;
      }

      const review = await Review.create(reviewData);

      return res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products - Tạo sản phẩm mới
   */
  async create(req, res, next) {
    try {
      const { name, category, sku, ...rest } = req.body;

      // Validation
      if (!name || !category || !sku) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, category, and sku are required',
        });
      }

      const productData = {
        name,
        category,
        sku,
        imageUrl: rest.imageUrl || '',
        description: rest.description || '',
        stock: rest.stock !== undefined ? rest.stock : true,
        price: Number(rest.price) || 0,
        quantity: Number(rest.quantity) || 0,
        status: rest.status || 'Publish',
        variants: Array.isArray(rest.variants) ? rest.variants : [],
      };

      const created = await this.productRepository.create(productData);

      return res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id - Cập nhật sản phẩm
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Validate và clean data
      if (updateData.price) {
        updateData.price = Number(updateData.price);
      }
      if (updateData.quantity) {
        updateData.quantity = Number(updateData.quantity);
      }

      const updated = await this.productRepository.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      return res.json({
        success: true,
        data: updated,
        message: 'Product updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id - Xóa sản phẩm
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await this.productRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      return res.json({
        success: true,
        message: 'Product deleted successfully',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
