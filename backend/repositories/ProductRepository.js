const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * ProductRepository - Data access layer cho Products
 * Chứa tất cả database queries liên quan đến Product
 */
class ProductRepository {
  /**
   * Tìm sản phẩm với filter, pagination, sorting
   */
  async findPaginated(filters, pagination, sortBy) {
    const { page = 1, limit = 12 } = pagination;
    const skip = (page - 1) * limit;

    // Build query từ filters
    const query = this._buildQuery(filters);

    // Build sort từ sortBy
    const sortOption = this._buildSort(sortBy);

    // Parallel queries: sản phẩm, tổng số, và thống kê đã bán
    const [products, totalProducts, soldStats] = await Promise.all([
      Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
      this._getSoldStats(),
    ]);

    // Thêm soldCount vào sản phẩm
    const soldMap = new Map(
      soldStats.map((doc) => [String(doc._id), Number(doc.soldCount) || 0])
    );

    const productsWithSold = products.map((p) => {
      const obj = p.toObject();
      const keyByNumericId = obj.id != null ? String(obj.id) : null;
      const keyByObjectId = obj._id != null ? String(obj._id) : null;

      obj.soldCount =
        (keyByNumericId && soldMap.get(keyByNumericId)) ??
        (keyByObjectId && soldMap.get(keyByObjectId)) ??
        0;

      return obj;
    });

    return {
      data: productsWithSold,
      pagination: {
        page,
        limit,
        total: totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
      },
    };
  }

  /**
   * Tìm một sản phẩm theo ID
   */
  async findById(id) {
    const { Types } = mongoose;
    let product = null;

    // Build filters: thử theo id number, _id, string id
    const filters = [];
    const nId = Number(id);
    if (!Number.isNaN(nId)) filters.push({ id: nId });
    if (Types.ObjectId.isValid(id)) {
      filters.push({ _id: new Types.ObjectId(id) });
    }
    filters.push({ id: String(id) });

    // Try từng collection
    product = await this._findInProductsDb(filters, 'products.productsList');
    if (!product) {
      product = await this._findInCurrentDb(filters, 'productsList');
    }
    if (!product) {
      product = await this._findInCurrentDb(filters, 'products');
    }
    if (!product && filters.length > 0) {
      product = await Product.findOne({ $or: filters }).lean();
    }

    return product;
  }

  /**
   * Tạo sản phẩm mới
   */
  async create(productData) {
    const newProduct = { ...productData };

    // Try save to products.productsList
    let saved = await this._saveToProductsDb(newProduct);
    if (saved) return saved;

    // Try save to current db productsList
    saved = await this._saveToCurrentDb(newProduct, 'productsList');
    if (saved) return saved;

    // Try save to current db products
    saved = await this._saveToCurrentDb(newProduct, 'products');
    if (saved) return saved;

    // Fallback: Sử dụng Product model
    const lastProduct = await Product.findOne().sort({ id: -1 }).lean();
    const newId = lastProduct ? (lastProduct.id || 0) + 1 : 1;
    newProduct.id = newId;

    const created = await Product.create(newProduct);
    return created;
  }

  /**
   * Cập nhật sản phẩm
   */
  async update(productId, updateData) {
    const { Types } = mongoose;

    // Try updates từng collection
    let updated = await this._updateInProductsDb(productId, updateData);
    if (updated) return updated;

    updated = await this._updateInCurrentDb(productId, updateData, 'productsList');
    if (updated) return updated;

    updated = await this._updateInCurrentDb(productId, updateData, 'products');
    if (updated) return updated;

    // Fallback: sử dụng model
    const filters = [];
    const nId = Number(productId);
    if (!Number.isNaN(nId)) filters.push({ id: nId });
    if (Types.ObjectId.isValid(productId)) {
      filters.push({ _id: new Types.ObjectId(productId) });
    }

    if (filters.length === 0) return null;

    return await Product.findOneAndUpdate(
      { $or: filters },
      updateData,
      { new: true }
    );
  }

  /**
   * Xóa sản phẩm
   */
  async delete(productId) {
    const { Types } = mongoose;

    // Try delete từng collection
    let deleted = await this._deleteInProductsDb(productId);
    if (deleted) return deleted;

    deleted = await this._deleteInCurrentDb(productId, 'productsList');
    if (deleted) return deleted;

    deleted = await this._deleteInCurrentDb(productId, 'products');
    if (deleted) return deleted;

    // Fallback: sử dụng model
    const filters = [];
    const nId = Number(productId);
    if (!Number.isNaN(nId)) filters.push({ id: nId });
    if (Types.ObjectId.isValid(productId)) {
      filters.push({ _id: new Types.ObjectId(productId) });
    }

    if (filters.length === 0) return null;

    return await Product.findOneAndDelete({ $or: filters });
  }

  /**
   * PRIVATE HELPER METHODS
   */

