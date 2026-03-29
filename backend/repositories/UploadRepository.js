/**
 * UploadRepository - Data access layer for file uploads to Cloudinary
 */
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

class UploadRepository {
  constructor() {
    this.cloudinary = cloudinary;
  }

  /**
   * Upload buffer to Cloudinary
   * @param {Buffer} buffer - File buffer to upload
   * @param {string} folder - Cloudinary folder (default: 'products')
   * @param {object} options - Additional Cloudinary options
   * @returns {Promise} Upload result with secure_url, public_id, etc.
   */
  async uploadToCloudinary(buffer, folder = 'products', options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Resize to max 800x800
            { quality: 'auto' }, // Auto optimize quality
          ],
          ...options, // Allow custom options override
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Convert buffer to stream
      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload single file
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} folder - Cloudinary folder
   * @returns {Promise} Upload result
   */
  async uploadSingle(fileBuffer, fileName, folder = 'products') {
    const result = await this.uploadToCloudinary(fileBuffer, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      originalFileName: fileName,
    };
  }

  /**
   * Upload multiple files in parallel
   * @param {Array} files - Array of file objects with buffer and originalname
   * @param {string} folder - Cloudinary folder
   * @returns {Promise} Array of upload results
   */
  async uploadMultiple(files, folder = 'products') {
    const uploadPromises = files.map((file) =>
      this.uploadToCloudinary(file.buffer, folder).then((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        originalFileName: file.originalname,
      }))
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise} Deletion result
   */
  async deleteFile(publicId) {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Get file info from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise} File resource information
   */
  async getFileInfo(publicId) {
    return new Promise((resolve, reject) => {
      this.cloudinary.api.resource(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = UploadRepository;
