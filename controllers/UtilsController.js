import multer from "multer";
import User from "../model/User.js";
import { StatusCodes } from "http-status-codes";
import { uploadImageFile } from "../services/imageService.js";
import { getUserIdFromToken } from "../services/authService.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadImage = async (req, res) => {
  const user_id = await getUserIdFromToken(req.headers.authorization);
  const user = await User.findById(user_id);
  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "User not found." });
  }
  try {
    upload.single("Logo")(req, res, async (err) => {
      if (err) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Error uploading image." });
      }

      if (!req.file) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "No image provided." });
      }

      const imageUrl = await uploadImageFile(req.file);

      delete req.file;

      res.status(StatusCodes.OK).json({ image_link: imageUrl });
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error." });
  }
};

export { uploadImage };
