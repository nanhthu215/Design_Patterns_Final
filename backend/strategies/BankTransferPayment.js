/**
 * backend/strategies/BankTransferPayment.js
 * Implement thanh toán bằng chuyển khoản ngân hàng
 */

const PaymentStrategy = require('./PaymentStrategy');

class BankTransferPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'bank_transfer';
  }

  /**
   * Validate bank transfer details
   */
  validatePaymentDetails(paymentDetails) {
    const { accountNumber, bankCode, accountHolderName } = paymentDetails;

    // Validate account number
    if (!accountNumber || accountNumber.trim().length < 8) {
      throw new Error('Account number is invalid (min 8 digits)');
    }

    // Validate bank code
    if (!bankCode || bankCode.trim().length === 0) {
      throw new Error('Bank code is required');
    }

    // Validate account holder name
    if (!accountHolderName || accountHolderName.trim().length === 0) {
      throw new Error('Account holder name is required');
    }

    return true;
  }

  /**
   * Process bank transfer payment
   */
  async processPayment(paymentDetails, amount) {
    try {
      // Validate payment details
      this.validatePaymentDetails(paymentDetails);

      console.log(
        `🏦 Processing Bank Transfer: ${amount} VND to ${paymentDetails.accountHolderName}`
      );

      // Simulate API call to banking system
      const transactionId = this._generateTransactionId();
      await this._simulatePaymentProcessing();

      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        amount,
        timestamp: new Date().toISOString(),
        accountNumber: paymentDetails.accountNumber.slice(-4).padStart(10, '*'),
        status: 'pending', // Bank transfers are usually pending
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      };
    } catch (error) {
      console.error('❌ Bank Transfer Payment Failed:', error.message);
      return {
        success: false,
        error: error.message,
        paymentMethod: this.paymentMethod,
      };
    }
  }

  /**
   * Refund bank transfer payment
   */
  async refund(transactionId, amount) {
    try {
      console.log(`🔄 Refunding Bank Transfer: ${amount} VND (Transaction: ${transactionId})`);
      await this._simulatePaymentProcessing();

      return {
        success: true,
        refundId: this._generateTransactionId(),
        originalTransaction: transactionId,
        amount,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
    } catch (error) {
      console.error('❌ Bank Transfer Refund Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _generateTransactionId() {
    return `BT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _simulatePaymentProcessing() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 1500);
    });
  }
}

module.exports = BankTransferPayment;