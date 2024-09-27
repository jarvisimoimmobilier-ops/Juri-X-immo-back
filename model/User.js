import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Schema } = mongoose;

const UserSchema = new mongoose.Schema({
  image_link:String,
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  firstName: {
    type: String,
    required: [false, "Please provide name"],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide a validate email",
    },
    unique: true,
  },
  contactNumber: {
    type: String,
    required:false,
    validate: {
      validator: function(value) {
        // Assuming a simple regex for demonstration. You might want to use a more robust one depending on your needs.
        return /^\d{10}$/.test(value); // This regex is for a 10-digit number, modify as per requirement
      },
      message: "Please provide a valid contact number",
    },
    unique: true,
},
  password: {
    select: false,
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
  },
  address: {
    type: String,
    required:false,
    minlength: 3,
  },
  brands: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
  customerId: {
    type: String,
    required: false,
    default:null
  },
  currentPlan: {
    type: String,
    required: [true, "Please specify a subscription plan"],
    enum: ['Free', 'Premium', 'Advanced'],
    default: 'Free'
  },
  // Eligible items the user can still create
  eligibleBrands: {
    type: Number,
    required: true,
    default: 1 // Default value for Free plan; adjust based on plan
  },
  eligibleCalendars: {
    type: Number,
    required: true,
    default: 1 // Default value for Free plan
  }
});

UserSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

export default mongoose.model("User", UserSchema);
