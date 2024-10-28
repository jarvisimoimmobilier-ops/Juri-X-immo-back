import User from "../model/User.js";
import { UnAuthenticatedError } from "../errors/index.js";

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
  const { firstname, lastname, title, image_link } = updates;

  // Prepare the update object dynamically
  const updateData = {};
  if (firstname) updateData["app_user.firstname"] = firstname;
  if (lastname) updateData["app_user.lastname"] = lastname;
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

export const updateUserPassword = async (
  user_id,
  currentPassword,
  newPassword
) => {
  try {
    const user = await User.findById(user_id).select("+auth_user.password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnAuthenticatedError("Current password is incorrect.");
    }
    user.auth_user.password = newPassword;
    await user.save();
  } catch (error) {
    throw new Error(error.message || "Failed to update password.");
  }
};
