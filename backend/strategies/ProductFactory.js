/**
 * backend/strategies/ProductFactory.js
 * Factory pattern for product creation
 * Tạo các loại sản phẩm khác nhau với các thuộc tính riêng
 */

class ProductFactory {
  /**
   * Create a product based on type
   * @param {string} type - Product type (electronics, clothing, books, food, etc.)
   * @param {Object} data - Product data
   * @returns {Object} - Product instance
   */
  static createProduct(type, data) {
    switch (type.toLowerCase()) {
      case 'electronics':
        return new ElectronicsProduct(data);
      case 'clothing':
        return new ClothingProduct(data);
      case 'books':
        return new BooksProduct(data);
      case 'food':
        return new FoodProduct(data);
      default:
        return new GenericProduct(data);
    }
  }

  /**
   * Create multiple products
   * @param {Array<Object>} productsData - Array of product data
   * @returns {Array<Object>} - Array of product instances
   */
  static createProducts(productsData) {
    return productsData.map((data) =>
      this.createProduct(data.type || 'generic', data)
    );
  }

  /**
   * Get product types
   * @returns {Array<string>} - List of available product types
   */
  static getAvailableTypes() {
    return ['electronics', 'clothing', 'books', 'food', 'generic'];
  }
}

/**
 * Base Product Class
 */
class BaseProduct {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.category = data.category;
    this.stock = data.stock || 0;
    this.sku = data.sku;
    this.imageUrl = data.imageUrl;
    this.status = data.status || 'Publish';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Validate product data
   * @returns {boolean}
   */
  validate() {
    if (!this.name || !this.sku || this.price <= 0) {
      throw new Error('Invalid product data: name, sku, and price are required');
    }
    return true;
  }

  /**
   * Get product summary
   * @returns {Object}
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      category: this.category,
      type: this.constructor.name,
      stock: this.stock,
    };
  }

  /**
   * Update stock
   * @param {number} quantity
   */
  updateStock(quantity) {
    this.stock += quantity;
    this.updatedAt = new Date();
  }

  /**
   * Check if in stock
   * @returns {boolean}
   */
  isInStock() {
    return this.stock > 0;
  }
}

/**
 * Electronics Product
 */
class ElectronicsProduct extends BaseProduct {
  constructor(data) {
    super(data);
    this.category = 'Electronics';
    this.type = 'electronics';
    this.warranty = data.warranty || '12 months';
    this.voltage = data.voltage || '110-240V';
    this.weight = data.weight || 0; // in kg
    this.dimensions = data.dimensions || {}; // {length, width, height}
    this.brand = data.brand || '';
    this.model = data.model || '';
  }

  validate() {
    super.validate();
    if (!this.brand || !this.model) {
      throw new Error('Brand and model are required for electronics');
    }
    return true;
  }

  /**
   * Get warranty info
   * @returns {string}
   */
  getWarrantyInfo() {
    return `This product includes ${this.warranty} warranty`;
  }

  /**
   * Check if product requires special handling
   * @returns {boolean}
   */
  requiresSpecialHandling() {
    return true; // Electronics require careful handling
  }

  /**
   * Get shipping restrictions
   * @returns {Array<string>}
   */
  getShippingRestrictions() {
    return ['Fragile', 'Keep dry', 'Handle with care'];
  }
}

/**
 * Clothing Product
 */
class ClothingProduct extends BaseProduct {
  constructor(data) {
    super(data);
    this.category = 'Clothing';
    this.type = 'clothing';
    this.sizes = data.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    this.colors = data.colors || [];
    this.material = data.material || '';
    this.brand = data.brand || '';
    this.season = data.season || 'All seasons';
    this.careInstructions = data.careInstructions || 'Machine wash at 30°C';
  }

  validate() {
    super.validate();
    if (!this.material || this.colors.length === 0) {
      throw new Error('Material and colors are required for clothing');
    }
    return true;
  }

  /**
   * Get available variants
   * @returns {Array<Object>}
   */
  getAvailableVariants() {
    return this.sizes.map((size) => ({
      size,
      colors: this.colors,
    }));
  }

