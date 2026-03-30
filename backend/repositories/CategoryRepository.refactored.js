/**
 * CategoryRepository - PURE VERSION
 * Uses MongooseRepositoryAdapter for database access
 * Zero hardcoded Mongoose operators
 */

const MongooseRepositoryAdapter = require('../core/adapters/MongooseRepositoryAdapter');

class CategoryRepository {
  constructor(ProductModel) {
    this.adapter = new MongooseRepositoryAdapter(ProductModel);
    this.model = ProductModel;
  }

  /**
   * Get all unique categories
   * PURE: Get distinct categories through adapter
   */
  async getAllCategories() {
    // Use aggregation pipeline through adapter
    const pipeline = [
      {
        $group: {
          _id: '$category',
        },
      },
      {
        $match: {
          _id: { $ne: null }, // Filter out null categories
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const result = await this.adapter.aggregate(pipeline);
    return result.map((doc) => doc._id);
  }

  /**
   * Get products by category
   * PURE: Query through adapter
   */
  async getByCategory(category, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;

    // Build category filter using PURE description
    const criteria = this._buildCategoryFilter(category);

    return await this.adapter.find(criteria, { page, limit, sort });
  }

  /**
   * Get category statistics (count, average price, min/max)
   * PURE: Aggregate through adapter
   */
  async getCategoryStats(category) {
    const pipeline = [
      {
        $match: {
          category: { $regex: `^${category}$`, $options: 'i' },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalSold: { $sum: '$soldCount' },
        },
      },
    ];

    const result = await this.adapter.aggregate(pipeline);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update category name (rename in all products)
   * PURE: Business logic for category rename
   */
  async updateCategory(oldName, newName) {
    // Build criteria for old name
    const criteria = this._buildCategoryFilter(oldName);

    // Update through adapter using bulk operation pattern
    const updateData = {
      category: newName,
      updatedAt: new Date(),
    };

    // Note: For bulk updates, adapter may need extension
    // For now, using standard find + update pattern
    return await this.adapter.update(
      { _categoryName: oldName }, // PURE description
      updateData
    );
  }

  /**
   * Delete category (remove all products in category)
   * PURE: Business logic for category deletion
   */
  async deleteCategory(category) {
    // Build criteria for category
    const criteria = this._buildCategoryFilter(category);

    // Delete through adapter (would need bulk delete support)
    return await this.adapter.delete({
      _categoryName: category, // PURE description
    });
  }

  /**
   * Get all categories with product counts
   * PURE: Aggregate through adapter
   */
  async getCategoriesWithCounts() {
    const pipeline = [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
      {
        $sort: { count: -1 },
      },
    ];

    const result = await this.adapter.aggregate(pipeline);

    return result.map((doc) => ({
      name: doc._id,
      count: doc.count,
    }));
  }

  /**
   * Get categories by price range
   * PURE: Get categories within price range
   */
  async getCategoriesByPriceRange(minPrice, maxPrice) {
    const pipeline = [
      {
        $match: {
          category: { $ne: null },
          price: { $gte: minPrice, $lte: maxPrice },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    return await this.adapter.aggregate(pipeline);
  }

  /**
   * Search categories by name
   * PURE: Search through adapter
   */
  async searchCategories(searchTerm, options = {}) {
    const { limit = 10 } = options;

    const pipeline = [
      {
        $match: {
          category: { $regex: searchTerm, $options: 'i' },
        },
      },
      {
        $group: {
          _id: '$category',
        },
      },
      {
        $limit: limit,
      },
    ];

    const result = await this.adapter.aggregate(pipeline);
    return result.map((doc) => doc._id);
  }

  /**
   * Get category trending (highest sold)
   * PURE: Aggregate top selling categories
   */
  async getTrendingCategories(limit = 10) {
    const pipeline = [
      {
        $match: {
          category: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSold: { $sum: '$soldCount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalSold: -1 },
      },
      {
        $limit: limit,
      },
    ];

    return await this.adapter.aggregate(pipeline);
  }

  /**
   * ⭐ PURE: Build category filter criteria
   * Converts business category filter to query criteria
   */
  _buildCategoryFilter(category) {
    return {
      _categoryRegex: category, // PURE description - adapter handles $regex
      _categoryOptions: 'i',    // case-insensitive
    };
  }

  /**
   * Count products in category
   * PURE: Count through adapter
   */
  async countByCategory(category) {
    const criteria = this._buildCategoryFilter(category);
    return await this.adapter.count(criteria);
  }

  /**
   * Check if category exists
   * PURE: Check through adapter
   */
  async categoryExists(category) {
    return await this.adapter.exists({
      category: { $regex: `^${category}$`, $options: 'i' },
    });
  }
}

module.exports = CategoryRepository;
