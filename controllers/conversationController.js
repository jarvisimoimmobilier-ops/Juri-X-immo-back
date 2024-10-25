import { StatusCodes } from "http-status-codes";
import dotenv from "dotenv";
import Thread from "../model/Thread.js";
import { validatePayload } from "../utils/functions.js";
import {
  createThread,
  sendMessageToOpenAI,
} from "../services/openAiServices.js";
import {
  createAndSaveThread,
  updateThreadMessages,
} from "../repositories/ThreadRepository.js";
dotenv.config();

// startConversation
const startConversation = async (req, res) => {
  const { name, assistant_id } = req.body;
  const user = req.user;

  const errorResponse = validatePayload(req, res, ["name", "assistant_id"]);
  if (errorResponse) return errorResponse;

  const thread_id = await createThread(assistant_id);
  const newThread = await createAndSaveThread(user, {
    name,
    assistant_id,
    thread_id,
  });

  res.status(StatusCodes.OK).json({
    message: "Conversation started successfully!",
    thread_id: newThread._id,
    name: newThread.name,
    assistant_id: newThread.assistant_id,
  });
};

// sendMessage
const sendMessage = async (req, res) => {
  // Validate required fields
  const errorResponse = validatePayload(req, res, ["message", "thread_id"]);
  if (errorResponse) return errorResponse;

  const user = req.user;
  const { message, thread_id } = req.body;

  // Find the thread in the database
  const thread = await Thread.findOne({ _id: thread_id, user: user._id });
  if (!thread) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Thread not found or access denied." });
  }

  const assistantResponse = await sendMessageToOpenAI(
    message,
    thread.assistant_id,
    thread.thread_id
  );

  // Update the thread with the new message and assistant response
  updateThreadMessages(thread_id, {
    userMessage: message,
    assistantMessage: assistantResponse,
  }).catch((error) => console.error("Failed to save messages:", error));

  // Respond with the assistant's message
  res.status(StatusCodes.OK).json({ response: assistantResponse });
};

// get messages
const getConvHistory = async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const response = {
    user: user,
    message: "Thanks for calling this API",
  };
  res.status(StatusCodes.OK).json(response);
};

// get conversations
const getAllConversations = async (req, res) => {
  const userId = req.user._id; // Get the authenticated user's ID

  // Find all threads associated with the user
  const threads = await Thread.find({ user_id: userId })
    .select("creation_date assistant_id status user_id")
    .lean();

  // Format the response
  const response = threads.map((thread) => ({
    thread_id: thread._id, // MongoDB auto-generated ID
    creation_date: thread.creation_date,
    assistant_id: thread.assistant_id,
    status: thread.status,
    user_id: thread.user_id,
  }));

  res.status(StatusCodes.OK).json(response);
};

// delete a conversation
const deleteConversation = async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const response = {
    user: user,
    message: "Thanks for calling this API",
  };
  res.status(StatusCodes.OK).json(response);
};

export {
  startConversation,
  sendMessage,
  getConvHistory,
  deleteConversation,
  getAllConversations,
};
