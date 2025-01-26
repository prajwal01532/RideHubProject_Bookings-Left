import { EsewaPayment } from 'esewajs';

const ESEWA_TEST_KEY = 'test_public_key_dc74e0fd57cb46cd93832aee0a507256';

class EsewaService {
  constructor() {
    this.esewa = new EsewaPayment({
      amount: 0,
      tax_amount: 0,
      total_amount: 0,
      transaction_uuid: '',
      product_code: '',
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${window.location.origin}/payment/success`,
      failure_url: `${window.location.origin}/payment/failure`,
      signed_field_names: ['total_amount', 'transaction_uuid', 'product_code'],
      test_mode: true // Set to false in production
    });
  }

  async initiatePayment(amount, bookingId) {
    try {
      const transactionId = `RIDEHUB_${Date.now()}_${bookingId}`;
      
      this.esewa.amount = amount;
      this.esewa.total_amount = amount;
      this.esewa.transaction_uuid = transactionId;
      this.esewa.product_code = 'RIDEHUB_VEHICLE_RENTAL';

      // Generate payment URL
      const paymentUrl = await this.esewa.getPaymentUrl();
      
      // Redirect to eSewa payment page
      window.location.href = paymentUrl;
      
      return true;
    } catch (error) {
      console.error('eSewa payment initiation failed:', error);
      throw error;
    }
  }
}

export default new EsewaService();
