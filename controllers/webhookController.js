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

    const session = event.data.object;

    const amount_paid = plan === "ChatbotPro" ? 99.99 : 19.99;
    const avatar_id = plan === "ChatbotPro" ? "2" : "1";

    switch (event.type) {
      case "checkout.session.completed":
        // Log metadata from session
        console.log("Checkout session completed:", session.id);
        console.log(
          "Plan from session metadata:",
          session.metadata?.plan || "No plan found"
        );
        break;

      case "payment_intent.succeeded": {
        console.log("Payment succeeded for payment intent:", session.id);

        // Retrieve the Checkout Session to access metadata
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          session.id // Use the `id` of the payment intent or session
        );

        const plan = checkoutSession.metadata?.plan;
        if (!plan) {
          console.error(
            "Plan is missing in metadata for payment intent:",
            checkoutSession.metadata
          );
          return res.status(400).send("Plan is missing in metadata.");
        }

        console.log("Plan from associated checkout session:", plan);

        // Process the payment based on the plan
        // Add your logic here
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
      }

      case "payment_intent.payment_failed":
        console.warn("Payment failed for payment intent:", session.id);
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
