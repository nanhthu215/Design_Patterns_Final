/**
 * backend/strategies/CreditCardPayment.js
 * Implement thanh toán bằng thẻ tín dụng
 */

const PaymentStrategy = require('./PaymentStrategy');

class CreditCardPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'credit_card';
  }

  /**
   * Validate credit card details
   */
  validatePaymentDetails(paymentDetails) {
    const { cardNumber, expiryDate, cvv, cardholderName } = paymentDetails;

    // Validate card number (Luhn algorithm simplified)
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      throw new Error('Card number is invalid');
    }

    // Validate expiry date (MM/YY format)
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      throw new Error('Expiry date must be in MM/YY format');
    }

    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const cardYear = 2000 + parseInt(year);
    const cardMonth = parseInt(month);

    if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
      throw new Error('Card has expired');
    }

    // Validate CVV
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      throw new Error('CVV is invalid (must be 3-4 digits)');
    }

    // Validate cardholder name
    if (!cardholderName || cardholderName.trim().length === 0) {
      throw new Error('Cardholder name is required');
    }

    return true;
  }

  /**
   * Process credit card payment
   */
  async processPayment(paymentDetails, amount) {
    try {
      // Validate payment details
      this.validatePaymentDetails(paymentDetails);

      console.log(
        `🎫 Processing Credit Card Payment: ${amount} VND from ${paymentDetails.cardholderName}`
      );

      // Simulate API call to payment gateway (Stripe, PayPal, etc.)
      const transactionId = this._generateTransactionId();
      await this._simulatePaymentProcessing();

      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        amount,
        timestamp: new Date().toISOString(),
        last4Digits: paymentDetails.cardNumber.slice(-4),
        status: 'completed',
      };
    } catch (error) {
      console.error('❌ Credit Card Payment Failed:', error.message);
      return {
        success: false,
        error: error.message,
        paymentMethod: this.paymentMethod,
      };
    }
  }

  /**
   * Refund credit card payment
   */
  async refund(transactionId, amount) {
    try {
      console.log(`🔄 Refunding Credit Card Payment: ${amount} VND (Transaction: ${transactionId})`);
      await this._simulatePaymentProcessing();

      return {
        success: true,
        refundId: this._generateTransactionId(),
        originalTransaction: transactionId,
        amount,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };
    } catch (error) {
      console.error('❌ Credit Card Refund Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _generateTransactionId() {
    return `CC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _simulatePaymentProcessing() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  }
}

module.exports = CreditCardPayment;