import mongoose from "mongoose";
const { Schema } = mongoose;

const ImageJobSchema = new mongoose.Schema({
  creationTime: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  imageDescr: {
    type: String,
  },
  calendar_id: {
    type: String,
    required: true,
  },
  post_id: {
    type: String,
    required: true,
  },
  cloudinary_url: {
    type: String,
  },
  dalle3_url: {
    type: String,
  },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "DONE"],
    default: "PENDING",
  },
});

export default mongoose.model("ImageJob", ImageJobSchema);
