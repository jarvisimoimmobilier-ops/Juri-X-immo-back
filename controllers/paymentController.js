import * as paymentService from '../services/paymentService.js';
import User from '../model/User.js';

export async function checkoutController(req, res) {
    try {
        const { name, email, userId, plan } = req.body;

        // Logging input for debugging (ensure this does not log sensitive information in production)
        console.log('Checkout request received:', { name, email, userId, plan });

        // Create or retrieve customer
        let customer = await paymentService.createOrRetrieveStripeCustomer(name, email);
        console.log('Stripe customer:', customer.id);

        // Retrieve the appropriate price ID based on the plan
        const priceId = paymentService.getPriceId(plan);
        console.log('Using price ID:', priceId);

        // Create the checkout session
        const checkoutSession = await paymentService.createCheckoutSession([{
            price: priceId,
            quantity: 1,
        }], customer, req);

        console.log('Checkout session created:', checkoutSession.id);

        // Update user document with the customer ID
        const userUpdateResult = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { customerId: customer.id } },
            { returnOriginal: false }
        );

        console.log('User updated with customer ID:', userUpdateResult);

        // Return the session and customer details
        res.status(200).json({ session: checkoutSession, customer: customer, plan });
    } catch (error) {
        console.error('Error in checkoutController:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
}


  const getInvoices = async (req, res) => {
      const customerId = req.params.customerId;
    
      try {
        const invoices = await paymentService.getInvoicesByCustomerId(customerId);
        res.status(200).json(invoices);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };

  export const getPayments = async (req, res) => {
    const customerId = req.params.customerId;
  
    try {
      const payments = await paymentService.getPaymentsByCustomerId(customerId);
  
      if (!payments.length) {
        return res.status(404).json({ error: 'No payments found for this customer.' });
      }
  
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  export default getInvoices

