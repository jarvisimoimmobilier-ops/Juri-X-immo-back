import { StatusCodes } from "http-status-codes";
import dotenv from "dotenv";
import Thread from "../model/Thread.js";
import {
  createThread,
  sendMessageToOpenAI,
} from "../services/openAiServices.js";
import { createAndSaveThread } from "../repositories/ThreadRepository.js";
dotenv.config();

// startConversation
const startConversation = async (req, res) => {
  try {
    const { name, assistant_id } = req.body;
    const user = req.user;
    if (!name || !assistant_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Name and assistant_id are required." });
    }
    const thread_id = await createThread();
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
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred while starting the conversation." });
  }
};

// sendMessage
const sendMessage = async (req, res) => {
  const user = req.user;
  const response = {
    user: user,
    message: "Thanks for calling this API",
  };
  res.status(StatusCodes.OK).json(response);
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
  try {
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
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred while retrieving conversations." });
  }
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
