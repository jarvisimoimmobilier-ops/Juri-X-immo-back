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

    // Extract event details
    const session = event.data.object;

    // Handle event types
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Checkout session completed:", session.id);

        // Perform actions if necessary (e.g., log the event or prepare for payment success)
        break;
      }

      case "payment_intent.succeeded": {
        const customerId = session.customer;
        const plan = session.metadata?.plan;

        if (!plan) {
          console.error(
            "Plan is missing from session metadata:",
            session.metadata
          );
          return res.status(400).send("Plan is missing in metadata.");
        }

        // Determine the amount and avatar ID based on the plan
        const amountPaid = plan === "ChatbotPro" ? 99.99 : 19.99;
        const avatarId = plan === "ChatbotPro" ? "2" : "1";

        console.log("Payment succeeded for customer:", customerId);

        try {
          // Call function to apply payment
          const updatedUser = await applySubscriptionPayment(
            customerId,
            amountPaid,
            avatarId,
            null
          );

          // Find the updated balance for the avatar
          const balanceEntry = updatedUser.app_user.balances.find(
            (balance) => balance.avatar_id === avatarId
          );

          const newBalance = balanceEntry ? balanceEntry.balance : "Unknown";
          console.log(
            `Subscription payment applied successfully for customer ${customerId}. New balance is: ${newBalance}`
          );
        } catch (error) {
          console.error(
            `Error applying subscription payment for customer ${customerId}:`,
            error.message
          );
          return res.status(500).send("Failed to apply subscription payment.");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const customerId = session.customer;
        console.warn("Payment failed for customer:", customerId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`, session);
    }

    // Respond with a 200 status to acknowledge receipt of the event
    res.sendStatus(200);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
