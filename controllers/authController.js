import User from "../model/User.js";
import { StatusCodes } from "http-status-codes";
import { OAuth2Client } from "google-auth-library";
import { badRequestError, UnAuthenticatedError } from "../errors/index.js";
import { registerUser,loginUser, getUserIdFromToken } from "../services/authService.js";
import jwt from "jsonwebtoken";
import stripeInit from 'stripe';
import dotenv from "dotenv";
dotenv.config();

const stripe = stripeInit(process.env.STRIPE_SECRET_KEY); 


const register = async (req, res) => {
  const { name, email, password  } = req.body;

  try {

    let customer;
    // Check if the customer exists
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    if(customers.data.length > 0){
    customer = customers.data[0]
    }else{
      customer = await stripe.customers.create({
        name: name,
        email: email,
        description: 'New Customer'
      });
    }

    const user = await registerUser(name, email, password,customer.id);
    const token = user.createJWT();

    res.status(StatusCodes.CREATED).json({
      user: {
        email: user.email,
        lastName: user.lastName,
        name: user.name,
        customerId:customer.id
      },
      token
    });

  } catch (error) {
    // Handle errors (you may want to create a separate error handling middleware)
    console.error(error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// handles google login
const clientId = new OAuth2Client("383922153128-qbmd4ngqd1knc05abrc30hac9lgb8n0o.apps.googleusercontent.com");


const googleAuth = async (req, res) => {
  const { idToken } = req.body;
  if (idToken) {
    try {
      const response = await clientId.verifyIdToken({ idToken, audience: "383922153128-qbmd4ngqd1knc05abrc30hac9lgb8n0o.apps.googleusercontent.com" });
      const { email_verified, email, name, picture } = response.payload;
      if (email_verified) {
        // Check if user with the provided email already exists
        let user = await User.findOne({ email });

        if (!user) {
          // If user doesn't exist, create a new one
          let password = email + clientId;
          user = await User.create({ email, password, fullName: name, name, picture });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email, userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });

        res.status(StatusCodes.OK).json({
          user,
          token // Send the JWT token to the client
        });
      }
    } catch (error) {
      console.error("Error with Google authentication:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error with Google authentication" });
    }
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid request" });
  }
};



//Get user data by id
const getUserById = async (req, res) => {

  try {
    // Get user ID from the token
    const user_id = await getUserIdFromToken(req.headers.authorization);

    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "user not found or unauthorized to read" });
    }

    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

//Update user data by id
const updateUserData = async (req, res) => {
  const newUserData = req.body;

  try {
    // Check if the brand belongs to the authenticated user before updating
    const user_id = await getUserIdFromToken(req.headers.authorization);
    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found or unauthorized to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(user_id, newUserData, {
      new: true,
    });

    res.status(StatusCodes.OK).json({ updatedUser });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};



export { register, login , googleAuth, getUserById,updateUserData};
