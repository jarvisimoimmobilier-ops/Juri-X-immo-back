import mongoose from "mongoose";
const { Schema } = mongoose;

const BrandSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    select: false,
  },
  company_name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  image_link: {
    type: String,
  },
  company_description: {
    type: String,
    required: [true, "Please company description"],
  },
  creation_date: {
    type: Date,
  },
  offered_services_products: {
    type: String,
    trim: true,
  },
  target_audience: {
    type: String,
    trim: true,
    default: "every one",
  },
  indefinite_term_offers: {
    type: String,
    trim: true,
  },
  fixed_term_offers: {
    type: String,
    trim: true,
  },
  sectors_of_activity: [
    {
      type: String,
    },
  ],
  more_details: {
    type: String,
    trim: true,
  },
  calendars: [{ type: Schema.Types.ObjectId, ref: "Calendar" }],
});

BrandSchema.methods.toString = function () {
  return (
    "\n - Company Name: " +
    this.company_name +
    "\n - Target Audience: " +
    this.target_audience +
    "\n - Company Description: " +
    this.company_description +
    "\n - Offered Services/Products: " +
    this.offered_services_products +
    "\n - Indefinite Term Offers: " +
    this.indefinite_term_offers +
    "\n - Fixed Term Offers: " +
    this.fixed_term_offers +
    "\n - Creation Date: " +
    this.creation_date +
    "\n - More Details: " +
    this.more_details +
    "\n"
  );
};

export default mongoose.model("Brand", BrandSchema);
