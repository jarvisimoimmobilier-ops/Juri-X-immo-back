import stripeInit from "stripe";
import dotenv from "dotenv";
import { applySubscriptionPayment } from "../repositories/UserRepository.js";

dotenv.config();

const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

export async function handleWebhook(req, res) {
  let event;

  try {
    // Construct the event
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Event received:", event.type);

    // Extract session object
    const session = event.data.object;
    const plan = event.data.plan || session.metadata?.plan; // Safely get plan from event payload or metadata

    // Define constants based on the plan
    console.log(plan);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout session completed:", session.id);

        const plan = session.metadata?.plan; // Get plan from metadata
        if (!plan) {
          console.error("Plan missing in session metadata:", session.metadata);
          return res.status(400).send("Plan is missing in metadata.");
        }

        const amount_paid = plan === "ChatbotPro" ? 99.99 : 19.99;
        const avatar_id = plan === "ChatbotPro" ? "2" : "1";
        console.log("amount_paid " + amount_paid);
        console.log("avatar_id " + avatar_id);

        // Update the user in your database here
        try {
          const updatedUser = await applySubscriptionPayment(
            session.customer,
            amount_paid,
            avatar_id,
            null
          );
          console.log("User successfully updated with subscription plan.");
        } catch (error) {
          console.error("Failed to update user:", error);
          return res.status(500).send("Database update failed.");
        }
        break;

      case "payment_intent.succeeded":
        console.log("Payment succeeded for payment intent:", session.id);
        // Handle payment intent specifics if necessary
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Send acknowledgment to Stripe
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
