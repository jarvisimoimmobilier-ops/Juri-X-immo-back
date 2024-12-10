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