  _buildQuery(filters) {
    const query = {};
    const { search, category, inStock, status, minPrice, maxPrice } = filters;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (inStock === 'true') {
      query.$or = [
        { inStock: true },
        { stock: { $gt: 0 } },
        { countInStock: { $gt: 0 } },
      ];
    } else if (inStock === 'false') {
      query.$or = [
        { inStock: false },
        { stock: { $lte: 0 } },
        { countInStock: { $lte: 0 } },
      ];
    }

    if (minPrice) {
      query.price = { ...(query.price || {}), $gte: Number(minPrice) };
    }
    if (maxPrice) {
      query.price = { ...(query.price || {}), $lte: Number(maxPrice) };
    }

    return query;
  }

  _buildSort(sortBy) {
    const sortOption = {};
    switch (sortBy) {
      case 'priceAsc':
        sortOption.price = 1;
        break;
      case 'priceDesc':
        sortOption.price = -1;
        break;
      case 'new':
        sortOption.createdAt = -1;
        break;
      default:
        sortOption.createdAt = -1;
        break;
    }
    return sortOption;
  }

  async _getSoldStats() {
    try {
      return await Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            soldCount: {
              $sum: {
                $ifNull: ['$items.quantity', '$items.qty'],
              },
            },
          },
        },
      ]);
    } catch (err) {
      console.error('Error getting sold stats:', err.message);
      return [];
    }
  }

  async _findInProductsDb(filters, collectionName) {
    try {
      const productsDb = mongoose.connection.useDb('products', { useCache: true });
      const coll = productsDb.collection('productsList');
      const count = await coll.countDocuments({});

      if (count > 0) {
        for (const filter of filters) {
          const found = await coll.findOne(filter);
          if (found) return found;
        }
      }
    } catch (err) {
      console.log(`Skipping ${collectionName}:`, err.message);
    }
    return null;
  }

  async _findInCurrentDb(filters, collectionName) {
    try {
      const coll = mongoose.connection.db.collection(collectionName);
      const count = await coll.countDocuments({});

      if (count > 0) {
        for (const filter of filters) {
          const found = await coll.findOne(filter);
          if (found) return found;
        }
      }
    } catch (err) {
      console.log(`Skipping ${collectionName}:`, err.message);
    }
    return null;
  }

  async _saveToProductsDb(productData) {
    try {
      const productsDb = mongoose.connection.useDb('products', { useCache: true });
      const coll = productsDb.collection('productsList');
      const count = await coll.countDocuments({});

      if (count > 0) {
        const lastProduct = await coll.findOne({}, { sort: { id: -1 } });
        const newId = lastProduct ? (lastProduct.id || 0) + 1 : 1;
        productData.id = newId;
        productData.createdAt = new Date();
        productData.updatedAt = new Date();

        await coll.insertOne(productData);
        return productData;
      }
    } catch (err) {
      console.log('Failed to save to products.productsList:', err.message);
    }
    return null;
  }

  async _saveToCurrentDb(productData, collectionName) {
    try {
      const coll = mongoose.connection.db.collection(collectionName);
      const count = await coll.countDocuments({});

      if (count > 0) {
        const lastProduct = await coll.findOne({}, { sort: { id: -1 } });
        const newId = lastProduct ? (lastProduct.id || 0) + 1 : 1;
        productData.id = newId;
        productData.createdAt = new Date();
        productData.updatedAt = new Date();

        await coll.insertOne(productData);
        return productData;
      }
    } catch (err) {
      console.log(`Failed to save to ${collectionName}:`, err.message);
    }
    return null;
  }

  async _updateInProductsDb(productId, updateData) {
    try {
      const productsDb = mongoose.connection.useDb('products', { useCache: true });
      const coll = productsDb.collection('productsList');
      updateData.updatedAt = new Date();

      const result = await coll.findOneAndUpdate(
        { $or: [{ id: productId }, { _id: productId }] },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (err) {
      console.log('Failed to update in products.productsList:', err.message);
    }
    return null;
  }

  async _updateInCurrentDb(productId, updateData, collectionName) {
    try {
      const coll = mongoose.connection.db.collection(collectionName);
      updateData.updatedAt = new Date();

      const result = await coll.findOneAndUpdate(
        { $or: [{ id: productId }, { _id: productId }] },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (err) {
      console.log(`Failed to update in ${collectionName}:`, err.message);
    }
    return null;
  }

  async _deleteInProductsDb(productId) {
    try {
      const productsDb = mongoose.connection.useDb('products', { useCache: true });
      const coll = productsDb.collection('productsList');

      const result = await coll.findOneAndDelete({
        $or: [{ id: productId }, { _id: productId }],
      });

      return result.value;
    } catch (err) {
      console.log('Failed to delete in products.productsList:', err.message);
    }
    return null;
  }

  async _deleteInCurrentDb(productId, collectionName) {
    try {
      const coll = mongoose.connection.db.collection(collectionName);

      const result = await coll.findOneAndDelete({
        $or: [{ id: productId }, { _id: productId }],
      });

      return result.value;
    } catch (err) {
      console.log(`Failed to delete in ${collectionName}:`, err.message);
    }
    return null;
  }
}

module.exports = ProductRepository;
