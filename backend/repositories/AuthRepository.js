const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * AuthRepository - Data access layer cho Authentication
 * Xử lý tất cả query liên quan đến Customer authentication
 */
class AuthRepository {
  /**
   * Tìm customer theo email
   */
  async findByEmail(email) {
    if (!email) return null;
    const normalized = String(email).toLowerCase().trim();
    return await Customer.findOne({ email: normalized });
  }

  /**
   * Tìm customer theo ID
   */
  async findById(id) {
    return await Customer.findById(id);
  }

  /**
   * Kiểm tra email đã tồn tại chưa (và chưa bị xóa)
   */
  async emailExists(email) {
    const normalized = String(email).toLowerCase().trim();
    const existing = await Customer.findOne({
      email: normalized,
      status: { $ne: 'deleted' },
    });
    return !!existing;
  }

  /**
   * Tạo customer mới (registration)
   */
  async createCustomer(data) {
    return await Customer.create({
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      email: String(data.email).toLowerCase().trim(),
      password: data.password, // phải hash trước khi gọi
      status: data.status || 'active',
      provider: data.provider || 'local',
      role: data.role || 'customer',
      addresses: data.addresses || [],
      avatarUrl: data.avatarUrl,
    });
  }

  /**
   * Xác thực password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Tạo JWT token
   */
  generateToken(userId, expiresIn = '7d') {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn });
  }

  /**
   * Cập nhật customer (Google OAuth)
   */
  async updateCustomer(id, updateData) {
    return await Customer.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Lưu OTP và expiry cho forgot password
   */
  async saveResetOtp(customerId, otp, expiresIn = 10 * 60 * 1000) {
    const expires = new Date(Date.now() + expiresIn);
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        resetPasswordOtp: otp,
        resetPasswordExpires: expires,
      },
      { new: true }
    );
  }

  /**
   * Xác thực OTP
   */
  async verifyResetOtp(customerId, otp) {
    const customer = await Customer.findById(customerId);
    if (!customer) return { valid: false, reason: 'Customer not found' };

    if (!customer.resetPasswordOtp || !customer.resetPasswordExpires) {
      return { valid: false, reason: 'No reset request found' };
    }

    if (String(customer.resetPasswordOtp) !== String(otp)) {
      return { valid: false, reason: 'Invalid OTP' };
    }

    if (customer.resetPasswordExpires < new Date()) {
      return { valid: false, reason: 'OTP expired' };
    }

    return { valid: true, customer };
  }

  /**
   * Reset password (xóa OTP sau khi verify)
   */
  async resetPassword(customerId, newHashedPassword) {
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        password: newHashedPassword,
        resetPasswordOtp: undefined,
        resetPasswordExpires: undefined,
      },
      { new: true }
    );
  }

  /**
   * Cập nhật avatar URL
   */
  async updateAvatar(customerId, avatarUrl) {
    return await Customer.findByIdAndUpdate(
      customerId,
      { avatarUrl },
      { new: true }
    );
  }
}

module.exports = AuthRepository;
