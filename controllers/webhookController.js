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

    // Extract event details
    const session = event.data.object;

    // Validate metadata
    const plan = session.metadata?.plan;
    if (!plan) {
      console.error("Plan is missing from session metadata:", session.metadata);
      return res.status(400).send("Plan is missing in metadata.");
    }

    // Determine amount and avatar ID based on plan
    const amount_paid = plan === "ChatbotPro" ? 99.99 : 19.99;
    const avatar_id = plan === "ChatbotPro" ? "2" : "1";

    // Handle event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout session completed:", session.id);
        break;

      case "payment_intent.succeeded":
        console.log("Payment succeeded for customer:", session.customer);
        try {
          const updatedUser = await applySubscriptionPayment(
            session.customer,
            amount_paid,
            avatar_id,
            null
          );

          // Find the updated balance for the avatar
          const balanceEntry = updatedUser.app_user.balances.find(
            (balance) => balance.avatar_id === avatar_id
          );

          const newBalance = balanceEntry ? balanceEntry.balance : "Unknown";
          console.log(
            `Subscription payment applied successfully for customer ${session.customer}. New balance is: ${newBalance}`
          );
        } catch (error) {
          console.error(
            `Error applying subscription payment for customer ${session.customer}:`,
            error.message
          );
          return res.status(500).send("Failed to apply subscription payment.");
        }
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
