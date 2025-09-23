import stripeInit from "stripe";
import dotenv from "dotenv";
import { applySubscriptionPayment, extendSubscription, handleFailedPayment, resetUserToDefaults } from "../repositories/UserRepository.js";

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

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout session completed:", session.id);

        const plan = session.metadata?.plan;
        if (!plan) {
          console.error("Plan missing in session metadata:", session.metadata);
          return res.status(400).send("Plan is missing in metadata.");
        }

        const amount_paid = plan === "ChatbotPro" ? 99.99 : 19.99;
        const avatar_id = plan === "ChatbotPro" ? "2" : "1";
        
        try {
          const updatedUser = await applySubscriptionPayment(
            session.customer,
            amount_paid,
            avatar_id,
            {
              invoice_id: session.invoice,
              session_id: session.id,
              amount: amount_paid,
              plan: plan,
              date: new Date()
            }
          );
          console.log("User successfully updated with subscription plan.");
        } catch (error) {
          console.error("Failed to update user:", error);
          return res.status(500).send("Database update failed.");
        }
        break;

      case "customer.subscription.deleted":
        console.log("Subscription cancelled:", session.id);
        
        try {
          // Reset user to default free tier balances
          await resetUserToDefaults(session.customer);
          console.log("User reset to default balances after cancellation.");
        } catch (error) {
          console.error("Failed to reset user to defaults:", error);
          return res.status(500).send("Failed to handle cancellation.");
        }
        break;

      case "invoice.paid":
        console.log("Recurring payment successful:", session.id);
        
        try {
          // Get subscription details from the invoice
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const plan = subscription.metadata?.plan || "ChatbotBasic";
          const amount_paid = plan === "ChatbotPro" ? 99.99 : 19.99;
          const avatar_id = plan === "ChatbotPro" ? "2" : "1";

          await extendSubscription(
            session.customer,
            amount_paid,
            avatar_id,
            {
              invoice_id: session.id,
              amount: session.amount_paid / 100, // Convert from cents
              plan: plan,
              date: new Date(session.created * 1000)
            }
          );
          console.log("Subscription extended successfully.");
        } catch (error) {
          console.error("Failed to extend subscription:", error);
          return res.status(500).send("Failed to extend subscription.");
        }
        break;

      case "invoice.payment_failed":
        console.log("Payment failed:", session.id);
        
        try {
          // Handle failed payment - maybe add grace period or send notification
          await handleFailedPayment(session.customer, {
            invoice_id: session.id,
            attempt_count: session.attempt_count,
            next_payment_attempt: session.next_payment_attempt,
            date: new Date(session.created * 1000)
          });
          console.log("Failed payment handled.");
        } catch (error) {
          console.error("Failed to handle payment failure:", error);
          return res.status(500).send("Failed to handle payment failure.");
        }
        break;

      case "payment_intent.succeeded":
        console.log("Payment succeeded for payment intent:", session.id);
        // Handle one-time payments if needed
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
