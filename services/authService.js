import { UnAuthenticatedError, badRequestError } from "../errors/index.js";
import User from "../model/User.js";
import jwt from "jsonwebtoken";

const registerUser = async (name, email, password,customerId) => {
  if (!name || !email || !password) {
    throw new badRequestError("Please provide all values");
  }

  const userAlreadyExists = await User.findOne({ email });
  if (userAlreadyExists) {
    throw new badRequestError("Email already in use");
  }

  const user = await User.create({ name, email, password,customerId });
  return user;
};

// Service function for user login
const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new badRequestError("Please provide all values");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new UnAuthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnAuthenticatedError("Invalid Credentials");
  }

  const token = user.createJWT();
  user.password = undefined;

  return { user, token, location: user.location };
};

const getUserIdFromToken = async (token) => {
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user ID from the decoded token
    const userId = decoded.userId;

    // Find the user by ID in the database
    const user = await User.findById(userId);

    return user;
  } catch (error) {
    // If there's an error (e.g., token expired or invalid), handle it here
    console.error(error);
    throw new Error("Failed to get user from token");
  }
};

export { registerUser, loginUser, getUserIdFromToken };
