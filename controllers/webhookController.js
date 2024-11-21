import stripeInit from "stripe";
import dotenv from "dotenv";
import User from "../model/User.js";
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

    // console.log("req.body :" + req.body);

    // Extract event details
    const session = event.data.object;

    //Step One
    //#1- check plan name
    //#2 get user by customer id
    //#3 call call applySubscriptionPayment(user,price,avatar(based on price))

    //#user : get user by customerId
    //amount: check session.metadata.plan name and get (price + avatar id)
    //
    const user = await User.findOne({
      "auth_user.customerId": session.customer,
    });

    const amount_paid = session.metadata.plan === "ChatbotPro" ? 99.99 : 19.99;
    const avatar_id = session.metadata.plan === "ChatbotPro" ? 2 : 1;

    console.log(user);

    // Handle event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Dataaaaaa:", session);
        break;

      case "payment_intent.succeeded":
        console.log("Payment succeeded:", session);
        await applySubscriptionPayment(user, 99.99, "2", null);

        break;

      case "payment_intent.payment_failed":
        console.log("Payment failed:", session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.sendStatus(200);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
