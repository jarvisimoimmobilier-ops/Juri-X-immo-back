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
  const { firstname, lastname, title, country, image_link } = updates;

  // Prepare the update object dynamically
  const updateData = {};
  if (firstname) updateData["app_user.firstname"] = firstname;
  if (lastname) updateData["app_user.lastname"] = lastname;
  if (title) updateData["app_user.title"] = title;
  if (image_link) updateData["app_user.image_link"] = image_link;
  if (country) updateData["app_user.country"] = country;

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

export const applySubscriptionPayment = async (
  userId,
  assistantID,
  paidAmount
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Locate the existing balance entry for the specified assistant
    const balanceEntry = user.app_user.balances.find(
      (balance) => balance.assistant_id === assistantID
    );

    if (balanceEntry) {
      // Update the existing balance
      balanceEntry.balance += paidAmount;
    } else {
      throw new Error(
        `Balance entry for assistant ID ${assistantID} not found.`
      );
    }

    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message || "Failed to update subscription balance.");
  }
};
