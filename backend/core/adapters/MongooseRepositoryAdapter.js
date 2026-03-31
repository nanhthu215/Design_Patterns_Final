/**
 * backend/core/adapters/MongooseRepositoryAdapter.js
 * 🔗 ADAPTER - Adapts pure Repository to Mongoose
 * 
 * Implements Repository interface for MongoDB/Mongoose.
 * This is the ONLY place where Mongoose specifics exist.
 */

const Repository = require('../interfaces/Repository');

class MongooseRepositoryAdapter extends Repository {
  /**
   * Create adapter instance
   * @param {Mongoose.Model} mongooseModel - Mongoose model class
   */
  constructor(mongooseModel) {
    super();
    this.model = mongooseModel;
    this.name = mongooseModel.modelName;
    console.log(`✅ [MongooseAdapter] Created for model: ${this.name}`);
  }

  /**
   * Find multiple records - implements pure interface with Mongoose
   * ⭐ CONVERTS PURE CRITERIA TO MONGOOSE OPERATORS
   */
  async find(criteria = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      // ✅ Convert pure criteria to Mongoose operators
      const mongooseCriteria = this._buildMongooseCriteria(criteria);

      // ✅ Mongoose implementation - visible only in adapter
      const [data, total] = await Promise.all([
        this.model.find(mongooseCriteria)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.model.countDocuments(mongooseCriteria),
      ]);

      return {
        data,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`[${this.name}] Find failed: ${error.message}`);
    }
  }

  /**
   * Find single record - implements pure interface with Mongoose
   * ⭐ CONVERTS PURE CRITERIA TO MONGOOSE OPERATORS
   */
  async findOne(criteria) {
    try {
      // ✅ Convert pure criteria to Mongoose operators
      const mongooseCriteria = this._buildMongooseCriteria(criteria);
      return await this.model.findOne(mongooseCriteria).lean();
    } catch (error) {
      throw new Error(`[${this.name}] FindOne failed: ${error.message}`);
    }
  }

  /**
   * Find by ID - implements pure interface with Mongoose
   */
  async findById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw new Error(`[${this.name}] FindById failed: ${error.message}`);
    }
  }

  /**
   * Create record - implements pure interface with Mongoose
   */
  async create(data) {
    try {
      const doc = await this.model.create(data);
      return doc.toObject ? doc.toObject() : doc;
    } catch (error) {
      throw new Error(`[${this.name}] Create failed: ${error.message}`);
    }
  }

  /**
   * Update record - implements pure interface with Mongoose
   */
  async update(id, data) {
    try {
      const updated = await this.model.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();

      if (!updated) {
        throw new Error('Record not found');
      }

      return updated;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Record not found');
      }
      throw new Error(`[${this.name}] Update failed: ${error.message}`);
    }
  }

  /**
   * Delete record - implements pure interface with Mongoose
   */
  async delete(id) {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      if (error.name === 'CastError') {
        return false;
      }
      throw new Error(`[${this.name}] Delete failed: ${error.message}`);
    }
  }

  /**
   * Count records - implements pure interface with Mongoose
   */
  async count(criteria = {}) {
    try {
      return await this.model.countDocuments(criteria);
    } catch (error) {
      throw new Error(`[${this.name}] Count failed: ${error.message}`);
    }
  }

  /**
   * Check existence - implements pure interface with Mongoose
   */
  async exists(criteria) {
    try {
      const result = await this.model.exists(criteria);
      return !!result;
    } catch (error) {
      throw new Error(`[${this.name}] Exists failed: ${error.message}`);
    }
  }

  /**
   * Advanced query wrapping - for complex aggregations
   */
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`[${this.name}] Aggregate failed: ${error.message}`);
    }
  }

  /**
   * ⭐ PURE CRITERIA CONVERTER - Translates pure layer descriptions to Mongoose operators
   * This is the ONLY place where Mongoose operators appear!
   * 
   * Pure format → Mongoose format:
   * - _categoryRegex → $regex
   * - _searchFields → $or with $regex
   * - _in → $in
   * - _gt → $gt
   * - _gte → $gte
   * - _lt → $lt
   * - _lte → $lte
   * - _priceRange → $gte/$lte for price
   * - _ratingMin → $gte for rating
   */
  _buildMongooseCriteria(pureCriteria = {}) {
    const mongooseCriteria = {};

    for (const key of Object.keys(pureCriteria)) {
      const value = pureCriteria[key];

      // Handle special pure descriptions
      if (key === '_categoryRegex') {
        mongooseCriteria.category = {
          $regex: value,
          $options: pureCriteria._categoryOptions || 'i',
        };
        delete mongooseCriteria._categoryOptions;
        continue;
      }

      if (key === '_categoryOptions') {
        // Already handled with _categoryRegex
        continue;
      }

      if (key === '_searchFields' && pureCriteria._searchTerm) {
        // Search in multiple fields
        const fields = value || [];
        const term = pureCriteria._searchTerm;
        mongooseCriteria.$or = fields.map((field) => ({
          [field]: { $regex: term, $options: 'i' },
        }));
        continue;
      }

      if (key === '_searchTerm') {
        // Already handled with _searchFields
        continue;
      }

      if (key === '_priceRange') {
        // Handle price range
        const { min, max } = value;
        mongooseCriteria.price = {};
        if (min !== undefined) mongooseCriteria.price.$gte = min;
        if (max !== undefined) mongooseCriteria.price.$lte = max;
        continue;
      }

      if (key === '_minRating') {
        mongooseCriteria.rating = { $gte: value };
        continue;
      }

      if (key === '_categoryName') {
        mongooseCriteria.category = value;
        continue;
      }

      // Handle operator descriptions
      if (typeof value === 'object' && value !== null) {
        if (value._in !== undefined) {
          mongooseCriteria[key] = { $in: value._in };
          continue;
        }

        if (value._gt !== undefined) {
          mongooseCriteria[key] = { $gt: value._gt };
          continue;
        }

        if (value._gte !== undefined) {
          mongooseCriteria[key] = { $gte: value._gte };
          continue;
        }

        if (value._lt !== undefined) {
          mongooseCriteria[key] = { $lt: value._lt };
          continue;
        }

        if (value._lte !== undefined) {
          mongooseCriteria[key] = { $lte: value._lte };
          continue;
        }

        if (value._regex !== undefined) {
          mongooseCriteria[key] = {
            $regex: value._regex,
            $options: value._options || 'i',
          };
          continue;
        }
      }

      // Regular criteria (no special handling needed)
      mongooseCriteria[key] = value;
    }

    return mongooseCriteria;
  }
}

module.exports = MongooseRepositoryAdapter;
