import Brand from "../model/Brand.js";
import User from "../model/User.js"; // Import the User model
import { StatusCodes } from "http-status-codes";
import { getUserIdFromToken } from "../services/authService.js";

const create = async (req, res) => {
  const authorizationHeader = req.headers.authorization;
  const {
    image_link,
    company_name,
    company_description,
    creation_date,
    offered_services_products,
    target_audience,
    indefinite_term_offers,
    fixed_term_offers,
    sectors_of_activity,
    more_details,
  } = req.body;

  try {
    // Get the user ID from the authorization token
    let user_id = await getUserIdFromToken(authorizationHeader);

    // Find the user by ID
    const user = await User.findById(user_id);

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    console.log(JSON.stringify(user));
    // Check if the user has eligible brands left
    if (user.eligibleBrands <= 0) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "No eligible brands left to create" });
    }

    // Create the new brand
    const brand = await Brand.create({
      user: user_id,
      image_link,
      company_name,
      company_description,
      creation_date,
      offered_services_products,
      target_audience,
      indefinite_term_offers,
      fixed_term_offers,
      sectors_of_activity,
      more_details,
    });

    // Update the Brands array and decrement eligibleBrands in the User model
    await User.findByIdAndUpdate(
      user_id,
      {
        $push: { brands: brand._id },
        $inc: { eligibleBrands: -1 },
      },
      { new: true }
    );

    res.status(StatusCodes.CREATED).json({ brand });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.UNAUTHORIZED).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    // Get user ID from the token
    const user_id = await getUserIdFromToken(req.headers.authorization);

    // Fetch only brands associated with the authenticated user
    const brands = await Brand.find({ user: user_id });
    res.status(StatusCodes.OK).json({ brands });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const getById = async (req, res) => {
  const { id } = req.params;

  try {
    // Get user ID from the token
    const user_id = await getUserIdFromToken(req.headers.authorization);

    const brand = await Brand.findOne({ _id: id, user: user_id });
    if (!brand) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Brand not found or unauthorized to read" });
    }

    res.status(StatusCodes.OK).json({ brand });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Check if the brand belongs to the authenticated user before updating
    const user_id = await getUserIdFromToken(req.headers.authorization);
    const brand = await Brand.findOne({ _id: id, user: user_id });
    if (!brand) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Brand not found or unauthorized to update" });
    }

    const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(StatusCodes.OK).json({ updatedBrand });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const deleteBrand = async (req, res) => {
  const { id } = req.params;

  try {
    // Get user ID from the token
    const user_id = await getUserIdFromToken(req.headers.authorization);

    // Find the brand to delete
    const brandToDelete = await Brand.findOne({ _id: id, user: user_id });
    if (!brandToDelete) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Brand not found or unauthorized to delete" });
    }

    // Delete the brand
    await Brand.findByIdAndDelete(id);

    // Remove the brand from the User's Brands array
    await User.findByIdAndUpdate(user_id, { $pull: { brands: id } });

    res.status(StatusCodes.OK).json({ deletedBrand: brandToDelete });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export { create, getAll, getById, update, deleteBrand };
