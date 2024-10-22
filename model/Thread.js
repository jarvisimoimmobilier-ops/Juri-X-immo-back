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
  date: { type: Date, default: Date.now }, // Timestamp for the message
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
  messages: [messageSchema], // Array of messages using the message sub-schema
});

// Pre-save middleware to automatically update the number_of_messages before saving
threadSchema.pre("save", function (next) {
  this.number_of_messages = this.messages.length; // Update the message count
  next();
});

const Thread = mongoose.model("Thread", threadSchema);
export default Thread;
