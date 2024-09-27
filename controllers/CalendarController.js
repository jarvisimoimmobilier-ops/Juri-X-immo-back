import Calendar from "../model/Calendar.js";
import { StatusCodes } from "http-status-codes";
import { getUserIdFromToken } from "../services/authService.js";
import Brand from "../model/Brand.js";
import User from "../model/User.js";
import { generateCalendar } from "../services/openAiServices.js";

const getCalendarsByBrandId = async (brandId) => {
  return await Calendar.find({ brand: brandId });
};

const create = async (req, res) => {
  const user_id = await getUserIdFromToken(req.headers.authorization);

  // Find the user by ID
  const user = await User.findById(user_id);
  console.log(user);

  const {
    calendar_name,
    brand_id,
    objective_of_posts,
    additional_notes,
    platforms,
    language,
    includePeopleInImages,
    addEmojis,
    hashtags,
    preferred_n_paragraphs,
    preferred_n_words_per_p,
    preferred_post_frq_per_w,
  } = req.body;

  try {
    // Check if the user has eligible calendars left
    if (user.eligibleCalendars <= 0) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "No eligible calendars left to create" });
    }

    const brand = await Brand.findOne({ _id: brand_id, user: user_id });
    if (!brand) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Brand not found or unauthorized to read" });
    }

    const calendar = await Calendar.create({
      calendar_name,
      brand: brand_id,
      calendar_config: {
        objective_of_posts,
        additional_notes,
        platforms,
        language,
        includePeopleInImages,
        addEmojis,
        hashtags,
        preferred_n_paragraphs,
        preferred_n_words_per_p,
        preferred_post_frq_per_w,
      },
    });

    await brand.updateOne({ $push: { calendars: calendar._id } });

    // Generate the calendar content
    const genCalendar = await generateCalendar(calendar, brand, user);
    console.log(genCalendar);
    await Calendar.findByIdAndUpdate(calendar._id, {
      $push: { generated_calendar: genCalendar },
    });

    // Decrement eligibleCalendars count for the user
    await User.findByIdAndUpdate(
      user_id,
      {
        $inc: { eligibleCalendars: -1 },
      },
      { new: true }
    );

    const generatedCal = await Calendar.findById(calendar._id);
    res.status(StatusCodes.CREATED).json({ generatedCal });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.UNAUTHORIZED).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const user_id = await getUserIdFromToken(req.headers.authorization);
    const brands = await Brand.find({ user: user_id });

    let calendars = [];
    for (const brand of brands) {
      const brandCalendars = await getCalendarsByBrandId(brand._id);
      calendars.push(...brandCalendars);
    }

    res.status(StatusCodes.OK).json({ calendars });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const user_id = await getUserIdFromToken(req.headers.authorization);
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Calendar not found" });
    }

    const brand = await Brand.findOne({ _id: calendar.brand, user: user_id });
    if (!brand) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized to get the calendar" });
    }

    res.status(StatusCodes.OK).json({ calendar });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const update = async (req, res) => {
  // Add your update logic here using Calendar.findByIdAndUpdate()
  try {
    const user_id = await getUserIdFromToken(req.headers.authorization);
    const { id } = req.params;
    const updateData = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Calendar not found" });
    }

    const brand = await Brand.findOne({ _id: calendar.brand, user: user_id });
    if (!brand) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized to update the calendar" });
    }

    const updatedCalendar = await Calendar.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(StatusCodes.OK).json({ updatedCalendar });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const deleteCalendar = async (req, res) => {
  try {
    const user_id = await getUserIdFromToken(req.headers.authorization);
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Calendar not found" });
    }

    const brand = await Brand.findOne({ _id: calendar.brand, user: user_id });
    if (!brand) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized to delete the calendar" });
    }

    await Calendar.findByIdAndDelete(id);
    await Brand.findByIdAndUpdate(brand._id, { $pull: { calendars: id } });

    res
      .status(StatusCodes.OK)
      .json({ message: "Calendar deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export { create, getAll, getById, update, deleteCalendar };
