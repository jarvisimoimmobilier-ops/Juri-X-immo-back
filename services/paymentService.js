import stripeInit from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

export async function createOrRetrieveStripeCustomer(name, email) {
  // Attempt to find an existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  // If a customer exists, return the first one found
  if (existingCustomers.data.length > 0) {
    console.log("Customer already exists. Retrieving existing customer.");
    return existingCustomers.data[0];
  }

  // No existing customer, create a new one
  console.log("Creating a new customer.");

  return await stripe.customers.create({
    name: name,
    email: email,
    description: "New Customer",
  });
}

export async function createCheckoutSession(lineItems, customer, req) {
  const protocol = req.protocol + "://";
  const host = req.headers.host;

  return await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "subscription",
    success_url: `https://zippy-smakager-72ffd6.netlify.app/converstations`,
    cancel_url: `https://zippy-smakager-72ffd6.netlify.app/payout`,
    payment_method_types: ["card"],
    customer: customer.id,
    metadata: {
      plan: req.body.plan,
      // Include plan in metadata
    },
    invoice_creation: {
      enabled: true, // Enable invoice creation
    },
  });
}

export function getPriceId(plan) {
  switch (plan) {
    case "ChatbotIndividual":
      return process.env.STRIPE_BASIC_PRODUCT_PRICE_ID;
    case "ChatbotPro":
      return process.env.STRIPE_PRO_PRODUCT_PRICE_ID;
    default:
      return process.env.STRIPE_BASIC_PRODUCT_PRICE_ID;
  }
}
