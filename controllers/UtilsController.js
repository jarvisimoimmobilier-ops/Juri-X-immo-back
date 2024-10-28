import multer from "multer";
import {
  updateUserProfilePicture,
  updateUser,
} from "../repositories/UserRepository.js";
import { StatusCodes } from "http-status-codes";
import { uploadImageFile } from "../services/cloudinaryService.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadProfilePicture = async (req, res) => {
  const user = req.user;
  upload.single("profilepicture")(req, res, async (err) => {
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

    const updatedUser = await updateUserProfilePicture(user._id, imageUrl);
    res
      .status(StatusCodes.OK)
      .json({ image_link: updatedUser.app_user.image_link });
  });
};

const getUser = async (req, res) => {
  const user = req.user;
  const response = {
    user: user,
    message: "Thanks for calling this API",
  };
  res.status(StatusCodes.OK).json(response);
};

const updateUserProfile = async (req, res) => {
  const user = req.user;
  const updates = req.body; // Expected fields in the body: name, surname, title, image_link

  // Call the updateUser function from UserRepository
  const updatedUser = await updateUser(user._id, updates);

  res.status(StatusCodes.OK).json({
    message: "User profile updated successfully",
    app_user: {
      firstname: updatedUser.app_user.firstname,
      lastname: updatedUser.app_user.lastname,
      title: updatedUser.app_user.title,
      image_link: updatedUser.app_user.image_link,
    },
  });
};

export { uploadProfilePicture, getUser, updateUserProfile };
