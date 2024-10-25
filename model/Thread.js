import mongoose from "mongoose";

// Define the message sub-schema
const messageSchema = new mongoose.Schema({
  message_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  sender: {
    type: String,
    enum: ["user", "assistant"], // Define sender as either 'user' or 'assistant'
    required: true,
  },
  content: { type: String, required: true }, // Message content
});

// Define the Thread schema
const threadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  thread_id: { type: String, required: true, unique: true },
  creation_date: { type: Date, default: Date.now },
  assistant_id: { type: String, required: true },
  status: { type: String, enum: ["active", "deleted"], default: "active" },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messages: [messageSchema],
});

const Thread = mongoose.model("Thread", threadSchema);
export default Thread;
