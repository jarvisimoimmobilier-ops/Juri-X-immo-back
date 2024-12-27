import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import "express-async-errors";
import connectDB from "./db/connect.js";
import authRouter from "./routes/authRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import conversationRouter from "./routes/conversationRouter.js";
import Utils from "./routes/utilitiesRoutes.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import notFoundModule from "./middleware/not-found.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
// Stripe requires the raw body for webhooks
app.use("/", webhookRoutes);

app.use(cors());
app.use(express.json());

app.use("/api/v1", paymentRoutes);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/conversation", conversationRouter);
app.use("/api/v1/", Utils);

app.use(notFoundModule);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
