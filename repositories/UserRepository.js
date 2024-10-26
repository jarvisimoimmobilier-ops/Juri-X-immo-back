import User from "../model/User.js";

export const updateUserProfilePicture = async (userId, imageUrl) => {
  try {
    // Update the user's app_user.image_link with the provided imageUrl
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { "app_user.image_link": imageUrl },
      { new: true }
    );

    return updatedUser;
  } catch (error) {
    throw new Error("Failed to update profile picture.");
  }
};

export const updateUser = async (userId, updates) => {
  const { name, surname, title, image_link } = updates;

  // Prepare the update object dynamically
  const updateData = {};
  if (name) updateData["app_user.name"] = name;
  if (surname) updateData["app_user.surname"] = surname;
  if (title) updateData["app_user.title"] = title;
  if (image_link) updateData["app_user.image_link"] = image_link;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new notFoundError(`User with ID ${userId} not found`);
  }

  return updatedUser;
};
