import { UnAuthenticatedError, badRequestError } from "../errors/index.js";
import User from "../model/User.js";
import jwt from "jsonwebtoken";
import { getAssistantConfig } from "../utils/functions.js";

// Service function for registering a new user
const registerUser = async (username, email, password) => {
  // Validate input fields
  if (!username || !email || !password) {
    throw new badRequestError("Please provide all required values");
  }

  // Check if the email is already registered
  const userAlreadyExists = await User.findOne({ "auth_user.email": email });
  if (userAlreadyExists) {
    throw new badRequestError("Email is already in use");
  }

  // Fetch assistant configuration to initialize balances
  const assistants = getAssistantConfig();
  const defaultBalances = Object.keys(assistants).map((assistantID) => ({
    assistant_id: assistantID,
    balance: 0,
  }));

  // Create the new user with default balances
  const newUser = new User({
    auth_user: {
      username,
      email,
      password,
    },
    app_user: {
      threads: [],
      balances: defaultBalances, // Set initial balances for each assistant
    },
  });

  // Save the new user
  await newUser.save();

  return newUser;
};

// Service function for user login
const loginUser = async (email, password) => {
  // Validate input
  if (!email || !password) {
    throw new badRequestError("Please provide both email and password");
  }

  // Find the user by email, include password for comparison
  const user = await User.findOne({ "auth_user.email": email }).select(
    "+auth_user.password"
  );
  if (!user) {
    throw new UnAuthenticatedError("Invalid Credentials");
  }

  // Check if the password is correct
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnAuthenticatedError("Invalid Credentials");
  }

  // Create a JWT for the user
  const token = user.createJWT();

  return { user: { _id: user._id, email: user.auth_user.email }, token };
};

// Service function to get user from JWT token
const getUserIdFromToken = async (token) => {
  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    // Check if user exists
    if (!user) {
      throw new UnAuthenticatedError("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error decoding token:", error);
    throw new UnAuthenticatedError("Invalid Token");
  }
};

export { registerUser, loginUser, getUserIdFromToken };
