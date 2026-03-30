/**
 * backend/core/interfaces/Repository.js
 * 🟢 PURE - Framework-agnostic repository interface
 * 
 * Defines the contract for all data access operations.
 * No Mongoose, Express, or framework dependencies.
 */

class Repository {
  /**
   * Find multiple records by criteria
   * @param {Object} criteria - Search criteria (framework-agnostic)
   * @param {Object} options - { page, limit, sort }
   * @returns {Promise<Object>} { data, total, pages }
   */
  async find(criteria, options = {}) {
    throw new Error('find() must be implemented');
  }

  /**
   * Find single record by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Record or null
   */
  async findOne(criteria) {
    throw new Error('findOne() must be implemented');
  }

  /**
   * Find record by unique identifier
   * @param {string|number} id - Record ID
   * @returns {Promise<Object|null>} Record or null
   */
  async findById(id) {
    throw new Error('findById() must be implemented');
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    throw new Error('create() must be implemented');
  }

  /**
   * Update existing record
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data) {
    throw new Error('update() must be implemented');
  }

  /**
   * Delete record
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>} Success
   */
  async delete(id) {
    throw new Error('delete() must be implemented');
  }

  /**
   * Count records matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria) {
    throw new Error('count() must be implemented');
  }

  /**
   * Check if record exists
   * @param {Object} criteria - Search criteria
   * @returns {Promise<boolean>} Exists
   */
  async exists(criteria) {
    throw new Error('exists() must be implemented');
  }
}

module.exports = Repository;
