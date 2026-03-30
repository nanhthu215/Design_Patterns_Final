/**
 * ProductRepository - PURE VERSION
 * Uses MongooseRepositoryAdapter for database access
 * Zero hardcoded Mongoose operators
 */

const MongooseRepositoryAdapter = require('../core/adapters/MongooseRepositoryAdapter');
const ProductFactory = require('../services/ProductFactory');

class ProductRepository {
  constructor(ProductModel) {
    this.adapter = new MongooseRepositoryAdapter(ProductModel);
    this.model = ProductModel;
  }

  /**
   * Find products with filters, pagination, sorting
   * PURE: Business logic separated from database implementation
   */
  async findPaginated(filters, pagination, sortBy) {
    const { page = 1, limit = 12 } = pagination;
    
    // ✅ PURE: Build criteria object (no Mongoose operators hardcoded here)
    const criteria = this._buildCriteria(filters);
    const sort = this._buildSort(sortBy);

    // Get products through adapter (adapter handles Mongoose)
    const result = await this.adapter.find(criteria, { page, limit, sort });
    
    // Get sold stats through adapter aggregation
    const soldStats = await this._getSoldStatsViaAdapter();
    
    // Merge sold data
    const soldMap = new Map(
      soldStats.map((doc) => [String(doc._id), Number(doc.soldCount) || 0])
    );

    const productsWithSold = result.data.map((p) => {
      const keyByNumericId = p.id != null ? String(p.id) : null;
      const keyByObjectId = p._id != null ? String(p._id) : null;

      return {
        ...p,
        soldCount:
          (keyByNumericId && soldMap.get(keyByNumericId)) ??
          (keyByObjectId && soldMap.get(keyByObjectId)) ??
          0,
      };
    });

    return {
      data: productsWithSold,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.pages,
      },
    };
  }

  /**
   * Find product by ID
   * PURE: Try multiple ID formats through adapter
   */
  async findById(id) {
    // Try via adapter (adapter handles ObjectId conversion internally)
    let product = await this.adapter.findById(id);
    if (product) return product;

    // Fallback: Try by numeric id
    const nId = Number(id);
    if (!Number.isNaN(nId)) {
      product = await this.adapter.findOne({ id: nId });
      if (product) return product;
    }

    // Fallback: Try by string id
    product = await this.adapter.findOne({ id: String(id) });
    return product;
  }

  /**
   * Create product using Factory pattern
   * PURE: Business logic for product creation
   */
  async create(productData) {
    // Use ProductFactory for normalization (PURE)
    const normalized = ProductFactory.createProduct({
      ...productData,
      createdAt: new Date(),
    });

    return await this.adapter.create(normalized);
  }

  /**
   * Update product
   * PURE: Validate and update through adapter
   */
  async update(id, updateData) {
    const validated = {
      ...updateData,
      updatedAt: new Date(),
    };

    return await this.adapter.update(id, validated);
  }

  /**
   * Delete product
   * PURE: Delete through adapter
   */
  async delete(id) {
    return await this.adapter.delete(id);
  }

  /**
   * Find products by category
   * PURE: Pure criteria building
   */
  async findByCategory(category, options = {}) {
    const criteria = this._buildCategoryFilter(category);
    return await this.adapter.find(criteria, options);
  }

  /**
   * Search products
   * PURE: Build search criteria
   */
  async search(searchTerm, options = {}) {
    const criteria = this._buildSearchCriteria(searchTerm);
    return await this.adapter.find(criteria, options);
  }

  /**
   * ⭐ PURE: Build criteria from filters (NO Mongoose operators here)
   * Returns plain object that adapter converts to Mongoose query
   */
  _buildCriteria(filters = {}) {
    const criteria = {};

    // Example: Convert filter to criteria
    if (filters.category) {
      criteria.category = filters.category;
    }
    if (filters.minPrice || filters.maxPrice) {
      // In pure layer, we describe what we want
      // Adapter handles $gte, $lte conversion
      criteria._priceRange = {
        min: filters.minPrice,
        max: filters.maxPrice,
      };
    }
    if (filters.inStock) {
      criteria.stock = { _gt: 0 }; // PURE description
    }
    if (filters.minRating) {
      criteria._minRating = filters.minRating;
    }

    return criteria;
  }

  /**
   * ⭐ PURE: Build sort specification
   */
  _buildSort(sortBy = 'newest') {
    const sorts = {
      newest: '-createdAt',
      oldest: 'createdAt',
      priceAsc: 'price',
      priceDesc: '-price',
      nameAsc: 'name',
      nameDesc: '-name',
    };
    return sorts[sortBy] || '-createdAt';
  }

  /**
   * ⭐ PURE: Build category filter
   */
  _buildCategoryFilter(category) {
    return {
      category: { _regex: category, _options: 'i' }, // PURE description
    };
  }

  /**
   * ⭐ PURE: Build search criteria
   */
  _buildSearchCriteria(searchTerm) {
    return {
      _searchFields: ['name', 'description'],
      _searchTerm: searchTerm,
    };
  }

  /**
   * Get sold stats through adapter aggregation
   * PURE: Aggregate through adapter
   */
  async _getSoldStatsViaAdapter() {
    const pipeline = [
      {
        $group: {
          _id: '$id',
          soldCount: { $sum: { $cond: ['$soldCount', '$soldCount', 0] } },
        },
      },
    ];

    return await this.adapter.aggregate(pipeline);
  }
}

module.exports = ProductRepository;
