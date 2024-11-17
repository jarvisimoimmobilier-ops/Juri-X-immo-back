import User from "../model/User.js";
import { UnAuthenticatedError, payment_required } from "../errors/index.js";
import { getAssistantConfig } from "../utils/functions.js";

const assistants = getAssistantConfig();

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
  user,
  amount_paid,
  avatar_id,
  invoice
) => {
  try {
    // Locate the balance entry for the specified assistant
    const balanceEntry = user.app_user.balances.find(
      (balance) => balance.avatar_id === avatar_id
    );

    const usableAmount = amount_paid;

    // Update the balance
    balanceEntry.balance += usableAmount;

    // Save the invoice details in the balance's invoices object
    balanceEntry.invoices.push(invoice);

    // Save the updated user document
    await user.save();
    return user;
  } catch (error) {
    console.error("Error applying subscription payment:", error);
    throw new Error(error.message || "Failed to apply subscription payment.");
  }
};

export const deductBalance = async (user, avatar_id, usage) => {
  try {
    // Locate the balance entry for the specified avatar (assistant)
    const balanceEntry = user.app_user.balances.find(
      (balance) => balance.avatar_id === avatar_id
    );

    const assistantConfig = assistants[avatar_id];
    const inputTokenValue = assistantConfig.inputTokenValue;
    const outputTokenValue = assistantConfig.outputTokenValue;

    // Calculate the total amount to deduct (sum of prompt and completion tokens)
    const totalInputTokensUsed = usage.prompt_tokens;
    const totalOutputTokensUsed = usage.completion_tokens;

    // Calculate the amount to deduct based on the total tokens used
    const amountToDeduct =
      totalInputTokensUsed * inputTokenValue +
      totalOutputTokensUsed * outputTokenValue;

    // Deduct the amount from the balance
    balanceEntry.balance -= amountToDeduct;

    // Save the updated user document
    await user.save();
    return user;
  } catch (error) {
    console.error("Error deducting balance:", error);
    throw new Error(error.message || "Failed to deduct balance.");
  }
};

export const hasSufficientBalance = (user, avatar_id) => {
  const balanceEntry = user.app_user.balances.find(
    (balance) => balance.avatar_id === avatar_id
  );

  if (balanceEntry.balance <= 0) {
    throw new payment_required(
      "Your balance on this avatar is : " +
        (balanceEntry.balance * 2.5).toFixed(5) +
        " $"
    );
  }

  return true;
};

export const getMyBalences = (user) => {
  return user.app_user.balances;
};
