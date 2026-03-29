/**
 * CategoryRepository - Data access layer for Category operations
 */
class CategoryRepository {
  constructor(ProductModel) {
    this.Product = ProductModel;
  }

  /**
   * Get all unique categories
   */
  async getAllCategories() {
    const categories = await this.Product.distinct("category");
    return categories.filter(Boolean).sort();
  }

  /**
   * Get products by category
   */
  async getByCategory(category, options = {}) {
    const { page = 1, limit = 20, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const query = { category: { $regex: `^${category}$`, $options: "i" } };

    const docs = await this.Product
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Product.countDocuments(query);

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get category statistics (count, average price, etc)
   */
  async getCategoryStats(category) {
    const stats = await this.Product.aggregate([
      {
        $match: {
          category: { $regex: `^${category}$`, $options: "i" },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalSold: { $sum: "$soldCount" },
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : null;
  }

  /**
   * Update category name (rename all products in that category)
   */
  async updateCategory(oldName, newName) {
    const result = await this.Product.updateMany(
      { category: { $regex: `^${oldName}$`, $options: "i" } },
      { $set: { category: newName } }
    );

    return result;
  }

  /**
   * Delete category (remove all products in that category)
   */
  async deleteCategory(category) {
    const result = await this.Product.deleteMany({
      category: { $regex: `^${category}$`, $options: "i" },
    });

    return result;
  }

  /**
   * Get all categories with product counts
   */
  async getCategoriesWithCounts() {
    const stats = await this.Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $match: { _id: { $exists: true, $ne: null } } },
      { $sort: { _id: 1 } },
    ]);

    return stats;
  }

  /**
   * Check if category exists
   */
  async categoryExists(category) {
    const count = await this.Product.countDocuments({
      category: { $regex: `^${category}$`, $options: "i" },
    });

    return count > 0;
  }

  /**
   * Get category suggestions (for autocomplete)
   */
  async getCategorySuggestions(prefix, limit = 10) {
    const categories = await this.Product.distinct("category", {
      category: { $regex: `^${prefix}`, $options: "i" },
    });

    return categories.slice(0, limit).sort();
  }

  /**
   * Search products within a category
   */
  async searchInCategory(category, searchTerm, options = {}) {
    const { page = 1, limit = 20, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const regex = new RegExp(searchTerm, "i");
    const query = {
      category: { $regex: `^${category}$`, $options: "i" },
      $or: [
        { name: regex },
        { description: regex },
        { sku: regex },
      ],
    };

    const docs = await this.Product
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Product.countDocuments(query);

    return {
      data: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = CategoryRepository;