  /**
   * Get care instructions
   * @returns {string}
   */
  getCareInstructions() {
    return this.careInstructions;
  }

  /**
   * Get size chart
   * @returns {Object}
   */
  getSizeChart() {
    const sizeCharts = {
      'XS': { chest: '32-34', waist: '24-26', length: '27' },
      'S': { chest: '34-36', waist: '26-28', length: '28' },
      'M': { chest: '38-40', waist: '30-32', length: '29' },
      'L': { chest: '42-44', waist: '34-36', length: '30' },
      'XL': { chest: '46-48', waist: '38-40', length: '31' },
      'XXL': { chest: '50-52', waist: '42-44', length: '32' },
    };
    return sizeCharts;
  }
}

/**
 * Books Product
 */
class BooksProduct extends BaseProduct {
  constructor(data) {
    super(data);
    this.category = 'Books';
    this.type = 'books';
    this.author = data.author || '';
    this.isbn = data.isbn || '';
    this.publisher = data.publisher || '';
    this.publishedDate = data.publishedDate || '';
    this.pages = data.pages || 0;
    this.language = data.language || 'English';
    this.format = data.format || 'Paperback'; // Paperback, Hardcover, eBook
  }

  validate() {
    super.validate();
    if (!this.author || !this.isbn) {
      throw new Error('Author and ISBN are required for books');
    }
    return true;
  }

  /**
   * Get book info
   * @returns {Object}
   */
  getBookInfo() {
    return {
      author: this.author,
      isbn: this.isbn,
      publisher: this.publisher,
      pages: this.pages,
      format: this.format,
      language: this.language,
      publishedDate: this.publishedDate,
    };
  }

  /**
   * Check if book is available in ebook format
   * @returns {boolean}
   */
  isAvailableAsEBook() {
    return this.format === 'eBook' || this.format === 'ebook';
  }

  /**
   * Get reading level
   * @returns {string}
   */
  getReadingLevel() {
    const levels = ['Children', 'Teens', 'Adults'];
    // Dựa trên category hoặc metadata khác
    return 'Adults'; // default
  }
}

/**
 * Food Product
 */
class FoodProduct extends BaseProduct {
  constructor(data) {
    super(data);
    this.category = 'Food';
    this.type = 'food';
    this.expiryDate = data.expiryDate || null;
    this.ingredients = data.ingredients || [];
    this.allergens = data.allergens || [];
    this.nutritionFacts = data.nutritionFacts || {};
    this.storageInstructions = data.storageInstructions || 'Store in cool dry place';
    this.organic = data.organic || false;
  }

  validate() {
    super.validate();
    if (!this.ingredients || this.ingredients.length === 0) {
      throw new Error('Ingredients are required for food products');
    }
    return true;
  }

  /**
   * Check if product is expired
   * @returns {boolean}
   */
  isExpired() {
    if (!this.expiryDate) return false;
    return new Date() > new Date(this.expiryDate);
  }

  /**
   * Get allergen warning
   * @returns {string|null}
   */
  getAllergenWarning() {
    if (this.allergens.length === 0) return 'No known allergens';
    return `⚠️ Contains: ${this.allergens.join(', ')}`;
  }

  /**
   * Get nutrition facts
   * @returns {Object}
   */
  getNutritionFacts() {
    return this.nutritionFacts;
  }

  /**
   * Check if product is organic
   * @returns {boolean}
   */
  isOrganic() {
    return this.organic === true;
  }

  /**
   * Get storage instructions
   * @returns {string}
   */
  getStorageInstructions() {
    return this.storageInstructions;
  }
}

/**
 * Generic Product
 */
class GenericProduct extends BaseProduct {
  constructor(data) {
    super(data);
    this.category = data.category || 'General';
    this.type = 'generic';
  }

  validate() {
    return super.validate();
  }
}

module.exports = {
  ProductFactory,
  BaseProduct,
  ElectronicsProduct,
  ClothingProduct,
  BooksProduct,
  FoodProduct,
  GenericProduct,
};