import { StatusCodes } from "http-status-codes";
import dotenv from "dotenv";
import { validatePayload } from "../utils/functions.js";
import {
  createThread,
  sendMessageToOpenAI,
} from "../services/openAiServices.js";
import {
  createAndSaveThread,
  updateThreadMessages,
  getThreadById,
  getAllThreadsByUserId,
  deleteThreadAndUserReference,
  updateThreadName,
} from "../repositories/ThreadRepository.js";
import {
  deductBalance,
  hasSufficientBalance,
} from "../repositories/UserRepository.js";
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

const updateConversationName = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  const user = req.user;

  const errorResponse = validatePayload(req, res, ["name"]);
  if (errorResponse) return errorResponse;

  const updatedThread = await updateThreadName(id, name);

  res.status(StatusCodes.OK).json({
    message: "Conversation updated successfully!",
    name: updatedThread.name,
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
  const thread = await getThreadById(thread_id, user._id);

  hasSufficientBalance(user, thread.assistant_id);

  const assistantResponse = await sendMessageToOpenAI(
    message,
    thread.assistant_id,
    thread.thread_id
  );

  await deductBalance(user, thread.assistant_id, assistantResponse.usage);
  // Update the thread with the new message and assistant response
  updateThreadMessages(thread_id, {
    userMessage: message,
    assistantMessage: assistantResponse.formattedMessages,
  }).catch((error) => console.error("Failed to save messages:", error));

  // Respond with the assistant's message
  res
    .status(StatusCodes.OK)
    .json({ response: assistantResponse.formattedMessages });
};

// get messages
const getConvHistory = async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const thread = await getThreadById(id, user._id);
  res.status(StatusCodes.OK).json({
    name: thread.name,
    thread_id: thread.thread_id,
    creation_date: thread.creation_date,
    assistant_id: thread.assistant_id,
    messages: thread.messages,
  });
};

// get conversations
const getAllConversations = async (req, res) => {
  const userId = req.user._id; // Get the authenticated user's ID
  const threads = await getAllThreadsByUserId(userId);
  res.status(StatusCodes.OK).json(threads);
};

// delete a conversation
const deleteConversation = async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  await deleteThreadAndUserReference(id, user._id);

  res.status(StatusCodes.OK).json({
    message: "Conversation deleted successfully.",
  });
};

export {
  startConversation,
  sendMessage,
  getConvHistory,
  deleteConversation,
  getAllConversations,
  updateConversationName,
};
