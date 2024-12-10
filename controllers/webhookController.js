import stripeInit from "stripe";
import dotenv from "dotenv";
import { applySubscriptionPayment } from "../repositories/UserRepository.js";

dotenv.config();

const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

export async function handleWebhook(req, res) {
  let event;

  try {
    // Construct the event from Stripe's signature
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Event received:", event.type);

    // Extract event data object
    const session = event.data.object;

    // Access metadata from session
    const plan = event.data.plan;

    if (!plan) {
      console.error("Plan is missing from session metadata:", session.metadata);
      return res.status(400).send("Plan is missing in metadata.");
    }

    console.log("Plan found:", plan);

    // Handle event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout session completed:", session.id);
        console.log("Plan from:", plan);
        break;

      case "payment_intent.succeeded":
        console.log("Payment succeeded for customer:", session.customer);
        break;

      case "payment_intent.payment_failed":
        console.warn("Payment failed for customer:", session.customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`, session);
    }

    // Acknowledge receipt of the event
    res.sendStatus(200);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
