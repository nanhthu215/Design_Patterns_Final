/**
 * backend/strategies/PaymentStrategy.js
 * Base abstract class cho tất cả payment strategies
 */

class PaymentStrategy {
  /**
   * Process payment
   * @param {Object} paymentDetails - Chi tiết thanh toán
   * @param {number} amount - Số tiền cần thanh toán
   * @returns {Promise<Object>} - Kết quả thanh toán
   */
  async processPayment(paymentDetails, amount) {
    throw new Error('Method processPayment() must be implemented');
  }

  /**
   * Validate payment details
   * @param {Object} paymentDetails - Chi tiết thanh toán
   * @returns {boolean} - Kết quả xác thực
   */
  validatePaymentDetails(paymentDetails) {
    throw new Error('Method validatePaymentDetails() must be implemented');
  }

  /**
   * Refund payment
   * @param {string} transactionId - ID giao dịch
   * @param {number} amount - Số tiền hoàn lại
   * @returns {Promise<Object>} - Kết quả hoàn lại
   */
  async refund(transactionId, amount) {
    throw new Error('Method refund() must be implemented');
  }
}

module.exports = PaymentStrategy;