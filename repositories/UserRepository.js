import User from "../model/User.js";
import {
  UnAuthenticatedError,
  payment_required,
  notFoundError,
} from "../errors/index.js";
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
  customerId,
  amount_paid,
  avatar_id,
  invoiceData
) => {
  console.log("amount_paid from method:", amount_paid);
  console.log("avatar_id from method:", avatar_id);

  const assistantConfig = assistants[avatar_id];
  try {
    const user = await User.findOne({ "app_user.customerId": customerId });
    if (!user) {
      throw new notFoundError(`User with customerId ${customerId} not found.`);
    }

    // Find or create balance entry for the specified assistant
    let balanceEntry = user.app_user.balances.find(
      (balance) => balance.avatar_id === avatar_id
    );

    if (!balanceEntry) {
      // Create new balance entry if it doesn't exist
      user.app_user.balances.push({
        avatar_id: avatar_id,
        balance: 0,
        invoices: []
      });
      balanceEntry = user.app_user.balances.find(
        (balance) => balance.avatar_id === avatar_id
      );
    }

    const usableAmount = amount_paid / assistantConfig.factor;
    console.log("usable amount to add is:", usableAmount);

    // Update the balance
    balanceEntry.balance += usableAmount;

    // Save the invoice details if provided
    if (invoiceData) {
      balanceEntry.invoices.push({
        ...invoiceData,
        type: "initial_payment"
      });
    }

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
        (balanceEntry.balance * assistants[avatar_id].factor).toFixed(5) +
        " $"
    );
  }

  return true;
};



export const getMyBalences = (user) => {
  let appUser = user.app_user;
  appUser.balances.forEach((balance) => {
    const assistant = assistants[balance.avatar_id];
    if (assistant && assistant.factor) {
      balance.balance *= assistant.factor;
    }
  });
  return appUser.balances;
};

export const getMyData = (user) => {
  user.app_user.balances.forEach((balance) => {
    const assistant = assistants[balance.avatar_id];
    if (assistant && assistant.factor) {
      balance.balance *= assistant.factor;
    }
  });

  return user;
};


// Add these functions to your UserRepository.js file

// Reset user to default free tier balances when subscription is cancelled
export const resetUserToDefaults = async (customerId) => {
  try {
    const user = await User.findOne({ "app_user.customerId": customerId });
    if (!user) {
      throw new notFoundError(`User with customerId ${customerId} not found.`);
    }

    // Reset all balances to default values (matching your existing defaults)
    user.app_user.balances.forEach((balance) => {
      if (balance.avatar_id === "1") {
        // ChatbotBasic - reset to default ~1.0 balance
        balance.balance = 0.9993036999999999;
      } else if (balance.avatar_id === "2") {
        // ChatbotPro - reset to default 1.0 balance  
        balance.balance = 1;
      }
      
      // Add cancellation record to invoices
      balance.invoices.push({
        type: "cancellation",
        date: new Date(),
        note: "Subscription cancelled - reset to default free tier"
      });
    });

    await user.save();
    console.log(`User ${customerId} reset to default balances.`);
    return user;
  } catch (error) {
    console.error("Error resetting user to defaults:", error);
    throw new Error(error.message || "Failed to reset user to defaults.");
  }
};

// Extend subscription when recurring payment succeeds
export const extendSubscription = async (customerId, amount_paid, avatar_id, invoiceData) => {
  try {
    const user = await User.findOne({ "app_user.customerId": customerId });
    if (!user) {
      throw new notFoundError(`User with customerId ${customerId} not found.`);
    }

    const assistantConfig = assistants[avatar_id];
    const balanceEntry = user.app_user.balances.find(
      (balance) => balance.avatar_id === avatar_id
    );

    if (!balanceEntry) {
      // If balance entry doesn't exist, create it
      user.app_user.balances.push({
        avatar_id: avatar_id,
        balance: 0,
        invoices: []
      });
      balanceEntry = user.app_user.balances.find(
        (balance) => balance.avatar_id === avatar_id
      );
    }

    const usableAmount = amount_paid / assistantConfig.factor;
    console.log("Extending subscription with usable amount:", usableAmount);

    // Add the new balance
    balanceEntry.balance += usableAmount;

    // Save the invoice details
    balanceEntry.invoices.push({
      ...invoiceData,
      type: "recurring_payment"
    });

    await user.save();
    console.log(`Subscription extended for user ${customerId}`);
    return user;
  } catch (error) {
    console.error("Error extending subscription:", error);
    throw new Error(error.message || "Failed to extend subscription.");
  }
};

// Handle failed payment - add grace period logic or notifications
export const handleFailedPayment = async (customerId, failureData) => {
  try {
    const user = await User.findOne({ "app_user.customerId": customerId });
    if (!user) {
      throw new notFoundError(`User with customerId ${customerId} not found.`);
    }

    // Add failure record to all balance entries
    user.app_user.balances.forEach((balance) => {
      balance.invoices.push({
        ...failureData,
        type: "payment_failed",
        note: "Payment attempt failed - account may be suspended if not resolved"
      });
    });

    // Optional: Implement grace period logic here
    // For example, don't immediately suspend if it's the first failure
    if (failureData.attempt_count >= 3) {
      // After 3 failed attempts, reduce balances significantly
      user.app_user.balances.forEach((balance) => {
        if (balance.balance > 1.0) {
          balance.balance = Math.min(balance.balance, 1.0); // Limit to $1 worth
        }
      });
      console.log(`Account limited due to multiple payment failures: ${customerId}`);
    }

    await user.save();
    console.log(`Payment failure recorded for user ${customerId}`);
    return user;
  } catch (error) {
    console.error("Error handling failed payment:", error);
    throw new Error(error.message || "Failed to handle payment failure.");
  }
};

