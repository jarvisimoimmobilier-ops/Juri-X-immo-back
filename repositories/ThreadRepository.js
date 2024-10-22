import Thread from "../model/Thread.js";

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
