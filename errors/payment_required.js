import { StatusCodes } from "http-status-codes";
import CustomAPIError from "./custom-api.js";

class payment_required extends CustomAPIError {
  constructor(message = "Insufficient balance to proceed.") {
    super(message);
    this.statusCode = StatusCodes.PAYMENT_REQUIRED; // Use 402 for payment-related issues
  }
}

export default payment_required;
