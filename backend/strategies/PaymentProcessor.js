/**
 * backend/strategies/PaymentProcessor.js
 * Context class sử dụng Strategy pattern
 * Nắm giữ reference tới strategy hiện tại và delegate payment processing
 */

const CreditCardPayment = require('./CreditCardPayment');
const BankTransferPayment = require('./BankTransferPayment');
const EWalletPayment = require('./EWalletPayment');

class PaymentProcessor {
  constructor(strategy = null) {
    this.strategy = strategy;
  }

  /**
   * Set payment strategy
   * @param {PaymentStrategy} strategy - Payment strategy instance
   */
  setStrategy(strategy) {
    if (!strategy) {
      throw new Error('Strategy cannot be null');
    }
    this.strategy = strategy;
    console.log(`✅ Strategy changed to: ${strategy.constructor.name}`);
  }

  /**
   * Get strategy by payment method type
   * @param {string} paymentMethod - Payment method type
   * @returns {PaymentStrategy} - Strategy instance
   */
  getStrategyByType(paymentMethod) {
    const method = paymentMethod.toLowerCase().replace(/\s+/g, '_');
    
    switch (method) {
      case 'credit_card':
      case 'creditcard':
      case 'card':
        return new CreditCardPayment();
      case 'bank_transfer':
      case 'banktransfer':
      case 'bank':
        return new BankTransferPayment();
      case 'ewallet':
      case 'wallet':
      case 'e_wallet':
      case 'vnpay':
      case 'momo':
      case 'zalopay':
      case 'paypal':
        return new EWalletPayment();
      default:
        throw new Error(`Unknown payment method: ${paymentMethod}`);
    }
  }

  /**
   * Process payment using strategy
   * @param {string} paymentMethod - Payment method type
   * @param {Object} paymentDetails - Payment details
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(paymentMethod, paymentDetails, amount) {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Get strategy based on payment method
      const strategy = this.getStrategyByType(paymentMethod);
      this.setStrategy(strategy);

      // Process payment using strategy
      const result = await this.strategy.processPayment(paymentDetails, amount);

      return result;
    } catch (error) {
      console.error('❌ Payment Processing Error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund payment
   * @param {string} transactionId - Transaction ID
   * @param {number} amount - Refund amount
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(transactionId, amount) {
    try {
      if (!this.strategy) {
        throw new Error('No payment strategy set. Process a payment first.');
      }

      const result = await this.strategy.refund(transactionId, amount);
      return result;
    } catch (error) {
      console.error('❌ Refund Processing Error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get list of supported payment methods
   * @returns {Array<string>} - List of supported methods
   */
  getSupportedPaymentMethods() {
    return ['credit_card', 'bank_transfer', 'ewallet'];
  }
}

module.exports = PaymentProcessor;