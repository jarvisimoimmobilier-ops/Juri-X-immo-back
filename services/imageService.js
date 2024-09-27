import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: "dcccxtln1",
  api_key: "242749878412777",
  api_secret: process.env.API_SECRET,
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
};

const uploadImage = async (imageUrl) => {
  try {
    const result = await cloudinary.v2.uploader.upload(imageUrl, opts);
    if (result && result.secure_url) {
      return result.secure_url;
    }
  } catch (error) {
    console.log(error.message);
    throw { message: error.message };
  }
};

const uploadImageFile = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided."));
    }

    cloudinary.v2.uploader
      .upload_stream({ resource_type: "image" }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      })
      .end(file.buffer);
  });
};

export { uploadImage, uploadImageFile };

// Define uploadMultipleImages as an async function
export async function uploadMultipleImages(images) {
  try {
    const base64Images = req.files.map((file) =>
      file.buffer.toString("base64")
    );

    // Handle the logic to upload multiple images (e.g., to Cloudinary) here
    const uploadedUrls = await Promise.all(base64Images.map(uploadImage));

    // Return the URLs or any relevant response
    res.json(uploadedUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
