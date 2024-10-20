import User from "../model/User.js";
import { StatusCodes } from "http-status-codes";
import { OAuth2Client } from "google-auth-library";
import { getUserIdFromToken } from "../services/authService.js";
import { badRequestError, UnAuthenticatedError } from "../errors/index.js";
import dotenv from "dotenv";
dotenv.config();

// sendMessage
const sendMessage = async (req, res) => {
  const user = req.user;

  const response = {
    user: user,
    message: "Thanks for calling this API",
  };
  res.status(StatusCodes.OK).json(response);
};

export { sendMessage };
