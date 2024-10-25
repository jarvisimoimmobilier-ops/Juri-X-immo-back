import Thread from "../model/Thread.js";
import { notFoundError } from "../errors/index.js";
import { Types } from "mongoose";
import User from "../model/User.js";

// Function to create and save a new thread
export const createAndSaveThread = async (
  user,
  { name, assistant_id, thread_id }
) => {
  // Create a new thread instance
  const newThread = new Thread({
    thread_id,
    name,
    assistant_id,
    user_id: user._id,
    messages: [],
  });

  // Save the thread to the database
  await newThread.save();

  // Update user's threads array to include the new thread's ID
  user.app_user.threads.push(newThread._id);
  await user.save();

  return newThread;
};

export const updateThreadMessages = async (
  thread_id,
  { userMessage, assistantMessage }
) => {
  return await Thread.findByIdAndUpdate(
    thread_id,
    {
      $push: {
        messages: [
          { sender: "user", content: userMessage }, // Add user's message
          { sender: "assistant", content: assistantMessage }, // Add assistant's message
        ],
      },
    },
    { new: true }
  );
};

export const getThreadById = async (_id, user_id) => {
  if (!Types.ObjectId.isValid(_id)) {
    throw new notFoundError(`No thread found with thread_id: ${_id}`);
  }
  const thread = await Thread.findOne({ _id, user_id });
  if (!thread) {
    throw new notFoundError(`No thread found with thread_id: ${_id}`);
  }
  return thread;
};

export const getAllThreadsByUserId = async (user_id) => {
  return await Thread.aggregate([
    { $match: { user_id } }, // Filter threads by user_id
    {
      $project: {
        _id: 1, // Include the MongoDB ID
        name: 1, // Include the thread name
        creation_date: 1, // Include creation date
        assistant_id: 1, // Include assistant ID
        status: 1, // Include status
        number_of_messages: { $size: "$messages" }, // Count the number of messages
      },
    },
  ]);
};

export const deleteThreadAndUserReference = async (thread_id, user_id) => {
  if (!Types.ObjectId.isValid(thread_id)) {
    throw new notFoundError(`No thread found with thread_id: ${thread_id}`);
  }
  // Start a session to perform both operations atomically
  const session = await Thread.startSession();
  session.startTransaction();

  try {
    // Find and delete the thread
    const thread = await Thread.findByIdAndDelete(thread_id, { session });

    // Check if the thread exists
    if (!thread) {
      throw new notFoundError(`No thread found with ID: ${thread_id}`);
    }

    // Remove the thread ID from the user's threads array
    await User.updateOne(
      { _id: user_id },
      { $pull: { "app_user.threads": thread_id } },
      { session }
    );
    await session.commitTransaction();
    session.endSession();

    return true;
  } catch (error) {
    await session.abortTransaction(); // Abort the transaction on error
    session.endSession();
    throw error; // Rethrow error to handle it in the controller
  }
};
