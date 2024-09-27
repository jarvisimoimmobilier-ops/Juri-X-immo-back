import express from "express";
import stripeInit from 'stripe';
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import "express-async-errors";
import connectDB from "./db/connect.js";
import authRouter from "./routes/authRoutes.js";
import BrandRoutes from "./routes/BrandRoutes.js";
import CalenderRoutes from "./routes/CalenderRoutes.js";
import GptRoutes from "./routes/gptRoutes.js";
import Utils from "./routes/Utils.js";
import PaymentRoutes from "./routes/paymentRoutes.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import notFoundModule from "./middleware/not-found.js";
import startBackgroundWorker from "./services/worker/backgroundworker.js";
import User from './model/User.js'


const app = express();
const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    let event;

    try {
        event = await stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Webhook event data:", event.data.object);  // Log to see the structure

        let plan = event.data.object.metadata?.plan;  // Adjusted path to metadata

        let eligibleBrands;
        let eligibleCalendars;

        if (plan === "Premium") {
            plan = 'Premium';
            eligibleBrands = 3;
            eligibleCalendars = 9;
        } else if (plan === "Advanced") {
            plan = 'Advanced';
            eligibleBrands = 30;
            eligibleCalendars = 20;
        }

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;  // This is a CheckoutSession
                try {
                    // const updatedUser = await User.findOneAndUpdate(
                    //     { customerId: session.customer },
                    //     {
                    //         $set: {
                    //             currentPlan: plan,
                    //             eligibleBrands: eligibleBrands,
                    //             eligibleCalendars: eligibleCalendars,
                    //         }
                    //     },
                    //     { new: true }
                    // );
                    const updatedUser = await User.findOneAndUpdate(
                        { customerId: session.customer },
                        {
                            $set: {
                                currentPlan: plan
                            },
                            $inc: {
                                eligibleBrands: eligibleBrands, // Assuming eligibleBrands is the increment value
                                eligibleCalendars: eligibleCalendars // Assuming eligibleCalendars is the increment value
                            }
                        },
                        { new: true }
                    );
                    
                    if (updatedUser) {
                        console.log("User updated:", updatedUser);
                    } else {
                        console.log("No user found with given customerId.");
                    }
                } catch (error) {
                    console.error("Failed to update user:", error);
                }

                console.log(`Payment succeeded for customer ${session.customer}`);
                break;

            case 'payment_intent.payment_failed':
                console.log(`Payment failed for customer`);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.sendStatus(200);
    } catch (err) {
        console.log(`❌ Error message: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});


if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

app.use(cors());
app.use(express.json());


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/", BrandRoutes);
app.use("/api/v1/", CalenderRoutes);
app.use("/api/v1/", GptRoutes);
app.use("/api/v1/", Utils);
app.use("/api/v1/", PaymentRoutes);




app.use(notFoundModule);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL);
        startBackgroundWorker();
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}...`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
